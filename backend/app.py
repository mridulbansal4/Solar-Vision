# File: app.py (Located in backend folder or project root)

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import requests
import datetime
import numpy as np
import os
import traceback # Import traceback for better error logging

app = Flask(__name__)
# Allow requests from your Vite dev server (adjust port if needed)
# For production, restrict this to your actual frontend domain
CORS(app, resources={r"/predict": {"origins": ["http://localhost:8080", "http://127.0.0.1:8080"]}})


# --- Configuration ---
# Ensure model file is in the same directory as app.py or provide the correct path
MODEL_FILE = 'solar_model_nasa_pune.pkl'
FEATURES = [ # Must exactly match features used during training
    'LAT', 'LON', 'ACRES', 'MONTH', 'DAY_OF_YEAR',
    'ALLSKY_SFC_SW_DWN', # GHI (kWh/m^2/day)
    'T2M'                # Temperature (°C)
]
# Pune Coordinates used for TRAINING the model
PUNE_LAT_TRAINING = 18.5204
PUNE_LON_TRAINING = 73.8567

# --- Load Model ---
model = None
if os.path.exists(MODEL_FILE):
    try:
        model = joblib.load(MODEL_FILE)
        print(f"INFO: Pune model '{MODEL_FILE}' loaded successfully.")
    except Exception as e:
        print(f"CRITICAL ERROR: Error loading model '{MODEL_FILE}'. Error: {e}")
        # Optionally exit if model loading fails critically in production
        # exit(1)
else:
    print(f"CRITICAL ERROR: Model file '{MODEL_FILE}' not found. Cannot make predictions.")
    # exit(1)


# --- Open-Meteo API Call Function ---
def get_open_meteo_forecast(latitude, longitude, days=7):
    """Fetches hourly solar forecast from Open-Meteo."""
    print(f"INFO: Fetching Open-Meteo forecast for Lat: {latitude}, Lon: {longitude}...")
    base_url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "temperature_2m,shortwave_radiation", # Temp (°C), GHI (W/m^2)
        "forecast_days": days,
        "timezone": "auto" # Auto-detect timezone based on coords
    }
    try:
        response = requests.get(base_url, params=params, timeout=15)
        response.raise_for_status() # Raises HTTPError for bad responses (4XX, 5XX)
        data = response.json()
        if 'hourly' not in data or 'time' not in data['hourly']:
             print("ERROR: Invalid format in Open-Meteo response:", data)
             return None
        print(f" -> Open-Meteo forecast fetched successfully for {days} days.")
        return data['hourly']
    except requests.exceptions.Timeout:
        print(f"ERROR: Timeout fetching Open-Meteo data for {latitude},{longitude}.")
        return None
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Failed to fetch Open-Meteo data. Status Code: {e.response.status_code if e.response else 'N/A'}. Error: {e}")
        return None
    except Exception as e: # Catch other potential errors like JSON parsing
        print(f"ERROR: Processing Open-Meteo response failed unexpectedly. Error: {e}")
        return None

# --- Prediction Endpoint ---
@app.route('/predict', methods=['POST', 'OPTIONS']) # Add OPTIONS for CORS preflight
def predict():
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()

    if model is None:
        print("ERROR: /predict called but model is not loaded.")
        return jsonify({"error": "Model not loaded on server"}), 500

    try:
        req_data = request.get_json()
        if not req_data:
             return jsonify({"error": "Request body must be JSON"}), 400
        print("INFO: Received request data:", req_data)

        # --- Input Validation ---
        required_keys = ['latitude', 'longitude', 'acres']
        missing = [key for key in required_keys if key not in req_data]
        if missing:
            return jsonify({"error": f"Missing required input keys: {missing}"}), 400

        try:
            forecast_latitude = float(req_data['latitude'])
            forecast_longitude = float(req_data['longitude'])
            acres = float(req_data['acres'])
        except (ValueError, TypeError):
             return jsonify({"error": "latitude, longitude, and acres must be numbers"}), 400

        if acres <= 0:
             return jsonify({"error": "Invalid value for 'acres'. Must be positive."}), 400

        # --- Get Forecast Data from Open-Meteo ---
        forecast_days = 7 # Predict based on next 7 days forecast
        hourly_forecast = get_open_meteo_forecast(forecast_latitude, forecast_longitude, forecast_days)

        if not hourly_forecast:
            return jsonify({"error": "Could not retrieve weather forecast data from Open-Meteo"}), 503 # Service Unavailable

        # --- Process Forecast Data ---
        try:
            df_forecast = pd.DataFrame(hourly_forecast)
            df_forecast['time'] = pd.to_datetime(df_forecast['time'])
            df_forecast.set_index('time', inplace=True)

            # Aggregate hourly W/m^2 to daily kWh/m^2
            # Sum(W/m^2 * 1 hour) / 1000 = kWh/m^2 for the day
            daily_ghi_kwh_m2 = df_forecast['shortwave_radiation'].resample('D').sum() / 1000
            daily_temp_c = df_forecast['temperature_2m'].resample('D').mean()

            # Create DataFrame matching FEATURES structure
            daily_summary = pd.DataFrame({
                'DATE': daily_ghi_kwh_m2.index,
                'ALLSKY_SFC_SW_DWN': daily_ghi_kwh_m2.values, # Use forecast GHI
                'T2M': daily_temp_c.values                 # Use forecast Temp
            })

            # Add features used for TRAINING, using the FIXED training coords
            daily_summary['LAT'] = PUNE_LAT_TRAINING
            daily_summary['LON'] = PUNE_LON_TRAINING
            daily_summary['ACRES'] = 1.0 # Model trained per acre
            daily_summary['MONTH'] = daily_summary['DATE'].dt.month
            daily_summary['DAY_OF_YEAR'] = daily_summary['DATE'].dt.dayofyear

            # Ensure correct column order and handle NaNs
            X_predict = daily_summary[FEATURES].copy()
            if X_predict.isnull().values.any(): # Check whole DataFrame efficiently
                print("WARNING: NaNs found in features pre-prediction. Imputing...")
                for col in X_predict.columns[X_predict.isnull().any()]:
                    mean_val = X_predict[col].mean()
                    if pd.isna(mean_val): mean_val = 0 # Fallback if all are NaN
                    X_predict[col] = X_predict[col].fillna(mean_val)
                    print(f" - Imputed NaNs in '{col}' with mean {mean_val:.2f}")

            print(f"\nINFO: DataFrame prepared for prediction (shape: {X_predict.shape}):")
            print(X_predict.head())

        except Exception as e:
            print(f"ERROR: Failed during forecast data processing. Error: {e}")
            traceback.print_exc()
            return jsonify({"error": f"Failed to process weather forecast data: {str(e)}"}), 500

        # --- Make Predictions ---
        try:
            daily_predictions_per_acre = model.predict(X_predict)
            # Scale by actual user-provided acres
            daily_predictions_total_kwh = daily_predictions_per_acre * acres
        except Exception as e:
            print(f"ERROR: Model prediction failed. Error: {e}")
            traceback.print_exc()
            return jsonify({"error": f"Model prediction failed: {str(e)}"}), 500


        # --- Aggregate Result ---
        # Calculate the average daily prediction and estimate monthly total
        avg_daily_pred = np.mean(daily_predictions_total_kwh)
        estimated_monthly_kwh = avg_daily_pred * 30.4 # Avg days per month

        print(f"INFO: Avg Daily Predicted kWh: {avg_daily_pred:.2f}")
        print(f"INFO: Estimated Monthly kWh: {estimated_monthly_kwh:.2f}")

        # Final check for NaN before returning
        if pd.isna(estimated_monthly_kwh) or np.isnan(estimated_monthly_kwh):
             print("ERROR: Final prediction resulted in NaN")
             return jsonify({"error": "Prediction calculation resulted in invalid value"}), 500

        # --- Return Response ---
        # Key MUST match frontend expectation: 'predicted_kwh_month'
        return jsonify({'predicted_kwh_month': float(estimated_monthly_kwh)})

    except Exception as e:
        print(f"ERROR: Unhandled exception in /predict route: {e}")
        traceback.print_exc()
        return jsonify({"error": f"An unexpected server error occurred: {str(e)}"}), 500

# Helper function for CORS preflight requests
def _build_cors_preflight_response():
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "*") # Be more specific in production
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "POST,OPTIONS")
    return response

# Need this import for the helper function
from flask import make_response

# --- Run App (for local development) ---
if __name__ == '__main__':
    # Use 0.0.0.0 to make it accessible on your local network (optional)
    app.run(host='0.0.0.0', port=5000, debug=True) # debug=True is for development ONLY