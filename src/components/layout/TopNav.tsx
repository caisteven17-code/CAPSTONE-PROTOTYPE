'use client';

import React, { useState } from 'react';
import { Calendar, ChevronDown, Check, User } from 'lucide-react';

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

  const timeframeLabels: Record<Timeframe, string> = {
    '6m': 'Past 6 Months',
    '1y': 'Past 1 Year',
    'all': 'All Time'
  };

  const handleTimeframeSelect = (tf: Timeframe) => {
    onTimeframeChange?.(tf);
    setShowTimeframeDropdown(false);
  };

  if (role === 'priest' || role === 'school' || role === 'seminary') {
    const entityLabel = role === 'school' ? 'School' : role === 'seminary' ? 'Seminary' : 'Parish';
    const entityName = role === 'school' ? 'SAN PABLO DIOCESAN CATHOLIC SCHOOL' : role === 'seminary' ? 'ST. PETER\'S COLLEGE SEMINARY' : 'SAN ISIDRO LABRADOR PARISH';
    const metadata = role === 'school'
      ? ['District not assigned', 'St. John the Baptist Vicariate', 'School Director: Rev. Fr. John Doe', 'Access: School']
      : role === 'seminary'
        ? ['District not assigned', 'St. John the Baptist Vicariate', 'Rector: Rev. Fr. James Smith', 'Access: Seminary']
        : ['District not assigned', 'St. John the Baptist Vicariate', 'Parish Priest: Not assigned', 'Access: Parish Priest'];
    const userInitial = role === 'school' ? 'S' : role === 'seminary' ? 'R' : 'B';

    return (
      <header className="bg-black text-white border-b border-white/5 sticky top-0 z-50 min-h-[78px] flex items-center w-full">
        <div className="flex items-center justify-between w-full gap-5 px-4 sm:px-6 lg:px-7 py-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h1 className="font-serif text-xl lg:text-2xl font-black leading-tight tracking-normal text-gold-400 truncate">
              {entityLabel} Financial Dashboard
            </h1>
            <p className="text-xs lg:text-sm font-black uppercase tracking-[0.22em] text-white truncate">
              {entityName}
            </p>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] font-bold text-white/35">
              {metadata.map((item, index) => (
                <React.Fragment key={item}>
                  {index > 0 && <span className="hidden sm:inline text-gold-500/60">•</span>}
                  <span className="truncate">{item}</span>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2.5 lg:gap-3 shrink-0">
            <div className="relative hidden sm:block">
              <button 
                onClick={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
                className="flex h-10 min-w-[176px] items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm font-black text-white hover:bg-white/10 transition-colors"
              >
                <Calendar className="w-4 h-4 text-gold-400" />
                <span className="hidden md:inline">{timeframeLabels[timeframe]}</span>
                <span className="md:hidden">{timeframe}</span>
                <ChevronDown className={`w-4 h-4 text-white/35 transition-transform ${showTimeframeDropdown ? 'rotate-180' : ''}`} />
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
                className="flex h-10 min-w-[100px] items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 text-sm font-black text-white hover:bg-white/10 transition-colors"
              >
                <span>{year}</span>
                <ChevronDown className={`w-4 h-4 text-white/35 transition-transform ${isYearOpen ? 'rotate-180' : ''}`} />
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
              className="flex h-11 w-11 lg:h-12 lg:w-12 items-center justify-center rounded-full border border-gold-200 bg-gold-500 text-black shadow-[0_0_24px_rgba(212,175,55,0.3)] hover:bg-gold-400 transition-colors cursor-pointer shrink-0"
            >
              <span className="text-lg font-black">{userInitial}</span>
            </button>
          </div>
        </div>
      </header>
    );
  }

  if (role === 'bishop' || role === 'admin') {
    return (
      <header className="bg-black text-white border-b border-white/5 sticky top-0 z-30 h-16 flex items-center w-full">
        <div className="flex items-center justify-between w-full px-8">
          {/* Left Side: Empty (Logo moved to sidebar) */}
          <div></div>

          
          {/* Right Side: Actions */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
                className="flex items-center gap-2 bg-white/5 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors border border-white/10"
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
                className="flex items-center gap-2 bg-white/5 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors border border-white/10"
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
