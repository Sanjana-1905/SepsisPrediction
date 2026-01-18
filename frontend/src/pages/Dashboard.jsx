import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Database, FileText, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import networkBackgroundImg from '../assets/analytics/network_background.jpeg';

export default function Dashboard() {
  return (
    <div className="bg-slate-50">
      {/* Hero Section */}
      <div className="relative h-[500px] w-full bg-[#1a3c5e] overflow-hidden">
        {/* Background Network Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${networkBackgroundImg})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a3c5e]/80 via-[#1a3c5e]/70 to-[#1a3c5e]/80"></div>

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