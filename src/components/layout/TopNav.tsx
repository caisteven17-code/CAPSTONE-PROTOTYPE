'use client';

import React, { useState } from 'react';
import { BarChart3, Bell, Calendar, ChevronDown, Church, Check, User } from 'lucide-react';

import { Role, Timeframe } from '../../App';
import { APP_CONFIG } from '../../constants';

interface TopNavProps {
  onNavigate?: (page: string) => void;
  onAccountSettings?: () => void;
  role?: Role;
  currentPage?: string;
  timeframe?: Timeframe;
  onTimeframeChange?: (timeframe: Timeframe) => void;
  year?: number;
  onYearChange?: (year: number) => void;
}

export function TopNav({ 
  onNavigate, 
  onAccountSettings,
  role = 'bishop', 
  currentPage = 'home', 
  timeframe = '6m', 
  onTimeframeChange,
  year = 2026,
  onYearChange
}: TopNavProps) {
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);

  const timeframeLabels: Record<Timeframe, string> = {
    '6m': 'Past 6 Months',
    '1y': 'Past 1 Year',
    'all': 'All Time'
  };

  const handleTimeframeSelect = (tf: Timeframe) => {
    onTimeframeChange?.(tf);
    setShowTimeframeDropdown(false);
  };

  if (role === 'parish_priest' || role === 'parish_secretary' || role === 'school' || role === 'seminary') {
    const entityLabel = role === 'school' ? 'School' : role === 'seminary' ? 'Seminary' : 'Parish';
    const entityName = role === 'school' ? 'SAN PABLO DIOCESAN CATHOLIC SCHOOL' : role === 'seminary' ? 'ST. PETER\'S COLLEGE SEMINARY' : 'SAN ISIDRO LABRADOR PARISH';
    const leaderTitle = role === 'school' ? 'School Director' : role === 'seminary' ? 'Rector' : role === 'parish_secretary' ? 'Parish Secretary' : 'Parish Priest';
    const leaderName = role === 'school' ? 'Rev. Fr. John Doe' : role === 'seminary' ? 'Rev. Fr. James Smith' : 'Ms. Maria Santos';
    const parishTabs = [
      { id: 'parish-dashboard', label: 'Parish Dashboard', icon: BarChart3 },
      ...(role === 'parish_priest' ? [{ id: 'priest-dashboard', label: 'Priest Dashboard', icon: User }] : []),
      { id: 'announcements', label: 'Announcements', icon: Bell },
    ];

    return (
      <header className="bg-black text-white border-b border-gray-800 sticky top-0 z-50 h-auto md:h-20 flex items-center w-full py-3 md:py-0">
        <div className="flex items-center justify-between w-full px-3 sm:px-4 md:px-8 gap-4">
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

          {(role === 'parish_priest' || role === 'parish_secretary') && (
            <nav className="hidden lg:flex items-center gap-3 shrink-0">
              {parishTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentPage === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => onNavigate?.(tab.id)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                      isActive
                        ? 'bg-gold-500 text-black'
                        : 'bg-white/5 text-white/65 border border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

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
              onClick={() => onAccountSettings?.()}
              className="w-8 h-8 md:w-10 md:h-10 bg-gold-500 rounded-full flex items-center justify-center hover:bg-gold-600 transition-colors cursor-pointer shadow-md border border-gold-600 shrink-0"
              aria-label="Open account settings"
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
        <div className="flex w-full items-center justify-between gap-8 px-8">
          <button
            onClick={() => onNavigate?.('home')}
            className="flex items-center gap-4 text-left"
            aria-label="Go to home"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] shadow-lg">
              <img
                src={APP_CONFIG.logoPath}
                alt="Diocese of San Pablo"
                className="h-8 w-8 object-contain"
              />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.35em] text-white/35">
                Diocese of
              </span>
              <span className="font-serif text-sm font-bold uppercase tracking-wide text-gold-400">
                San Pablo
              </span>
            </span>
          </button>

          <div className="flex items-center justify-end gap-5">
            <div className="relative">
              <button 
                onClick={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
                className="flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm font-bold text-white transition-colors hover:bg-white/10"
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

            <button
              onClick={() => onAccountSettings?.()}
              className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full border border-gold-600 bg-gold-500 text-black shadow-lg shadow-gold-500/20 transition-colors hover:bg-gold-600"
              aria-label="Open account settings"
            >
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
    );
  }
}
