# File: train_model.py
# This script loads the data file and trains the model.

import pandas as pd
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score

# --- Configuration ---
DATA_FILE = 'solar_data_nasa_pune.csv' # File to load data from
MODEL_FILE = 'solar_model_nasa_pune.pkl' # File to save the model to

FEATURES = [
    'LAT', 'LON', 'ACRES', 'MONTH', 'DAY_OF_YEAR',
    'ALLSKY_SFC_SW_DWN', # GHI
    'T2M'                # Temperature
]
TARGET = 'Solar_kWh_per_Acre'

# --- 1. Load Data ---
print("--- Starting Model Training Script ---")
print(f"Attempting to load data from '{DATA_FILE}'...")
if not os.path.exists(DATA_FILE):
    print(f"CRITICAL ERROR: Data file '{DATA_FILE}' not found.")
    print("Please create the data file first (e.g., by running 'generate_data.py' or adding your true data).")
    exit(1)

try:
    df_train = pd.read_csv(DATA_FILE)
    print(f"Data loaded successfully. Shape: {df_train.shape}")
except Exception as e:
    print(f"CRITICAL ERROR: Failed to read '{DATA_FILE}'. Error: {e}")
    exit(1)

# --- 2. Prepare Data for Model ---
print("\nPreparing data for model training...")
try:
    X = df_train[FEATURES]
    y = df_train[TARGET]
except KeyError as e:
    print(f"CRITICAL ERROR: Missing required column. {e}")
    print(f"Make sure '{DATA_FILE}' contains all features: {FEATURES} and target: {TARGET}")
    exit(1)

# Handle potential NaNs
if X.isnull().values.any() or y.isnull().values.any():
    print("WARNING: NaNs detected in data. Dropping rows with missing values...")
    df_train.dropna(subset=FEATURES + [TARGET], inplace=True)
    X = df_train[FEATURES]
    y = df_train[TARGET]
    print(f"Data shape after dropping NaNs: {X.shape}")

if X.empty:
    print("CRITICAL ERROR: No data remaining after handling missing values. Cannot train model.")
    exit(1)

# --- 3. Split Data ---
print("\nSplitting data into training and testing sets (80% train, 20% test)...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
print(f"Training set size: {X_train.shape[0]} samples")
print(f"Test set size: {X_test.shape[0]} samples")

# --- 4. Train Model ---
print("\nTraining RandomForestRegressor model...")
model = RandomForestRegressor(
    n_estimators=150,
    max_depth=15,
    min_samples_split=10,
    min_samples_leaf=5,
    random_state=42,
    n_jobs=-1,
    oob_score=True
)
try:
    model.fit(X_train, y_train)
    print("Model training complete.")
    if hasattr(model, 'oob_score_') and model.oob_score_:
        print(f"Model Out-of-Bag (OOB) R-squared score: {model.oob_score_:.4f}")
except Exception as e:
    print(f"CRITICAL ERROR: Model training failed. Error: {e}")
    exit(1)

# --- 5. Evaluate Model ---
print("\nEvaluating model on the test set...")
try:
    predictions = model.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)
    print(f"Mean Absolute Error (MAE): {mae:.2f} kWh/Acre")
    print(f"R-squared (R2) Score: {r2:.4f}")
except Exception as e:
    print(f"ERROR: Model evaluation failed. Error: {e}")

# --- 6. Save Model ---
print(f"\nSaving trained model to '{MODEL_FILE}'...")
try:
    joblib.dump(model, MODEL_FILE)
    print(f"Model successfully saved to '{MODEL_FILE}'.")
except Exception as e:
    print(f"ERROR: Failed to save the model. Error: {e}")

print("\n--- Model Training Script Finished ---")