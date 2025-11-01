

# Solar-Vision 

Solar-Vision is a web application designed to predict monthly solar energy generation (in kWh) for a given location in Pune, India. Users can input their location, available land area, and average monthly electricity consumption to receive a customized forecast, helping them assess their solar energy potential.

The application uses a machine learning model trained on historical NASA data for Pune, combined with real-time weather forecasts from the Open-Meteo API, to provide accurate predictions.

## Features

  * **Custom Solar Forecast:** Get an estimated monthly solar energy generation (kWh) based on your specific parameters.
  * **Interactive Form:** Easy-to-use interface to input your location (Pune neighborhood), land area (in acres), and monthly electricity consumption.
  * **Real-time Data:** Utilizes live 7-day weather forecasts to ensure predictions are based on current atmospheric conditions.
  * **ML-Powered Backend:** Employs a Scikit-learn (RandomForest) model for robust and accurate energy prediction.

## Technology Stack

This project is a full-stack application composed of a React frontend and a Flask backend.

### Frontend

  * **Framework:** [React](https://reactjs.org/)
  * **Language:** [TypeScript](https://www.typescriptlang.org/)
  * **Bundler:** [Vite](https://vitejs.dev/)
  * **UI:** [shadcn-ui](https://ui.shadcn.com/)
  * **Styling:** [Tailwind CSS](https://tailwindcss.com/)

### Backend

  * **Framework:** [Flask](https://flask.palletsprojects.com/)
  * **Language:** [Python](https://www.python.org/)
  * **ML Library:** [Scikit-learn](https://scikit-learn.org/stable/)
  * **Data Handling:** [Pandas](https://pandas.pydata.org/) & [NumPy](https://numpy.org/)
  * **Data Source:** [Open-Meteo API](https://open-meteo.com/) (for live weather)

## How It Works

1.  **User Input:** The user provides their location, land area (acres), and monthly consumption (kWh) via the React frontend.
2.  **API Request:** The frontend sends the latitude, longitude, and acres to the `/predict` endpoint on the Flask backend.
3.  **Weather Fetching:** The backend server calls the Open-Meteo API to get a 7-day hourly forecast for the given coordinates, specifically requesting temperature (`temperature_2m`) and Global Horizontal Irradiance (`shortwave_radiation`).
4.  **Data Processing:** The hourly forecast data is aggregated into daily averages for temperature and daily sums for GHI (converted from W/m² to kWh/m²).
5.  **Prediction:** This processed data is fed into a pre-trained `RandomForestRegressor` model (`solar_model_nasa_pune.pkl`). The model predicts the daily energy generation in `Solar_kWh_per_Acre`.
6.  **Final Calculation:** The daily-per-acre prediction is scaled by the user's provided `acres`, and the average of the 7-day forecast is used to estimate the total energy for an average month (`avg_daily_pred * 30.4`).
7.  **Response:** The backend returns the final `predicted_kwh_month` to the frontend, which displays it to the user.

### Machine Learning Model

The prediction model is a `RandomForestRegressor` trained on the `solar_data_nasa_pune.csv` dataset.

  * **Model File:** `solar_model_nasa_pune.pkl`
  * **Target Variable:** `Solar_kWh_per_Acre`
  * **Training Features:**
      * `LAT` (Latitude)
      * `LON` (Longitude)
      * `ACRES`
      * `MONTH`
      * `DAY_OF_YEAR`
      * `ALLSKY_SFC_SW_DWN` (GHI)
      * `T2M` (Temperature)

## How to Run Locally

To run this project, you'll need to start both the backend server and the frontend development server.

### Backend (Flask Server)

1.  **Navigate to the backend directory:**

    ```sh
    cd backend
    ```

2.  **Create and activate a virtual environment:**

    ```sh
    # Windows
    python -m venv venv
    .\venv\Scripts\activate

    # macOS / Linux
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Install Python dependencies:**

    ```sh
    pip install -r requirements.txt
    ```

4.  **Run the Flask server:**

    ```sh
    python app.py
    ```

    The backend will be running on `http://127.0.0.1:5000/`.

### Frontend (Vite + React)

1.  **Open a new terminal** and navigate to the **root project directory**.

2.  **Install Node.js dependencies:**

    ```sh
    npm install
    ```

3.  **Start the frontend development server:**

    ```sh
    npm run dev
    ```

4.  Open your browser and navigate to the URL provided by Vite (usually `http://localhost:5173` or `http://localhost:8080`).

-----
