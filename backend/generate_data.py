# File: generate_data.py
# This script creates a synthetic dataset if one doesn't already exist.

import pandas as pd
import numpy as np
import datetime
import os

# --- Configuration ---
OUTPUT_CSV_FILE = 'solar_data_nasa_pune.csv'
PUNE_LAT = 18.5204
PUNE_LON = 73.8567
START_YEAR = 2019
END_YEAR = 2023 # 5 years of data

# --- Generation Logic ---
def generate_synthetic_data_file():
    """Generates and saves a synthetic CSV file if it doesn't exist."""
    
    # --- IMPORTANT CHECK ---
    # If the file already exists, do nothing.
    # This protects your "true data" file when you add it later.
    if os.path.exists(OUTPUT_CSV_FILE):
        print(f"INFO: Data file '{OUTPUT_CSV_FILE}' already exists.")
        print(" -> Skipping synthetic data generation.")
        return

    print(f"INFO: Data file not found. Generating new synthetic data for Pune ({START_YEAR}-{END_YEAR})...")
    dates = pd.date_range(start=f'{START_YEAR}-01-01', end=f'{END_YEAR}-12-31', freq='D')
    df = pd.DataFrame({'DATE': dates})

    # Add required features
    df['LAT'] = PUNE_LAT
    df['LON'] = PUNE_LON
    df['ACRES'] = 1.0 # For per-acre prediction
    df['MONTH'] = df['DATE'].dt.month
    df['DAY_OF_YEAR'] = df['DATE'].dt.dayofyear

    # Simulate GHI (ALLSKY_SFC_SW_DWN in kWh/m^2/day)
    base_ghi = 5.5
    amplitude_ghi = 1.5
    ghi_seasonality = base_ghi - amplitude_ghi * np.cos(2 * np.pi * (df['DAY_OF_YEAR'] - 40) / 365.25)
    monsoon_factor = 1 - 0.4 * np.exp(-((df['DAY_OF_YEAR'] - 210) / 50)**2)
    ghi_noise = np.random.normal(0, 0.4, size=len(df))
    df['ALLSKY_SFC_SW_DWN'] = (ghi_seasonality * monsoon_factor + ghi_noise).clip(lower=0.5)

    # Simulate Temperature (T2M in °C)
    base_temp = 25
    amplitude_temp = 6
    temp_seasonality = base_temp + amplitude_temp * np.sin(2 * np.pi * (df['DAY_OF_YEAR'] - 120) / 365.25)
    temp_noise = np.random.normal(0, 1.0, size=len(df))
    df['T2M'] = temp_seasonality + temp_noise

    # Calculate Target (Solar_kWh_per_Acre)
    panel_area_per_acre_sqm = 4046.86 * 0.60
    panel_efficiency = 0.18
    performance_ratio = 0.80
    df['Solar_kWh_per_Acre'] = (
        df['ALLSKY_SFC_SW_DWN'] *
        panel_area_per_acre_sqm *
        panel_efficiency *
        performance_ratio *
        (1 + np.random.normal(0, 0.03, size=len(df)))
    ).clip(lower=0)

    # Select and order final columns
    FINAL_COLUMNS = ['LAT', 'LON', 'ACRES', 'MONTH', 'DAY_OF_YEAR', 'ALLSKY_SFC_SW_DWN', 'T2M', 'Solar_kWh_per_Acre']
    df_final = df[FINAL_COLUMNS].round(4)

    # Save to CSV
    try:
        df_final.to_csv(OUTPUT_CSV_FILE, index=False)
        print(f"Successfully generated and saved {len(df_final)} rows to '{OUTPUT_CSV_FILE}'")
    except Exception as e:
        print(f"ERROR: Failed to save data to '{OUTPUT_CSV_FILE}'. Error: {e}")

# --- Main execution ---
if __name__ == "__main__":
    # Check dependencies
    try:
        import pandas
        import numpy
    except ImportError:
        print("ERROR: 'pandas' and 'numpy' are required. Please install them:")
        print("pip install pandas numpy")
        exit(1)
        
    generate_synthetic_data_file()