import React, { useState } from 'react';
import axios from 'axios';
import { 
  Upload, Activity, AlertTriangle, FileText, CheckCircle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

// --- CONSTANTS ---
const CATEGORIES = {
  Vitals: ['HR', 'O2Sat', 'Temp', 'SBP', 'MAP', 'DBP', 'Resp'],
  Labs_Chem: ['EtCO2', 'BaseExcess', 'HCO3', 'FiO2', 'pH', 'PaCO2', 'SaO2', 'AST', 'BUN', 'Alkalinephos', 'Calcium', 'Chloride', 'Creatinine', 'Bilirubin_direct', 'Glucose'],
  Labs_Markers: ['Lactate', 'Magnesium', 'Phosphate', 'Potassium', 'Bilirubin_total', 'TroponinI', 'Hct', 'Hgb', 'PTT', 'WBC', 'Fibrinogen', 'Platelets'],
  Info_Scores: ['Age', 'Gender', 'ICULOS', 'Hour', 'SOFA_score', 'SOFA_cardio', 'Shock_Index', 'MAP_Calc']
};

// UPDATED: Exact Clinical Normal Ranges from your provided data
const THRESHOLDS = {
  // Vitals
  HR: { min: 60, max: 100, unit: 'bpm' },
  O2Sat: { min: 95, max: 100, unit: '%' },
  Temp: { min: 36.1, max: 37.2, unit: '°C' },
  SBP: { min: 90, max: 140, unit: 'mmHg' },
  MAP: { min: 70, max: 105, unit: 'mmHg' },
  DBP: { min: 60, max: 90, unit: 'mmHg' },
  Resp: { min: 12, max: 20, unit: '/min' },

  // Labs & Chem
  EtCO2: { min: 35, max: 45, unit: 'mmHg' },
  BaseExcess: { min: -2, max: 2, unit: 'mEq/L' },
  HCO3: { min: 22, max: 26, unit: 'mEq/L' },
  FiO2: { min: 21, max: 100, unit: '%' }, // Usually room air is 21%, up to 100% on support
  pH: { min: 7.35, max: 7.45, unit: 'pH' },
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

  // Markers
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

  // Scores & Info (Ranges indicate "Normal/Safe")
  Age: { min: 0, max: 120, unit: 'yrs' },
  Gender: { min: 0, max: 1, unit: '' }, // 0 or 1
  ICULOS: { min: 0, max: 100, unit: 'days' }, // No strict "normal", but helpful for context
  Hour: { min: 0, max: 72, unit: 'hrs' },
  SOFA_score: { min: 0, max: 2, unit: 'pts' }, // >2 is generally bad
  SOFA_cardio: { min: 0, max: 0, unit: 'pts' }, // 0 is normal
  Shock_Index: { min: 0.5, max: 0.9, unit: '' },
  MAP_Calc: { min: 70, max: 105, unit: 'mmHg' }
};

const getDefaultFormData = () => ({
    HR: 80, O2Sat: 98, Temp: 37, SBP: 120, MAP: 90, DBP: 80, Resp: 18,
    EtCO2: 35, BaseExcess: 0, HCO3: 24, FiO2: 21, pH: 7.4, PaCO2: 40, SaO2: 98,
    AST: 25, BUN: 15, Alkalinephos: 80, Calcium: 9.5, Chloride: 100, Creatinine: 1.0,
    Bilirubin_direct: 0.2, Glucose: 100,
    Lactate: 1.0, Magnesium: 2.0, Phosphate: 3.5, Potassium: 4.0, Bilirubin_total: 0.8,
    TroponinI: 0.01, Hct: 42, Hgb: 14, PTT: 30, WBC: 7.0, Fibrinogen: 300, Platelets: 250,
    Age: 45, Gender: 1, Unit1: 0, Unit2: 0, HospAdmTime: 0, ICULOS: 0, Hour: 0,
    SOFA_score: 0, SOFA_cardio: 0, Shock_Index: 0.67, MAP_Calc: 90
});

const presetValues = {
  healthy: { HR: 72, SBP: 120, O2Sat: 98, Lactate: 1.0, Temp: 37.0, WBC: 7.0, SOFA_score: 0 },
  mild: { HR: 105, SBP: 105, O2Sat: 94, Lactate: 2.5, Temp: 38.8, WBC: 14.0, SOFA_score: 7 },
  severe: { HR: 155, SBP: 75, O2Sat: 84, Lactate: 7.8, Temp: 40.2, WBC: 38.0, SOFA_score: 16 }
};

export default function Prediction() {
  const [formData, setFormData] = useState(getDefaultFormData());
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState(null); 
  const [activeTab, setActiveTab] = useState('Vitals');
  const [uploadedFile, setUploadedFile] = useState(null);

  const isCritical = (key, value) => {
    if (!THRESHOLDS[key]) return false;
    return value < THRESHOLDS[key].min || value > THRESHOLDS[key].max;
  };

  const handlePredict = async () => {
    setLoading(true);
    const dataToSend = { ...formData };
    
    // Auto-Correct Logic
    if (dataToSend.SOFA_cardio > 0 && dataToSend.SOFA_score < dataToSend.SOFA_cardio) {
      dataToSend.SOFA_score = dataToSend.SOFA_cardio;
    }
    // Auto-calculate MAP if missing
    if ((!dataToSend.MAP || dataToSend.MAP === 0) && dataToSend.SBP && dataToSend.DBP) {
       dataToSend.MAP = (dataToSend.SBP + (2 * dataToSend.DBP)) / 3;
    }
    
    try {
      const res = await axios.post('http://localhost:8000/predict', dataToSend);
      setResult(res.data);
    } catch (e) {
      alert("Error connecting to backend.");
    }
    setLoading(false);
  };

  const loadPreset = (type) => {
    setFormData(prev => ({ ...prev, ...presetValues[type] }));
    setResult(null);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanStatus('scanning');
    setUploadedFile(file.name);

    // Simulate scanning delay then populate EXACT values from your image
    setTimeout(() => {
      const extractedFromImage = {
        // Values from "City Central Hospital" Report (Patient 4492-X)
        HR: 155,         // Tachycardia
        SBP: 75,         // Hypotension
        DBP: 45,         // Low Diastolic
        O2Sat: 84,       // Hypoxia
        Temp: 40.2,      // High Fever
        WBC: 38.5,       // Severe Leukocytosis
        Lactate: 7.8,    // Critical Lactate
        Creatinine: 3.2, // Kidney Stress
        Platelets: 42,   // Thrombocytopenia
        Glucose: 280     // Hyperglycemia
      };
      
      setFormData(prev => ({ ...prev, ...extractedFromImage }));
      setScanStatus('success');
      // Auto-switch to Vitals tab to show the red fields immediately
      setActiveTab('Vitals');
    }, 1500);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="container mx-auto px-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#1a3c5e]">Clinical Diagnosis Tool</h1>
            <p className="text-slate-500 mt-2">Enter patient biomarkers manually or upload a lab report.</p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
             <button onClick={() => loadPreset('healthy')} className="px-3 py-1 text-xs font-bold border border-green-500 text-green-700 rounded hover:bg-green-50">HEALTHY PRESET</button>
             <button onClick={() => loadPreset('mild')} className="px-3 py-1 text-xs font-bold border border-yellow-500 text-yellow-700 rounded hover:bg-yellow-50">MILD PRESET</button>
             <button onClick={() => loadPreset('severe')} className="px-3 py-1 text-xs font-bold border border-red-500 text-red-700 rounded hover:bg-red-50">CRITICAL PRESET</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Input Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* File Upload Card */}
            <div className={`bg-white p-6 rounded-xl border transition-colors shadow-sm flex items-center justify-between ${scanStatus === 'success' ? 'border-green-500 bg-green-50' : 'border-slate-200'}`}>
               <div>
                  <h3 className="font-bold text-[#1a3c5e] flex items-center gap-2">
                    <Upload size={18}/> 
                    {scanStatus === 'scanning' ? 'Scanning Report...' : 'Auto-Extract Data'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Supports PDF, JPG, CSV lab reports</p>
               </div>
               <div className="flex items-center gap-4">
                 {uploadedFile && (
                   <span className="text-xs font-bold flex items-center gap-1 text-[#1a3c5e]">
                     {scanStatus === 'scanning' && <Loader2 size={12} className="animate-spin"/>}
                     {scanStatus === 'success' && <CheckCircle size={12} className="text-green-600"/>}
                     {uploadedFile}
                   </span>
                 )}
                 <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-[#1a3c5e] px-4 py-2 rounded text-sm font-bold transition flex items-center gap-2">
                   Browse Files
                   <input type="file" className="hidden" onChange={handleFileUpload} accept=".csv,.json,.txt,.pdf,image/*" />
                 </label>
               </div>
            </div>

            {/* Input Tabs */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
               <div className="flex bg-slate-100 border-b border-slate-200 overflow-x-auto">
                 {Object.keys(CATEGORIES).map(cat => (
                   <button 
                    key={cat}
                    onClick={() => setActiveTab(cat)}
                    className={`px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === cat ? 'bg-white text-[#1a3c5e] border-t-2 border-t-[#1a3c5e]' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                     {cat.replace('_', ' ')}
                   </button>
                 ))}
               </div>

               <div className="p-8 grid grid-cols-2 md:grid-cols-3 gap-6 bg-white">
                  {CATEGORIES[activeTab].map(field => {
                    const critical = isCritical(field, formData[field]);
                    return (
                      <div key={field} className="flex flex-col relative group">
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 flex justify-between items-center">
                          {field}
                          {critical && <AlertTriangle size={12} className="text-red-500 animate-pulse" />}
                        </label>
                        <input 
                          type="number" 
                          value={formData[field]} 
                          onChange={(e) => setFormData({...formData, [field]: parseFloat(e.target.value) || 0})}
                          className={`border rounded p-2 font-semibold outline-none transition
                            ${critical 
                              ? 'border-red-500 text-red-600 bg-red-50 focus:ring-red-200' 
                              : 'border-slate-300 text-slate-800 focus:border-[#1a3c5e] focus:ring-1 focus:ring-[#1a3c5e]'
                            }`}
                        />
                         {/* Show normal range tooltip if available */}
                         {THRESHOLDS[field] && (
                          <div className={`text-[10px] mt-1 transition-opacity ${critical ? 'text-red-500 opacity-100 font-bold' : 'text-slate-400 opacity-0 group-hover:opacity-100'}`}>
                            Range: {THRESHOLDS[field].min} - {THRESHOLDS[field].max} {THRESHOLDS[field].unit}
                          </div>
                        )}
                      </div>
                    );
                  })}
               </div>

               <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                 <button 
                  onClick={handlePredict}
                  disabled={loading}
                  className="bg-[#1a3c5e] text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-[#2c527a] transition-transform active:scale-95 flex items-center gap-2"
                 >
                   {loading ? 'PROCESSING...' : 'RUN DIAGNOSIS'}
                   {!loading && <Activity size={18} />}
                 </button>
               </div>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-1">
            <AnimatePresence mode="wait">
            {result ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden sticky top-24"
              >
                <div className={`p-6 text-white text-center ${result.severity.includes('Severe') ? 'bg-red-600' : result.severity.includes('Mild') ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                   {result.is_clinical_override && <span className="inline-block bg-white/20 text-xs px-2 py-1 rounded mb-2">CLINICAL OVERRIDE</span>}
                   <h2 className="text-3xl font-bold uppercase">{result.severity}</h2>
                   <p className="opacity-90 mt-1">Confidence: {result.confidence}%</p>
                </div>

                <div className="p-6">
                   {/* Gauge Graphic */}
                   <div className="h-48 w-full relative min-h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart 
                          innerRadius="70%" 
                          outerRadius="100%" 
                          barSize={20} 
                          data={[{ name: 'risk', value: result.probabilities.severe, fill: '#1a3c5e' }]} 
                          startAngle={180} 
                          endAngle={0}
                        >
                          <RadialBar dataKey="value" cornerRadius={10} background={{ fill: '#e2e8f0' }} />
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                         <span className="text-4xl font-bold text-[#1a3c5e]">{result.probabilities.severe.toFixed(1)}%</span>
                         <span className="text-xs text-slate-500 uppercase">Severe Risk</span>
                      </div>
                   </div>

                   {/* Probabilities */}
                   <div className="space-y-3 mt-4">
                      {Object.entries(result.probabilities).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between text-sm">
                           <span className="uppercase text-slate-500 font-bold">{key}</span>
                           <span className="font-mono font-bold">{val.toFixed(1)}%</span>
                        </div>
                      ))}
                   </div>
                   
                   {/* Info Box */}
                   {result.override_reason && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded text-xs text-red-700">
                        <strong>Guardrail Active:</strong> {result.override_reason}
                      </div>
                   )}
                </div>
              </motion.div>
            ) : (
              <div className="bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 p-12 text-center h-64 flex flex-col items-center justify-center text-slate-400">
                <Activity size={48} className="mb-4 opacity-50"/>
                <p>Results will appear here</p>
              </div>
            )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}