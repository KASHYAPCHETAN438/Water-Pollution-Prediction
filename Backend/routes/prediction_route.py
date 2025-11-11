from flask import Blueprint, jsonify, request
import numpy as np
import joblib
import os
import traceback
import sys
from extensions import db

prediction_bp = Blueprint('prediction_bp', __name__)

# Load pre-trained model and label encoder
# --------------------------------------------------------------------
try:
    model_path = os.path.join(os.path.dirname(__file__), '..', 'ml_models', 'best_water_model.pkl')
    le_path = os.path.join(os.path.dirname(__file__), '..', 'ml_models', 'label_encoder.pkl')
    
    model = joblib.load(model_path)
    le = joblib.load(le_path)
    print("✅ Loaded pre-trained model and label encoder successfully")
except Exception as e:
    print(f"❌ Error loading model: {str(e)}")
    print("Model path:", model_path)
    print("Label encoder path:", le_path)
    model = None
    le = None

# Routes
# --------------------------------------------------------------------

# --------------------------------------------------------------------
# ✅ 4) Diagnostics route — check model loading status
# --------------------------------------------------------------------
@prediction_bp.route('/diagnostics', methods=['GET'])
def diagnostics():
    """Return diagnostic information about the model setup."""
    if model is None or le is None:
        return jsonify({
            "status": "error",
            "message": "Model not loaded properly"
        }), 500

    info = {
        "python_version": sys.version,
        "model_type": type(model).__name__,
        "model_path": model_path,
        "features": [
            "Temperature", "Dissolved Oxygen", "pH", "Conductivity",
            "BOD", "Nitrate", "Fecal Coliform", "Total Coliform"
        ],
        "classes": list(le.classes_) if le else None
    }

    try:
        import sklearn
        info["sklearn_version"] = sklearn.__version__
    except Exception as e:
        info["sklearn_version"] = f"not installed ({e})"

    return jsonify(info)

@prediction_bp.route('/predict', methods=['POST'])
def predict():
    """Make a water quality prediction based on input parameters."""
    if model is None or le is None:
        return jsonify({
            "success": False,
            "error": "Model not loaded properly. Check server logs."
        }), 500

    try:
        # Validate request
        if not request.is_json:
            return jsonify({
                "success": False,
                "error": "Request must be JSON"
            }), 400

        data = request.json
        print("📥 Received data:", data)

        # Validate required fields
        required_fields = {
            "temperature": "Temperature",
            "dissolvedOxygen": "Dissolved Oxygen",
            "ph": "pH",
            "conductivity": "Conductivity",
            "bod": "BOD",
            "nitrate": "Nitrate",
            "fecalColiform": "Fecal Coliform",
            "totalColiform": "Total Coliform"
        }

        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return jsonify({
                "success": False,
                "error": f"Missing required fields: {', '.join(missing_fields)}"
            }), 400

        # Create input array
        try:
            input_data = np.array([[
                float(data.get("temperature")),
                float(data.get("dissolvedOxygen")),
                float(data.get("ph")),
                float(data.get("conductivity")),
                float(data.get("bod")),
                float(data.get("nitrate")),
                float(data.get("fecalColiform")),
                float(data.get("totalColiform"))
            ]])
        except ValueError as e:
            return jsonify({
                "success": False,
                "error": "Invalid numeric value in input",
                "details": str(e)
            }), 400

        print("✅ Processed input data:", input_data)

        # Make prediction
        pred_label = model.predict(input_data)
        prediction = le.inverse_transform(pred_label)[0]
        
        print("✨ Prediction result:", prediction)

        return jsonify({
            "success": True,
            "prediction": prediction
        })

    except Exception as e:
        print("❌ Error during prediction:", str(e))
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400
