from flask import Blueprint, jsonify, request
import numpy as np
import joblib
import os
import traceback
import sys
from extensions import db
import pandas as pd  # for DataFrame inputs (main + tap models)

prediction_bp = Blueprint('prediction_bp', __name__)

# --------------------------------------------------------------------
# Load old pre-trained model and label encoder (8-features wale model)
# --------------------------------------------------------------------
try:
    model_path = os.path.join(os.path.dirname(__file__), '..', 'ml_models', 'best_water_model.pkl')
    le_path = os.path.join(os.path.dirname(__file__), '..', 'ml_models', 'label_encoder.pkl')

    model = joblib.load(model_path)
    le = joblib.load(le_path)
    print(" Loaded pre-trained model and label encoder successfully")
except Exception as e:
    print(f" Error loading old model: {str(e)}")
    print("Model path:", model_path)
    print("Label encoder path:", le_path)
    model = None
    le = None

# --------------------------------------------------------------------
# NEW: Load tap water model (tap_water.pkl) -> 5 features, string labels
# --------------------------------------------------------------------
try:
    tap_model_path = os.path.join(os.path.dirname(__file__), '..', 'ml_models', 'tap_water.pkl')
    tap_model = joblib.load(tap_model_path)
    print(" Loaded tap water model successfully")
except Exception as e:
    print(f" Error loading tap water model: {str(e)}")
    print("Tap model path:", tap_model_path)
    tap_model = None


# ------------------------------------------------------------
# HELPER: build input DataFrame for main (8-feature) model
#       -> uses SAME column names as training DataFrame
# ------------------------------------------------------------
def build_main_model_df(d):
    """
    Convert JSON body from frontend into a pandas DataFrame with
    the same feature names that were used when fitting the model.
    """

    required_fields = [
        "temperature", "dissolvedOxygen", "ph", "conductivity",
        "bod", "nitrate", "fecalColiform", "totalColiform"
    ]
    missing = [f for f in required_fields if d.get(f) is None]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")

    # Values order = joh tum frontend se bhej rahe ho
    try:
        values = [
            float(d.get("temperature")),
            float(d.get("dissolvedOxygen")),
            float(d.get("ph")),
            float(d.get("conductivity")),
            float(d.get("bod")),
            float(d.get("nitrate")),
            float(d.get("fecalColiform")),
            float(d.get("totalColiform")),
        ]
    except Exception as e:
        raise ValueError(f"Invalid numeric value in input: {e}")

    # Model ko jis naam ke features ke saath train kiya gaya tha,
    # wo sklearn model ke andar feature_names_in_ me saved rehte hain.
    default_cols = [
        "Temperature", "Dissolved Oxygen", "pH", "Conductivity",
        "BOD", "Nitrate", "Fecal Coliform", "Total Coliform"
    ]
    feature_names = list(getattr(model, "feature_names_in_", default_cols))

    if len(feature_names) != len(values):
        raise ValueError(
            f"Model expects {len(feature_names)} features but received {len(values)}."
        )

    sample = {feature_names[i]: values[i] for i in range(len(feature_names))}

    df = pd.DataFrame([sample])
    return df


# Routes
# --------------------------------------------------------------------

@prediction_bp.route('/diagnostics', methods=['GET'])
def diagnostics():
    """Return diagnostic information about the model setup."""
    if model is None or le is None:
        main_model_status = "error"
    else:
        main_model_status = "ok"

    if tap_model is None:
        tap_status = "error"
    else:
        tap_status = "ok"

    default_cols = [
        "Temperature", "Dissolved Oxygen", "pH", "Conductivity",
        "BOD", "Nitrate", "Fecal Coliform", "Total Coliform"
    ]
    main_features = list(getattr(model, "feature_names_in_", default_cols)) if model else None

    info = {
        "python_version": sys.version,
        "main_model_status": main_model_status,
        "tap_model_status": tap_status,
        "model_type": type(model).__name__ if model else None,
        "model_path": model_path if model else None,
        "tap_model_path": tap_model_path if tap_model else None,
        "features_main_model": main_features,
        "tap_features": [
            "ph", "Hardness", "Chloramines", "Sulfate", "Turbidity"
        ],
        "classes_main_model": list(le.classes_) if le else None
    }

    try:
        import sklearn
        info["sklearn_version"] = sklearn.__version__
    except Exception as e:
        info["sklearn_version"] = f"not installed ({e})"

    return jsonify(info)


@prediction_bp.route('/predict', methods=['POST'])
def predict():
    """Make a water quality prediction based on input parameters (old 8-feature model)."""
    if model is None or le is None:
        return jsonify({
            "success": False,
            "error": "Model not loaded properly. Check server logs."
        }), 500
    try:
        data = request.get_json(force=True)
        print("📥 /predict Received data:", data)

        input_df = build_main_model_df(data)
        print(" /predict Processed input DF:")
        print(input_df)

        pred_label = model.predict(input_df)
        prediction = le.inverse_transform(pred_label)[0]
        print(" /predict Prediction result:", prediction)

        return jsonify({
            "success": True,
            "prediction": prediction
        })
    except ValueError as ve:
        print(" /predict Validation error:", str(ve))
        return jsonify({"success": False, "error": str(ve)}), 400
    except Exception as e:
        traceback.print_exc()
        print(" /predict Error during prediction:", str(e))
        return jsonify({"success": False, "error": "Internal server error"}), 500


@prediction_bp.route('/tap', methods=['POST'])
def predict_tap():
    """Tap endpoint but using main 8-feature model (not tap_water.pkl)."""
    if model is None or le is None:
        return jsonify({"success": False, "error": "Model not loaded properly."}), 500

    try:
        data = request.get_json(force=True)
        print("📥 /tap Received data:", data)

        input_df = build_main_model_df(data)
        print(" /tap Processed input DF:")
        print(input_df)

        pred_label = model.predict(input_df)
        prediction = le.inverse_transform(pred_label)[0]
        print(" /tap Prediction result:", prediction)

        return jsonify({"success": True, "prediction": prediction})
    except ValueError as ve:
        print(" /tap Validation error:", str(ve))
        return jsonify({"success": False, "error": str(ve)}), 400
    except Exception as e:
        traceback.print_exc()
        print(" /tap Error during prediction:", str(e))
        return jsonify({"success": False, "error": "Internal server error"}), 500


@prediction_bp.route('/river', methods=['POST'])
def predict_river():
    """River endpoint using main 8-feature model."""
    if model is None or le is None:
        return jsonify({"success": False, "error": "Model not loaded properly."}), 500
    try:
        data = request.get_json(force=True)
        print("📥 /river Received data:", data)

        input_df = build_main_model_df(data)
        print(" River input DF:")
        print(input_df)

        pred_label = model.predict(input_df)
        prediction = le.inverse_transform(pred_label)[0]
        print(" /river Prediction result:", prediction)

        return jsonify({"success": True, "prediction": prediction})
    except ValueError as ve:
        print(" River ValueError:", str(ve))
        return jsonify({"success": False, "error": str(ve)}), 400
    except Exception as e:
        traceback.print_exc()
        print(" /river Error during prediction:", str(e))
        return jsonify({"success": False, "error": "Internal server error"}), 500


# --------------------------------------------------------------------
# NEW: /tap-status — uses tap_water.pkl (5 features, no label encoder)
# --------------------------------------------------------------------
@prediction_bp.route('/tap-status', methods=['POST'])
def predict_tap_status():
    """
    Predict tap water status using tap_water.pkl model.
    Input JSON:
    {
        "ph": ...,
        "Hardness": ...,
        "Chloramines": ...,
        "Sulfate": ...,
        "Turbidity": ...
    }
    Output:
    {
        "success": true,
        "prediction": "Low" / "Average" / "High"
    }
    """
    if tap_model is None:
        return jsonify({"success": False, "error": "Tap water model not loaded."}), 500

    try:
        data = request.get_json(force=True)
        print("📥 /tap-status Received tap data:", data)

        required_fields = ["ph", "Hardness", "Chloramines", "Sulfate", "Turbidity"]
        missing = [f for f in required_fields if data.get(f) is None]
        if missing:
            raise ValueError(f"Missing required fields: {', '.join(missing)}")

        # Build DataFrame with same columns used in training
        sample = {
            "ph": float(data["ph"]),
            "Hardness": float(data["Hardness"]),
            "Chloramines": float(data["Chloramines"]),
            "Sulfate": float(data["Sulfate"]),
            "Turbidity": float(data["Turbidity"])
        }

        X_new = pd.DataFrame([sample])
        print(" Tap-status input processed:")
        print(X_new)

        pred = tap_model.predict(X_new)[0]  # already "Low"/"Average"/"High"
        print(" Tap water prediction:", pred)

        return jsonify({
            "success": True,
            "prediction": pred
        })
    except ValueError as ve:
        print(" Tap-status validation error:", str(ve))
        return jsonify({"success": False, "error": str(ve)}), 400
    except Exception as e:
        traceback.print_exc()
        print(" Error during tap-status prediction:", str(e))
        return jsonify({"success": False, "error": "Internal server error"}), 500
