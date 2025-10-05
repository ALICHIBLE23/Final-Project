import sys
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import numpy as np
import re
import os

if len(sys.argv) < 4:
    print("Usage: python lightcurve.py <csv_path> <planet_name> <output_path>")
    sys.exit(1)

csv_path = sys.argv[1]
planet_name = sys.argv[2]
output_path = sys.argv[3]

def normalize(name):
    return re.sub(r"[^a-z0-9]", "", str(name).lower())

def generate_curve(period, depth_ppm, duration, title):
    depth = depth_ppm / 1_000_000
    time = np.linspace(0, period, 500)
    mid = period / 2
    sigma = duration / 2
    brightness = 1 - depth * np.exp(-((time - mid) ** 2) / (2 * sigma ** 2))
    
    plt.figure(figsize=(10, 6))
    plt.plot(time, brightness, color="deepskyblue", linewidth=2)
    plt.title(title, fontsize=14)
    plt.xlabel("Time (days)", fontsize=12)
    plt.ylabel("Normalized Brightness", fontsize=12)
    plt.grid(True, alpha=0.3)
    plt.tight_layout()

try:
    print(f"Searching for planet: {planet_name}")
    
    df = pd.read_csv(csv_path)
    print(f"CSV columns: {df.columns.tolist()}")
    
    # Check which name column exists
    name_col = None
    if "Planet_name" in df.columns:
        name_col = "Planet_name"
    elif "Name" in df.columns:
        name_col = "Name"
    else:
        print("ERROR: No name column found")
        sys.exit(1)
    
    print(f"Using column: {name_col}")
    
    # Normalize and search
    df["norm_name"] = df[name_col].apply(normalize)
    target_norm = normalize(planet_name)
    match = df[df["norm_name"].str.contains(target_norm, na=False)]
    
    if match.empty:
        print(f"Planet not found: {planet_name}")
        # Create "not found" image
        plt.figure(figsize=(10, 6))
        plt.text(0.5, 0.5, f"Planet '{planet_name}' not found", 
                ha="center", va="center", fontsize=16)
        plt.axis('off')
    else:
        planet = match.iloc[0]
        print(f"Found: {planet[name_col]}")
        
        period = float(planet.get("orbital_period", 10) or 10)
        depth_ppm = float(planet.get("Transit_depth", 2000) or 2000)
        duration = float(planet.get("Transit_duration", 2) or 2)
        
        print(f"period={period}, depth={depth_ppm}, duration={duration}")
        
        generate_curve(period, depth_ppm, duration, f"Light Curve: {planet[name_col]}")
    
    # Save
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    plt.savefig(output_path, dpi=100, bbox_inches='tight')
    plt.close()
    print(f"SAVED: {output_path}")
    sys.exit(0)
    
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)