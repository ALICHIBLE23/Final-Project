from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app)

# ============================================
# ?? Prediction Function
# ============================================
def predict_single_row(model_path, encoder_path, input_data, feature_names=None):
    model = joblib.load(model_path)
    encoder = joblib.load(encoder_path)

    if isinstance(input_data, (list, np.ndarray)):
        input_data = np.array(input_data).reshape(1, -1)
    if isinstance(input_data, pd.DataFrame):
        input_data = input_data.values.reshape(1, -1)

    prediction_encoded = model.predict(input_data)[0]
    probabilities = model.predict_proba(input_data)[0]
    prediction_label = encoder.inverse_transform([prediction_encoded])[0]

    results = {
        "prediction": prediction_label,
        "prediction_encoded": int(prediction_encoded),
        "probabilities": dict(zip(encoder.classes_, probabilities.tolist())),
        "probability_max": float(np.max(probabilities))
    }
    return results

# ============================================
# ?? Flask API Routes
# ============================================

@app.route("/")
def home():
    return jsonify({"message": "Flask backend is running ✅"})

@app.route("/api/check-planet", methods=["POST"])
def check_planet():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    db_path = os.path.join("data", "Confirmed.csv")
    if os.path.exists(db_path):
        df = pd.read_csv(db_path)
        if "Planet_name" in df.columns and data.get("Planet_name") in df["Planet_name"].values:
            planet = df[df["Planet_name"] == data["Planet_name"]].iloc[0].to_dict()
            return jsonify({"exists": True, "planet": planet})

    return jsonify({"exists": False})

@app.route("/api/save-candidate", methods=["POST"])
def save_candidate():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    os.makedirs("data", exist_ok=True)
    save_path = os.path.join("data", "Candidates.csv")
    df_new = pd.DataFrame([data])

    if os.path.exists(save_path):
        df_new.to_csv(save_path, mode="a", header=False, index=False)
    else:
        df_new.to_csv(save_path, index=False)

    return jsonify({"success": True, "message": "Candidate saved successfully"})

@app.route("/api/verify", methods=["POST"])
def verify_candidate():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    try:
        # Convert all numeric values from the received JSON input
        input_values = [
            float(v) for v in data.values()
            if isinstance(v, (int, float, str)) and str(v).replace(".", "", 1).isdigit()
        ]

        # Absolute path to model and encoder
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        model_path = os.path.join(base_dir, "outputs1", "random_forest_model.pkl")
        encoder_path = os.path.join(base_dir, "outputs1", "label_encoder.pkl")

        result = predict_single_row(
            model_path=model_path,
            encoder_path=encoder_path,
            input_data=input_values,
        )

        return jsonify({
            "success": True,
            "is_planet": result["prediction"] == "Confirmed Planet",
            "predicted_class": result["prediction"],
            "confidence": result["probability_max"],
            "all_probabilities": result["probabilities"],
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/batch-verify", methods=["POST"])
def batch_verify():
    try:
        data = request.get_json()
        if not data or "planets" not in data:
            return jsonify({"error": "No planet data provided"}), 400

        planets = data["planets"]
        results = []

        # Absolute paths
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        model_path = os.path.join(base_dir, "outputs1", "random_forest_model.pkl")
        encoder_path = os.path.join(base_dir, "outputs1", "label_encoder.pkl")

        for planet in planets:
            input_values = [
                float(v) for v in planet.values()
                if isinstance(v, (int, float, str)) and str(v).replace(".", "", 1).isdigit()
            ]
            result = predict_single_row(
                model_path=model_path,
                encoder_path=encoder_path,
                input_data=input_values,
            )
            results.append({
                "Planet_name": planet.get("Planet_name", f"Planet{len(results)+1}"),
                "predicted_class": result["prediction"],
                "confidence": result["probability_max"],
                "all_probabilities": result["probabilities"],
            })

        return jsonify({"success": True, "results": results})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================
# ?? Run Server
# ============================================

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
