from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd
import numpy as np
from pydantic import BaseModel, ConfigDict
import os

# Add SepsisPredictor class for loading the early warning models
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
            "model",
            "clf",
            "estimator",
            "pipeline",
            "base_model",
            "sk_model",
            "xgb_model",
            "decision_model",
        ):
            try:
                est = getattr(self, attr, None)
            except Exception:
                est = None
            if _is_estimator(est):
                return est

        # Fallback: scan object attributes for an estimator-like object
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

# 1. Initialize App
app = FastAPI()

# 2. Add Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def _log_routes_on_startup():
    routes = []
    for r in app.router.routes:
        methods = getattr(r, "methods", None)
        if methods:
            routes.append({"path": getattr(r, "path", ""), "methods": sorted(list(methods))})
    print("✅ Registered routes:")
    for item in routes:
        print(f"  {item['methods']}  {item['path']}")

# 3. Global Variables for Artifacts
severity_model = None
severity_feature_names = None
severity_scaler = None
healthy_medians = None
clinical_bridge = None
sepsis_decision_engine = None
base_vitals_model = None

# 4. Load Artifacts (Optimized for Bridge Scaling)
try:
    if os.path.exists("sepsis_honest_73_balanced.pkl"):
        severity_model = joblib.load("sepsis_honest_73_balanced.pkl")
        print("✅ SUCCESS: Loaded Severity Model: sepsis_honest_73_balanced.pkl")
    elif os.path.exists("sepsis_balanced_70_70.pkl"):
        severity_model = joblib.load("sepsis_balanced_70_70.pkl")
        print("✅ SUCCESS: Loaded Severity Model: sepsis_balanced_70_70.pkl")
    elif os.path.exists("sepsis_severity_model_FINAL_3CLASS.pkl"):
        severity_model = joblib.load("sepsis_severity_model_FINAL_3CLASS.pkl")
        print("✅ SUCCESS: Loaded Severity Model: sepsis_severity_model_FINAL_3CLASS.pkl")
    else:
        print("❌ CRITICAL: No severity model found (expected sepsis_balanced_70_70.pkl).")

    if os.path.exists("sepsis_scaler.pkl"):
        try:
            severity_scaler = joblib.load("sepsis_scaler.pkl")
            print("✅ SUCCESS: Loaded Severity Scaler: sepsis_scaler.pkl")
        except Exception as e:
            print(f"⚠️ WARNING: Could not load sepsis_scaler.pkl: {e}")

    if os.path.exists("healthy_medians.pkl"):
        try:
            healthy_medians = joblib.load("healthy_medians.pkl")
            print("✅ SUCCESS: Loaded Healthy Medians: healthy_medians.pkl")
        except Exception as e:
            print(f"⚠️ WARNING: Could not load healthy_medians.pkl: {e}")

    if os.path.exists("clinical_bridge.pkl"):
        try:
            clinical_bridge = joblib.load("clinical_bridge.pkl")
            print("✅ SUCCESS: Loaded Clinical Bridge: clinical_bridge.pkl")
        except Exception as e:
            print(f"⚠️ WARNING: Could not load clinical_bridge.pkl: {e}")

    try:
        if severity_model is not None and hasattr(severity_model, "feature_names_in_"):
            severity_feature_names = list(getattr(severity_model, "feature_names_in_"))
    except Exception:
        severity_feature_names = None
    try:
        if severity_feature_names is None and severity_model is not None and hasattr(severity_model, "get_booster"):
            severity_feature_names = severity_model.get_booster().feature_names
    except Exception:
        severity_feature_names = None
    if not severity_feature_names and isinstance(healthy_medians, dict):
        severity_feature_names = list(healthy_medians.keys())
    if not severity_feature_names and os.path.exists("feature_names.pkl"):
        severity_feature_names = joblib.load("feature_names.pkl")
    if severity_feature_names:
        print(f"✅ SUCCESS: Severity feature count = {len(severity_feature_names)}")
except Exception as e:
    print(f"❌ ERROR: Artifact loading failed: {e}")

# Load Sepsis Early Warning System Models
try:
    if os.path.exists("sepsis_decision_engine.pkl"):
        try:
            sepsis_decision_engine = joblib.load("sepsis_decision_engine.pkl")
            print("✅ SUCCESS: Loaded Sepsis Decision Engine.")
        except Exception as e:
            print(f"⚠️ WARNING: Could not load sepsis_decision_engine.pkl: {e}")
            # Create fallback decision engine
            sepsis_decision_engine = None
    
    base_vitals_candidates = ["base_vitals_model.pkl", "base_vitals_model .pkl"]
    base_vitals_path = next((p for p in base_vitals_candidates if os.path.exists(p)), None)
    if base_vitals_path:
        try:
            base_vitals_model = joblib.load(base_vitals_path)
            print(f"✅ SUCCESS: Loaded Base Vitals Model: {base_vitals_path}")
        except Exception as e:
            print(f"⚠️ WARNING: Could not load base_vitals_model ({base_vitals_path}): {e}")
            base_vitals_model = None
    else:
        print("⚠️ WARNING: base_vitals_model not found (expected base_vitals_model.pkl)")
except Exception as e:
    print(f"⚠️ WARNING: Sepsis Early Warning models loading failed: {e}")

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


class SeverityData(BaseModel):
    model_config = ConfigDict(extra="allow")
    # Vitals
    HR: float = 75.0
    O2Sat: float = 98.0
    Temp: float = 37.0
    SBP: float = 120.0
    DBP: float = 80.0
    MAP: float = 90.0
    Resp: float = 16.0
    # Lab Markers
    WBC: float = 7.0
    Platelets: float = 250.0
    Lactate: float = 1.0
    Hgb: float = 14.0
    Hct: float = 42.0
    PTT: float = 30.0
    Fibrinogen: float = 300.0
    TroponinI: float = 0.01
    Magnesium: float = 2.0
    Phosphate: float = 3.5
    Bilirubin_total: float = 0.8
    # Lab Chemistry
    Creatinine: float = 1.0
    Glucose: float = 100.0
    pH: float = 7.4
    HCO3: float = 24.0
    BaseExcess: float = 0.0
    FiO2: float = 21.0
    PaCO2: float = 40.0
    EtCO2: float = 35.0
    SaO2: float = 98.0
    Chloride: float = 100.0
    Calcium: float = 9.5
    Potassium: float = 4.0
    AST: float = 25.0
    BUN: float = 15.0
    Alkalinephos: float = 80.0
    Bilirubin_direct: float = 0.2
    # Demographics/Info
    Age: float = 50.0
    Gender: float = 1.0
    ICULOS: float = 0.0
    Hour: float = 0.0
    SOFA_score: float = 0.0
    SOFA_cardio: float = 0.0
    Shock_Index: float = 0.67
    MAP_Calc: float = 90.0
    HospAdmTime: float = 0.0
    Unit1: float = 0.0
    Unit2: float = 0.0

# UI Key to Model Column Mapping
UI_MAP = {
    # Vitals
    'HR': 'heart_rate',
    'SBP': 'systolic_bp',
    'DBP': 'diastolic_bp',
    'MAP': 'mean_bp',
    'O2Sat': 'oxygen_saturation',
    'Temp': 'temperature',
    'Resp': 'respiratory_rate',
    
    # Lab Markers
    'WBC': 'leukocytes',
    'Platelets': 'thrombocytes',
    'Lactate': 'lactate',
    'Hgb': 'hemoglobin',
    'Hct': 'hematocrit',
    'PTT': 'partial_thromboplastin_time',
    'Fibrinogen': 'fibrinogen',
    'TroponinI': 'troponin_i',
    'Magnesium': 'magnesium',
    'Phosphate': 'phosphate',
    'Bilirubin_total': 'total_bilirubin',
    
    # Lab Chemistry
    'Glucose': 'blood_glucose',
    'Creatinine': 'creatinine',
    'pH': 'arterial_ph',
    'HCO3': 'bicarbonate',
    'BaseExcess': 'base_excess',
    'FiO2': 'fraction_of_inspired_o2',
    'PaCO2': 'partial_co2',
    'EtCO2': 'partial_co2',
    'SaO2': 'oxygen_saturation',
    'Chloride': 'chloride',
    'Calcium': 'calcium',
    'Potassium': 'potassium',
    'AST': 'aspartate_aminotransferase',
    'BUN': 'blood_urea_nitrogen',
    'Alkalinephos': 'alkaline_phosphatase',
    'Bilirubin_direct': 'direct_bilirubin',
    
    # Demographics/Info
    'Age': 'age',
    'Gender': 'gender',
    'ICULOS': 'iculos',
    'Hour': 'hour',
    'SOFA_score': 'sofa_score',
    'SOFA_cardio': 'sofa_cardio',
    'Shock_Index': 'shock_index',
    'MAP_Calc': 'map_calc',
    'HospAdmTime': 'hosp_adm_time',
    'Unit1': 'unit1',
    'Unit2': 'unit2',
}

_EARLY_VITALS_DEFAULTS = {
    "HR": 80.0,
    "Temp": 37.0,
    "SBP": 120.0,
    "DBP": 80.0,
    "MAP": 90.0,
    "O2Sat": 98.0,
    "Resp": 16.0,
}

# 6. Severity Prediction Route
@app.post("/severity")
async def predict_severity(data: SeverityData):
    print(f"🔍 DEBUG: /severity endpoint called, model loaded: {severity_model is not None}")
    if severity_model is None or not severity_feature_names:
        raise HTTPException(status_code=500, detail="Severity model artifacts not loaded.")

    try:
        # Convert Pydantic model to dict
        data_dict = data.model_dump()
        print(f"🔍 DEBUG: Received data: {data_dict}")

        # Build baseline in normalized feature space.
        # If the model was trained on z-scored features, using zeros is a neutral baseline.
        input_df = pd.DataFrame(np.zeros((1, len(severity_feature_names))), columns=severity_feature_names)
        
        # B. Apply Clinical Bridge (Z-Score Scaling)
        print("\n--- NEW PREDICTION REQUEST ---")
        skipped_fields = []
        mapped_fields = []
        
        for ui_key, value in data_dict.items():
            # Skip non-numeric fields and metadata
            if ui_key in ['model_config'] or value is None:
                continue
                
            col = UI_MAP.get(ui_key)
            target_col = None
            
            # Try mapped name first
            if col and col in input_df.columns:
                target_col = col
            # Try direct match (case-sensitive)
            elif ui_key in input_df.columns:
                target_col = ui_key
            # Try case-insensitive match
            else:
                for df_col in input_df.columns:
                    if df_col.lower() == ui_key.lower():
                        target_col = df_col
                        break
                # Try matching with common variations
                if target_col is None:
                    ui_lower = ui_key.lower()
                    for df_col in input_df.columns:
                        df_lower = df_col.lower()
                        # Try matching with underscores/spaces removed
                        if ui_lower.replace('_', '').replace('-', '') == df_lower.replace('_', '').replace('-', ''):
                            target_col = df_col
                            break
                        # Try partial match for common patterns
                        if ui_lower in df_lower or df_lower in ui_lower:
                            if len(ui_lower) > 3 and len(df_lower) > 3:  # Avoid false matches
                                target_col = df_col
                                break

            if target_col is None:
                skipped_fields.append(ui_key)
                continue
            
            mapped_fields.append(f"{ui_key} -> {target_col}")
            
            # Apply clinical bridge scaling if available (z-score)
            if isinstance(clinical_bridge, dict) and target_col in clinical_bridge:
                stats = clinical_bridge.get(target_col, None)
                try:
                    mean = float(stats.get('mean'))
                    std = float(stats.get('std'))
                    std = std if std != 0 else 1.0
                    scaled_value = (float(value) - mean) / std
                    input_df[target_col] = scaled_value
                    print(f"  ✓ {ui_key} ({value}) -> {target_col} (scaled: {scaled_value:.3f})")
                except Exception as e:
                    input_df[target_col] = float(value)
                    print(f"  ✓ {ui_key} ({value}) -> {target_col} (direct, scaling failed: {e})")
            else:
                input_df[target_col] = float(value)
                print(f"  ✓ {ui_key} ({value}) -> {target_col} (direct)")
        
        if skipped_fields:
            print(f"  ⚠️ WARNING: Skipped fields (not found in model): {', '.join(skipped_fields)}")
        print(f"  ✅ Successfully mapped {len(mapped_fields)} fields")

        # C. Execute AI Prediction
        # Ensure column order matches training exactly to avoid ValueError
        if severity_scaler is not None and not hasattr(severity_model, "named_steps") and hasattr(severity_scaler, "transform"):
            try:
                scaled = severity_scaler.transform(input_df[severity_feature_names])
                input_df = pd.DataFrame(scaled, columns=severity_feature_names)
            except Exception as e:
                print(f"⚠️ WARNING: Severity scaling skipped: {e}")

        probs = severity_model.predict_proba(input_df)[0]
        raw_prediction = int(np.argmax(probs))
        print(f"🔍 DEBUG: Raw prediction: {raw_prediction}, Probabilities: {probs}")
        
        # D. Clinical Guardrails (Override logic)
        final_prediction = raw_prediction
        is_clinical_override = False
        override_reason = None

        # Check for critical danger zones (including lab markers and lab chemistry)
        sofa_score = float(getattr(data, "SOFA_score", 0.0) or 0.0)
        lactate = float(getattr(data, "Lactate", 0.0) or 0.0)
        creatinine = float(getattr(data, "Creatinine", 0.0) or 0.0)
        wbc = float(getattr(data, "WBC", 0.0) or 0.0)
        platelets = float(getattr(data, "Platelets", 0.0) or 0.0)
        bilirubin_total = float(getattr(data, "Bilirubin_total", 0.0) or 0.0)
        troponin = float(getattr(data, "TroponinI", 0.0) or 0.0)
        bun = float(getattr(data, "BUN", 0.0) or 0.0)
        
        is_critical = (
            # Vitals
            data.HR > 130 or 
            data.SBP < 85 or 
            data.O2Sat < 88 or
            # Lab Markers (critical for sepsis)
            lactate > 4.0 or
            wbc > 20.0 or
            wbc < 4.0 or
            platelets < 100.0 or
            troponin > 0.5 or
            # Lab Chemistry (critical for sepsis)
            creatinine > 2.0 or
            bilirubin_total > 3.0 or
            bun > 40.0 or
            # SOFA Score
            sofa_score >= 10
        )

        if raw_prediction == 0 and is_critical:
            final_prediction = 2
            is_clinical_override = True
            critical_findings = []
            if data.HR > 130: critical_findings.append(f"HR={data.HR}")
            if data.SBP < 85: critical_findings.append(f"SBP={data.SBP}")
            if data.O2Sat < 88: critical_findings.append(f"O2Sat={data.O2Sat}")
            if lactate > 4.0: critical_findings.append(f"Lactate={lactate}")
            if wbc > 20.0 or wbc < 4.0: critical_findings.append(f"WBC={wbc}")
            if platelets < 100.0: critical_findings.append(f"Platelets={platelets}")
            if creatinine > 2.0: critical_findings.append(f"Creatinine={creatinine}")
            if bilirubin_total > 3.0: critical_findings.append(f"Bilirubin={bilirubin_total}")
            if bun > 40.0: critical_findings.append(f"BUN={bun}")
            if troponin > 0.5: critical_findings.append(f"TroponinI={troponin}")
            if sofa_score >= 10: critical_findings.append(f"SOFA={sofa_score}")
            override_reason = f"GUARDRAIL: Critical values detected ({', '.join(critical_findings[:3])})."
        
        # E. Final Severity Mapping
        severity_labels = ["Healthy", "Mild Sepsis", "Severe/Critical"]
        
        result = {
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
        
        print(f"🔍 DEBUG: Returning result: {result}")
        return result

    except Exception as e:
        print(f"❌ ERROR: Prediction failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/severity")
async def severity_get():
    raise HTTPException(status_code=405, detail="Method Not Allowed. Use POST /severity with JSON body.")

# 7. Sepsis Early Warning System Data Schema
class SepsisEarlyWarningData(BaseModel):
    # Vitals
    HR: float = 75.0
    Temp: float = 37.0
    SBP: float = 120.0
    # Lab Values
    Lactate: float = 1.0  # Current lactate
    Baseline_Lactate: float = 1.0  # First lactate reading of the day
    Creatinine: float = 1.0

# 8. Health Check Route
@app.get("/")
async def root():
    print("🔍 DEBUG: Health check endpoint called")
    return {
        "message": "Sepsis Prediction API",
        "endpoints": {
            "/predict": "POST - Early diagnosis (alias of /sepsis-warning)",
            "/sepsis-warning": "POST - Early diagnosis (risk score)",
            "/severity": "POST - Sepsis severity classification",
            "/predict-severity": "POST - Severity (alias of /severity)",
            "/docs": "GET - API documentation",
            "/test": "GET - Test endpoint"
        },
        "models_loaded": {
            "severity_model": severity_model is not None,
            "sepsis_decision_engine": sepsis_decision_engine is not None,
            "base_vitals_model": base_vitals_model is not None
        }
    }

@app.get("/test")
async def test():
    return {"status": "Backend is running", "timestamp": "working"}

# 9. Sepsis Early Warning Route
@app.post("/sepsis-warning")
async def sepsis_early_warning(data: SepsisEarlyWarningData):
    # Allow fallback calculation even if models aren't loaded
    use_fallback = sepsis_decision_engine is None or base_vitals_model is None

    # If the decision engine unpickled as the placeholder wrapper and it has no real estimator inside,
    # don't use it (it will return constant 0.5). Use the existing clinical fallback instead.
    try:
        if (
            sepsis_decision_engine is not None
            and sepsis_decision_engine.__class__.__name__ == "SepsisPredictor"
            and hasattr(sepsis_decision_engine, "_unwrap_estimator")
            and sepsis_decision_engine._unwrap_estimator() is None
        ):
            use_fallback = True
    except Exception:
        pass
    
    if use_fallback:
        print("⚠️ WARNING: Using fallback calculation - models not loaded")
    
    try:
        # Step 1: Transform raw vitals through base_vitals_model to get Prob
        # Build a vitals feature vector that matches the trained base_vitals_model
        base_feature_names = getattr(base_vitals_model, 'feature_names_in_', None) if base_vitals_model is not None else None
        base_expected = getattr(base_vitals_model, 'n_features_in_', None) if base_vitals_model is not None else None

        # Derive MAP if possible
        default_dbp = float(_EARLY_VITALS_DEFAULTS["DBP"])
        map_calc = (float(data.SBP) + 2.0 * default_dbp) / 3.0

        shock_index = (float(data.HR) / float(data.SBP)) if float(data.SBP) else 0.0

        vitals_candidates = {
            # UI keys
            "HR": float(data.HR),
            "Temp": float(data.Temp),
            "SBP": float(data.SBP),
            "DBP": default_dbp,
            "MAP": map_calc,
            "O2Sat": float(_EARLY_VITALS_DEFAULTS["O2Sat"]),
            "Resp": float(_EARLY_VITALS_DEFAULTS["Resp"]),
            "Shock_Index": shock_index,
            "shock_index": shock_index,
            "MAP_Calc": map_calc,
            # common training column names
            "heart_rate": float(data.HR),
            "temperature": float(data.Temp),
            "systolic_bp": float(data.SBP),
            "diastolic_bp": default_dbp,
            "mean_bp": map_calc,
            "oxygen_saturation": float(_EARLY_VITALS_DEFAULTS["O2Sat"]),
            "respiratory_rate": float(_EARLY_VITALS_DEFAULTS["Resp"]),
            "map": map_calc,
            "sbp": float(data.SBP),
            "hr": float(data.HR),
        }

        if base_feature_names is not None and len(base_feature_names) > 0:
            vitals_input = np.array([[float(vitals_candidates.get(str(name), 0.0)) for name in base_feature_names]])
        elif base_expected is not None and int(base_expected) == 7:
            vitals_input = np.array([[
                float(vitals_candidates["HR"]),
                float(vitals_candidates["Temp"]),
                float(vitals_candidates["SBP"]),
                float(vitals_candidates["DBP"]),
                float(vitals_candidates["MAP"]),
                float(vitals_candidates["O2Sat"]),
                float(vitals_candidates["Resp"]),
            ]])
        else:
            vitals_input = np.array([[float(data.HR), float(data.Temp), float(data.SBP)]])
        can_use_base = (
            not use_fallback and
            base_vitals_model is not None and
            (base_expected is None or int(base_expected) == int(vitals_input.shape[1]))
        )
        if can_use_base:
            try:
                if hasattr(base_vitals_model, 'predict_proba'):
                    probs = base_vitals_model.predict_proba(vitals_input)[0]
                    vitals_prob = probs[1] if len(probs) > 1 else probs[0]
                else:
                    # Fallback: use a simple heuristic based on vitals
                    hr_risk = abs(data.HR - 80) / 100.0
                    temp_risk = abs(data.Temp - 37.0) / 3.0
                    sbp_risk = max(0, (120 - data.SBP) / 120.0) if data.SBP < 120 else 0
                    vitals_prob = min(1.0, (hr_risk + temp_risk + sbp_risk) / 3.0)
            except Exception as e:
                print(f"Warning: Could not use base_vitals_model, using fallback: {e}")
                # Fallback calculation
                hr_risk = abs(data.HR - 80) / 100.0
                temp_risk = abs(data.Temp - 37.0) / 3.0
                sbp_risk = max(0, (120 - data.SBP) / 120.0) if data.SBP < 120 else 0
                vitals_prob = min(1.0, (hr_risk + temp_risk + sbp_risk) / 3.0)
        else:
            if base_expected is not None and int(base_expected) != int(vitals_input.shape[1]):
                print(f"⚠️ WARNING: base_vitals_model expects {int(base_expected)} features but got {int(vitals_input.shape[1])}; using fallback")
            # Fallback calculation when models not usable
            hr_risk = abs(data.HR - 80) / 100.0
            temp_risk = abs(data.Temp - 37.0) / 3.0
            sbp_risk = max(0, (120 - data.SBP) / 120.0) if data.SBP < 120 else 0
            vitals_prob = min(1.0, (hr_risk + temp_risk + sbp_risk) / 3.0)
        
        # Step 2: Calculate Clinical Lab Features
        lactate_max = max(data.Lactate, data.Baseline_Lactate)  # Highest lactate reading
        lactate_trend = data.Lactate - data.Baseline_Lactate  # Trend: latest - first
        creatinine_max = data.Creatinine  # Highest creatinine reading
        
        # Step 3: Prepare features for decision engine
        # The decision engine expects: [Vitals_Prob, Lactate_Max, Lactate_Trend, Creatinine_Max]
        features = np.array([[vitals_prob, lactate_max, lactate_trend, creatinine_max]])
        
        # Step 4: Get risk score from decision engine
        # The decision engine should return a probability/risk score
        if not use_fallback and sepsis_decision_engine is not None:
            try:
                if hasattr(sepsis_decision_engine, 'predict_proba'):
                    # Standard sklearn model
                    probs = sepsis_decision_engine.predict_proba(features)[0]
                    risk_score = probs[1] if len(probs) > 1 else probs[0]
                elif hasattr(sepsis_decision_engine, 'predict'):
                    # Try predict method - might return probability directly
                    pred = sepsis_decision_engine.predict(features)[0]
                    risk_score = float(pred)
                else:
                    # Try calling as a function (custom class)
                    risk_score = float(sepsis_decision_engine(features))
            except Exception as e:
                print(f"Warning: Could not use standard predict methods, using fallback: {e}")
                # Fallback: use a simple weighted combination
                risk_score = (vitals_prob * 0.4 + min(lactate_max / 4.0, 1.0) * 0.3 + 
                             max(lactate_trend / 2.0, 0) * 0.2 + min(creatinine_max / 2.0, 1.0) * 0.1)
        else:
            # Fallback: use a simple weighted combination when models not loaded
            risk_score = (vitals_prob * 0.4 + min(lactate_max / 4.0, 1.0) * 0.3 + 
                         max(lactate_trend / 2.0, 0) * 0.2 + min(creatinine_max / 2.0, 1.0) * 0.1)
        
        # Ensure risk_score is between 0 and 1
        risk_score = max(0.0, min(1.0, float(risk_score)))
        
        # Step 5: Determine status based on 0.30 threshold
        status = "Patient Stable" if risk_score < 0.30 else "🚨 SEPSIS ALERT: INITIATE PROTOCOL"
        is_alert = risk_score >= 0.30
        
        # Step 6: Feature breakdown - identify which factor is driving the risk
        feature_contributions = {
            "Vitals Prob": vitals_prob,
            "Lactate Max": lactate_max,
            "Lactate Trend": lactate_trend,
            "Creatinine Max": creatinine_max
        }
        
        # Find the most concerning factor
        alert_factors = []
        if vitals_prob > 0.65:
            alert_factors.append("Elevated Vitals Probability")
        if lactate_max > 2.0:
            alert_factors.append("High Lactate Max")
        if lactate_trend > 0.5:
            alert_factors.append("Rising Lactate Trend")
        if creatinine_max > 1.5:
            alert_factors.append("Elevated Creatinine")
        
        primary_alert = alert_factors[0] if alert_factors else "Normal Parameters"
        
        return {
            "risk_score": round(risk_score, 3),
            "risk_percentage": round(risk_score * 100, 1),
            "status": status,
            "is_alert": is_alert,
            "feature_breakdown": {
                "vitals_prob": round(vitals_prob, 3),
                "lactate_max": round(lactate_max, 2),
                "lactate_trend": round(lactate_trend, 2),
                "creatinine_max": round(creatinine_max, 2)
            },
            "primary_alert_factor": primary_alert,
            "all_alert_factors": alert_factors,
            "raw_inputs": {
                "HR": data.HR,
                "Temp": data.Temp,
                "SBP": data.SBP,
                "Lactate": data.Lactate,
                "Baseline_Lactate": data.Baseline_Lactate,
                "Creatinine": data.Creatinine
            },
            "model_status": {
                "using_fallback": use_fallback,
                "models_loaded": {
                    "sepsis_decision_engine": sepsis_decision_engine is not None,
                    "base_vitals_model": base_vitals_model is not None
                }
            }
        }
    
    except Exception as e:
        print(f"❌ ERROR: Sepsis Early Warning failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/sepsis-warning")
async def sepsis_warning_get():
    raise HTTPException(status_code=405, detail="Method Not Allowed. Use POST /sepsis-warning with JSON body.")


# Preferred naming: /predict = early diagnosis
@app.post("/predict")
async def predict_early_alias(data: SepsisEarlyWarningData):
    return await sepsis_early_warning(data)


@app.get("/predict")
async def predict_early_get():
    raise HTTPException(status_code=405, detail="Method Not Allowed. Use POST /predict with JSON body.")


# Backward-compatible naming for severity
@app.post("/predict-severity")
async def predict_severity_alias(data: SeverityData):
    return await predict_severity(data)


@app.get("/predict-severity")
async def predict_severity_get():
    raise HTTPException(status_code=405, detail="Method Not Allowed. Use POST /predict-severity with JSON body.")


@app.post("/sepsis-warnning")
async def sepsis_warning_post_alias(data: SepsisEarlyWarningData):
    return await sepsis_early_warning(data)


@app.get("/sepsis-warnning")
async def sepsis_warning_get_alias():
    raise HTTPException(status_code=405, detail="Method Not Allowed. Use POST /sepsis-warning with JSON body.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)