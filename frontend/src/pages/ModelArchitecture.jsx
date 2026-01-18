import React, { useState } from 'react';
import { motion } from 'framer-motion'; // Import Framer Motion
import { 
  Database, Scale, Brain, ShieldCheck, 
  Layers, ArrowRight, BarChart3, Activity, 
  ZoomIn, X, Server, CheckCircle, Clock, AlertTriangle
} from 'lucide-react';

// Images - Severity Diagnosis
import matrixImg from '../assets/analytics/matrix.jpeg';
import featuresImg from '../assets/analytics/features.jpeg';
import separationImg from '../assets/analytics/separation.jpeg';

// Images - Early Detection  
import rocImg from '../assets/analytics/roc.jpeg';
import correlationImg from '../assets/analytics/correlation.jpeg';
import performanceImg from '../assets/analytics/performance.jpeg';

// Animation Variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function ModelArchitecture() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeTab, setActiveTab] = useState('early-detection');

  return (
    <div className="bg-slate-50 min-h-screen py-16 overflow-hidden">
      <div className="container mx-auto px-6 max-w-6xl">
        
        {/* Page Header */}
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-4xl font-serif font-bold text-[#1a3c5e] mb-4"
          >
            Model Architecture Deep-Dive
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="text-lg text-slate-600"
          >
            Two specialized models: Early Detection & Severity Diagnosis
          </motion.p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1 inline-flex">
            <button
              onClick={() => setActiveTab('early-detection')}
              className={`px-8 py-3 rounded-lg font-bold transition-all ${
                activeTab === 'early-detection'
                  ? 'bg-[#1a3c5e] text-white shadow-md'
                  : 'text-slate-600 hover:text-[#1a3c5e]'
              }`}
            >
              Early Detection Model
            </button>
            <button
              onClick={() => setActiveTab('severity')}
              className={`px-8 py-3 rounded-lg font-bold transition-all ${
                activeTab === 'severity'
                  ? 'bg-[#1a3c5e] text-white shadow-md'
                  : 'text-slate-600 hover:text-[#1a3c5e]'
              }`}
            >
              Severity Diagnosis Model
            </button>
          </div>
        </div>

        {/* Early Detection Tab Content */}
        {activeTab === 'early-detection' && (
          <EarlyDetectionArchitecture 
            selectedImage={selectedImage} 
            setSelectedImage={setSelectedImage} 
            fadeInUp={fadeInUp} 
            staggerContainer={staggerContainer} 
            ImageCard={ImageCard}
            rocImg={rocImg}
            correlationImg={correlationImg}
            performanceImg={performanceImg}
          />
        )}

        {/* Severity Diagnosis Tab Content */}
        {activeTab === 'severity' && (
          <SeverityArchitecture 
            selectedImage={selectedImage} 
            setSelectedImage={setSelectedImage} 
            fadeInUp={fadeInUp} 
            staggerContainer={staggerContainer} 
            ImageCard={ImageCard} 
            matrixImg={matrixImg} 
            separationImg={separationImg} 
            featuresImg={featuresImg}
          />
        )}

        {/* FULL SCREEN IMAGE MODAL */}
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button 
              className="absolute top-6 right-6 text-white hover:text-slate-300 transition-colors p-2 bg-black/50 rounded-full"
              onClick={() => setSelectedImage(null)}
            >
              <X size={32} />
            </button>
            <motion.img 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              src={selectedImage} 
              alt="Full Screen Analysis" 
              className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()} 
            />
          </motion.div>
        )}

      </div>
    </div>
  );
}

// Early Detection Architecture Component
function EarlyDetectionArchitecture({ selectedImage, setSelectedImage, fadeInUp, staggerContainer, ImageCard, rocImg, correlationImg, performanceImg}) {
  return (
    <>
      {/* Section 1: Golden Window Logic */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-6 opacity-5"><Clock size={120} /></div>
        <h2 className="text-2xl font-bold text-[#1a3c5e] mb-6 flex items-center gap-3 relative z-10">
          <Clock className="text-[#1a3c5e]" /> 1. The "Golden Window" Logic
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div>
            <p className="text-slate-600 mb-4 leading-relaxed">
              The primary goal of this model is to maximize the <strong>Lead Time</strong>. By detecting metabolic distress early, we provide clinicians with a <strong className="text-[#1a3c5e]">6.4-hour head start</strong> to initiate the "Sepsis Bundle" (fluids and antibiotics).
            </p>
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
              <p className="text-sm text-amber-800">
                <strong>Clinical Impact:</strong> Early intervention within the golden window significantly improves patient outcomes and reduces mortality rates.
              </p>
            </div>
          </div>
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="font-bold text-[#1a3c5e] mb-2 text-sm uppercase">Lead Time Advantage</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Early Detection</span>
                <span className="font-bold text-[#1a3c5e]">6.4 hours</span>
              </div>
              <div className="h-2 bg-slate-200 rounded overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full bg-amber-500"
                ></motion.div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Time window for intervention before clinical deterioration</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Section 2: Two-Stage Ensemble Architecture */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="bg-[#1a3c5e] rounded-2xl shadow-lg p-8 mb-8 text-white relative overflow-hidden"
      >
        <div className="absolute -bottom-10 -right-10 p-8 opacity-10"><Layers size={200} /></div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 relative z-10">
          <Layers /> 2. Two-Stage Ensemble Architecture
        </h2>
        <p className="text-slate-200 mb-8 max-w-3xl relative z-10 text-lg font-light">
          Unlike the single-classifier approach for severity, the Early Diagnosis system uses a <strong>Stacked Ensemble</strong> to filter out "noisy" vitals.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <div className="bg-white/10 p-6 rounded-xl backdrop-blur-md border border-white/20">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Activity size={20} /> Stage 1: Vitals Base Model
            </h3>
            <ul className="space-y-2 text-sm text-slate-200">
              <li className="flex items-start gap-2">
                <span className="text-amber-300 mt-1">•</span>
                <span><strong>Input:</strong> Heart Rate, Temperature, Systolic Blood Pressure</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-300 mt-1">•</span>
                <span><strong>Function:</strong> Generates "Vitals Susceptibility Probability" (P_vitals)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-300 mt-1">•</span>
                <span>Determines if patient's physical appearance is consistent with early systemic inflammation</span>
              </li>
            </ul>
          </div>
          <div className="bg-white/10 p-6 rounded-xl backdrop-blur-md border border-white/20">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Brain size={20} /> Stage 2: Decision Engine
            </h3>
            <ul className="space-y-2 text-sm text-slate-200">
              <li className="flex items-start gap-2">
                <span className="text-amber-300 mt-1">•</span>
                <span><strong>Input:</strong> P_vitals + Biochemical Markers (Lactate Max, Lactate Trend, Creatinine)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-300 mt-1">•</span>
                <span><strong>Function:</strong> Combines physical signals with chemical evidence</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-300 mt-1">•</span>
                <span>Reaches final verdict on sepsis risk</span>
              </li>
            </ul>
          </div>
        </div>
      </motion.section>

      {/* Section 3: Feature Engineering */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8"
      >
        <h2 className="text-2xl font-bold text-[#1a3c5e] mb-6 flex items-center gap-3">
          <BarChart3 className="text-[#1a3c5e]" /> 3. Feature Engineering: The "Spiral" Detection
        </h2>
        <p className="text-slate-600 mb-6 leading-relaxed">
          The model does not just look at a single snapshot; it calculates the <strong>velocity of decline</strong> through specific engineered features:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="font-bold text-[#1a3c5e] mb-2">Lactate Trend (ΔLactate)</h3>
            <p className="text-sm text-slate-600 mb-3">
              Calculated as <code className="bg-white px-2 py-1 rounded text-xs">Lactate_current - Baseline_Lactate</code>
            </p>
            <p className="text-xs text-red-600 font-semibold">A positive trend is the strongest predictor of impending septic shock.</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="font-bold text-[#1a3c5e] mb-2">Lactate Max</h3>
            <p className="text-sm text-slate-600 mb-3">
              Captures the peak metabolic stress reached during the monitoring window.
            </p>
            <p className="text-xs text-amber-600 font-semibold">Critical threshold: &gt; 2.0 mmol/L</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="font-bold text-[#1a3c5e] mb-2">Integrated Risk Score</h3>
            <p className="text-sm text-slate-600 mb-3">
              A weighted sum where biochemical markers (Lactate) carry <strong>65% of the decision weight</strong>.
            </p>
            <p className="text-xs text-green-600 font-semibold">Ensures vitals-only spikes (anxiety/pain) don't trigger false alerts.</p>
          </div>
        </div>
      </motion.section>

      {/* Section 4: System Calibration */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="bg-[#1a3c5e] rounded-2xl shadow-lg p-8 mb-8 text-white"
      >
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
          <ShieldCheck /> 4. System Calibration: The 0.30 Threshold
        </h2>
        <p className="text-slate-200 mb-6 text-lg font-light">
          To ensure patient safety in an ICU setting, the model is calibrated for a <strong>Zero-Miss Safety Profile</strong>:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 p-6 rounded-xl backdrop-blur-md border border-white/20">
            <h3 className="font-bold mb-2">Decision Gate</h3>
            <p className="text-3xl font-bold text-amber-300 mb-2">0.30</p>
            <p className="text-xs text-slate-300">Mathematically optimized to capture the "tail" of the sepsis distribution</p>
          </div>
          <div className="bg-white/10 p-6 rounded-xl backdrop-blur-md border border-white/20">
            <h3 className="font-bold mb-2">Recall Priority</h3>
            <p className="text-3xl font-bold text-green-300 mb-2">100%</p>
            <p className="text-xs text-slate-300">By setting a lower threshold, we achieve 100% Recall for septic patients</p>
          </div>
          <div className="bg-white/10 p-6 rounded-xl backdrop-blur-md border border-white/20">
            <h3 className="font-bold mb-2">Safety Logic</h3>
            <p className="text-sm text-amber-300 mb-2">False Positive vs False Negative</p>
            <p className="text-xs text-slate-300">In sepsis, a "False Positive" = extra blood test; a "False Negative" = patient death. Model is biased toward action.</p>
          </div>
        </div>
      </motion.section>

      {/* Section 5: Results & Evidence */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8"
      >
        <h2 className="text-2xl font-bold text-[#1a3c5e] mb-6 flex items-center gap-3">
          <CheckCircle className="text-[#1a3c5e]" /> 5. Results & Evidence of Success
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left p-3 font-bold text-[#1a3c5e]">Metric</th>
                <th className="text-left p-3 font-bold text-[#1a3c5e]">Performance</th>
                <th className="text-left p-3 font-bold text-[#1a3c5e]">Clinical Significance</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="p-3 font-semibold">Sensitivity (Recall)</td>
                <td className="p-3"><span className="text-2xl font-bold text-green-600">100%</span></td>
                <td className="p-3 text-slate-600">Zero septic patients were missed by the system</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="p-3 font-semibold">Lead Time</td>
                <td className="p-3"><span className="text-2xl font-bold text-amber-600">6.4 Hours</span></td>
                <td className="p-3 text-slate-600">Provides a massive window for antibiotic intervention</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="p-3 font-semibold">NPV (Negative Predictive Value)</td>
                <td className="p-3"><span className="text-2xl font-bold text-green-600">100%</span></td>
                <td className="p-3 text-slate-600">If the model says "Stable," there is total certainty of no current sepsis</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">System Accuracy</td>
                <td className="p-3"><span className="text-2xl font-bold text-[#1a3c5e]">~60%</span></td>
                <td className="p-3 text-slate-600">Balanced to clear 60% of healthy patients while maintaining 100% safety</td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* Section 6: Technical Integration */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="bg-[#1a3c5e] rounded-2xl shadow-lg p-8 mb-8 text-white"
      >
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
          <Server /> 6. Technical Integration (Backend)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/10 p-6 rounded-xl backdrop-blur-md border border-white/20">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Activity size={20} /> Asynchronous Inference
            </h3>
            <p className="text-sm text-slate-200">
              The FastAPI backend runs the Early Diagnosis check every time new vitals or labs are uploaded.
            </p>
          </div>
          <div className="bg-white/10 p-6 rounded-xl backdrop-blur-md border border-white/20">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Scale size={20} /> Weighted Aggregation
            </h3>
            <p className="text-sm text-slate-200 mb-2">
              The backend performs the calculation:
            </p>
            <code className="text-xs bg-black/30 px-3 py-2 rounded block text-cyan-300">
              Risk_Score = f(P_vitals, Lactate_Max, Lactate_Trend, Creatinine_Max)
            </code>
          </div>
          <div className="bg-white/10 p-6 rounded-xl backdrop-blur-md border border-white/20 md:col-span-2">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <AlertTriangle size={20} /> Prescriptive Alerts
            </h3>
            <p className="text-sm text-slate-200">
              If the score <strong className="text-amber-300">≥ 0.30</strong>, the system generates a <strong>Sepsis Alert</strong> and suggests the standardized "Hour-1 Bundle" actions (blood cultures, lactate measurement, fluid resuscitation, and antibiotics).
            </p>
          </div>
        </div>
      </motion.section>

      {/* Section 7: Visual Validation - Early Detection Graphs */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8"
      >
        <h2 className="text-2xl font-bold text-[#1a3c5e] mb-8 flex items-center gap-3">
          <BarChart3 className="text-[#1a3c5e]" /> 7. Visual Validation & Performance Metrics
        </h2>
        <p className="text-slate-600 text-sm mb-6 flex items-center gap-2">
          <ZoomIn size={16}/> Click any chart to view full screen
        </p>
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <ImageCard 
            title="Multi-Class ROC" 
            src={rocImg} 
            desc="Performance curves indicating the trade-off between sensitivity and specificity for each class."
            onClick={() => setSelectedImage(rocImg)}
          />
          <ImageCard 
            title="Biomarker Correlation" 
            src={correlationImg} 
            desc="Heatmap revealing physiological relationships (e.g., Mean BP vs Diastolic BP) used for feature engineering."
            onClick={() => setSelectedImage(correlationImg)}
          />
          <ImageCard 
            title="Class-wise F1 Scores" 
            src={performanceImg} 
            desc="Consistent high performance across classes: Healthy (0.94), Mild (0.92), Severe (0.96)."
            onClick={() => setSelectedImage(performanceImg)}
          />
        </motion.div>
      </motion.section>
    </>
  );
}

// Severity Diagnosis Architecture Component
function SeverityArchitecture({ selectedImage, setSelectedImage, fadeInUp, staggerContainer, ImageCard, matrixImg, separationImg, featuresImg }) {
  return (
    <>
      {/* Section 1: Data Engineering */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-6 opacity-5"><Database size={120} /></div>
        <h2 className="text-2xl font-bold text-[#1a3c5e] mb-6 flex items-center gap-3 relative z-10">
          <Database className="text-[#1a3c5e]" /> 1. Data Engineering & Integrity
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div>
            <p className="text-slate-600 mb-4 leading-relaxed">
              The foundation of reliable medical AI is separating biological signal from noise. We established strict protocols to prevent "Data Leakage" and ensure the model learns physiology, not artifacts.
            </p>
            <ul className="space-y-3 mt-4 text-sm text-slate-700">
              <li className="flex gap-3">
                <div className="mt-1.5 min-w-[6px] h-1.5 rounded-full bg-red-500"></div>
                <span><strong>Removed Temporal Bias:</strong> Timesteps and Sequential IDs were stripped.</span>
              </li>
              <li className="flex gap-3">
                <div className="mt-1.5 min-w-[6px] h-1.5 rounded-full bg-red-500"></div>
                <span><strong>Noise Reduction:</strong> Static demographics like Age/Gender removed.</span>
              </li>
            </ul>
          </div>
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="font-bold text-[#1a3c5e] mb-2 text-sm uppercase">Standardization Strategy</h3>
            <p className="text-sm text-slate-600 mb-4">
              Global Z-Score normalization was applied <strong>before</strong> interaction to prevent high-range values (Platelets) from dominating low-range critical values (Lactate).
            </p>
            <div className="flex items-center gap-2 text-xs font-mono bg-white p-2 rounded border border-slate-200 text-slate-500">
              <span className="text-green-600">Normalization</span>
              <ArrowRight size={12}/>
              <span>Equal Playing Field</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Section 2: Clinical Bridge */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="bg-[#1a3c5e] rounded-2xl shadow-lg p-8 mb-8 text-white relative overflow-hidden"
      >
        <div className="absolute -bottom-10 -right-10 p-8 opacity-10"><Scale size={200} /></div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 relative z-10">
          <Layers /> 2. The "Clinical Bridge"
        </h2>
        <p className="text-slate-200 mb-8 max-w-3xl relative z-10 text-lg font-light">
          Ensuring the model interprets real-world vitals correctly after training on normalized data. Without this bridge, raw inputs appeared as outliers.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 items-center">
          <div className="bg-white/10 p-6 rounded-xl backdrop-blur-md border border-white/20 text-center">
            <div className="text-xs uppercase tracking-widest text-slate-300 mb-2">Raw Input</div>
            <div className="text-2xl font-bold mb-1">155 BPM</div>
            <div className="text-xs text-red-300">"Extreme Outlier"</div>
          </div>
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="text-xs font-mono bg-black/30 px-3 py-1 rounded text-cyan-300">
              Z = (X - Mean) / Std
            </div>
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }} 
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <ArrowRight size={32} className="text-white/50" />
            </motion.div>
            <div className="text-xs uppercase tracking-widest text-slate-300">Real-Time Scaling</div>
          </div>
          <div className="bg-white/10 p-6 rounded-xl backdrop-blur-md border border-white/20 text-center">
            <div className="text-xs uppercase tracking-widest text-slate-300 mb-2">Model View</div>
            <div className="text-2xl font-bold mb-1">+3.50 SD</div>
            <div className="text-xs text-green-300">"Critical Signal"</div>
          </div>
        </div>
      </motion.section>

      {/* Section 3: Model Architecture */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8"
      >
        <h2 className="text-2xl font-bold text-[#1a3c5e] mb-6 flex items-center gap-3">
          <Brain className="text-[#1a3c5e]" /> 3. Calibrated Logistic Regression
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <p className="text-slate-600 leading-relaxed mb-4">
              We chose <strong>Calibrated Logistic Regression</strong> to prioritize explainability. In clinical settings, we must know <em>why</em> a risk score is high.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded text-[#1a3c5e]"><Scale size={18}/></div>
                <div>
                  <h4 className="font-bold text-[#1a3c5e] text-sm">Class Weighting (Balanced)</h4>
                  <p className="text-xs text-slate-500 mt-1">Mathematically penalizes missing a "Severe" case.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded text-[#1a3c5e]"><Activity size={18}/></div>
                <div>
                  <h4 className="font-bold text-[#1a3c5e] text-sm">"Glass Box" Interpretability</h4>
                  <p className="text-xs text-slate-500 mt-1">Risk scores are tied to specific coefficients.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 flex flex-col justify-center">
            <div className="flex justify-between items-center mb-2 text-sm font-bold text-slate-700">
              <span>Input Coefficients</span>
              <span>Risk Output</span>
            </div>
            <div className="space-y-2">
              <div className="h-2 bg-slate-200 rounded overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: "80%" }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-red-500"
                ></motion.div>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Lactate Contribution</span>
                <span className="text-red-600 font-bold">+ High Impact</span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Section 4: System Integration */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="bg-[#1a3c5e] rounded-2xl shadow-lg p-8 mb-8 text-white"
      >
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
          <Server /> 4. System Integration & Deployment
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-xl text-slate-800 shadow-md">
            <div className="text-[#1a3c5e] mb-3"><Server size={28}/></div>
            <h3 className="font-bold text-[#1a3c5e] mb-2">FastAPI Backend</h3>
            <p className="text-sm text-slate-600">Orchestrator that receives raw JSON vitals, runs the Clinical Bridge, and executes inference.</p>
          </motion.div>
          <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-xl text-slate-800 shadow-md border-l-4 border-l-red-500">
            <div className="text-red-600 mb-3"><ShieldCheck size={28}/></div>
            <h3 className="font-bold text-[#1a3c5e] mb-2">Clinical Guardrails</h3>
            <p className="text-sm text-slate-600">Triggers Severe Alert if SBP &lt; 85 or Lactate &gt; 4.0, regardless of AI output.</p>
          </motion.div>
          <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-xl text-slate-800 shadow-md">
            <div className="text-[#1a3c5e] mb-3"><Activity size={28}/></div>
            <h3 className="font-bold text-[#1a3c5e] mb-2">React Dashboard</h3>
            <p className="text-sm text-slate-600">Translates complex probabilities into a simple Needle Gauge for immediate action.</p>
          </motion.div>
        </div>
      </motion.section>

      {/* Section 5: Results */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8"
      >
        <h2 className="text-2xl font-bold text-[#1a3c5e] mb-6 flex items-center gap-3">
          <CheckCircle className="text-[#1a3c5e]" /> 5. Results & Evidence of Success
        </h2>
        <p className="text-slate-600 mb-8">The "Proof of Concept" was validated through three distinct stress tests:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-4 border border-slate-100 rounded-lg bg-slate-50">
            <div className="text-3xl font-bold text-[#1a3c5e] mb-1">0.98</div>
            <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">High Sensitivity (Recall)</div>
            <p className="text-xs text-slate-400 mt-2">Caught almost every instance of septic shock.</p>
          </div>
          <div className="text-center p-4 border border-slate-100 rounded-lg bg-slate-50">
            <div className="text-3xl font-bold text-[#1a3c5e] mb-1">74%</div>
            <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">Probability Divergence</div>
            <p className="text-xs text-slate-400 mt-2">Clear separation: Healthy (~25%) vs Shock (99.4%).</p>
          </div>
          <div className="text-center p-4 border border-slate-100 rounded-lg bg-slate-50">
            <div className="text-3xl font-bold text-[#1a3c5e] mb-1">94%</div>
            <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">Overall Accuracy</div>
            <p className="text-xs text-slate-400 mt-2">Eliminated "pointed peak" errors in confusion matrix.</p>
          </div>
        </div>
      </motion.section>

      {/* Section 6: Visual Validation */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="bg-[#1a3c5e] rounded-2xl shadow-lg p-8 mb-8 text-white"
      >
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
          <BarChart3 className="text-white" /> 6. Visual Validation & EDA
        </h2>
        <p className="text-slate-300 text-sm mb-6 flex items-center gap-2">
          <ZoomIn size={16}/> Click any chart to view full screen
        </p>
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <ImageCard 
            title="Confusion Matrix" 
            tag="94% Accuracy" 
            tagColor="text-green-600"
            src={matrixImg} 
            desc="Shows high diagonal density, proving correct classification across all 3 severity levels."
            onClick={() => setSelectedImage(matrixImg)}
          />
          <ImageCard 
            title="Risk Probability Split" 
            src={separationImg} 
            desc="Demonstrates clear divergence (~74%) between Healthy (green) and Severe (red) patient probabilities."
            onClick={() => setSelectedImage(separationImg)}
          />
          <ImageCard 
            title="Clinical Drivers" 
            src={featuresImg} 
            desc="Lactate, Heart Rate, and Leukocytes identified as the strongest statistical predictors of severity."
            onClick={() => setSelectedImage(featuresImg)}
          />
        </motion.div>
      </motion.section>
    </>
  );
}

// Helper component
function ImageCard({ title, tag, tagColor, src, desc, onClick }) {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div 
      variants={cardVariants}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="group relative rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-shadow duration-300 cursor-zoom-in bg-white"
      onClick={onClick}
    >
      <div className="bg-slate-50 p-3 border-b border-slate-200 font-bold text-[#1a3c5e] text-sm flex justify-between items-center">
          <span>{title}</span>
          {tag && <span className={tagColor || 'text-slate-500'}>{tag}</span>}
      </div>
      <div className="relative overflow-hidden h-48 bg-slate-100">
        <img 
          src={src} 
          alt={title} 
          className="w-full h-full object-contain group-hover:scale-105 transition duration-500" 
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <ZoomIn className="text-white drop-shadow-md" size={32} />
        </div>
      </div>
      <div className="p-4 text-xs text-slate-500 leading-relaxed">
          {desc}
      </div>
    </motion.div>
  );
}