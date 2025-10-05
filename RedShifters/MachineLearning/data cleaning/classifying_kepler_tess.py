import pandas as pd

df_big = pd.read_csv('/content/Dataset/NASA_DATASET.csv', encoding='latin1')
df_small = pd.read_csv('/content/Dataset/kepler_data_no_empty.csv', encoding='latin1')  

df_big['classification'] = 1 

key_columns = ['Right_ascension', 'Declination', 'orbital_period', 'Transit_epoch']

df_big['composite_key'] = df_big[key_columns].astype(str).agg('_'.join, axis=1)
df_small['composite_key'] = df_small[key_columns].astype(str).agg('_'.join, axis=1)

matching_mask = df_big['composite_key'].isin(df_small['composite_key'])
df_big.loc[matching_mask, 'classification'] = 0

df_big = df_big.drop('composite_key', axis=1)

print(f"Big dataset: {len(df_big)} rows")
print(f"Small dataset: {len(df_small)} rows")
print(f"Rows classified as 0 (in subset): {len(df_big[df_big['classification'] == 0])}")
print(f"Rows classified as 1 (not in subset): {len(df_big[df_big['classification'] == 1])}")

df_big.to_csv('/content/Dataset/big_dataset_classified.csv', index=False)
print("\n? Big dataset with classification saved!") 
