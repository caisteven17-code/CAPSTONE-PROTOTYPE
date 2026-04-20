'use client';

import React from 'react';
import { 
  Home, 
  Church, 
  BookOpen, 
  GraduationCap, 
  Briefcase, 
  Settings,
  Zap,
  Search,
  Calendar,
  ChevronDown,
  Check,
  User,
  Bell,
  Heart,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { APP_CONFIG } from '../../constants';
import { Timeframe } from '../../App';

interface SidebarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  role: string;
  timeframe?: Timeframe;
  onTimeframeChange?: (timeframe: Timeframe) => void;
}

/** Timeframe display labels (moved to module level to avoid recreation on each render) */
const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  '6m': 'Past 6 Months',
  '1y': 'Past 1 Year',
  'all': 'All Time'
} as const;

export function Sidebar({ 
  activeTab, 
  onNavigate, 
  role,
  timeframe = '6m',
  onTimeframeChange
}: SidebarProps) {
  const [showTimeframeDropdown, setShowTimeframeDropdown] = React.useState(false);

  /**
   * Handle timeframe selection and close dropdown
   */
  const handleTimeframeSelect = React.useCallback((tf: Timeframe) => {
    onTimeframeChange?.(tf);
    setShowTimeframeDropdown(false);
  }, [onTimeframeChange]);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'parish', label: 'Parishes', icon: Church },
    { id: 'seminaries', label: 'Seminaries', icon: BookOpen },
    { id: 'school', label: 'Schools', icon: GraduationCap },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'aitwin', label: 'AI Twin', icon: Zap },
    { id: 'consolidated', label: 'Financials', icon: FileText },
    { id: 'announcements', label: 'Announcements', icon: Bell },
    { id: 'health', label: 'Health Tracker', icon: Heart },
  ];

  if (role !== 'bishop' && role !== 'admin') return null;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-black text-white h-screen sticky top-0 left-0 z-40 shadow-2xl border-r border-white/5">
      {/* Logo Section */}
      <div className="p-6 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/5 rounded-xl p-1.5 border border-white/10 flex items-center justify-center">
            <img 
              src={APP_CONFIG.logoPath} 
              alt="Diocese Logo" 
              className="w-full h-full object-contain filter brightness-110"
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[8px] font-black tracking-[0.2em] text-white/40 leading-none mb-0.5">DIOCESE OF</h1>
            <h2 className="text-xs font-serif font-bold text-gold-400 tracking-wide uppercase leading-tight">San Pablo</h2>
          </div>
        </div>
      </div>

      {/* Main Menu Label */}
      <div className="px-6 mb-4">
        <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Main Menu</h3>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-white/10 text-gold-400 shadow-sm' 
                  : 'text-white/50 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-gold-400' : 'text-white/20 group-hover:text-white/40'}`} />
              <span className="text-xs font-bold tracking-wide">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 bg-gold-400 rounded-full shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={() => onNavigate('settings')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
            activeTab === 'settings' 
              ? 'bg-white/10 text-gold-400' 
              : 'text-white/50 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4 transition-colors group-hover:text-white/40" />
          <span className="text-xs font-bold tracking-wide">Settings</span>
        </button>
      </div>
    </aside>
  );
}
