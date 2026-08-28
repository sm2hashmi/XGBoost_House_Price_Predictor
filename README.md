# 🏠 Ames Housing Price Estimator (XGBoost + FastAPI + Streamlit)

## 📊 Overview
A complete ML application for predicting house prices using the Ames Housing dataset. Features a FastAPI backend and a Streamlit frontend with real-time anomaly detection.

## 🚀 Live Demo
**Streamlit URL:** [https://your-app.streamlit.app](https://your-app.streamlit.app)
**FastAPI Backend:** [https://ames-housing-api.onrender.com](https://ames-housing-api.onrender.com)

## ⚠️ Deployment Notes

### Render Cold Start (Free Tier)
The FastAPI backend is deployed on **Render's free tier**. 
To save resources, Render spins down the server after **15 minutes of inactivity**.

- When you access the backend or the Streamlit app after a period of inactivity, the first request will take **~30–60 seconds** to wake the server up. 
- This is completely normal and is **not a bug** in the application.
- Once the server is awake, subsequent requests will be fast (< 1 second).

**To avoid the cold start during your evaluation:**  
Simply open the backend health check URL in a new tab first:
[https://xgboost-house-api.onrender.com/health](https://xgboost-house-api.onrender.com/health)  
Wait for it to load, then use the Streamlit app normally.

## 🛠️ Tech Stack
- **Model:** XGBoost (Gradient Boosting)
- **Backend:** FastAPI (Deployed on Render)
- **Frontend:** Streamlit (Deployed on Streamlit Cloud)
- **Dataset:** Ames Housing (sklearn)

## 📦 Local Setup

1. Clone and navigate:
```bash
cd Ames_Housing_Predictor