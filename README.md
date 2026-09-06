# 🏠 HomeWise - XGBoost House Price Predictor

## 📊 Overview
A professional, interactive property valuation tool powered by **XGBoost** machine learning. Features a pure HTML/CSS/JS frontend with a wizard-style user interface and a FastAPI backend.

## 🚀 Live Demo
- **Frontend (HTML/CSS/JS):** [https://sm2hashmi.github.io/XGBoost_House_Predictor/](https://sm2hashmi.github.io/XGBoost_House_Price_Predictor/)
- **Backend (FastAPI):** [https://xgboost-house-api.onrender.com](https://xgboost-house-api.onrender.com/)

## 🛠️ Tech Stack
- **Frontend:** HTML, CSS (Tailwind), JavaScript (noUiSlider, Chart.js)
- **Backend:** FastAPI, Python
- **Model:** XGBoost
- **Dataset:** Ames Housing (Iowa, USA)

## 📁 Project Structure
```
XGBoost_House_Predictor/
├── index.html          # Main frontend page
├── style.css           # Custom styles (glassmorphism, slider overrides)
├── script.js           # All JavaScript logic (wizard, API calls, chart)
├── main.py             # FastAPI backend
├── models/
│   └── xgboost_ames.joblib  # Trained XGBoost model
├── requirements.txt    # Python dependencies for FastAPI
└── README.md           # This file
```

## ⚙️ Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/smmhashmi/XGBoost_House_Predictor.git
cd XGBoost_House_Predictor
```

### 2. Set Up Python Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the FastAPI Backend
```bash
uvicorn main:app --reload --port 8000
```

### 5. Open the Frontend
- **Option A:** Open `index.html` directly in your browser (works if API is running).
- **Option B:** Serve it with a local server:
  ```bash
  python3 -m http.server 8001
  ```
  Then open `http://localhost:8001`

## 🔧 How It Works
1. **Landing Page:** A hero section with a "Start Valuation" button.
2. **Wizard Flow:** 12 steps (11 property features + 1 sensitivity setting).
3. **Sliders + Number Inputs:** Users can drag or type values.
4. **Validation:** Warning messages appear if values are out of range.
5. **Prediction:** Calls the FastAPI backend with the input data.
6. **Results:** Displays estimated price (animated counter) and a feature importance chart.

## ⚠️ Important Notes

### Production Readiness
This project is a **proof of concept** and is intended for **educational and demonstration purposes only**. It should not be deployed in production environments without significant hardening and optimization.

### CDN Usage
The frontend relies on external CDN services (Tailwind CSS, noUiSlider, Chart.js, Font Awesome) for convenience and rapid prototyping. While this approach is suitable for development and demonstration, it is **not recommended for production deployments** due to potential security, reliability, and performance concerns.

### Render Cold Start
The FastAPI backend is deployed on **Render's free tier**. It spins down after **15 minutes of inactivity**. The first request after a pause takes **~30-60 seconds to wake up**. Visit the `/health` endpoint first to warm it up.

## 📊 Dataset
The model is trained on the **Ames Housing** dataset (Iowa, USA). It should not be used for real-world financial decisions without proper retraining and validation.

## 📝 License
This project was created for an academic machine learning assignment.
