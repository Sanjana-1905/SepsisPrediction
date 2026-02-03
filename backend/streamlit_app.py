import streamlit as st
import joblib
import pandas as pd
import numpy as np
import os

# --- PAGE CONFIG ---
st.set_page_config(
    page_title="Sepsis Prediction System",
    page_icon="🏥",
    layout="wide"
)

# --- CLASS DEFINITIONS (Must match main.py for Pickle compatibility) ---
class SepsisPredictor:
    def __init__(self):
        pass

    def _unwrap_estimator(self):
        def _is_estimator(obj):
            if obj is None or obj is self:
                return False
            return hasattr(obj, "predict_proba") or hasattr(obj, "predict")

        # Common attribute names
        for attr in (
            "model", "clf", "estimator", "pipeline", "base_model",
            "sk_model", "xgb_model", "decision_model",
        ):
            try:
                est = getattr(self, attr, None)
            except Exception:
                est = None
            if _is_estimator(est):
                return est

        try:
            items = list(getattr(self, "__dict__", {}).items())
        except Exception:
            items = []
        for _, val in items:
            if _is_estimator(val):
                return val
            if isinstance(val, dict):
                for v in val.values():
                    if _is_estimator(v):
                        return v
            if isinstance(val, (list, tuple)):
                for v in val:
                    if _is_estimator(v):
                        return v
        return None

    def predict_proba(self, X):
        est = self._unwrap_estimator()
        if est is not None and hasattr(est, "predict_proba"):
            return est.predict_proba(X)
        X_arr = np.asarray(X)
        n = int(X_arr.shape[0]) if X_arr.ndim >= 1 else 1
        return np.tile(np.array([[0.5, 0.5]]), (n, 1))
    
    def predict(self, X):
        est = self._unwrap_estimator()
        if est is not None and hasattr(est, "predict"):
            return est.predict(X)
        probs = self.predict_proba(X)
        try:
            return probs[:, 1]
        except Exception:
            return np.array([0.5])

# --- CONSTANTS & CONFIG ---
base_dir = os.path.dirname(__file__)

_EARLY_VITALS_DEFAULTS = {
    "HR": 80.0, "Temp": 37.0, "SBP": 120.0, "DBP": 80.0,
    "MAP": 90.0, "O2Sat": 98.0, "Resp": 16.0,
}

UI_MAP = {
    'HR': 'heart_rate', 'SBP': 'systolic_bp', 'DBP': 'diastolic_bp',
    'MAP': 'mean_bp', 'O2Sat': 'oxygen_saturation', 'Temp': 'temperature',
    'Resp': 'respiratory_rate', 'WBC': 'leukocytes', 'Platelets': 'thrombocytes',
    'Lactate': 'lactate', 'Hgb': 'hemoglobin', 'Hct': 'hematocrit',
    'PTT': 'partial_thromboplastin_time', 'Fibrinogen': 'fibrinogen',
    'TroponinI': 'troponin_i', 'Magnesium': 'magnesium', 'Phosphate': 'phosphate',
    'Bilirubin_total': 'total_bilirubin', 'Glucose': 'blood_glucose',
    'Creatinine': 'creatinine', 'pH': 'arterial_ph', 'HCO3': 'bicarbonate',
    'BaseExcess': 'base_excess', 'FiO2': 'fraction_of_inspired_o2',
    'PaCO2': 'partial_co2', 'EtCO2': 'partial_co2', 'SaO2': 'oxygen_saturation',
    'Chloride': 'chloride', 'Calcium': 'calcium', 'Potassium': 'potassium',
    'AST': 'aspartate_aminotransferase', 'BUN': 'blood_urea_nitrogen',
    'Alkalinephos': 'alkaline_phosphatase', 'Bilirubin_direct': 'direct_bilirubin',
    'Age': 'age', 'Gender': 'gender', 'ICULOS': 'iculos', 'Hour': 'hour',
    'SOFA_score': 'sofa_score', 'SOFA_cardio': 'sofa_cardio',
    'Shock_Index': 'shock_index', 'MAP_Calc': 'map_calc',
    'HospAdmTime': 'hosp_adm_time', 'Unit1': 'unit1', 'Unit2': 'unit2',
}

# --- LOAD MODELS ---
@st.cache_resource
def load_models():
    models = {
        "severity_model": None, "severity_scaler": None, "healthy_medians": None,
        "clinical_bridge": None, "sepsis_decision_engine": None,
        "base_vitals_model": None, "feature_names": None
    }
    
    try:
        # Severity Model
        if os.path.exists(os.path.join(base_dir, "sepsis_honest_73_balanced.pkl")):
            models["severity_model"] = joblib.load(os.path.join(base_dir, "sepsis_honest_73_balanced.pkl"))
        elif os.path.exists(os.path.join(base_dir, "sepsis_balanced_70_70.pkl")):
            models["severity_model"] = joblib.load(os.path.join(base_dir, "sepsis_balanced_70_70.pkl"))
        
        # Artifacts
        if os.path.exists(os.path.join(base_dir, "sepsis_scaler.pkl")):
            models["severity_scaler"] = joblib.load(os.path.join(base_dir, "sepsis_scaler.pkl"))
        if os.path.exists(os.path.join(base_dir, "healthy_medians.pkl")):
            models["healthy_medians"] = joblib.load(os.path.join(base_dir, "healthy_medians.pkl"))
        if os.path.exists(os.path.join(base_dir, "clinical_bridge.pkl")):
            models["clinical_bridge"] = joblib.load(os.path.join(base_dir, "clinical_bridge.pkl"))
            
        # Feature Names
        if models["severity_model"] and hasattr(models["severity_model"], "feature_names_in_"):
            models["feature_names"] = list(models["severity_model"].feature_names_in_)
        elif models["healthy_medians"] and isinstance(models["healthy_medians"], dict):
            models["feature_names"] = list(models["healthy_medians"].keys())
        elif os.path.exists(os.path.join(base_dir, "feature_names.pkl")):
            models["feature_names"] = joblib.load(os.path.join(base_dir, "feature_names.pkl"))
            
        # Decision Engine
        if os.path.exists(os.path.join(base_dir, "sepsis_decision_engine.pkl")):
            models["sepsis_decision_engine"] = joblib.load(os.path.join(base_dir, "sepsis_decision_engine.pkl"))
        
        # Base Vitals
        vitals_path = os.path.join(base_dir, "base_vitals_model.pkl")
        if not os.path.exists(vitals_path):
             vitals_path = os.path.join(base_dir, "base_vitals_model .pkl") # whitespace in name from main.py check
        
        if os.path.exists(vitals_path):
            models["base_vitals_model"] = joblib.load(vitals_path)
            
    except Exception as e:
        st.error(f"Error loading models: {e}")
        
    return models

models = load_models()

# --- UI LAYOUT ---
st.title("🏥 Sepsis Prediction System")
st.markdown("Enter patient vitals and lab values to assess sepsis risk and severity.")

# Tabs for different inputs
tab1, tab2, tab3 = st.tabs(["Patient Vitals", "Lab Values", "Demographics & Other"])

data = {}

with tab1:
    col1, col2, col3 = st.columns(3)
    data["HR"] = col1.number_input("Heart Rate (bpm)", value=75.0)
    data["Temp"] = col2.number_input("Temperature (°C)", value=37.0)
    data["O2Sat"] = col3.number_input("O2 Saturation (%)", value=98.0)
    
    col4, col5, col6 = st.columns(3)
    data["SBP"] = col4.number_input("Systolic BP (mmHg)", value=120.0)
    data["DBP"] = col5.number_input("Diastolic BP (mmHg)", value=80.0)
    data["Resp"] = col6.number_input("Respiratory Rate", value=16.0)

with tab2:
    st.caption("Common Markers")
    col1, col2, col3 = st.columns(3)
    data["Lactate"] = col1.number_input("Lactate (mmol/L)", value=1.0)
    data["WBC"] = col2.number_input("WBC (k/uL)", value=7.0)
    data["Creatinine"] = col3.number_input("Creatinine (mg/dL)", value=1.0)
    
    st.caption("Additional Labs")
    col4, col5 = st.columns(2)
    data["Platelets"] = col4.number_input("Platelets (k/uL)", value=250.0)
    data["Bilirubin_total"] = col5.number_input("Total Bilirubin (mg/dL)", value=0.8)
    
    # Advanced / Hidden by default in main view usually, but simpler here
    with st.expander("Advanced Lab Values"):
        data["Hgb"] = st.number_input("Hemoglobin", value=14.0)
        data["TroponinI"] = st.number_input("Troponin I", value=0.01)
        data["Glucose"] = st.number_input("Glucose", value=100.0)
        # Add others as needed based on UI_MAP if crucial

with tab3:
    col1, col2 = st.columns(2)
    data["Age"] = col1.number_input("Age", value=50.0)
    data["SOFA_score"] = col2.number_input("SOFA Score", value=0.0)
    data["Baseline_Lactate"] = st.number_input("Baseline Lactate (for early warning trend)", value=1.0)

# --- PREDICTION LOGIC (Condensed from main.py) ---
if st.button("Predict Sepsis Risk", type="primary", use_container_width=True):
    
    # 1. EARLY WARNING LOGIC
    st.subheader("Early Warning Analysis")
    
    # Calculations
    map_calc = (data["SBP"] + 2 * data["DBP"]) / 3
    shock_index = data["HR"] / data["SBP"] if data["SBP"] else 0.0
    
    # Base Vitals Model
    vitals_prob = 0.0
    if models["base_vitals_model"]:
        try:
             # Try simple 3-feature input first as fallback in main.py logic suggested
             vitals_input = np.array([[data["HR"], data["Temp"], data["SBP"]]])
             # But check if model expects 7
             if hasattr(models["base_vitals_model"], "n_features_in_") and models["base_vitals_model"].n_features_in_ == 7:
                 vitals_input = np.array([[
                     data["HR"], data["Temp"], data["SBP"], data["DBP"],
                     map_calc, data["O2Sat"], data["Resp"]
                 ]])
             
             probs = models["base_vitals_model"].predict_proba(vitals_input)[0]
             vitals_prob = probs[1] if len(probs) > 1 else probs[0]
        except Exception:
            # Fallback heuristic
            hr_risk = abs(data["HR"] - 80) / 100.0
            temp_risk = abs(data["Temp"] - 37.0) / 3.0
            sbp_risk = max(0, (120 - data["SBP"]) / 120.0) if data["SBP"] < 120 else 0
            vitals_prob = min(1.0, (hr_risk + temp_risk + sbp_risk) / 3.0)
            
    # Decision Engine
    lactate_max = max(data["Lactate"], data["Baseline_Lactate"])
    lactate_trend = data["Lactate"] - data["Baseline_Lactate"]
    features = np.array([[vitals_prob, lactate_max, lactate_trend, data["Creatinine"]]])
    
    risk_score = 0.0
    if models["sepsis_decision_engine"]:
        try:
            if hasattr(models["sepsis_decision_engine"], 'predict_proba'):
                probs = models["sepsis_decision_engine"].predict_proba(features)[0]
                risk_score = probs[1] if len(probs) > 1 else probs[0]
            elif hasattr(models["sepsis_decision_engine"], 'predict'):
                pred = models["sepsis_decision_engine"].predict(features)[0]
                risk_score = float(pred)
        except Exception:
             pass # Fallback below
             
    if risk_score == 0.0: # Fallback
         risk_score = (vitals_prob * 0.4 + min(lactate_max / 4.0, 1.0) * 0.3 + 
                         max(lactate_trend / 2.0, 0) * 0.2 + min(data["Creatinine"] / 2.0, 1.0) * 0.1)

    # Display Early Warning
    risk_col1, risk_col2 = st.columns([1, 2])
    with risk_col1:
        st.metric("Risk Score", f"{risk_score:.3f}")
    with risk_col2:
        if risk_score >= 0.30:
            st.error(f"🚨 ALERT: High Risk ({(risk_score*100):.1f}%)")
        else:
            st.success(f"✅ Stable ({(risk_score*100):.1f}%)")

    # 2. SEVERITY LOGIC
    st.divider()
    st.subheader("Severity Classification")
    
    if models["severity_model"] and models["feature_names"]:
        # Prepare Input DF
        input_df = pd.DataFrame(np.zeros((1, len(models["feature_names"]))), columns=models["feature_names"])
        
        # Fill mapped values
        # Simple mapping for this demo
        map_dict = {
            'heart_rate': data["HR"], 'systolic_bp': data["SBP"], 'diastolic_bp': data["DBP"],
            'mean_bp': map_calc, 'oxygen_saturation': data["O2Sat"], 'temperature': data["Temp"],
            'respiratory_rate': data["Resp"], 'leukocytes': data["WBC"], 
            'thrombocytes': data["Platelets"], 'lactate': data["Lactate"],
            'creatinine': data["Creatinine"], 'total_bilirubin': data["Bilirubin_total"],
            'age': data["Age"], 'sofa_score': data["SOFA_score"]
        }
        
        # Clinical Bridge Scaling
        bridge = models["clinical_bridge"]
        for feat in models["feature_names"]:
            val = 0.0
            # Find matching value
            if feat in map_dict:
                val = map_dict[feat]
            
            # Scale
            if isinstance(bridge, dict) and feat in bridge:
                 stats = bridge.get(feat)
                 mean = float(stats.get('mean', 0))
                 std = float(stats.get('std', 1))
                 if std == 0: std = 1
                 input_df[feat] = (val - mean) / std
            else:
                 input_df[feat] = val
                 
        # Predict
        sev_probs = models["severity_model"].predict_proba(input_df)[0]
        raw_pred = int(np.argmax(sev_probs))
        
        # Guardrails
        is_critical = (
            data["HR"] > 130 or data["SBP"] < 85 or data["O2Sat"] < 88 or
            data["Lactate"] > 4.0 or data["WBC"] > 20.0 or data["WBC"] < 4.0 or
            data["Platelets"] < 100 or data["SOFA_score"] >= 10
        )
        if raw_pred == 0 and is_critical:
            raw_pred = 2 # Force Severe
            st.warning("⚠️ Clinical Guardrail Activated: Critical values detected despite model prediction.")
            
        labels = ["Healthy", "Mild Sepsis", "Severe/Critical"]
        st.info(f"Severity Prediction: **{labels[raw_pred]}**")
        
        # Probability Bar
        chart_data = pd.DataFrame({
            "Severity": labels,
            "Probability": sev_probs
        })
        st.bar_chart(chart_data, x="Severity", y="Probability")
        
    else:
        st.error("Severity models not loaded correctly.")

# --- FOOTER ---
st.markdown("---")
st.caption("Sepsis Prediction System - Streamlit Deployment Version")
