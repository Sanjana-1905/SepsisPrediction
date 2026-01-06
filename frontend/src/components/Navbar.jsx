import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white relative z-50 shadow-sm">
      {/* Top Bar with Logo */}
      <div className="container mx-auto px-6 py-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-[#1a3c5e] text-white p-2 rounded-lg group-hover:scale-105 transition-transform">
            <ShieldAlert size={28} />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-serif font-bold text-[#1a3c5e] tracking-tight">NOVAGUARD</span>
            <span className="text-xs uppercase tracking-widest text-slate-500 font-medium">Clinical Biomarker Engine</span>
          </div>
        </Link>
        
        {/* Desktop Menu - Launch Button Removed */}
        <div className="hidden md:flex items-center gap-8 font-medium text-sm text-slate-600">
          <Link 
            to="/" 
            className={`transition-colors hover:text-[#1a3c5e] ${isActive('/') ? 'text-[#1a3c5e] font-bold' : ''}`}
          >
            HOME
          </Link>
          <Link 
            to="/predict" 
            className={`transition-colors hover:text-[#1a3c5e] ${isActive('/predict') ? 'text-[#1a3c5e] font-bold' : ''}`}
          >
            START DIAGNOSIS
          </Link>
          <Link 
            to="/model" 
            className={`transition-colors hover:text-[#1a3c5e] ${isActive('/model') ? 'text-[#1a3c5e] font-bold' : ''}`}
          >
            MODEL ARCHITECTURE
          </Link>
        </div>
      </div>
      
      {/* Decorative Curve */}
      <div className="h-4 bg-[#1a3c5e] w-full" style={{ clipPath: 'ellipse(60% 100% at 50% 100%)' }}></div>
    </nav>
  );
}