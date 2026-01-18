import React, { useState } from 'react';
import axios from 'axios';
import { 
  AlertTriangle, Activity, Heart, Thermometer, Droplet, 
  TrendingUp, Loader2, CheckCircle, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RadialBarChart, RadialBar, ResponsiveContainer, Cell } from 'recharts';

export default function SepsisWarning() {
  const [formData, setFormData] = useState({
    HR: 80,
    Temp: 37.0,
    SBP: 120,
    Lactate: 1.0,
    Baseline_Lactate: 1.0,
    Creatinine: 1.0
  });
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/predict', formData);
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
    const presets = {
      low: {
        // Low Risk: All values in healthy range (< 0.30 score)
        HR: 75,
        Temp: 37.0,
        SBP: 120,
        Lactate: 1.0,
        Baseline_Lactate: 1.0,
        Creatinine: 1.0
      },
      mid: {
        // Mid Risk: Some elevated values (0.30-0.50 score)
        HR: 110,  // Elevated HR
        Temp: 38.2,  // Mild fever
        SBP: 100,  // Slightly low BP
        Lactate: 2.5,  // Elevated lactate (danger zone > 2.2)
        Baseline_Lactate: 1.8,  // Rising trend
        Creatinine: 1.4  // Elevated creatinine (danger zone > 1.3)
      },
      severe: {
        // Severe Risk: Multiple danger zone values (> 0.50 score)
        HR: 130,  // Very high HR
        Temp: 39.5,  // High fever
        SBP: 85,  // Low BP
        Lactate: 4.5,  // Very high lactate
        Baseline_Lactate: 2.0,  // Strong rising trend
        Creatinine: 2.0  // Very high creatinine
      },
      test: {
        // Case B: Healthy (Anxiety) test case
        HR: 100,  // High heart rate (anxiety)
        Temp: 37.0,
        SBP: 120,
        Lactate: 1.0,  // Low lactate
        Baseline_Lactate: 1.1,  // Baseline slightly higher
        Creatinine: 0.8  // Normal creatinine
      }
    };
    
    setFormData(presets[type]);
    setResult(null);
  };

  const getRiskColor = (score) => {
    if (score < 0.30) return '#10b981'; // Green
    if (score < 0.50) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  const getRiskLabel = (score) => {
    if (score < 0.30) return 'Low Risk';
    if (score < 0.50) return 'Moderate Risk';
    return 'High Risk';
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="container mx-auto px-6">
        
        {/* Header Section */}
        <div className="mb-10 border-b border-slate-200 pb-6">
          <h1 className="text-3xl font-serif font-bold text-[#1a3c5e] mb-2">
            Sepsis Early Warning System
          </h1>
          <p className="text-slate-500">
            Enter patient vitals and lab values to receive real-time sepsis risk assessment.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Input Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Instructions Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-[#1a3c5e] mb-3 flex items-center gap-2">
                <AlertCircle size={18} />
                How to Use the Sepsis Early Warning Feature
              </h3>
              <ol className="space-y-2 text-sm text-slate-600 list-decimal list-inside">
                <li><strong>Enter Vitals:</strong> Input the patient's current Heart Rate, Temperature, and Blood Pressure.</li>
                <li><strong>Input Lab Values:</strong> Enter the latest Lactate and Creatinine results from the lab report.</li>
                <li><strong>Check Trend:</strong> Ensure the "Baseline Lactate" (from admission) is entered to calculate the <strong>Trend</strong>.</li>
                <li><strong>Review AI Score:</strong> Look at the Integrated Risk Score. Any score above <strong>0.30</strong> requires immediate clinical validation.</li>
                <li><strong>Clinical Action:</strong> If the alert is Red, perform a bedside assessment and consider blood cultures/antibiotics immediately.</li>
              </ol>
            </div>

            {/* Input Form */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
              
              {/* Vitals Section */}
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-bold text-[#1a3c5e] mb-4 flex items-center gap-2">
                  <Activity size={20} />
                  Patient Vitals
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                      <Heart size={14} />
                      Heart Rate (bpm)
                    </label>
                    <input 
                      type="number" 
                      value={formData.HR} 
                      onChange={(e) => setFormData({...formData, HR: parseFloat(e.target.value) || 0})}
                      className="border border-slate-300 rounded p-3 font-semibold outline-none focus:border-[#1a3c5e] focus:ring-1 focus:ring-[#1a3c5e]"
                      placeholder="80"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                      <Thermometer size={14} />
                      Temperature (°C)
                    </label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={formData.Temp} 
                      onChange={(e) => setFormData({...formData, Temp: parseFloat(e.target.value) || 0})}
                      className="border border-slate-300 rounded p-3 font-semibold outline-none focus:border-[#1a3c5e] focus:ring-1 focus:ring-[#1a3c5e]"
                      placeholder="37.0"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2">
                      Systolic BP (mmHg)
                    </label>
                    <input 
                      type="number" 
                      value={formData.SBP} 
                      onChange={(e) => setFormData({...formData, SBP: parseFloat(e.target.value) || 0})}
                      className="border border-slate-300 rounded p-3 font-semibold outline-none focus:border-[#1a3c5e] focus:ring-1 focus:ring-[#1a3c5e]"
                      placeholder="120"
                    />
                  </div>
                </div>
              </div>

              {/* Lab Values Section */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-[#1a3c5e] mb-4 flex items-center gap-2">
                  <Droplet size={20} />
                  Clinical Lab Values
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2">
                      Current Lactate (mmol/L)
                    </label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={formData.Lactate} 
                      onChange={(e) => setFormData({...formData, Lactate: parseFloat(e.target.value) || 0})}
                      className="border border-slate-300 rounded p-3 font-semibold outline-none focus:border-[#1a3c5e] focus:ring-1 focus:ring-[#1a3c5e]"
                      placeholder="1.0"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                      <TrendingUp size={14} />
                      Baseline Lactate (mmol/L)
                    </label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={formData.Baseline_Lactate} 
                      onChange={(e) => setFormData({...formData, Baseline_Lactate: parseFloat(e.target.value) || 0})}
                      className="border border-slate-300 rounded p-3 font-semibold outline-none focus:border-[#1a3c5e] focus:ring-1 focus:ring-[#1a3c5e]"
                      placeholder="1.0"
                    />
                    <p className="text-xs text-slate-500 mt-1">First reading of the day</p>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2">
                      Creatinine Max (mg/dL)
                    </label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={formData.Creatinine} 
                      onChange={(e) => setFormData({...formData, Creatinine: parseFloat(e.target.value) || 0})}
                      className="border border-slate-300 rounded p-3 font-semibold outline-none focus:border-[#1a3c5e] focus:ring-1 focus:ring-[#1a3c5e]"
                      placeholder="1.0"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-slate-50 border-t border-slate-200">
                <div className="flex flex-wrap gap-2 mb-4">
                  <button 
                    onClick={() => loadPreset('low')}
                    className="px-4 py-2 text-sm font-bold border border-green-500 text-green-700 rounded hover:bg-green-50 transition"
                  >
                    LOAD LOW RISK PRESET
                  </button>
                  <button 
                    onClick={() => loadPreset('mid')}
                    className="px-4 py-2 text-sm font-bold border border-yellow-500 text-yellow-700 rounded hover:bg-yellow-50 transition"
                  >
                    LOAD MID RISK PRESET
                  </button>
                  <button 
                    onClick={() => loadPreset('severe')}
                    className="px-4 py-2 text-sm font-bold border border-red-500 text-red-700 rounded hover:bg-red-50 transition"
                  >
                    LOAD SEVERE RISK PRESET
                  </button>
                  <button 
                    onClick={() => loadPreset('test')}
                    className="px-4 py-2 text-sm font-bold border border-blue-500 text-blue-700 rounded hover:bg-blue-50 transition"
                  >
                    LOAD TEST CASE
                  </button>
                </div>
                <div className="flex justify-end">
                  <button 
                    onClick={handlePredict}
                    disabled={loading}
                    className="bg-[#1a3c5e] text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-[#2c527a] transition-transform active:scale-95 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        PROCESSING...
                      </>
                    ) : (
                      <>
                        CALCULATE RISK SCORE
                        <Activity size={18} />
                      </>
                    )}
                  </button>
                </div>
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
                className="space-y-6"
              >
                {/* Status Banner */}
                <div className={`rounded-xl border-2 overflow-hidden shadow-xl ${
                  result.is_alert 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-green-500 bg-green-50'
                }`}>
                  <div className={`p-6 text-center ${
                    result.is_alert ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                  }`}>
                    {result.is_alert && (
                      <AlertTriangle size={32} className="mx-auto mb-2 animate-pulse" />
                    )}
                    {!result.is_alert && (
                      <CheckCircle size={32} className="mx-auto mb-2" />
                    )}
                    <h2 className={`text-2xl font-bold uppercase mb-2 ${
                      result.is_alert ? 'animate-pulse' : ''
                    }`}>
                      {result.status}
                    </h2>
                    <p className="text-sm opacity-90">
                      Risk Score: {result.risk_percentage}%
                    </p>
                  </div>
                </div>

                {/* Risk Dial */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-xl p-6">
                  <h3 className="text-lg font-bold text-[#1a3c5e] mb-4 text-center">
                    Integrated Risk Score
                  </h3>
                  <div className="h-64 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart 
                        innerRadius="60%" 
                        outerRadius="100%" 
                        barSize={30} 
                        data={[{ name: 'risk', value: result.risk_percentage, fill: getRiskColor(result.risk_score) }]} 
                        startAngle={180} 
                        endAngle={0}
                      >
                        <RadialBar 
                          dataKey="value" 
                          cornerRadius={10} 
                          background={{ fill: '#e2e8f0' }} 
                          minAngle={0}
                          fill={getRiskColor(result.risk_score)}
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pt-6">
                      <span className="text-5xl font-bold" style={{ color: getRiskColor(result.risk_score) }}>
                        {result.risk_percentage}%
                      </span>
                      <span className="text-sm text-slate-500 uppercase mt-1">
                        {getRiskLabel(result.risk_score)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Feature Breakdown */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-xl p-6">
                  <h3 className="text-lg font-bold text-[#1a3c5e] mb-4">
                    Feature Breakdown
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                      <span className="text-sm font-semibold text-slate-700">Vitals Probability</span>
                      <span className="font-mono font-bold text-[#1a3c5e]">
                        {(result.feature_breakdown.vitals_prob * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                      <span className="text-sm font-semibold text-slate-700">Lactate Max</span>
                      <span className="font-mono font-bold text-[#1a3c5e]">
                        {result.feature_breakdown.lactate_max} mmol/L
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                      <span className="text-sm font-semibold text-slate-700">Lactate Trend</span>
                      <span className={`font-mono font-bold ${
                        result.feature_breakdown.lactate_trend > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {result.feature_breakdown.lactate_trend > 0 ? '+' : ''}
                        {result.feature_breakdown.lactate_trend} mmol/L
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                      <span className="text-sm font-semibold text-slate-700">Creatinine Max</span>
                      <span className="font-mono font-bold text-[#1a3c5e]">
                        {result.feature_breakdown.creatinine_max} mg/dL
                      </span>
                    </div>
                  </div>
                  
                  {result.primary_alert_factor && result.is_alert && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-xs text-red-700">
                        <strong>Alert Triggered By:</strong> {result.primary_alert_factor}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 p-12 text-center h-96 flex flex-col items-center justify-center text-slate-400">
                <Activity size={48} className="mb-4 opacity-50"/>
                <p className="font-semibold">Risk Assessment</p>
                <p className="text-sm mt-2">Results will appear here</p>
              </div>
            )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}
