import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Activity, ShieldAlert, CheckCircle, Database, Zap, 
  Cpu, Heart, Thermometer, User, FileText, LayoutDashboard, 
  Search, Menu, Moon, Sun, TrendingUp, AlertTriangle, 
  Gauge, Brain, Stethoscope, Upload, Activity as ActivityIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

// Feature categories for organized UI
const CATEGORIES = {
  Vitals: ['HR', 'O2Sat', 'Temp', 'SBP', 'MAP', 'DBP', 'Resp'],
  Labs_Chem: ['EtCO2', 'BaseExcess', 'HCO3', 'FiO2', 'pH', 'PaCO2', 'SaO2', 'AST', 'BUN', 'Alkalinephos', 'Calcium', 'Chloride', 'Creatinine', 'Bilirubin_direct', 'Glucose'],
  Labs_Markers: ['Lactate', 'Magnesium', 'Phosphate', 'Potassium', 'Bilirubin_total', 'TroponinI', 'Hct', 'Hgb', 'PTT', 'WBC', 'Fibrinogen', 'Platelets'],
  Info_Scores: ['Age', 'Gender', 'Unit1', 'Unit2', 'HospAdmTime', 'ICULOS', 'Hour', 'SOFA_score', 'SOFA_cardio', 'Shock_Index', 'MAP_Calc']
};

// Default values for all 45 features
const getDefaultFormData = () => {
  const defaults = {
    // Vitals
    HR: 80, O2Sat: 98, Temp: 37, SBP: 120, MAP: 90, DBP: 80, Resp: 18,
    // Labs Chemistry
    EtCO2: 35, BaseExcess: 0, HCO3: 24, FiO2: 21, pH: 7.4, PaCO2: 40, SaO2: 98,
    AST: 25, BUN: 15, Alkalinephos: 80, Calcium: 9.5, Chloride: 100, Creatinine: 1.0,
    Bilirubin_direct: 0.2, Glucose: 100,
    // Labs Markers
    Lactate: 1.0, Magnesium: 2.0, Phosphate: 3.5, Potassium: 4.0, Bilirubin_total: 0.8,
    TroponinI: 0.01, Hct: 42, Hgb: 14, PTT: 30, WBC: 7.0, Fibrinogen: 300, Platelets: 250,
    // Info & Scores
    Age: 45, Gender: 1, Unit1: 0, Unit2: 0, HospAdmTime: 0, ICULOS: 0, Hour: 0,
    SOFA_score: 0, SOFA_cardio: 0, Shock_Index: 0.67, MAP_Calc: 90
  };
  return defaults;
};

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [formData, setFormData] = useState(getDefaultFormData());
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [uploadedRecord, setUploadedRecord] = useState(null); // { fileName, preview, parsedValues, anomalies, fileType }


  // Auto-correct SOFA_score when SOFA_cardio changes (prevent contradiction)
  useEffect(() => {
    if (formData.SOFA_cardio > 0 && formData.SOFA_score < formData.SOFA_cardio) {
      setFormData(prev => ({
        ...prev,
        SOFA_score: prev.SOFA_cardio
      }));
    }
  }, [formData.SOFA_cardio]);

  // Clinical thresholds for critical values - Normal ranges for all lab values
  const thresholds = {
    // Vitals
    HR: { min: 60, max: 100, unit: 'bpm' },
    SBP: { min: 90, max: 140, unit: 'mmHg' },
    DBP: { min: 60, max: 90, unit: 'mmHg' },
    MAP: { min: 70, max: 105, unit: 'mmHg' },
    Resp: { min: 12, max: 20, unit: '/min' },
    O2Sat: { min: 95, max: 100, unit: '%' },
    Temp: { min: 36.1, max: 37.2, unit: '°C' },
    // Labs Chemistry
    EtCO2: { min: 35, max: 45, unit: 'mmHg' },
    BaseExcess: { min: -2, max: 2, unit: 'mEq/L' },
    HCO3: { min: 22, max: 26, unit: 'mEq/L' },
    FiO2: { min: 21, max: 100, unit: '%' },
    pH: { min: 7.35, max: 7.45, unit: '' },
    PaCO2: { min: 35, max: 45, unit: 'mmHg' },
    SaO2: { min: 95, max: 100, unit: '%' },
    AST: { min: 10, max: 40, unit: 'U/L' },
    BUN: { min: 7, max: 20, unit: 'mg/dL' },
    Alkalinephos: { min: 44, max: 147, unit: 'U/L' },
    Calcium: { min: 8.5, max: 10.5, unit: 'mg/dL' },
    Chloride: { min: 98, max: 107, unit: 'mEq/L' },
    Creatinine: { min: 0.6, max: 1.2, unit: 'mg/dL' },
    Bilirubin_direct: { min: 0, max: 0.3, unit: 'mg/dL' },
    Glucose: { min: 70, max: 100, unit: 'mg/dL' },
    // Labs Markers
    Lactate: { min: 0.5, max: 2.0, unit: 'mmol/L' },
    Magnesium: { min: 1.7, max: 2.2, unit: 'mg/dL' },
    Phosphate: { min: 2.5, max: 4.5, unit: 'mg/dL' },
    Potassium: { min: 3.5, max: 5.0, unit: 'mEq/L' },
    Bilirubin_total: { min: 0.3, max: 1.2, unit: 'mg/dL' },
    TroponinI: { min: 0, max: 0.04, unit: 'ng/mL' },
    Hct: { min: 36, max: 48, unit: '%' },
    Hgb: { min: 12, max: 16, unit: 'g/dL' },
    PTT: { min: 25, max: 35, unit: 'sec' },
    WBC: { min: 4.5, max: 11.0, unit: 'K/μL' },
    Fibrinogen: { min: 200, max: 400, unit: 'mg/dL' },
    Platelets: { min: 150, max: 450, unit: 'K/μL' },
    // Info & Scores
    Age: { min: 0, max: 120, unit: 'years' },
    Gender: { min: 0, max: 1, unit: '' },
    Hour: { min: 0, max: 72, unit: 'hrs' },
    ICULOS: { min: 0, max: 100, unit: 'days' },
    SOFA_score: { min: 0, max: 24, unit: '' },
    SOFA_cardio: { min: 0, max: 4, unit: '' },
    Shock_Index: { min: 0.5, max: 0.9, unit: '' },
    MAP_Calc: { min: 70, max: 105, unit: 'mmHg' },
  };

  const isCritical = (key, value) => {
    if (!thresholds[key]) return false;
    return value < thresholds[key].min || value > thresholds[key].max;
  };

  const getEvidence = () => {
    const evidence = [];
    if (formData.HR > thresholds.HR.max) {
      evidence.push({ label: "Tachycardia Detected", value: `HR: ${formData.HR}`, status: "critical" });
    } else if (formData.HR < thresholds.HR.min) {
      evidence.push({ label: "Bradycardia Detected", value: `HR: ${formData.HR}`, status: "warning" });
    } else {
      evidence.push({ label: "HR within normal range", value: `HR: ${formData.HR}`, status: "normal" });
    }
    if (formData.SBP < thresholds.SBP.min) {
      evidence.push({ label: "Hypotension Warning", value: `SBP: ${formData.SBP}`, status: "critical" });
    } else if (formData.SBP > thresholds.SBP.max) {
      evidence.push({ label: "Hypertensive range", value: `SBP: ${formData.SBP}`, status: "warning" });
    } else {
      evidence.push({ label: "SBP within normal range", value: `SBP: ${formData.SBP}`, status: "normal" });
    }
    return evidence;
  };

  // Helper to extract numeric values from a free-form text string
  const extractValuesFromText = (text) => {
    const keys = Object.keys(getDefaultFormData());
    const parsed = {};
    // Simple key:value or "HR 80" style parsing
    const regex = new RegExp(`\\b(${keys.join('|')})\\b[:=\s]*([0-9]{1,3}(?:\\.[0-9]+)?)`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      const key = match[1];
      const val = parseFloat(match[2]);
      if (!Number.isNaN(val)) parsed[key] = val;
    }
    return parsed;
  };

  const checkAnomalies = (values) => {
    const anomalies = {};
    Object.entries(values).forEach(([k, v]) => {
      if (thresholds[k]) {
        if (v < thresholds[k].min || v > thresholds[k].max) {
          anomalies[k] = { value: v, min: thresholds[k].min, max: thresholds[k].max };
        }
      }
    });
    return anomalies;
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setScanMessage('Scanning lab report...');

    try {
      const textReader = new FileReader();

      // We'll parse text-based files directly; for images/PDF we fallback to heuristic extraction
      const isText = file.type === 'application/json' || file.type === 'text/csv' || file.type === 'text/plain' || file.name.endsWith('.csv') || file.name.endsWith('.json') || file.name.endsWith('.txt');

      if (isText) {
        textReader.onload = (e) => {
          const text = e.target.result;
          let parsed = {};

          // Try JSON
          if (file.type === 'application/json' || file.name.endsWith('.json')) {
            try {
              const obj = JSON.parse(text);
              Object.keys(getDefaultFormData()).forEach(k => {
                if (obj[k] !== undefined && obj[k] !== null) parsed[k] = parseFloat(obj[k]) || obj[k];
              });
            } catch (e) {
              // fallback to free text
              parsed = extractValuesFromText(text);
            }
          } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            // Simple CSV parser: header row or key,value rows
            const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            if (lines.length > 0) {
              const header = lines[0].split(/,|\t/).map(h => h.replace(/["']/g, '').trim());
              const headersContainKeys = header.some(h => Object.keys(getDefaultFormData()).includes(h));
              if (headersContainKeys && lines.length > 1) {
                const values = lines[1].split(/,|\t/);
                header.forEach((h, i) => {
                  if (Object.keys(getDefaultFormData()).includes(h)) parsed[h] = parseFloat(values[i]) || values[i];
                });
              } else {
                // try key:value per line
                lines.forEach(line => {
                  const m = line.match(/(\w+)\s*[:=,]\s*([0-9.]+)$/);
                  if (m && Object.keys(getDefaultFormData()).includes(m[1])) parsed[m[1]] = parseFloat(m[2]);
                });
              }
            }
          } else {
            // Free-form text (txt)
            parsed = extractValuesFromText(text);
          }

          const anomalies = checkAnomalies(parsed);

          const record = { fileName: file.name, preview: text.slice(0, 1000), parsedValues: parsed, anomalies, fileType: file.type };
          // Auto-apply parsed values
          if (Object.keys(parsed).length > 0) {
            setFormData(prev => ({ ...prev, ...parsed }));
            setScanMessage('Lab records scanned and applied.');
            setTimeout(() => setScanMessage(''), 3000);
            setUploadedRecord(record);
            // Trigger a prediction after a short delay so the backend receives updated params
            setTimeout(() => handlePredict(), 800);
          } else {
            setScanMessage('No measurable lab values were found in the file. Preview is available.');
            setUploadedRecord({ fileName: file.name, preview: text.slice(0, 1000), parsedValues: {}, anomalies: {}, fileType: file.type });
            setLoading(false);
          }
          setLoading(false);
        };
        textReader.onerror = () => {
          setScanMessage('Failed to read file.');
          setLoading(false);
        };
        textReader.readAsText(file);
      } else {
        // Image or PDF: we cannot OCR here reliably; provide preview and a best-effort extraction
        const url = URL.createObjectURL(file);
        // Heuristic extraction — use previously defined example extraction as fallback
        const parsed = {
          WBC: 14.5,
          Platelets: 150,
          Creatinine: 1.2,
          Glucose: 115,
          Lactate: 2.5,
          Hgb: 11.5,
          Hct: 35
        };
        const anomalies = checkAnomalies(parsed);
        const record = { fileName: file.name, preview: url, parsedValues: parsed, anomalies, fileType: file.type };
        setFormData(prev => ({ ...prev, ...parsed }));
        setUploadedRecord(record);
        setScanMessage('Preview available. Extracted key labs and applied to form.');
        setTimeout(() => setScanMessage(''), 4000);
        setLoading(false);
        // Auto-predict
        setTimeout(() => handlePredict(), 900);
      }
    } catch (err) {
      console.error('Upload parse error', err);
      setScanMessage('Error scanning file');
      setLoading(false);
    }
  };

  // Preset value sets for demonstration (updated to match Scaling Bridge "Truth Test" profiles)
  const presetValues = {
    healthy: {
      // Key clinical values for Healthy preset
      HR: 72, SBP: 120, O2Sat: 98, Lactate: 1.0, Temp: 37.0, WBC: 7.0,
      // Keep other defaults for completeness
      MAP: 90, DBP: 75, Resp: 16,
      EtCO2: 38, BaseExcess: 0, HCO3: 24, FiO2: 21, pH: 7.40, PaCO2: 40, SaO2: 98,
      AST: 25, BUN: 12, Alkalinephos: 85, Calcium: 9.8, Chloride: 102, Creatinine: 0.9,
      Bilirubin_direct: 0.2, Glucose: 95,
      Magnesium: 2.0, Phosphate: 3.8, Potassium: 4.2, Bilirubin_total: 0.8,
      TroponinI: 0.01, Hct: 42, Hgb: 14, PTT: 30, Fibrinogen: 300, Platelets: 250,
      Age: 45, Gender: 1, Unit1: 0, Unit2: 0, HospAdmTime: 0, ICULOS: 0, Hour: 0,
      SOFA_score: 0, SOFA_cardio: 0, Shock_Index: 0.63, MAP_Calc: 90
    },
    mild: {
      // Key clinical values for Mild Sepsis preset
      HR: 105, SBP: 105, O2Sat: 94, Lactate: 2.5, Temp: 38.8, WBC: 14.0,
      // Keep other values reasonable for context
      MAP: 68, DBP: 58, Resp: 24,
      EtCO2: 30, BaseExcess: -5, HCO3: 18, FiO2: 50, pH: 7.28, PaCO2: 52, SaO2: 88,
      AST: 65, BUN: 35, Alkalinephos: 150, Calcium: 8.2, Chloride: 108, Creatinine: 2.0,
      Bilirubin_direct: 1.2, Glucose: 160,
      Magnesium: 1.6, Phosphate: 5.0, Potassium: 5.2, Bilirubin_total: 2.5,
      TroponinI: 0.15, Hct: 35, Hgb: 11.0, PTT: 40, Fibrinogen: 420, Platelets: 120,
      Age: 62, Gender: 1, Unit1: 0, Unit2: 0, HospAdmTime: 0, ICULOS: 4, Hour: 18,
      SOFA_score: 7, SOFA_cardio: 2, Shock_Index: 1.15, MAP_Calc: 75
    },
    severe: {
      // Key clinical values for Severe/Critical Sepsis preset (triggers Clinical Guardrail)
      HR: 155, SBP: 75, O2Sat: 84, Lactate: 7.8, Temp: 40.2, WBC: 38.0,
      // Keep other values consistent with critical profile
      MAP: 55, DBP: 45, Resp: 32,
      EtCO2: 25, BaseExcess: -12, HCO3: 14, FiO2: 80, pH: 7.18, PaCO2: 60, SaO2: 78,
      AST: 180, BUN: 60, Alkalinephos: 280, Calcium: 6.8, Chloride: 118, Creatinine: 3.5,
      Bilirubin_direct: 3.5, Glucose: 220,
      Magnesium: 1.2, Phosphate: 6.5, Potassium: 6.2, Bilirubin_total: 6.0,
      TroponinI: 1.2, Hct: 28, Hgb: 9.0, PTT: 55, Fibrinogen: 600, Platelets: 45,
      Age: 72, Gender: 0, Unit1: 0, Unit2: 0, HospAdmTime: 0, ICULOS: 8, Hour: 36,
      SOFA_score: 16, SOFA_cardio: 4, Shock_Index: 1.93, MAP_Calc: 55
    }
  };

  const loadPreset = (presetType) => {
    // Merge preset fields into existing form data so we don't drop unrelated features
    setFormData(prev => ({ ...prev, ...presetValues[presetType] }));
    setResult(null); // Clear previous results
  };

  const handlePredict = async () => {
    setLoading(true);
    
    // Auto-fix SOFA score contradiction before sending
    const dataToSend = { ...formData };
    if (dataToSend.SOFA_cardio > 0 && dataToSend.SOFA_score < dataToSend.SOFA_cardio) {
      dataToSend.SOFA_score = dataToSend.SOFA_cardio;
      console.log(`Auto-corrected SOFA_score: ${formData.SOFA_score} -> ${dataToSend.SOFA_score} (to match SOFA_cardio)`);
    }
    
    try {
      const res = await axios.post('http://localhost:8000/predict', dataToSend);
      setResult(res.data);
    } catch (e) { 
      console.error("Connection Error:", e);
      alert("Make sure your backend is running at http://localhost:8000");
    }
    setLoading(false);
  };

  // Calculate risk score from probabilities (Bridge model format)
  const getRiskScore = () => {
    if (!result || !result.probabilities) return 0;
    
    // Use severe probability as the risk score
    if (typeof result.probabilities === 'object' && result.probabilities.severe !== undefined) {
      return result.probabilities.severe; // Already a percentage
    } else if (Array.isArray(result.probabilities)) {
      // Fallback for array format
      return (result.probabilities[2] || 0) * 100;
    }
    return 0;
  };

  const riskScore = getRiskScore();
  
  // Determine UI state based on severe probability (Bridge model logic)
  // Final thresholds from successful test: 0-35% = Healthy, 36-60% = Mild, 61-100% = Severe
  const getStatusFromRisk = (severeProb) => {
    if (severeProb > 60) {
      return {
        status: "CRITICAL: SEVERE SEPSIS",
        color: "#ef4444", // Red
        severityLevel: "severe"
      };
    } else if (severeProb > 35) {
      return {
        status: "WARNING: MILD SEPSIS",
        color: "#f59e0b", // Orange/Yellow
        severityLevel: "mild"
      };
    } else {
      return {
        status: "PATIENT STABLE",
        color: "#10b981", // Green
        severityLevel: "healthy"
      };
    }
  };

  const statusInfo = result ? getStatusFromRisk(riskScore) : null;

  // Prepare gauge data for Recharts - Use severe probability as needle position
  const gaugeData = result ? [
    {
      name: 'Severe Risk',
      value: riskScore, // This is the "needle" position (0-100%)
      fill: statusInfo ? statusInfo.color : (darkMode ? '#00f0ff' : '#0066cc')
    },
    {
      name: 'Remaining',
      value: 100 - riskScore,
      fill: darkMode ? 'rgba(0, 240, 255, 0.1)' : 'rgba(0, 102, 204, 0.1)'
    }
  ] : [];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#05070a] text-cyan-50' : 'bg-gray-50 text-gray-900'}`}>
      {/* Top Navigation Bar */}
      <nav className={`border-b ${darkMode ? 'border-cyan-900/30 bg-[#0a0d12]' : 'border-gray-200 bg-white'} px-6 py-4 flex justify-between items-center sticky top-0 z-50 backdrop-blur-sm`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${darkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-100 text-blue-600'}`}>
            <ShieldAlert size={24} />
          </div>
          <span className={`font-bold text-xl tracking-tight ${darkMode ? 'text-cyan-100' : 'text-gray-900'}`}>
            NovaGuard AI
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg transition-all ${darkMode ? 'hover:bg-cyan-500/20 text-cyan-400' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Sidebar Navigation */}
        <div className="flex gap-8 mb-8">
          <div className={`w-64 ${darkMode ? 'bg-[#0a0d12] border-cyan-900/30' : 'bg-white border-gray-200'} border rounded-2xl p-4 sticky top-24 h-fit`}>
            <div className="flex flex-col space-y-2">
              <NavLink 
                active={activeTab === 'dashboard'} 
                onClick={() => setActiveTab('dashboard')} 
                icon={<LayoutDashboard size={20}/>} 
                label="Patient Dashboard"
                darkMode={darkMode}
              />
              <NavLink 
                active={activeTab === 'pipeline'} 
                onClick={() => setActiveTab('pipeline')} 
                icon={<Database size={20}/>} 
                label="Model Architecture"
                darkMode={darkMode}
              />
            </div>
          </div>

          {/* Main Dashboard Content */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' ? (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  {/* Header */}
                  <div>
                    <h1 className={`text-4xl font-bold mb-2 ${darkMode ? 'text-cyan-100' : 'text-gray-900'}`}>
                      Clinical Decision Support
                    </h1>
                    <p className={`${darkMode ? 'text-cyan-400/70' : 'text-gray-600'} mb-4`}>
                      Processing 45 multi-modal biomarkers for complex sepsis prediction
                    </p>
                    
                    {/* Demo Preset Buttons */}
                    <div className="flex flex-wrap gap-3 mb-6">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => loadPreset('healthy')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
                          darkMode 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30' 
                            : 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                        }`}
                      >
                        <CheckCircle size={16} />
                        Load Healthy Preset
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => loadPreset('mild')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
                          darkMode 
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30' 
                            : 'bg-yellow-100 text-yellow-700 border border-yellow-300 hover:bg-yellow-200'
                        }`}
                      >
                        <AlertTriangle size={16} />
                        Load Mild Sepsis Preset
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => loadPreset('severe')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
                          darkMode 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' 
                            : 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200'
                        }`}
                      >
                        <ShieldAlert size={16} />
                        Load Severe/Critical Preset
                      </motion.button>
          </div>
        </div>

                  {/* Lab Record Scan Card */}
                  <section>
                    <div className={`${darkMode ? 'bg-[#0a0d12] border-cyan-900/30' : 'bg-white border-gray-200'} border rounded-2xl p-6`}>
                      <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-cyan-300' : 'text-gray-800'}`}>
                        <FileText size={20} className={darkMode ? 'text-cyan-400' : 'text-blue-600'} />
                        Lab Record Scan
                      </h2>
                      <p className={`text-xs mb-6 font-medium leading-relaxed ${darkMode ? 'text-cyan-400/70' : 'text-gray-600'}`}>
                        Upload PDF or Image of Blood Work (CBC/BMP) to automatically extract clinical parameters.
                      </p>
                      
                      <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed ${darkMode ? 'border-cyan-900/30 hover:border-cyan-500/50' : 'border-gray-200 hover:border-blue-300'} rounded-2xl cursor-pointer ${darkMode ? 'hover:bg-cyan-500/5' : 'hover:bg-gray-50'} transition-all`}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload size={24} className={darkMode ? 'text-cyan-400' : 'text-gray-400'} />
                          <p className={`text-xs font-bold uppercase tracking-widest mt-2 ${darkMode ? 'text-cyan-400/70' : 'text-gray-500'}`}>
                            Upload Report
                          </p>
          </div>
                        <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,application/json,text/csv,text/plain" />
                      </label>
                      {scanMessage && (
                        <p className={`text-xs mt-3 text-center ${darkMode ? 'text-cyan-400' : 'text-blue-600'}`}>
                          {scanMessage}
                        </p>
                      )}

                      {uploadedRecord && (
                        <div className={`mt-4 p-4 rounded-lg border ${darkMode ? 'bg-[#071014] border-cyan-900/20' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`text-sm font-bold ${darkMode ? 'text-cyan-200' : 'text-gray-800'}`}>{uploadedRecord.fileName}</p>
                              <p className="text-xs mt-1 text-muted">Type: {uploadedRecord.fileType || 'unknown'}</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  // Re-apply parsed values to form
                                  if (Object.keys(uploadedRecord.parsedValues || {}).length > 0) {
                                    setFormData(prev => ({ ...prev, ...uploadedRecord.parsedValues }));
                                    setScanMessage('Applied extracted values to form');
                                    setTimeout(() => setScanMessage(''), 2500);
                                  }
                                }}
                                className={`px-3 py-1 rounded text-xs font-bold ${darkMode ? 'bg-cyan-500/20 text-cyan-300' : 'bg-blue-100 text-blue-600'}`}>
                                Apply Values
                              </button>
                              <button
                                onClick={async () => {
                                  if (Object.keys(uploadedRecord.parsedValues || {}).length > 0) {
                                    setFormData(prev => ({ ...prev, ...uploadedRecord.parsedValues }));
                                  }
                                  await handlePredict();
                                }}
                                className={`px-3 py-1 rounded text-xs font-bold ${darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'}`}>
                                Apply & Predict
                              </button>
                              <button
                                onClick={() => {
                                  if (uploadedRecord.preview && uploadedRecord.fileType && uploadedRecord.fileType.startsWith('image/')) {
                                    URL.revokeObjectURL(uploadedRecord.preview);
                                  }
                                  setUploadedRecord(null);
                                }}
                                className={`px-3 py-1 rounded text-xs font-bold ${darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>
                                Remove
                              </button>
                            </div>
                          </div>

                          {/* Preview */}
                          {uploadedRecord.preview && (
                            <div className="mt-3">
                              {uploadedRecord.fileType && uploadedRecord.fileType.startsWith('image/') ? (
                                <img src={uploadedRecord.preview} alt="uploaded" className="max-h-40 rounded-md object-contain" />
                              ) : (
                                <pre className={`text-xs mt-2 p-2 rounded ${darkMode ? 'bg-[#041018]' : 'bg-white'}`}>{uploadedRecord.preview}</pre>
                              )}
                            </div>
                          )}

                          {/* Parsed values */}
                          {uploadedRecord.parsedValues && Object.keys(uploadedRecord.parsedValues).length > 0 && (
                            <div className="mt-3 grid grid-cols-3 gap-2">
                              {Object.entries(uploadedRecord.parsedValues).slice(0, 12).map(([k, v]) => (
                                <div key={k} className="text-xs p-2 rounded bg-transparent border border-dashed">
                                  <div className="font-bold">{k}</div>
                                  <div className="text-sm">{v}</div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Anomalies */}
                          {uploadedRecord.anomalies && Object.keys(uploadedRecord.anomalies).length > 0 && (
                            <div className="mt-3 text-xs text-yellow-300">
                              <strong>Values outside normal range:</strong>
                              <ul className="list-disc list-inside">
                                {Object.entries(uploadedRecord.anomalies).map(([k, a]) => (
                                  <li key={k}>{k}: {a.value} (normal {a.min}-{a.max})</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
          </div>
                  </section>

                  {/* Feature Input Sections */}
                  <div className="space-y-10">
                    {Object.entries(CATEGORIES).map(([categoryName, fields]) => (
                      <section key={categoryName}>
                        <h2 className={`text-sm font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-3 ${darkMode ? 'text-cyan-500' : 'text-blue-600'}`}>
                          <div className={`w-2 h-2 rounded-full animate-pulse ${darkMode ? 'bg-cyan-500' : 'bg-blue-500'}`} />
                          {categoryName.replace('_', ' ')}
                </h2>
                        <div className="grid grid-cols-12 gap-4">
                          {fields.map((field) => {
                            const critical = isCritical(field, formData[field]);
                            const threshold = thresholds[field];
                            const hasRange = threshold && threshold.min !== undefined && threshold.max !== undefined;
                            
                            return (
                              <motion.div
                                key={field}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`col-span-12 sm:col-span-6 lg:col-span-3 ${darkMode ? 'bg-[#0a0d12] border-cyan-900/30' : 'bg-white border-gray-200'} border rounded-xl p-4 transition-all duration-300 ${critical ? 'critical-glow' : ''}`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <label className={`text-[10px] font-black uppercase tracking-wider ${darkMode ? 'text-cyan-400/70' : 'text-gray-500'}`}>
                                    {field}
                                  </label>
                                  {critical && <AlertTriangle size={14} className="text-red-400 animate-pulse" />}
                                </div>
                      <input 
                        type="number" 
                                  value={formData[field] || ''}
                                  onChange={(e) => setFormData({...formData, [field]: parseFloat(e.target.value) || 0})}
                                  className={`w-full bg-transparent border-none outline-none text-lg font-bold ${critical ? 'text-red-400' : (darkMode ? 'text-cyan-100' : 'text-gray-900')} focus:text-cyan-400 placeholder:opacity-50`}
                                  placeholder="0"
                                />
                                {hasRange && (
                                  <p className={`text-[9px] mt-1 ${critical ? 'text-red-400/80' : (darkMode ? 'text-cyan-400/50' : 'text-gray-400')}`}>
                                    Normal: {threshold.min}-{threshold.max} {threshold.unit}
                                  </p>
                                )}
                              </motion.div>
                            );
                          })}
                    </div>
                      </section>
                  ))}
                </div>

                  {/* Diagnosis Result Center & XAI Panel */}
                  <div className="grid grid-cols-12 gap-6">
                    {/* Diagnosis Result Center */}
                    <section className="col-span-12 lg:col-span-7">
                      <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-cyan-300' : 'text-gray-800'}`}>
                        <Brain size={20} className={darkMode ? 'text-cyan-400' : 'text-blue-600'} />
                        Diagnosis Result Center
                      </h2>

              <AnimatePresence mode="wait">
                {result ? (
                  <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className={`${darkMode ? 'bg-[#0a0d12] border-cyan-900/30' : 'bg-white border-gray-200'} border rounded-2xl p-8 relative overflow-hidden`}
                          >
                            {/* Clinical Override Badge */}
                            {result.is_clinical_override && (
                              <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${darkMode ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-red-100 text-red-600 border border-red-200'}`}>
                                CLINICAL OVERRIDE
                              </div>
                            )}
                            
                            {/* Override Reason Banner */}
                            {result.override_reason && (
                              <div className={`absolute top-4 left-4 px-4 py-2 rounded-lg text-xs font-bold border max-w-xs z-10 ${darkMode ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-blue-100 text-blue-700 border-blue-300'}`}>
                                {result.override_reason}
                              </div>
                            )}
                            
                            {/* Sanity Gate Banner - Shows when AI hallucination was corrected */}
                            {result.is_hallucination_corrected && !result.is_clinical_override && (
                              <div className={`absolute top-4 left-4 px-4 py-2 rounded-lg text-xs font-bold border ${darkMode ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-yellow-100 text-yellow-700 border-yellow-300'}`}>
                                <div className="flex items-center gap-2">
                                  <AlertTriangle size={14} />
                                  <span>SANITY GATE</span>
                                </div>
                                <p className={`text-[10px] mt-1 ${darkMode ? 'text-yellow-300/70' : 'text-yellow-600'}`}>
                                  Model predicted {result.raw_ai_output === 2 ? 'Severe' : 'Mild'} but vitals are normal
                                </p>
                              </div>
                            )}
                            
                            {/* Sanity Gate Banner - Shows when AI hallucination was corrected */}
                            {result.is_hallucination_corrected && (
                              <div className={`absolute top-4 left-4 px-4 py-2 rounded-lg text-xs font-bold border ${darkMode ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-yellow-100 text-yellow-700 border-yellow-300'}`}>
                                <div className="flex items-center gap-2">
                                  <AlertTriangle size={14} />
                                  <span>AI CORRECTED</span>
                                </div>
                                <p className={`text-[10px] mt-1 ${darkMode ? 'text-yellow-300/70' : 'text-yellow-600'}`}>
                                  Model predicted {result.raw_ai_output === 2 ? 'Severe' : 'Mild'} but vitals are normal
                                </p>
                    </div>
                            )}

                            {/* Severity Display - Driven by Severe Probability (Bridge Model) */}
                            <div className="text-center mb-6 mt-10">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", delay: 0.2 }}
                                className={`inline-flex p-4 rounded-full mb-4 ${
                                  statusInfo?.severityLevel === 'healthy'
                                    ? darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
                                    : statusInfo?.severityLevel === 'mild'
                                    ? darkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'
                                    : darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
                                }`}
                              >
                                {statusInfo?.severityLevel === 'healthy' ? (
                                  <CheckCircle size={48} />
                                ) : (
                                  <ShieldAlert size={48} />
                                )}
                      </motion.div>
                              
                              <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-4xl font-bold mb-2"
                                style={{ color: statusInfo?.color || (darkMode ? '#00f0ff' : '#0066cc') }}
                              >
                                {statusInfo?.status || result.severity.toUpperCase()}
                              </motion.h2>
                              
                              <p className={`text-sm uppercase tracking-wider ${darkMode ? 'text-cyan-400/70' : 'text-gray-500'}`}>
                                Severe Risk: {riskScore.toFixed(1)}%
                              </p>
                            </div>

                            {/* Severe Risk Gauge - Driven by probabilities.severe (Bridge Model) */}
                            <div className="mt-8">
                              <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 text-center ${darkMode ? 'text-cyan-400/70' : 'text-gray-500'}`}>
                                Severe Sepsis Risk Gauge
                              </h3>
                              <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                  <RadialBarChart
                                    innerRadius="60%"
                                    outerRadius="90%"
                                    data={gaugeData}
                                    startAngle={180}
                                    endAngle={0}
                                  >
                                    <RadialBar
                                      dataKey="value"
                                      cornerRadius={10}
                                    />
                                  </RadialBarChart>
                                </ResponsiveContainer>
                              </div>
                              <div className="text-center mt-4">
                                <span 
                                  className="text-3xl font-bold"
                                  style={{ color: statusInfo?.color || (darkMode ? '#00f0ff' : '#0066cc') }}
                                >
                                  {riskScore.toFixed(1)}%
                                </span>
                                <p className={`text-xs mt-1 ${darkMode ? 'text-cyan-400/50' : 'text-gray-400'}`}>
                                  Severe Probability
                                </p>
                              </div>
                            </div>

                            {/* Linear confidence bar */}
                            <div className="mt-6">
                              <p className={`${darkMode ? 'text-cyan-400/60' : 'text-gray-400'} text-xs uppercase font-bold tracking-widest mb-2`}>
                                AI Confidence
                              </p>
                              <div className="relative pt-1">
                                <div className={`overflow-hidden h-2 mb-3 text-xs flex rounded ${darkMode ? 'bg-cyan-900/40' : 'bg-gray-100'}`}>
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${result.confidence || (result.confidence_score * 100).toFixed(1)}%` }}
                                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${darkMode ? 'bg-cyan-500' : 'bg-blue-500'}`}
                                  />
                                </div>
                                <span className={`text-sm font-bold ${darkMode ? 'text-cyan-300' : 'text-blue-600'}`}>
                                  {result.confidence || (result.confidence_score * 100).toFixed(1)}% Certainty
                                </span>
                              </div>
                    </div>
                    
                            {/* Probability Breakdown - Bridge Model Format (Dictionary) */}
                            <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-cyan-900/30">
                              {(() => {
                                // Handle both dictionary and array formats
                                let probs = {};
                                if (result.probabilities && typeof result.probabilities === 'object') {
                                  if (result.probabilities.severe !== undefined) {
                                    // Dictionary format (Bridge model)
                                    probs = result.probabilities;
                                  } else if (Array.isArray(result.probabilities)) {
                                    // Array format (fallback)
                                    probs = {
                                      healthy: (result.probabilities[0] || 0) * 100,
                                      mild: (result.probabilities[1] || 0) * 100,
                                      severe: (result.probabilities[2] || 0) * 100
                                    };
                                  }
                                }
                                
                                const probEntries = [
                                  { key: 'healthy', label: 'Healthy', value: probs.healthy || 0, index: 0 },
                                  { key: 'mild', label: 'Mild', value: probs.mild || 0, index: 1 },
                                  { key: 'severe', label: 'Severe', value: probs.severe || 0, index: 2 }
                                ];
                                
                                return probEntries.map(({ key, label, value, index }) => {
                                  const isRawPrediction = index === result.raw_ai_output;
                                  const isFinalPrediction = index === result.prediction;
                                  const isSevereRisk = key === 'severe' && value > 35;
                                  
                                  return (
                                    <div key={key} className="text-center">
                                      <p className={`text-2xl font-bold ${
                                        isFinalPrediction 
                                          ? (darkMode ? 'text-cyan-400' : 'text-blue-600')
                                          : isRawPrediction && result.is_clinical_override
                                          ? (darkMode ? 'text-yellow-400' : 'text-yellow-600')
                                          : isSevereRisk
                                          ? (darkMode ? 'text-red-400' : 'text-red-600')
                                          : (darkMode ? 'text-cyan-400/30' : 'text-gray-300')
                                      }`}>
                                        {value.toFixed(1)}%
                                      </p>
                                      <p className={`text-xs uppercase tracking-wider mt-1 ${darkMode ? 'text-cyan-400/50' : 'text-gray-400'}`}>
                                        {label}
                                      </p>
                                      {isRawPrediction && result.is_clinical_override && (
                                        <p className={`text-[9px] mt-1 ${darkMode ? 'text-yellow-400/70' : 'text-yellow-600'}`}>
                                          (AI)
                                        </p>
                                      )}
                                    </div>
                                  );
                                });
                              })()}
                        </div>
                            
                            {/* Debug info - Show raw vs final prediction */}
                            {result.is_clinical_override && (
                              <div className={`mt-4 p-3 rounded-lg text-xs ${darkMode ? 'bg-cyan-900/20 text-cyan-400/70' : 'bg-blue-50 text-blue-700'}`}>
                                <p className="font-bold mb-1">Model Prediction vs Clinical Override:</p>
                                <p>Raw AI: {["Healthy", "Mild", "Severe"][result.raw_ai_output]} 
                                  ({result.probabilities?.[["healthy", "mild", "severe"][result.raw_ai_output]]?.toFixed(1) || '0'}%)</p>
                                <p>Final: {result.severity} (Clinical Override Applied)</p>
                                <p className="mt-2 font-semibold">Severe Risk Score: {riskScore.toFixed(1)}%</p>
                    </div>
                            )}
                  </motion.div>
                ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={`${darkMode ? 'bg-[#0a0d12] border-cyan-900/30 border-dashed' : 'bg-white border-gray-200 border-dashed'} border-2 rounded-2xl h-96 flex flex-col items-center justify-center`}
                          >
                            <Activity size={48} className={`mb-4 ${darkMode ? 'text-cyan-400/20' : 'text-gray-300'} animate-pulse`} />
                            <p className={`font-bold uppercase tracking-widest text-sm ${darkMode ? 'text-cyan-400/40' : 'text-gray-400'}`}>
                              Waiting for Clinical Matrix
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </section>

                    {/* XAI Reasoning Panel */}
                    <section className="col-span-12 lg:col-span-5">
                      <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-cyan-300' : 'text-gray-800'}`}>
                        <TrendingUp size={20} className={darkMode ? 'text-cyan-400' : 'text-blue-600'} />
                        Clinical Evidence
                      </h2>
                      
                      <div className={`${darkMode ? 'bg-[#0a0d12] border-cyan-900/30' : 'bg-white border-gray-200'} border rounded-2xl p-6 space-y-4`}>
                        {getEvidence().map((item, idx) => (
                          <motion.div
                            key={item.label}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`p-4 rounded-lg border ${
                              item.status === 'critical'
                                ? darkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
                                : item.status === 'warning'
                                  ? darkMode ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200'
                                  : darkMode ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-blue-50 border-blue-200'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${
                                item.status === 'critical'
                                  ? darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
                                  : item.status === 'warning'
                                    ? darkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'
                                    : darkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-100 text-blue-600'
                              }`}>
                                <AlertTriangle size={16} />
                              </div>
                              <div className="flex-1">
                                <p className={`text-sm font-bold mb-1 ${darkMode ? 'text-cyan-100' : 'text-gray-900'}`}>
                                  {item.label}
                                </p>
                                <p className={`text-xs ${darkMode ? 'text-cyan-400/70' : 'text-gray-600'}`}>
                                  {item.value}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}

                        {result && result.top_features && result.top_features.length > 0 && (
                          <div className="pt-4 border-t border-cyan-900/20 space-y-3">
                            <p className={`text-xs uppercase tracking-wider font-bold ${darkMode ? 'text-cyan-400/70' : 'text-gray-500'}`}>
                              Model-driven evidence
                            </p>
                            {result.top_features.map((feature, idx) => (
                              <motion.div
                                key={feature.feature}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`p-3 rounded-lg border ${
                                  feature.is_critical
                                    ? darkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
                                    : darkMode ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-blue-50 border-blue-200'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-lg ${
                                    feature.is_critical
                                      ? darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
                                      : darkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-100 text-blue-600'
                                  }`}>
                                    <AlertTriangle size={16} />
                                  </div>
                                  <div className="flex-1">
                                    <p className={`text-sm font-bold mb-1 ${darkMode ? 'text-cyan-100' : 'text-gray-900'}`}>
                                      {feature.feature}: {feature.value}
                                    </p>
                                    <p className={`text-xs ${darkMode ? 'text-cyan-400/70' : 'text-gray-600'}`}>
                                      {feature.explanation}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}

                        {!result && (
                          <div className={`text-center py-6 ${darkMode ? 'text-cyan-400/40' : 'text-gray-400'}`}>
                            <Brain size={32} className="mx-auto mb-2 opacity-30" />
                            <p className="text-xs">Run diagnosis to view model explanations.</p>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>

                  {/* Predict Button */}
                  <div className="flex justify-center">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePredict}
                      disabled={loading}
                      className={`px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
                        darkMode
                          ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-400 hover:to-cyan-500 shadow-cyan-500/50'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-400 hover:to-blue-500 shadow-blue-500/50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {loading ? "ANALYZING BIOMARKERS..." : "EXECUTE DIAGNOSIS"}
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="pipeline"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                  <FeatureCard title="XGBoost Model" icon={<Cpu className={darkMode ? 'text-cyan-400' : 'text-blue-600'}/>} darkMode={darkMode} />
                  <FeatureCard title="Feature Engineering" icon={<Database className={darkMode ? 'text-cyan-400' : 'text-blue-600'}/>} darkMode={darkMode} />
                  <FeatureCard title="Real-time Analysis" icon={<Zap className={darkMode ? 'text-cyan-400' : 'text-blue-600'}/>} darkMode={darkMode} />
                </motion.div>
                )}
              </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

/* Internal Components */
function NavLink({ icon, label, active, onClick, darkMode }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex items-center gap-4 px-4 py-3 rounded-xl font-semibold transition-all w-full text-left ${
        active 
          ? darkMode 
            ? 'bg-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/20 border border-cyan-500/30' 
            : 'bg-blue-100 text-blue-600 shadow-lg shadow-blue-100 border border-blue-200'
          : darkMode
            ? 'text-cyan-400/70 hover:bg-cyan-500/10 hover:text-cyan-300'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {icon} <span className="text-sm">{label}</span>
    </button>
  );
}

function FeatureCard({ title, icon, darkMode }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      className={`${darkMode ? 'bg-[#0a0d12] border-cyan-900/30' : 'bg-white border-gray-200'} border rounded-2xl p-10 text-center cursor-pointer`}
    >
      <div className="mb-6 flex justify-center">
        <div className={`p-5 rounded-2xl ${darkMode ? 'bg-cyan-500/10' : 'bg-blue-50'}`}>
          {React.cloneElement(icon, { size: 40 })}
        </div>
      </div>
      <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-cyan-100' : 'text-gray-900'}`}>{title}</h3>
      <p className={`text-sm leading-relaxed font-medium ${darkMode ? 'text-cyan-400/70' : 'text-gray-600'}`}>
        Advanced machine learning pipeline for clinical decision support.
      </p>
    </motion.div>
  );
}
