from flask import Blueprint, jsonify, request
import numpy as np
import joblib
import os
import traceback
import sys
from extensions import db
import pandas as pd  # <-- NEW: for DataFrame for tap water model

prediction_bp = Blueprint('prediction_bp', __name__)

# --------------------------------------------------------------------
# Load old pre-trained model and label encoder (8-features wale model)
# --------------------------------------------------------------------
try:
    model_path = os.path.join(os.path.dirname(__file__), '..', 'ml_models', 'best_water_model.pkl')
    le_path = os.path.join(os.path.dirname(__file__), '..', 'ml_models', 'label_encoder.pkl')
    
    model = joblib.load(model_path)
    le = joblib.load(le_path)
    print("✅ Loaded pre-trained model and label encoder successfully")
except Exception as e:
    print(f"❌ Error loading old model: {str(e)}")
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
    print("✅ Loaded tap water model successfully")
except Exception as e:
    print(f"❌ Error loading tap water model: {str(e)}")
    print("Tap model path:", tap_model_path)
    tap_model = None


# Routes
# --------------------------------------------------------------------

# --------------------------------------------------------------------
# ✅ 4) Diagnostics route — check model loading status
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

    info = {
        "python_version": sys.version,
        "main_model_status": main_model_status,
        "tap_model_status": tap_status,
        "model_type": type(model).__name__ if model else None,
        "model_path": model_path if model else None,
        "tap_model_path": tap_model_path if tap_model else None,
        "features_main_model": [
            "Temperature", "Dissolved Oxygen", "pH", "Conductivity",
            "BOD", "Nitrate", "Fecal Coliform", "Total Coliform"
        ],
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
        print("📥 Received data:", data)

        # validate and build input array
        def build_input_array(d):
            required_fields = [
                "temperature", "dissolvedOxygen", "ph", "conductivity",
                "bod", "nitrate", "fecalColiform", "totalColiform"
            ]
            missing = [f for f in required_fields if d.get(f) is None]
            if missing:
                raise ValueError(f"Missing required fields: {', '.join(missing)}")

            try:
                arr = np.array([[
                    float(d.get("temperature")),
                    float(d.get("dissolvedOxygen")),
                    float(d.get("ph")),
                    float(d.get("conductivity")),
                    float(d.get("bod")),
                    float(d.get("nitrate")),
                    float(d.get("fecalColiform")),
                    float(d.get("totalColiform"))
                ]])
            except Exception as e:
                raise ValueError(f"Invalid numeric value in input: {e}")
            return arr

        input_data = build_input_array(data)
        print("✅ Processed input data:", input_data)

        pred_label = model.predict(input_data)
        prediction = le.inverse_transform(pred_label)[0]
        print("✨ Prediction result:", prediction)

        return jsonify({
            "success": True,
            "prediction": prediction
        })
    except ValueError as ve:
        print("❌ Validation error:", str(ve))
        return jsonify({"success": False, "error": str(ve)}), 400
    except Exception as e:
        traceback.print_exc()
        print("❌ Error during prediction:", str(e))
        return jsonify({"success": False, "error": "Internal server error"}), 500


# --------------------------------------------------------------------
# Old endpoints: /tap and /river — same 8-feature model reuse
# --------------------------------------------------------------------
@prediction_bp.route('/tap', methods=['POST'])
def predict_tap():
    if model is None or le is None:
        return jsonify({"success": False, "error": "Model not loaded properly."}), 500

    try:
        data = request.get_json(force=True)
        def build_input_array(d):
            required_fields = [
                "temperature", "dissolvedOxygen", "ph", "conductivity",
                "bod", "nitrate", "fecalColiform", "totalColiform"
            ]
            missing = [f for f in required_fields if d.get(f) is None]
            if missing:
                raise ValueError(f"Missing required fields: {', '.join(missing)}")
            try:
                arr = np.array([[
                    float(d.get("temperature")),
                    float(d.get("dissolvedOxygen")),
                    float(d.get("ph")),
                    float(d.get("conductivity")),
                    float(d.get("bod")),
                    float(d.get("nitrate")),
                    float(d.get("fecalColiform")),
                    float(d.get("totalColiform"))
                ]])
            except Exception as e:
                raise ValueError(f"Invalid numeric value in input: {e}")
            return arr

        input_data = build_input_array(data)
        pred_label = model.predict(input_data)
        prediction = le.inverse_transform(pred_label)[0]
        return jsonify({"success": True, "prediction": prediction})
    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 400
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": "Internal server error"}), 500


@prediction_bp.route('/river', methods=['POST'])
def predict_river():
    # same as predict_tap (8-feature model)
    if model is None or le is None:
        return jsonify({"success": False, "error": "Model not loaded properly."}), 500
    try:
        data = request.get_json(force=True)
        def build_input_array(d):
            required_fields = [
                "temperature", "dissolvedOxygen", "ph", "conductivity",
                "bod", "nitrate", "fecalColiform", "totalColiform"
            ]
            missing = [f for f in required_fields if d.get(f) is None]
            if missing:
                raise ValueError(f"Missing required fields: {', '.join(missing)}")
            try:
                arr = np.array([[
                    float(d.get("temperature")),
                    float(d.get("dissolvedOxygen")),
                    float(d.get("ph")),
                    float(d.get("conductivity")),
                    float(d.get("bod")),
                    float(d.get("nitrate")),
                    float(d.get("fecalColiform")),
                    float(d.get("totalColiform"))
                ]])
            except Exception as e:
                raise ValueError(f"Invalid numeric value in input: {e}")
            return arr

        input_data = build_input_array(data)
        pred_label = model.predict(input_data)
        prediction = le.inverse_transform(pred_label)[0]
        return jsonify({"success": True, "prediction": prediction})
    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 400
    except Exception as e:
        traceback.print_exc()
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
        print("📥 Received tap data:", data)

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
        print("✅ Tap input processed:", X_new)

        pred = tap_model.predict(X_new)[0]  # already "Low"/"Average"/"High"
        print("✨ Tap water prediction:", pred)

        return jsonify({
            "success": True,
            "prediction": pred
        })
    except ValueError as ve:
        print("❌ Tap validation error:", str(ve))
        return jsonify({"success": False, "error": str(ve)}), 400
    except Exception as e:
        traceback.print_exc()
        print("❌ Error during tap prediction:", str(e))
        return jsonify({"success": False, "error": "Internal server error"}), 500

