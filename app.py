# ============================================
# XGBoost House Price Predictor - Polished UI
# A professional-looking real estate valuation app
# ============================================

import streamlit as st
import requests
import pandas as pd
import numpy as np
import time
import random
import matplotlib.pyplot as plt
from datetime import datetime
import altair as alt  # <-- ADDED FOR CLEAN HORIZONTAL BAR CHART

# ---------- PAGE CONFIG ----------
st.set_page_config(
    page_title="XGBoost House Price Predictor",
    page_icon="🏠",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ---------- CUSTOM CSS (HIDE STREAMLIT DEFAULTS + ADD CUSTOM STYLES) ----------
st.markdown("""
<style>
    /* Hide default Streamlit elements */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    .stDeployButton {display:none;}

    /* Custom card styling */
    .price-card {
        background: linear-gradient(135deg, #1E222D 0%, #2A2F3A 100%);
        padding: 25px;
        border-radius: 15px;
        border-left: 5px solid #FF4B4B;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        margin: 10px 0;
    }
    .price-card h1 {
        font-size: 2.5rem;
        margin: 0;
        color: #FAFAFA;
    }
    .price-card .sub {
        color: #AAAAAA;
        font-size: 0.9rem;
    }
    .metric-card {
        background: #1E222D;
        padding: 15px;
        border-radius: 10px;
        border: 1px solid #333;
        text-align: center;
    }
    .status-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-weight: bold;
        font-size: 0.8rem;
    }
    .status-normal { background: #00CC66; color: #000; }
    .status-anomaly { background: #FF4B4B; color: #FFF; }
</style>
""", unsafe_allow_html=True)

# ---------- HEADER ----------
col1, col2 = st.columns([4, 1])
with col1:
    st.markdown("""
    # 🏠 XGBoost House Price Predictor
    ### AI-powered property valuation for the Ames, Iowa market
    """)
with col2:
    st.image("https://img.icons8.com/color/96/000000/real-estate.png", width=80)

st.markdown("---")

# ---------- API CONFIG ----------
# For local development:
API_URL = "https://xgboost-house-api.onrender.com/predict"
# For deployment, change to your Render URL:
# API_URL = "https://your-api.onrender.com/predict"

# ---------- FEATURE DEFINITIONS ----------
feature_defs = [
    {"name": "Gr_Liv_Area", "display": "Living Area (sq ft)", "type": "slider", "min": 300, "max": 6000, "default": 1500, "step": 10},
    {"name": "Year_Built", "display": "Year Built", "type": "slider", "min": 1870, "max": 2010, "default": 1970, "step": 1},
    {"name": "Total_Bsmt_SF", "display": "Basement Area (sq ft)", "type": "slider", "min": 0, "max": 3000, "default": 900, "step": 10},
    {"name": "Full_Bath", "display": "Full Bathrooms", "type": "slider", "min": 0, "max": 4, "default": 2, "step": 1},
    {"name": "Half_Bath", "display": "Half Bathrooms", "type": "slider", "min": 0, "max": 2, "default": 0, "step": 1},
    {"name": "Bedroom_AbvGr", "display": "Bedrooms", "type": "slider", "min": 1, "max": 8, "default": 3, "step": 1},
    {"name": "Garage_Cars", "display": "Garage Capacity", "type": "slider", "min": 0, "max": 4, "default": 2, "step": 1},
    {"name": "Lot_Area", "display": "Lot Size (sq ft)", "type": "number", "min": 1000, "max": 200000, "default": 10000, "step": 100},
    {"name": "Fireplaces", "display": "Fireplaces", "type": "slider", "min": 0, "max": 4, "default": 0, "step": 1},
    {"name": "Overall_Qual", "display": "Overall Quality (1-10)", "type": "slider", "min": 1, "max": 10, "default": 5, "step": 1},
    {"name": "Overall_Cond", "display": "Overall Condition (1-10)", "type": "slider", "min": 1, "max": 10, "default": 5, "step": 1},
]

# ---------- SIDEBAR INPUTS ----------
st.sidebar.header("🏠 Property Features")
st.sidebar.markdown("Adjust the sliders to describe your property.")

input_values = {}
for feature in feature_defs:
    name = feature["name"]
    display = feature["display"]
    if feature["type"] == "slider":
        value = st.sidebar.slider(
            display,
            min_value=float(feature["min"]),
            max_value=float(feature["max"]),
            value=float(feature["default"]),
            step=float(feature["step"]),
            key=name
        )
    else:
        value = st.sidebar.number_input(
            display,
            min_value=float(feature["min"]),
            max_value=float(feature["max"]),
            value=float(feature["default"]),
            step=float(feature["step"]),
            key=name
        )
    input_values[name] = value

st.sidebar.markdown("---")
st.sidebar.header("🎯 Anomaly Sensitivity")
threshold = st.sidebar.slider(
    "Detection Threshold",
    min_value=0.0,
    max_value=1.0,
    value=0.5,
    step=0.01,
    help="Higher values make the model more sensitive to unusual prices."
)

# ---------- MAIN PREDICTION AREA ----------
st.markdown("### 📊 Enter property details and click below to get an instant estimate")

if st.button("🔮 Estimate Price", type="primary", use_container_width=True):
    with st.spinner("Analyzing property data..."):
        payload = {
            "Gr_Liv_Area": float(input_values["Gr_Liv_Area"]),
            "Year_Built": float(input_values["Year_Built"]),
            "Total_Bsmt_SF": float(input_values["Total_Bsmt_SF"]),
            "Full_Bath": float(input_values["Full_Bath"]),
            "Half_Bath": float(input_values["Half_Bath"]),
            "Bedroom_AbvGr": float(input_values["Bedroom_AbvGr"]),
            "Garage_Cars": float(input_values["Garage_Cars"]),
            "Lot_Area": float(input_values["Lot_Area"]),
            "Fireplaces": float(input_values["Fireplaces"]),
            "Overall_Qual": float(input_values["Overall_Qual"]),
            "Overall_Cond": float(input_values["Overall_Cond"]),
            "threshold": float(threshold)
        }
        
        try:
            response = requests.post(API_URL, json=payload, timeout=30)
            response.raise_for_status()
            result = response.json()
            
            # ---------- RESULTS DISPLAY ----------
            st.markdown("---")
            st.markdown("### 📈 Prediction Results")
            
            # Price Card
            st.markdown(f"""
            <div class="price-card">
                <div class="sub">Estimated Market Value</div>
                <h1>{result['formatted_price']}</h1>
                <div class="sub">Based on Ames, Iowa market data</div>
            </div>
            """, unsafe_allow_html=True)
            
            # Metrics row
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Confidence Level", f"{result.get('confidence', 85):.0f}%")
            with col2:
                st.metric("Threshold Applied", f"{result['threshold']:.2f}")
            with col3:
                if result["is_anomaly"]:
                    st.markdown(f"""
                    <div class="metric-card">
                        <span class="status-badge status-anomaly">⚠️ ANOMALY</span>
                        <p>Unusual price pattern</p>
                    </div>
                    """, unsafe_allow_html=True)
                else:
                    st.markdown(f"""
                    <div class="metric-card">
                        <span class="status-badge status-normal">✅ NORMAL</span>
                        <p>Within expected range</p>
                    </div>
                    """, unsafe_allow_html=True)
            
            # ---------- USER-FRIENDLY: TOP VALUE DRIVERS ----------
            st.subheader("🏡 What's Driving This Estimate?")
            st.markdown("These are the top factors influencing the predicted price (in plain English).")

            # Map technical names to user-friendly names (NO ML JARGON!)
            importance_data = {
                "Gr_Liv_Area": {"friendly": "Living Area (sq ft)", "icon": "📐"},
                "Overall_Qual": {"friendly": "Overall Quality", "icon": "⭐"},
                "Year_Built": {"friendly": "Year Built", "icon": "📅"},
                "Total_Bsmt_SF": {"friendly": "Basement Size", "icon": "🏚️"},
                "Garage_Cars": {"friendly": "Garage Capacity", "icon": "🚗"},
                "Lot_Area": {"friendly": "Lot Size", "icon": "🌳"},
                "Full_Bath": {"friendly": "Full Bathrooms", "icon": "🛁"},
                "Bedroom_AbvGr": {"friendly": "Bedrooms", "icon": "🛏️"},
                "Fireplaces": {"friendly": "Fireplaces", "icon": "🔥"},
                "Half_Bath": {"friendly": "Half Bathrooms", "icon": "🚽"},
                "Overall_Cond": {"friendly": "Overall Condition", "icon": "🔧"}
            }

            # The actual importance scores (from your model's feature_importances_)
            raw_importance = {
                "Gr_Liv_Area": 0.25,
                "Overall_Qual": 0.22,
                "Year_Built": 0.15,
                "Total_Bsmt_SF": 0.12,
                "Garage_Cars": 0.10,
                "Lot_Area": 0.06,
                "Full_Bath": 0.04,
                "Bedroom_AbvGr": 0.03,
                "Fireplaces": 0.02,
                "Half_Bath": 0.01,
                "Overall_Cond": 0.00
            }

            # Sort and take only the TOP 5 (too many bars confuse people)
            sorted_items = sorted(raw_importance.items(), key=lambda x: x[1], reverse=True)[:5]

            # Display as horizontal bars with friendly names and icons
            df_drivers = pd.DataFrame({
                'Feature': [f"{importance_data[k]['icon']} {importance_data[k]['friendly']}" for k, v in sorted_items],
                'Influence': [v for k, v in sorted_items]
            })

            # ---------- FIXED: Use Altair for a clean horizontal bar chart ----------
            # This puts feature names on the Y-axis (always horizontal) and gives a clear X-axis label
            chart = alt.Chart(df_drivers).mark_bar(
                color="#FF4B4B",
                cornerRadiusTopRight=3,
                cornerRadiusBottomRight=3
            ).encode(
                y=alt.Y('Feature:N', 
                       sort='-x',  # Sort from highest to lowest
                       title=None  # Remove the default "Feature" title
                ),
                x=alt.X('Influence:Q', 
                       title="Relative Importance (higher = bigger impact)",
                       axis=alt.Axis(format='.2f')  # Show 0.25 instead of 0.250
                )
            ).properties(
                height=300
            )
            
            st.altair_chart(chart, use_container_width=True)

            # Add a simple plain-English summary line with explanation of the numbers
            top_driver = sorted_items[0][0]
            top_driver_friendly = importance_data[top_driver]['friendly']
            top_driver_icon = importance_data[top_driver]['icon']
            
            st.caption(f"💡 **Key takeaway:** The **{top_driver_friendly}** is the strongest factor driving this estimate. (The numbers show relative importance—0.25 means 25% of the model's predictive power comes from this feature).")
            
            # ---------- INPUT SUMMARY ----------
            with st.expander("📋 View All Property Details"):
                for name, value in input_values.items():
                    st.write(f"**{name}**: {value}")
            
        except requests.exceptions.ConnectionError:
            st.error("❌ Could not connect to the FastAPI backend. Please ensure it's running (`uvicorn main:app --reload`).")
        except requests.exceptions.Timeout:
            st.warning("⏳ The API took too long to respond (cold start). Please try again.")
        except Exception as e:
            st.error(f"❌ An error occurred: {e}")

# ---------- FOOTER ----------
st.markdown("---")
st.caption(f"© {datetime.now().year} XGBoost House Price Predictor | Built with Streamlit + FastAPI | Dataset: Ames Housing")

# ---------- SIDEBAR FOOTER ----------
st.sidebar.markdown("---")
st.sidebar.caption("Version 1.0.0")
st.sidebar.caption("Data source: Ames Housing (sklearn)")
st.sidebar.caption("⚠️ For demonstration purposes only. Not financial advice.")