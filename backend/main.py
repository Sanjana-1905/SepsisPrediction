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

        weights = getattr(self, "weights", None)
        feature_min_max = getattr(self, "feature_min_max", None)
        
        if isinstance(weights, dict) and isinstance(feature_min_max, dict):
            X_arr = np.asarray(X)
            results = []
            for row in X_arr:
                p_max_raw = float(row[0])
                lac_max_raw = float(row[1])
                lac_trend_raw = float(row[2])
                creat_max_raw = float(row[3])
                
                def scale_val(val, key):
                    limits = feature_min_max.get(key)
                    if limits:
                        min_v, max_v = limits
                        return max(0.0, min(1.0, (val - min_v) / (max_v - min_v) if max_v != min_v else 0.0))
                    return val
                
                p_max_scaled = scale_val(p_max_raw, 'p_max')
                lac_max_scaled = scale_val(lac_max_raw, 'lac_max')
                lac_trend_scaled = scale_val(lac_trend_raw, 'lac_trend')
                creat_max_scaled = scale_val(creat_max_raw, 'creat_max')
                
                score = (
                    weights.get('p_max', 0.25) * p_max_scaled +
                    weights.get('lac_max', 0.45) * lac_max_scaled +
                    weights.get('lac_trend', 0.2) * lac_trend_scaled +
                    weights.get('creat_max', 0.1) * creat_max_scaled
                )
                results.append(score)
            
            return np.array([[1.0 - r, r] for r in results])

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
    print("Registered routes:")
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
    if os.path.exists("models/sepsis_honest_73_balanced.pkl"):
        severity_model = joblib.load("models/sepsis_honest_73_balanced.pkl")
        print("SUCCESS: Loaded Severity Model: models/sepsis_honest_73_balanced.pkl")
    elif os.path.exists("models/sepsis_balanced_70_70.pkl"):
        severity_model = joblib.load("models/sepsis_balanced_70_70.pkl")
        print("SUCCESS: Loaded Severity Model: models/sepsis_balanced_70_70.pkl")
    elif os.path.exists("models/sepsis_severity_model_FINAL_3CLASS.pkl"):
        severity_model = joblib.load("models/sepsis_severity_model_FINAL_3CLASS.pkl")
        print("SUCCESS: Loaded Severity Model: models/sepsis_severity_model_FINAL_3CLASS.pkl")
    else:
        print("CRITICAL: No severity model found (expected models/sepsis_honest_73_balanced.pkl).")

    if os.path.exists("models/sepsis_scaler.pkl"):
        try:
            severity_scaler = joblib.load("models/sepsis_scaler.pkl")
            print("SUCCESS: Loaded Severity Scaler: models/sepsis_scaler.pkl")
        except Exception as e:
            print(f"WARNING: Could not load models/sepsis_scaler.pkl: {e}")

    if os.path.exists("models/healthy_medians.pkl"):
        try:
            healthy_medians = joblib.load("models/healthy_medians.pkl")
            print("SUCCESS: Loaded Healthy Medians: models/healthy_medians.pkl")
        except Exception as e:
            print(f"WARNING: Could not load models/healthy_medians.pkl: {e}")

    if os.path.exists("models/clinical_bridge.pkl"):
        try:
            clinical_bridge = joblib.load("models/clinical_bridge.pkl")
            print("SUCCESS: Loaded Clinical Bridge: models/clinical_bridge.pkl")
        except Exception as e:
            print(f"WARNING: Could not load models/clinical_bridge.pkl: {e}")

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
    if not severity_feature_names and os.path.exists("models/feature_names.pkl"):
        severity_feature_names = joblib.load("models/feature_names.pkl")
    if severity_feature_names:
        print(f"SUCCESS: Severity feature count = {len(severity_feature_names)}")
except Exception as e:
    print(f"ERROR: Artifact loading failed: {e}")

# Load Sepsis Early Warning System Models
try:
    import sys
    main_module = sys.modules.get('__main__')
    if main_module and not hasattr(main_module, 'SepsisPredictor'):
        setattr(main_module, 'SepsisPredictor', SepsisPredictor)

    if os.path.exists("models/sepsis_decision_engine.pkl"):
        try:
            sepsis_decision_engine = joblib.load("models/sepsis_decision_engine.pkl")
            print("SUCCESS: Loaded Sepsis Decision Engine.")
        except Exception as e:
            print(f"WARNING: Could not load models/sepsis_decision_engine.pkl: {e}")
            # Create fallback decision engine
            sepsis_decision_engine = None
    
    base_vitals_candidates = ["models/base_vitals_model.pkl", "models/base_vitals_model .pkl"]
    base_vitals_path = next((p for p in base_vitals_candidates if os.path.exists(p)), None)
    if base_vitals_path:
        try:
            base_vitals_model = joblib.load(base_vitals_path)
            print(f"SUCCESS: Loaded Base Vitals Model: {base_vitals_path}")
        except Exception as e:
            print(f"WARNING: Could not load base_vitals_model ({base_vitals_path}): {e}")
            base_vitals_model = None
    else:
        print("WARNING: base_vitals_model not found (expected models/base_vitals_model.pkl)")
except Exception as e:
    print(f"WARNING: Sepsis Early Warning models loading failed: {e}")

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
    if severity_model is None or not severity_feature_names:
        raise HTTPException(status_code=500, detail="Severity model artifacts not loaded.")

    try:
        data_dict = data.model_dump()
        input_df = pd.DataFrame(np.zeros((1, len(severity_feature_names))), columns=severity_feature_names)
        
        skipped_fields = []
        mapped_fields = []
        
        for ui_key, value in data_dict.items():
            if ui_key in ['model_config'] or value is None:
                continue
                
            col = UI_MAP.get(ui_key)
            target_col = None
            
            if col and col in input_df.columns:
                target_col = col
            elif ui_key in input_df.columns:
                target_col = ui_key
            else:
                for df_col in input_df.columns:
                    if df_col.lower() == ui_key.lower():
                        target_col = df_col
                        break
                if target_col is None:
                    ui_lower = ui_key.lower()
                    for df_col in input_df.columns:
                        df_lower = df_col.lower()
                        if ui_lower.replace('_', '').replace('-', '') == df_lower.replace('_', '').replace('-', ''):
                            target_col = df_col
                            break
                        if ui_lower in df_lower or df_lower in ui_lower:
                            if len(ui_lower) > 3 and len(df_lower) > 3:
                                target_col = df_col
                                break

            if target_col is None:
                skipped_fields.append(ui_key)
                continue
            
            mapped_fields.append(f"{ui_key} -> {target_col}")
            input_df[target_col] = float(value)
        
        # Run inference using raw features (as expected by sepsis_honest_73_balanced.pkl)
        probs = severity_model.predict_proba(input_df)[0]
        raw_prediction = int(np.argmax(probs))
        
        # Clinical Guardrails (Override logic)
        final_prediction = raw_prediction
        is_clinical_override = False
        override_reason = None

        lactate = float(getattr(data, "Lactate", 0.0) or 0.0)
        age = float(getattr(data, "Age", 0.0) or 0.0)
        sbp = float(getattr(data, "SBP", 0.0) or 0.0)
        
        is_critical = (
            lactate > 4.0 or
            (age >= 65.0 and sbp < 60.0)
        )

        if raw_prediction < 2 and is_critical:
            final_prediction = 2
            is_clinical_override = True
            critical_findings = []
            if lactate > 4.0:
                critical_findings.append(f"Lactate={lactate}")
            if age >= 65.0 and sbp < 60.0:
                critical_findings.append(f"Age={age}, SBP={sbp}")
            override_reason = f"GUARDRAIL: Critical values detected ({', '.join(critical_findings)})."
        
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
        
        return result

    except Exception as e:
        print(f"ERROR: Prediction failed: {e}")
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
    print("DEBUG: Health check endpoint called")
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
    if base_vitals_model is None:
        raise HTTPException(status_code=500, detail="Base vitals model not loaded.")
    if sepsis_decision_engine is None:
        raise HTTPException(status_code=500, detail="Sepsis decision engine not loaded.")
    
    # Verify decision engine is valid
    is_decision_engine_valid = True
    try:
        if (
            sepsis_decision_engine.__class__.__name__ == "SepsisPredictor"
            and hasattr(sepsis_decision_engine, "_unwrap_estimator")
            and sepsis_decision_engine._unwrap_estimator() is None
            and not (hasattr(sepsis_decision_engine, "weights") and hasattr(sepsis_decision_engine, "feature_min_max"))
        ):
            is_decision_engine_valid = False
    except Exception:
        is_decision_engine_valid = False
        
    if not is_decision_engine_valid:
        raise HTTPException(status_code=500, detail="Loaded sepsis decision engine has no valid estimator or weights.")
    
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
            # Scale vitals using baseline statistics to prevent RandomForest out-of-bounds constant prediction
            scaling = {
                'HR': {'mean': 85.0, 'std': 20.0},
                'O2Sat': {'mean': 96.0, 'std': 4.0},
                'Temp': {'mean': 37.0, 'std': 1.0},
                'SBP': {'mean': 115.0, 'std': 25.0},
                'MAP': {'mean': 90.0, 'std': 15.0},
                'DBP': {'mean': 80.0, 'std': 15.0},
                'Resp': {'mean': 18.0, 'std': 5.0}
            }
            if isinstance(clinical_bridge, dict):
                mapping = {
                    'HR': 'heart_rate',
                    'SBP': 'systolic_bp',
                    'Temp': 'temperature',
                    'O2Sat': 'oxygen_saturation'
                }
                for k, bridge_k in mapping.items():
                    if bridge_k in clinical_bridge:
                        scaling[k] = {
                            'mean': float(clinical_bridge[bridge_k].get('mean', scaling[k]['mean'])),
                            'std': float(clinical_bridge[bridge_k].get('std', scaling[k]['std']))
                        }
            
            scaled_vals = []
            for name in base_feature_names:
                val = float(vitals_candidates.get(str(name), 0.0))
                if name in scaling:
                    mean = scaling[name]['mean']
                    std = scaling[name]['std']
                    scaled_val = (val - mean) / (std if std != 0 else 1.0)
                    scaled_vals.append(scaled_val)
                else:
                    scaled_vals.append(val)
            vitals_input = np.array([scaled_vals])
        elif base_expected is not None and int(base_expected) == 7:
            scaling_ordered = [
                ('HR', 85.0, 20.0),
                ('Temp', 37.0, 1.0),
                ('SBP', 115.0, 25.0),
                ('DBP', 80.0, 15.0),
                ('MAP', 90.0, 15.0),
                ('O2Sat', 96.0, 4.0),
                ('Resp', 18.0, 5.0)
            ]
            scaled_vals = []
            keys = ["HR", "Temp", "SBP", "DBP", "MAP", "O2Sat", "Resp"]
            for i, key in enumerate(keys):
                val = float(vitals_candidates[key])
                name, mean, std = scaling_ordered[i]
                if isinstance(clinical_bridge, dict):
                    bridge_k = {'HR': 'heart_rate', 'SBP': 'systolic_bp', 'Temp': 'temperature', 'O2Sat': 'oxygen_saturation'}.get(key)
                    if bridge_k and bridge_k in clinical_bridge:
                        mean = float(clinical_bridge[bridge_k].get('mean', mean))
                        std = float(clinical_bridge[bridge_k].get('std', std))
                scaled_val = (val - mean) / (std if std != 0 else 1.0)
                scaled_vals.append(scaled_val)
            vitals_input = np.array([scaled_vals])
        else:
            vitals_input = np.array([[float(data.HR), float(data.Temp), float(data.SBP)]])
 
        if base_expected is not None and int(base_expected) != int(vitals_input.shape[1]):
            raise HTTPException(
                status_code=500,
                detail=f"Base vitals model expects {int(base_expected)} features but got {int(vitals_input.shape[1])}."
            )
 
        if hasattr(base_vitals_model, 'predict_proba'):
            probs = base_vitals_model.predict_proba(vitals_input)[0]
            vitals_prob = probs[1] if len(probs) > 1 else probs[0]
        else:
            raise HTTPException(
                status_code=500,
                detail="Loaded base vitals model does not support predict_proba."
            )
        
        # Step 2: Calculate Clinical Lab Features
        lactate_max = max(data.Lactate, data.Baseline_Lactate)  # Highest lactate reading
        lactate_trend = data.Lactate - data.Baseline_Lactate  # Trend: latest - first
        creatinine_max = data.Creatinine  # Highest creatinine reading
        
        # Step 3: Prepare features for decision engine
        # The decision engine expects: [Vitals_Prob, Lactate_Max, Lactate_Trend, Creatinine_Max]
        features = np.array([[vitals_prob, lactate_max, lactate_trend, creatinine_max]])
        
        # Step 4: Get risk score from decision engine
        # The decision engine should return a probability/risk score
        if hasattr(sepsis_decision_engine, 'predict_proba'):
            probs = sepsis_decision_engine.predict_proba(features)[0]
            risk_score = probs[1] if len(probs) > 1 else probs[0]
        elif hasattr(sepsis_decision_engine, 'predict'):
            pred = sepsis_decision_engine.predict(features)[0]
            risk_score = float(pred)
        else:
            risk_score = float(sepsis_decision_engine(features))
        
        # Ensure risk_score is between 0 and 1
        risk_score = max(0.0, min(1.0, float(risk_score)))
        
        # Step 5: Determine status based on 0.30 threshold
        status = "Patient Stable" if risk_score < 0.30 else "SEPSIS ALERT: INITIATE PROTOCOL"
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
                "using_fallback": False,
                "models_loaded": {
                    "sepsis_decision_engine": True,
                    "base_vitals_model": True
                }
            }
        }
    
    except Exception as e:
        print(f"ERROR: Sepsis Early Warning failed: {e}")
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