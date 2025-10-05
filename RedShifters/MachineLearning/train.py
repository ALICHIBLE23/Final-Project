import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.preprocessing import LabelEncoder
import joblib
import matplotlib.pyplot as plt
import seaborn as sns

def train_random_forest(data_path, output_dir="outputs1", return_probabilities=False):
    # Ensure output folder exists
    os.makedirs(output_dir, exist_ok=True)

    # Read the dataset
    df = pd.read_csv(data_path, encoding='latin1')

    # Clean column names to remove weird characters
    df.columns = df.columns.str.encode('ascii', 'ignore').str.decode('ascii').str.strip()

    # Features and target
    X = df.drop('Disposition', axis=1)
    y = df['Disposition']

    # Encode labels
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )

    # Train model
    rf_model = RandomForestClassifier(
        n_estimators=300,
        max_depth=20,
        min_samples_split=8,
        min_samples_leaf=4,
        max_features='sqrt',
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )
    rf_model.fit(X_train, y_train)

    # Predictions
    y_pred = rf_model.predict(X_test)
    y_proba = rf_model.predict_proba(X_test) if return_probabilities else None

    # Evaluation
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, target_names=le.classes_)
    cm = confusion_matrix(y_test, y_pred)

    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': X.columns,
        'importance': rf_model.feature_importances_
    }).sort_values('importance', ascending=False)

    # Save confusion matrix
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=le.classes_, yticklabels=le.classes_)
    plt.title('Confusion Matrix')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "confusion_matrix.png"), dpi=300, bbox_inches='tight')

    # Save feature importance plot
    plt.figure(figsize=(10, 8))
    top_features = feature_importance.head(15)
    plt.barh(range(len(top_features)), top_features['importance'])
    plt.yticks(range(len(top_features)), top_features['feature'])
    plt.xlabel('Importance')
    plt.title('Top 15 Feature Importances')
    plt.gca().invert_yaxis()
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "feature_importance.png"), dpi=300, bbox_inches='tight')

    # Save model, encoder, and feature importance table
    joblib.dump(rf_model, os.path.join(output_dir, "random_forest_model.pkl"))
    joblib.dump(le, os.path.join(output_dir, "label_encoder.pkl"))
    feature_importance.to_csv(os.path.join(output_dir, "feature_importance.csv"), index=False)

    return {
        "accuracy": accuracy,
        "report": report,
        "confusion_matrix": cm,
        "feature_importance": feature_importance,
        "y_test": y_test,
        "y_pred": y_pred,
        "y_proba": y_proba,
        "label_encoder": le
    }
