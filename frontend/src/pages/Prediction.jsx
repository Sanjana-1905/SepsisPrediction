import React, { useState } from 'react';
import axios from 'axios';
import Tesseract from 'tesseract.js';
import { 
  Upload, Activity, AlertTriangle, FileText, CheckCircle, Loader2, Eye, Pill, Stethoscope
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

const THRESHOLDS = {
  HR: { min: 60, max: 100, unit: 'bpm' },
  O2Sat: { min: 95, max: 100, unit: '%' },
  Temp: { min: 36.1, max: 37.2, unit: '°C' },
  SBP: { min: 90, max: 140, unit: 'mmHg' },
  MAP: { min: 70, max: 105, unit: 'mmHg' },
  DBP: { min: 60, max: 90, unit: 'mmHg' },
  Resp: { min: 12, max: 20, unit: '/min' },
  Lactate: { min: 0.5, max: 2.0, unit: 'mmol/L' },
  Glucose: { min: 70, max: 100, unit: 'mg/dL' },
  WBC: { min: 4.5, max: 11.0, unit: 'K/μL' },
  Creatinine: { min: 0.6, max: 1.2, unit: 'mg/dL' },
  Platelets: { min: 150, max: 450, unit: 'K/μL' },
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
  healthy: { 
    HR: 72, SBP: 120, DBP: 80, MAP: 90, O2Sat: 98, Temp: 37.0, Resp: 18,
    EtCO2: 35, BaseExcess: 0, HCO3: 24, FiO2: 21, pH: 7.4, PaCO2: 40, SaO2: 98,
    AST: 25, BUN: 15, Alkalinephos: 80, Calcium: 9.5, Chloride: 100, Creatinine: 1.0,
    Bilirubin_direct: 0.2, Glucose: 100,
    Lactate: 1.0, Magnesium: 2.0, Phosphate: 3.5, Potassium: 4.0, Bilirubin_total: 0.8,
    TroponinI: 0.01, Hct: 42, Hgb: 14, PTT: 30, WBC: 7.0, Fibrinogen: 300, Platelets: 250,
    SOFA_score: 0 
  },
  mild: { 
    HR: 105, SBP: 105, DBP: 70, MAP: 82, O2Sat: 94, Temp: 38.8, Resp: 22,
    EtCO2: 32, BaseExcess: -3, HCO3: 21, FiO2: 28, pH: 7.35, PaCO2: 38, SaO2: 94,
    AST: 45, BUN: 25, Alkalinephos: 120, Calcium: 8.8, Chloride: 98, Creatinine: 1.5,
    Bilirubin_direct: 0.5, Glucose: 140,
    Lactate: 2.5, Magnesium: 1.8, Phosphate: 3.0, Potassium: 4.5, Bilirubin_total: 1.5,
    TroponinI: 0.15, Hct: 38, Hgb: 12, PTT: 35, WBC: 14.0, Fibrinogen: 400, Platelets: 180,
    SOFA_score: 7 
  },
  severe: { 
    HR: 155, SBP: 75, DBP: 50, MAP: 58, O2Sat: 84, Temp: 40.2, Resp: 28,
    EtCO2: 28, BaseExcess: -8, HCO3: 18, FiO2: 50, pH: 7.25, PaCO2: 32, SaO2: 84,
    AST: 120, BUN: 55, Alkalinephos: 200, Calcium: 7.5, Chloride: 95, Creatinine: 2.8,
    Bilirubin_direct: 2.5, Glucose: 180,
    Lactate: 7.8, Magnesium: 1.5, Phosphate: 2.2, Potassium: 5.2, Bilirubin_total: 4.5,
    TroponinI: 1.2, Hct: 28, Hgb: 9, PTT: 50, WBC: 38.0, Fibrinogen: 600, Platelets: 80,
    SOFA_score: 16 
  }
};

// Clinical Decision Support Function
const getClinicalSuggestions = (riskScore, lactateVal, suspectedSource = "Unknown") => {
  const suggestions = [];
  
  // 1. General Sepsis Bundle (Always triggered if risk >= 0.30)
  if (riskScore >= 0.30) {
    suggestions.push("🔹 Order Blood Cultures (before antibiotics).");
    suggestions.push("🔹 Measure/Repeat Lactate level.");
  }
  
  // 2. Specific Action based on Lactate Rise
  if (lactateVal >= 2.0) {
    suggestions.push("🔹 Initiate fluid resuscitation: 30mL/kg crystalloid.");
  }
  
  // 3. Antibiotic Logic based on Clinician Input
  const antibioticMap = {
    "Lungs (Pneumonia)": "Ceftriaxone + Azithromycin",
    "Urinary (UTI)": "Ciprofloxacin or Ceftriaxone",
    "Abdominal": "Piperacillin/Tazobactam (Zosyn)",
    "Skin/Soft Tissue": "Vancomycin",
    "Unknown": "Vancomycin + Zosyn (Broad Spectrum Coverage)"
  };
  
  const rx = antibioticMap[suspectedSource] || "Consult ID Specialist";
  suggestions.push(`💊 Suggested Antibiotics: ${rx}`);
  
  return suggestions;
};

export default function Prediction() {
  const [formData, setFormData] = useState(getDefaultFormData());
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState('idle');
  const [activeTab, setActiveTab] = useState('Vitals');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [debugText, setDebugText] = useState('');
  const [suspectedSource, setSuspectedSource] = useState('Unknown');

  const getPrimaryProbKey = (res) => {
    const pred = Number(res?.prediction);
    if (pred === 0) return 'healthy';
    if (pred === 1) return 'mild';
    if (pred === 2) return 'severe';

    const sev = String(res?.severity || '').toLowerCase();
    if (sev.includes('mild')) return 'mild';
    if (sev.includes('severe') || sev.includes('critical')) return 'severe';
    return 'healthy';
  };

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
    if ((!dataToSend.MAP || dataToSend.MAP === 0) && dataToSend.SBP && dataToSend.DBP) {
       dataToSend.MAP = (dataToSend.SBP + (2 * dataToSend.DBP)) / 3;
    }
    
    try {
      const res = await axios.post('http://localhost:8000/severity', dataToSend);
      setResult(res.data);
    } catch (e) {
      const status = e?.response?.status;
      const detail = e?.response?.data?.detail;
      const data = e?.response?.data;
      const url = e?.config?.url;
      alert(
        `Backend request failed.\nURL: ${url || 'unknown'}\nStatus: ${status || 'no response'}\nDetail: ${detail || ''}\nResponse: ${data ? JSON.stringify(data) : ''}`
      );
    }
    setLoading(false);
  };

  const loadPreset = (type) => {
    setFormData(prev => ({ ...prev, ...presetValues[type] }));
    setResult(null);
  };

  // --- UPDATED PARSER: FLATTENED TEXT SCAN ---
  // This ignores newlines and table structures, simply finding "KEYWORD" then grabbing the NEXT NUMBER.
  const parseExtractedText = (text) => {
    const extracted = {};
    
    // 1. Flatten text: Replace newlines with spaces, lowercase everything
    const cleanText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').toLowerCase();
    
    console.log("Flattened Text:", cleanText);

    // Exact keywords from your "City Central Hospital" report
    const mapping = {
      'heart rate': 'HR',
      'systolic bp': 'SBP',
      'diastolic bp': 'DBP',
      'oxygen saturation': 'O2Sat',
      'body temperature': 'Temp',
      'wbc count': 'WBC',
      'serum lactate': 'Lactate',
      'creatinine': 'Creatinine',
      'platelet count': 'Platelets',
      'blood glucose': 'Glucose'
    };

    Object.keys(mapping).forEach(searchPhrase => {
      // Find where the phrase starts
      const index = cleanText.indexOf(searchPhrase);
      
      if (index !== -1) {
        // Create a search window starting immediately after the phrase
        // We look at the next 50 characters to find the value
        const startSearch = index + searchPhrase.length;
        const windowText = cleanText.substring(startSearch, startSearch + 50);
        
        // Regex: Find the first integer or decimal number
        // e.g. "105 bpm" -> matches "105"
        // e.g. "14.2 $10^9" -> matches "14.2"
        const match = windowText.match(/(\d+(\.\d+)?)/);
        
        if (match) {
          const val = parseFloat(match[0]);
          if (!isNaN(val)) {
             const appKey = mapping[searchPhrase];
             extracted[appKey] = val;
             console.log(`Found ${appKey}: ${val}`);
          }
        }
      }
    });

    return extracted;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanStatus('scanning');
    setUploadedFile(file.name);
    setDebugText('Initializing Tesseract...');

    try {
      let extractedData = {};

      if (file.type.startsWith('image/')) {
        const worker = await Tesseract.createWorker('eng');
        // PSM 3 = Auto page segmentation (Robust for tables/spreadsheets)
        await worker.setParameters({
          tessedit_pageseg_mode: Tesseract.PSM.AUTO, 
        });
        
        const { data: { text } } = await worker.recognize(file);
        await worker.terminate();
        
        setDebugText(text); // Show raw text
        extractedData = parseExtractedText(text);
      } 
      else if (file.type === 'text/csv' || file.type === 'text/plain') {
        const text = await file.text();
        setDebugText(text);
        extractedData = parseExtractedText(text);
      }

      if (Object.keys(extractedData).length > 0) {
        setFormData(prev => ({ ...prev, ...extractedData }));
        setScanStatus('success');
        
        // Auto-switch tabs based on critical findings
        if (extractedData.Lactate || extractedData.WBC) setActiveTab('Labs_Markers');
        if (extractedData.HR || extractedData.SBP) setActiveTab('Vitals');
      } else {
        setScanStatus('error');
        alert("Text read, but no matching parameters found. Ensure image is clear.");
      }

    } catch (err) {
      console.error(err);
      setScanStatus('error');
      setDebugText("Error: " + err.message);
    }
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
             <button onClick={() => loadPreset('healthy')} className="px-3 py-1 text-xs font-bold border border-green-500 text-green-700 rounded hover:bg-green-50">LOW RISK PRESET</button>
             <button onClick={() => loadPreset('mild')} className="px-3 py-1 text-xs font-bold border border-yellow-500 text-yellow-700 rounded hover:bg-yellow-50">MILD PRESET</button>
             <button onClick={() => loadPreset('severe')} className="px-3 py-1 text-xs font-bold border border-red-500 text-red-700 rounded hover:bg-red-50">CRITICAL PRESET</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Input Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* File Upload Card */}
            <div className={`bg-white p-6 rounded-xl border transition-colors shadow-sm flex flex-col gap-4 ${scanStatus === 'success' ? 'border-green-500 bg-green-50' : 'border-slate-200'}`}>
               <div className="flex items-center justify-between">
                 <div>
                    <h3 className="font-bold text-[#1a3c5e] flex items-center gap-2">
                      <Upload size={18}/> 
                      {scanStatus === 'scanning' ? 'Analysing Report...' : 'Auto-Extract Data'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Supports Images (OCR) & Text Files</p>
                 </div>
                 <div className="flex items-center gap-4">
                   {uploadedFile && (
                     <span className="text-xs font-bold flex items-center gap-1 text-[#1a3c5e]">
                       {scanStatus === 'scanning' && <Loader2 size={12} className="animate-spin"/>}
                       {scanStatus === 'success' && <CheckCircle size={12} className="text-green-600"/>}
                       {uploadedFile}
                     </span>
                   )}
                   <label className={`cursor-pointer px-4 py-2 rounded text-sm font-bold transition flex items-center gap-2 ${scanStatus === 'scanning' ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-100 hover:bg-slate-200 text-[#1a3c5e]'}`}>
                     {scanStatus === 'scanning' ? 'Processing...' : 'Browse Files'}
                     <input 
                      type="file" 
                      className="hidden" 
                      onChange={handleFileUpload} 
                      accept=".csv,.txt,image/*" 
                      disabled={scanStatus === 'scanning'}
                     />
                   </label>
                 </div>
               </div>

               {/* Raw Text Preview for Debugging */}
               {debugText && (
                 <div className="mt-2 p-3 bg-slate-100 rounded border border-slate-300 shadow-inner max-h-32 overflow-y-auto">
                   <p className="text-[10px] font-bold text-slate-500 mb-2 flex items-center gap-1 sticky top-0 bg-slate-100">
                     <Eye size={10}/> RAW OCR TEXT (DEBUG)
                   </p>
                   <pre className="text-[10px] text-slate-600 font-mono whitespace-pre-wrap">{debugText}</pre>
                 </div>
               )}
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
                   {(() => {
                     const primaryKey = getPrimaryProbKey(result);
                     const primaryValue = Number(result?.probabilities?.[primaryKey] ?? 0);
                     const primaryLabel = primaryKey === 'healthy' ? 'Healthy' : primaryKey === 'mild' ? 'Mild' : 'Severe';
                     const primaryFill = primaryKey === 'healthy' ? '#059669' : primaryKey === 'mild' ? '#f59e0b' : '#dc2626';
                     // Calculate endAngle based on percentage: 180 (start) to 0 (end), so 50% = 90 degrees
                     const endAngle = 180 - (primaryValue / 100) * 180;

                     return (
                   <div className="h-48 w-full relative min-h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart 
                          innerRadius="70%" 
                          outerRadius="100%" 
                          barSize={20} 
                          data={[{ name: 'prob', value: primaryValue, fill: primaryFill }]} 
                          startAngle={180} 
                          endAngle={endAngle}
                        >
                          <RadialBar 
                            dataKey="value" 
                            cornerRadius={10} 
                            background={{ fill: '#e2e8f0' }}
                            minAngle={0}
                          />
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                         <span className="text-4xl font-bold text-[#1a3c5e]">{primaryValue.toFixed(1)}%</span>
                         <span className="text-xs text-slate-500 uppercase">{primaryLabel} %</span>
                      </div>
                   </div>
                     );
                   })()}

                   <div className="space-y-3 mt-4">
                      {[
                        ['healthy', result.probabilities.healthy],
                        ['mild', result.probabilities.mild],
                        ['severe', result.probabilities.severe],
                      ].map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between text-sm">
                           <span className="uppercase text-slate-500 font-bold">{key}</span>
                           <span className="font-mono font-bold">{Number(val).toFixed(1)}%</span>
                        </div>
                      ))}
                   </div>
                   
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

        {/* Clinical Decision Support System */}
        {result && (result.severity.includes('Mild') || result.severity.includes('Severe') || result.severity.includes('Critical')) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 bg-white rounded-xl border-2 border-amber-200 shadow-xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Stethoscope size={24} />
                <h2 className="text-2xl font-bold">Clinical Decision Support</h2>
              </div>
              <p className="text-amber-50 text-sm">
                Treatment protocol checklist based on Surviving Sepsis Campaign guidelines
              </p>
            </div>

            <div className="p-6">
              {/* Source Selection */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Suspected Source of Infection?
                </label>
                <select
                  value={suspectedSource}
                  onChange={(e) => setSuspectedSource(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-3 font-semibold text-[#1a3c5e] focus:border-[#1a3c5e] focus:ring-2 focus:ring-[#1a3c5e] outline-none"
                >
                  <option value="Unknown">Unknown</option>
                  <option value="Lungs (Pneumonia)">Lungs (Pneumonia)</option>
                  <option value="Urinary (UTI)">Urinary (UTI)</option>
                  <option value="Abdominal">Abdominal</option>
                  <option value="Skin/Soft Tissue">Skin/Soft Tissue</option>
                </select>
              </div>

              {/* Treatment Suggestions */}
              <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                <h3 className="text-lg font-bold text-[#1a3c5e] mb-4 flex items-center gap-2">
                  <Pill size={20} />
                  Protocol Checklist
                </h3>
                <ul className="space-y-3">
                  {getClinicalSuggestions(
                    result.probabilities.severe / 100, // Convert to risk score
                    formData.Lactate || 0,
                    suspectedSource
                  ).map((suggestion, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-3 bg-white rounded border border-slate-200">
                      <span className="text-lg">{suggestion.split(' ')[0]}</span>
                      <span className="text-sm text-slate-700 flex-1">{suggestion.substring(suggestion.indexOf(' ') + 1)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Disclaimer */}
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  <strong>⚠️ Important:</strong> AI suggestions are for guidance only. Confirm with hospital formulary, check patient allergies, and consult with infectious disease specialist when appropriate. This system follows Surviving Sepsis Campaign guidelines but should not replace clinical judgment.
                </p>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}