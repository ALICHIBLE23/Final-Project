import pandas as pd
import joblib

def get_top_likely_planets(model_path, encoder_path, data_path, top_n=10):
    """
    Predict probability of being a planet (CP) for each row in a new dataset.
    Returns top N rows by probability, with all columns.
    """
    # Load model and encoder
    rf_model = joblib.load(model_path)
    le = joblib.load(encoder_path)

    # Load new dataset
    df = pd.read_csv(data_path, encoding='latin1')

    # Clean column names to remove encoding artifacts / invisible characters
    df.columns = df.columns.str.encode('ascii', 'ignore').str.decode('ascii').str.strip()

    # Drop target and identifier columns for prediction
    X = df.drop(columns=["Disposition", "Name"], errors='ignore')

    # Predict probabilities
    probs = rf_model.predict_proba(X)

    # Index of CP class
    cp_index = list(le.classes_).index("CP")

    # Add probability column
    df["P_CP"] = probs[:, cp_index]

    # Sort by probability and pick top N
    top_df = df.sort_values("P_CP", ascending=False).head(top_n)

    return top_df  # return all columns, including P_CP
