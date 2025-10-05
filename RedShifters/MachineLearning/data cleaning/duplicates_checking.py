import pandas as pd

file_path = '/content/Dataset/cumulative_2025.09.28_10.52.01.csv'

encodings = ['latin1', 'ISO-8859-1', 'cp1252', 'utf-16', 'windows-1252']

for encoding in encodings:
    try:
        df = pd.read_csv(file_path, encoding=encoding)
        print(f"? Successfully read with {encoding} encoding")
        print(f"Data shape: {df.shape}")
        
        total_duplicates = df.duplicated().sum()
        print(f"Total completely duplicate rows: {total_duplicates}")
        
        if total_duplicates > 0:
            duplicate_rows = df[df.duplicated(keep=False)]
            print(f"\nFirst few duplicate rows:")
            print(duplicate_rows.head())
        else:
            print("No complete duplicates found.")
        break
        
    except UnicodeDecodeError:
        print(f"? Failed with {encoding} encoding")
    except Exception as e:
        print(f"? Error with {encoding}: {e}")



