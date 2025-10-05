import pandas as pd

df = pd.read_csv('/content/Dataset/cumulative_2025.09.28_10.52.01.csv', encoding='latin1')

print(f"Original dataset: {len(df)} rows")

df_clean = df.dropna()

print(f"After removing empty rows: {len(df_clean)} rows")
print(f"Removed {len(df) - len(df_clean)} rows with empty values")

df_clean.to_csv('/content/Dataset/tess_data_no_empty.csv', index=False)
print("\n✓ Cleaned data saved to: /content/Dataset/tess_data_no_empty.csv")