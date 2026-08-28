# ============================================
# FASTAPI BACKEND - Ames Housing Predictor
# FINAL: Uses NumPy array + bool conversion
# ============================================

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import pandas as pd
import joblib
import os

# ---------- INITIALIZE APP ----------
app = FastAPI(
    title="XGBoost Housing Price Estimator",
    description="Predicts house prices using XGBoost",
    version="1.0.0"
)

# ---------- CORS ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- LOAD MODEL ----------
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "xgboost_ames.joblib")

try:
    model = joblib.load(MODEL_PATH)
    print(f"✅ Model loaded successfully from {MODEL_PATH}")
except Exception as e:
    print(f"❌ Failed to load model: {e}")
    model = None

# ---------- REQUEST SCHEMA ----------
class HouseFeatures(BaseModel):
    Gr_Liv_Area: float
    Year_Built: float
    Total_Bsmt_SF: float
    Full_Bath: float
    Half_Bath: float
    Bedroom_AbvGr: float
    Garage_Cars: float
    Lot_Area: float
    Fireplaces: float
    Overall_Qual: float
    Overall_Cond: float
    threshold: float = 0.5

# ---------- PREDICTION ENDPOINT ----------
@app.post("/predict")
async def predict(features: HouseFeatures):
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    try:
        # Convert to dictionary
        input_dict = features.dict()
        threshold = input_dict.pop("threshold", 0.5)
        
        # ---------- BUILD NUMPY ARRAY (bypasses all XGBoost dtype issues) ----------
        input_array = np.array([[
            input_dict["Gr_Liv_Area"],
            input_dict["Year_Built"],
            input_dict["Total_Bsmt_SF"],
            input_dict["Full_Bath"],
            input_dict["Half_Bath"],
            input_dict["Bedroom_AbvGr"],
            input_dict["Garage_Cars"],
            input_dict["Lot_Area"],
            input_dict["Fireplaces"],
            input_dict["Overall_Qual"],
            input_dict["Overall_Cond"]
        ]], dtype=np.float64)
        
        # Predict
        prediction = model.predict(input_array)[0]
        
        # ---------- CONVERT TO PYTHON BOOL (Fixes serialization error) ----------
        is_anomaly = bool(prediction > 600000 or prediction < 50000)
        
        return {
            "predicted_price": float(prediction),
            "formatted_price": f"${prediction:,.2f}",
            "is_anomaly": is_anomaly,
            "threshold": float(threshold)
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ---------- HEALTH CHECK ----------
@app.get("/")
async def root():
    return {
        "status": "online",
        "model_loaded": model is not None,
        "message": "Ames Housing Price Estimator API"
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None
    }