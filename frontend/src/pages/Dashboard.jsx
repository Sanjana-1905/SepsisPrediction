import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Database, FileText, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  return (
    <div className="bg-slate-50">
      {/* Hero Section */}
      <div className="relative h-[500px] w-full bg-[#1a3c5e] overflow-hidden">
        {/* Background Overlay Image Effect */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579684385180-16f9366182c3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a3c5e] via-[#1a3c5e]/90 to-transparent"></div>

        <div className="container mx-auto px-6 h-full flex flex-col justify-center relative z-10 text-white">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-serif font-bold mb-6 max-w-3xl leading-tight"
          >
            Early Sepsis Detection & Clinical Decision Support
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-200 max-w-2xl mb-10 font-light"
          >
            Leveraging high-frequency physiological data and Calibrated Logistic Regression to predict sepsis severity across Healthy, Mild, and Septic Shock classes.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Link to="/predict" className="inline-flex items-center gap-2 bg-white text-[#1a3c5e] px-8 py-4 rounded font-bold hover:bg-slate-100 transition shadow-xl">
              START DIAGNOSIS <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Hexagon Services Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl text-slate-400 font-light uppercase tracking-widest mb-2">Core Capabilities</h2>
          <div className="h-1 w-20 bg-[#1a3c5e] mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <HexagonCard 
            icon={<Activity size={40} />} 
            title="3-Class Prediction" 
            desc="Classifies patients into Healthy, Mild Sepsis, or Severe/Critical Septic Shock with high sensitivity."
            link="/predict"
          />
          <HexagonCard 
            icon={<Database size={40} />} 
            title="Clinical Bridge" 
            desc="Proprietary scaling bridge to translate raw UI inputs into the model's normalized internal state."
            link="/model"
          />
          <HexagonCard 
            icon={<FileText size={40} />} 
            title="Full Stack System" 
            desc="FastAPI 'Clinical Brain' backend with React Dashboard for real-time ICU monitoring."
            link="/predict"
          />
        </div>
      </div>

      {/* Stats & Info Section */}
      <div className="bg-white py-20 border-t border-slate-200">
        <div className="container mx-auto px-6">
          <h3 className="text-[#1a3c5e] font-bold uppercase tracking-wider mb-8 text-sm">System Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-serif font-bold text-slate-800">Interpretable AI for Medicine</h2>
              <p className="text-slate-600 leading-relaxed">
                We transitioned from "Black Box" models to a <strong>Calibrated Logistic Regression</strong> engine. This ensures that every prediction is mathematically interpretable, allowing clinicians to understand exactly how vitals like Lactate and Systolic BP drive the risk score.
              </p>
              <ul className="space-y-3 mt-4">
                <li className="flex items-center gap-3 text-slate-700">
                  <div className="h-2 w-2 bg-[#1a3c5e] rounded-full"></div>
                  <strong>Weighted Balance:</strong> Treats rare "Severe" cases with equal importance.
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <div className="h-2 w-2 bg-[#1a3c5e] rounded-full"></div>
                  <strong>Clinical Guardrails:</strong> Overrides AI if vitals indicate immediate shock.
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <div className="h-2 w-2 bg-[#1a3c5e] rounded-full"></div>
                  <strong>Z-Score Bridge:</strong> Solves the "Mathematical Loop" scaling issue.
                </li>
              </ul>
            </div>
            <div className="bg-slate-100 p-8 rounded-2xl border border-slate-200 shadow-inner">
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white p-4 shadow-sm rounded">
                   <div className="text-3xl font-bold text-[#1a3c5e]">94%</div>
                   <div className="text-xs text-slate-500 uppercase mt-1">Overall Accuracy</div>
                 </div>
                 <div className="bg-white p-4 shadow-sm rounded">
                   <div className="text-3xl font-bold text-[#1a3c5e]">43</div>
                   <div className="text-xs text-slate-500 uppercase mt-1">Clinical Features</div>
                 </div>
                 <div className="bg-white p-4 shadow-sm rounded col-span-2">
                   <div className="text-3xl font-bold text-[#1a3c5e]">150,000+</div>
                   <div className="text-xs text-slate-500 uppercase mt-1">Training Observations</div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HexagonCard({ icon, title, desc, link }) {
  return (
    <div className="flex flex-col items-center text-center group">
      <Link to={link}>
        <div className="w-32 h-36 bg-[#1a3c5e] flex items-center justify-center text-white mb-6 relative hover:bg-[#2c527a] transition-colors shadow-xl group-hover:-translate-y-2 transform duration-300"
             style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
          {icon}
        </div>
      </Link>
      <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide mb-3">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed max-w-xs">{desc}</p>
    </div>
  );
}