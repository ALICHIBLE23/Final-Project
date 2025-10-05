from train import train_random_forest
from predict import get_top_likely_planets
import numpy as np  
from predictSingleRow import predict_single_row
"""
if __name__ == "__main__":
    results = train_random_forest("MachineLearning/data/NASA_DATASET_Optimized.csv", return_probabilities=True)

    print("\nAccuracy:", results["accuracy"])
    print("\nClassification Report:\n", results["report"])
    print("\nConfusion Matrix:\n", results["confusion_matrix"])
    print("\nTop Features:\n", results["feature_importance"].head(10))

    # Print first 5 probability predictions
    probs = results["y_proba"]
    le = results["label_encoder"]

    for i, p in enumerate(probs[:5]):
        pred_label = le.inverse_transform([results["y_pred"][i]])[0]
        print(f"Object {i}: predicted={pred_label}, probability CP={p[0]:.3f}, FP={p[1]:.3f}")
        """
"""
if __name__ == "__main__":
    model_path = r"outputs3/random_forest_model.pkl"
    encoder_path = r"outputs3/label_encoder.pkl"
    data_path = r"MachineLearning/data/Candidates.csv"

    top_planets = get_top_likely_planets(model_path, encoder_path, data_path, top_n=10)
    print("Top 10 most likely planets:")
    print(top_planets.to_string(index=False))  

    # Optional CSV output
    top_planets.to_csv("top10_likely_planets.csv", index=False)
    """

if __name__ == "__main__":
    # Your existing training code
    results = train_random_forest("MachineLearning/data/NASA_DATASET_Optimized.csv", return_probabilities=True)
    
    print("\nAccuracy:", results["accuracy"])
    print("\nClassification Report:\n", results["report"])
    print("\nTop Features:\n", results["feature_importance"].head(10))
    
    # Test single prediction
    model_path = "outputs1/random_forest_model.pkl"
    encoder_path = "outputs1/label_encoder.pkl"
    
    # Example: create a sample row (replace with your actual data)
    # This should match the features used during training
    sample_row = [13.9285074, 3.9986123, 13364.35946, 9.5784743,36.5645594,627.1693637,12.8988,5103.41,4.52801,0.836141]  # Replace with your actual feature values
    
    # Make prediction
    prediction = predict_single_row(model_path, encoder_path, sample_row)
    
    print(f"\nSingle Prediction Results:")
    print(f"Predicted Class: {prediction['prediction']}")
    print(f"Confidence: {prediction['probability_max']:.3f}")
    print("All Probabilities:")
    for class_name, prob in prediction['probabilities'].items():
        print(f"  {class_name}: {prob:.3f}")