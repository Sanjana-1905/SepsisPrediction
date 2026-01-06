from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd
import numpy as np
from pydantic import BaseModel
import os

# 1. Initialize App
app = FastAPI()

# 2. Add Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Global Variables for Artifacts
model = None
feature_names = None
clinical_bridge = None

# 4. Load Artifacts (Optimized for Bridge Scaling)
try:
    if os.path.exists("sepsis_production_model.pkl"):
        model = joblib.load("sepsis_production_model.pkl")
        feature_names = joblib.load("feature_names.pkl")
        clinical_bridge = joblib.load("clinical_bridge.pkl")
        print(f"✅ SUCCESS: Loaded Bridge Model with {len(feature_names)} features.")
    else:
        print("❌ CRITICAL: sepsis_production_model.pkl not found in backend directory.")
except Exception as e:
    print(f"❌ ERROR: Artifact loading failed: {e}")

# 5. Data Schema
class PatientData(BaseModel):
    HR: float = 75.0
    O2Sat: float = 98.0
    Temp: float = 37.0
    SBP: float = 120.0
    DBP: float = 80.0
    MAP: float = 90.0
    Resp: float = 16.0
    WBC: float = 7.0
    Platelets: float = 250.0
    Lactate: float = 1.0
    Creatinine: float = 1.0
    Glucose: float = 100.0
    Age: float = 50.0
    SOFA_score: float = 0.0

# UI Key to Model Column Mapping
UI_MAP = {
    'HR': 'heart_rate',
    'SBP': 'systolic_bp',
    'DBP': 'diastolic_bp',
    'MAP': 'mean_bp',
    'O2Sat': 'oxygen_saturation',
    'Temp': 'temperature',
    'Resp': 'respiratory_rate',
    'WBC': 'leukocytes',
    'Platelets': 'thrombocytes',
    'Lactate': 'lactate',
    'Glucose': 'blood_glucose',
    'Creatinine': 'creatinine',
    'Age': 'age'
}

# 6. Prediction Route
@app.post("/predict")
async def predict(data: PatientData):
    if model is None or clinical_bridge is None:
        raise HTTPException(status_code=500, detail="Model artifacts not loaded.")

    try:
        # Convert Pydantic model to dict
        data_dict = data.dict()
        
        # A. Initialize neutral baseline (zeros) for the 11 model features
        input_df = pd.DataFrame(np.zeros((1, len(feature_names))), columns=feature_names)
        
        # B. Apply Clinical Bridge (Z-Score Scaling)
        print("\n--- NEW PREDICTION REQUEST ---")
        for ui_key, value in data_dict.items():
            col = UI_MAP.get(ui_key)
            if col and col in feature_names:
                stats = clinical_bridge.get(col, {'mean': float(value), 'std': 1.0})
                scaled_val = (float(value) - stats['mean']) / stats['std']
                input_df[col] = scaled_val
                print(f"DEBUG: {ui_key}({value}) -> {col} (Scaled: {scaled_val:.3f})")

        # C. Execute AI Prediction
        # Ensure column order matches training exactly to avoid ValueError
        input_df = input_df[feature_names]
        probs = model.predict_proba(input_df)[0]
        raw_prediction = int(np.argmax(probs))
        
        # D. Clinical Guardrails (Override logic)
        final_prediction = raw_prediction
        is_clinical_override = False
        override_reason = None

        # Check for critical danger zones
        is_critical = (
            data.HR > 130 or 
            data.SBP < 85 or 
            data.Lactate > 4.0 or 
            data.O2Sat < 88 or
            data.SOFA_score >= 10
        )

        if raw_prediction == 0 and is_critical:
            final_prediction = 2
            is_clinical_override = True
            override_reason = "GUARDRAIL: Critical vitals detected (AI was too optimistic)."
        
        # E. Final Severity Mapping
        severity_labels = ["Healthy", "Mild Sepsis", "Severe/Critical"]
        
        return {
            "prediction": final_prediction,
            "severity": severity_labels[final_prediction],
            "status": severity_labels[final_prediction],
            "confidence": round(float(np.max(probs)) * 100, 1),
            "probabilities": {
                "healthy": round(float(probs[0]) * 100, 1),
                "mild": round(float(probs[1]) * 100, 1),
                "severe": round(float(probs[2]) * 100, 1)
            },
            "is_clinical_override": is_clinical_override,
            "override_reason": override_reason,
            "debug_info": {
                "raw_ai_output": raw_prediction,
                "scaled_inputs": input_df.iloc[0].to_dict()
            }
        }

    except Exception as e:
        print(f"❌ ERROR: Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)