'use client';

import React, { useState } from 'react';
import { Calendar, ChevronDown, Church, Check, Menu, X, User } from 'lucide-react';
import { APP_CONFIG } from '../../constants';
import { motion, AnimatePresence } from 'motion/react';

import { Role, Timeframe } from '../../App';

interface TopNavProps {
  onNavigate?: (page: string) => void;
  role?: Role;
  currentPage?: string;
  timeframe?: Timeframe;
  onTimeframeChange?: (timeframe: Timeframe) => void;
  year?: number;
  onYearChange?: (year: number) => void;
}

export function TopNav({ 
  onNavigate, 
  role = 'bishop', 
  currentPage = 'home', 
  timeframe = '6m', 
  onTimeframeChange,
  year = 2026,
  onYearChange
}: TopNavProps) {
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const timeframeLabels: Record<Timeframe, string> = {
    '6m': 'Past 6 Months',
    '1y': 'Past 1 Year',
    'all': 'All Time'
  };

  const handleTimeframeSelect = (tf: Timeframe) => {
    onTimeframeChange?.(tf);
    setShowTimeframeDropdown(false);
  };

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'parish', label: 'Parish' },
    { id: 'seminaries', label: 'Seminaries' },
    { id: 'school', label: 'School' },
    { id: 'projects', label: 'Projects' },
  ];

  const handleNavigate = (page: string) => {
    onNavigate?.(page);
    setIsMobileMenuOpen(false);
  };

  if (role === 'priest' || role === 'school' || role === 'seminary') {
    const entityLabel = role === 'school' ? 'School' : role === 'seminary' ? 'Seminary' : 'Parish';
    const entityName = role === 'school' ? 'SAN PABLO DIOCESAN CATHOLIC SCHOOL' : role === 'seminary' ? 'ST. PETER\'S COLLEGE SEMINARY' : 'SAN ISIDRO LABRADOR PARISH';
    const leaderTitle = role === 'school' ? 'School Director' : role === 'seminary' ? 'Rector' : 'Parish Priest';
    const leaderName = role === 'school' ? 'Rev. Fr. John Doe' : role === 'seminary' ? 'Rev. Fr. James Smith' : 'Rev. Fr. Noel Artillaga';

    return (
      <header className="bg-black text-white border-b border-gray-800 sticky top-0 z-50 h-auto md:h-20 flex items-center w-full py-3 md:py-0">
        <div className="flex items-center justify-between w-full px-3 sm:px-4 md:px-8">
          {/* Logo & Title */}
          <div className="flex items-center gap-2 md:gap-4 overflow-hidden flex-1 min-w-0">
            <div className="w-8 md:w-12 h-8 md:h-12 border border-[#D4AF37] rounded-lg flex items-center justify-center text-[#D4AF37] shadow-md shrink-0">
              <Church className="w-4 md:w-6 h-4 md:h-6" />
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-sm md:text-2xl font-serif font-bold text-[#D4AF37] tracking-tight leading-none mb-0.5 md:mb-1 truncate">{entityLabel} Financial Dashboard</h1>
              <p className="text-[9px] md:text-sm font-bold text-white/80 tracking-wider uppercase mb-0.5 truncate">{entityName}</p>
              <p className="text-[8px] md:text-xs text-white/40 truncate">{leaderTitle}: {leaderName}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative hidden sm:block">
              <button 
                onClick={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
                className="flex items-center gap-2 bg-white text-church-green px-3 md:px-4 py-2 md:py-2.5 rounded-full text-sm font-bold hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <Calendar className="w-3 h-3 md:w-4 md:h-4 text-church-green/60" />
                <span className="hidden md:inline">{timeframeLabels[timeframe]}</span>
                <span className="md:hidden">{timeframe}</span>
                <ChevronDown className={`w-3 h-3 md:w-4 md:h-4 text-church-green/60 transition-transform ${showTimeframeDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showTimeframeDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-[60] animate-in fade-in zoom-in duration-200">
                  {(Object.keys(timeframeLabels) as Timeframe[]).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => handleTimeframeSelect(tf)}
                      className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-gray-50 flex items-center justify-between transition-colors"
                    >
                      <span className={timeframe === tf ? 'text-gold-600 font-bold' : 'text-gray-600'}>
                        {timeframeLabels[tf]}
                      </span>
                      {timeframe === tf && <Check className="w-4 h-4 text-gold-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative hidden sm:block">
              <button 
                onClick={() => setIsYearOpen(!isYearOpen)}
                className="flex items-center gap-2 bg-white text-church-green px-3 md:px-4 py-2 md:py-2.5 rounded-full text-sm font-bold hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <span>{year}</span>
                <ChevronDown className={`w-3 h-3 md:w-4 md:h-4 text-church-green/60 transition-transform ${isYearOpen ? 'rotate-180' : ''}`} />
              </button>

              {isYearOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-[60] animate-in fade-in zoom-in duration-200">
                  {[2026, 2025, 2024, 2023, 2022].map((y) => (
                    <button
                      key={y}
                      onClick={() => {
                        onYearChange?.(y);
                        setIsYearOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-gray-50 flex items-center justify-between transition-colors"
                    >
                      <span className={year === y ? 'text-gold-600 font-bold' : 'text-gray-600'}>
                        {y}
                      </span>
                      {year === y && <Check className="w-4 h-4 text-gold-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button 
              onClick={() => onNavigate?.('settings')}
              className="w-8 h-8 md:w-10 md:h-10 bg-gold-500 rounded-full flex items-center justify-center hover:bg-gold-600 transition-colors cursor-pointer shadow-md border border-gold-600 shrink-0"
            >
              <span className="text-black font-black text-xs md:text-sm">P</span>
            </button>
          </div>
        </div>
      </header>
    );
  }

  if (role === 'bishop' || role === 'admin') {
    return (
      <header className="bg-black text-white border-b border-white/5 sticky top-0 z-30 h-20 flex items-center w-full">
        <div className="flex items-center justify-between w-full px-8">
          {/* Left Side: Logo & Branding */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center p-1 border border-white/10">
              <img 
                src={APP_CONFIG.logoPath} 
                alt="Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="hidden md:flex flex-col">
              <h1 className="text-lg font-serif font-bold text-gold-500 leading-none">Diocese of San Pablo</h1>
              <p className="text-xs text-white/40 font-semibold tracking-wider">Financial Analytics System</p>
            </div>
          </div>

          
          {/* Right Side: Actions */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <button 
                onClick={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
                className="flex items-center gap-2 bg-white/5 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors border border-white/10"
              >
                <Calendar className="w-4 h-4 text-white/40" />
                <span className="hidden sm:inline">{timeframeLabels[timeframe]}</span>
                <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${showTimeframeDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showTimeframeDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-[60] animate-in fade-in zoom-in duration-200">
                  {(Object.keys(timeframeLabels) as Timeframe[]).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => handleTimeframeSelect(tf)}
                      className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-gray-50 flex items-center justify-between transition-colors"
                    >
                      <span className={timeframe === tf ? 'text-gold-600 font-bold' : 'text-church-green'}>
                        {timeframeLabels[tf]}
                      </span>
                      {timeframe === tf && <Check className="w-4 h-4 text-gold-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button 
                onClick={() => setIsYearOpen(!isYearOpen)}
                className="flex items-center gap-2 bg-white/5 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors border border-white/10"
              >
                <span>{year}</span>
                <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${isYearOpen ? 'rotate-180' : ''}`} />
              </button>

              {isYearOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-black/95 rounded-2xl shadow-xl border border-gold-500/30 py-2 z-[60] animate-in fade-in zoom-in duration-200">
                  {[2026, 2025, 2024, 2023, 2022].map((y) => (
                    <button
                      key={y}
                      onClick={() => {
                        onYearChange?.(y);
                        setIsYearOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold hover:bg-white/5 flex items-center justify-between transition-colors text-white"
                    >
                      <span className={year === y ? 'text-gold-500' : 'text-gray-300'}>
                        {y}
                      </span>
                      {year === y && <Check className="w-4 h-4 text-gold-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button 
              onClick={() => onNavigate?.('settings')}
              className="w-10 h-10 bg-gold-500 text-black rounded-full flex items-center justify-center hover:bg-gold-600 transition-colors cursor-pointer shadow-lg shadow-gold-500/20 border border-gold-600 shrink-0"
            >
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
    );
  }
}
