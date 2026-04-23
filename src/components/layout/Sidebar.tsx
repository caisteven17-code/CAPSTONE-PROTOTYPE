'use client';

import React from 'react';
import { 
  Home, 
  Church, 
  BookOpen, 
  GraduationCap, 
  Briefcase, 
  Settings,
  ChevronDown,
  Check,
  User,
  Bell,
  FileText,
  BarChart3,
  Heart,
  Zap
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
  const [showParishDropdown, setShowParishDropdown] = React.useState(activeTab.startsWith('parish'));

  // Auto-expand dropdown when parish or priest tab is active
  React.useEffect(() => {
    setShowParishDropdown(activeTab.startsWith('parish') || activeTab.startsWith('priest'));
  }, [activeTab]);

  /**
   * Handle timeframe selection and close dropdown
   */
  const handleTimeframeSelect = React.useCallback((tf: Timeframe) => {
    onTimeframeChange?.(tf);
    setShowTimeframeDropdown(false);
  }, [onTimeframeChange]);

  const parishSubtabs = [
    { id: 'parish-dashboard', label: 'Dashboard', icon: BarChart3, section: 'PARISH' },
    { id: 'parish-aitwin', label: 'AI Twin', icon: Zap, section: 'PARISH' },
    { id: 'priest-dashboard', label: 'Dashboard', icon: BarChart3, section: 'PRIEST' },
    { id: 'priest-health', label: 'Health Tracker', icon: Heart, section: 'PRIEST' },
    { id: 'priest-aitwin', label: 'AI Twin', icon: Zap, section: 'PRIEST' },
  ];

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'seminaries', label: 'Seminaries', icon: BookOpen },
    { id: 'school', label: 'Schools', icon: GraduationCap },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'announcements', label: 'Announcements', icon: Bell },
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
        {/* Home */}
        {(() => {
          const homeItem = navItems.find((item) => item.id === 'home');
          if (!homeItem) return null;
          const Icon = homeItem.icon;
          const isActive = activeTab === homeItem.id;

          return (
            <button
              key={homeItem.id}
              onClick={() => onNavigate(homeItem.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive
                  ? 'bg-white/10 text-gold-400 shadow-sm'
                  : 'text-white/50 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-gold-400' : 'text-white/20 group-hover:text-white/40'}`} />
              <span className="text-xs font-bold tracking-wide">{homeItem.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 bg-gold-400 rounded-full shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
              )}
            </button>
          );
        })()}

        {/* Parishes Dropdown */}
        <div>
          <div className={`w-full flex items-center gap-3 rounded-xl transition-all duration-300 ${
            activeTab.startsWith('parish') || activeTab.startsWith('priest')
              ? 'bg-white/10 text-gold-400 shadow-sm'
              : 'text-white/50'
          }`}>
            {/* Main Button - Navigate to Dashboard */}
            <button
              onClick={() => {
                onNavigate('parish-dashboard');
                setShowParishDropdown(false);
              }}
              className="flex-1 flex items-center gap-3 px-4 py-3 hover:text-white transition-colors group"
            >
              <Church className={`w-4 h-4 transition-colors ${(activeTab.startsWith('parish') || activeTab.startsWith('priest')) ? 'text-gold-400' : 'text-white/20 group-hover:text-white/40'}`} />
              <span className="text-xs font-bold tracking-wide">Parishes</span>
            </button>

            {/* Dropdown Toggle - Only for Chevron */}
            <button
              onClick={() => setShowParishDropdown(!showParishDropdown)}
              className="px-3 py-3 hover:bg-white/10 rounded-r-xl transition-colors"
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showParishDropdown ? 'rotate-180' : ''}`} />
            </button>

            {(activeTab.startsWith('parish') || activeTab.startsWith('priest')) && (
              <div className="absolute right-3 w-1.5 h-1.5 bg-gold-400 rounded-full shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
            )}
          </div>

          {/* Parish Subtabs Dropdown */}
          <AnimatePresence>
            {showParishDropdown && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-0 mt-1 pl-6"
              >
                {/* PARISH SECTION */}
                <div className="py-1">
                  <div className="px-4 py-1.5 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                    Parish
                  </div>
                  {parishSubtabs
                    .filter(sub => sub.section === 'PARISH')
                    .map((subtab) => {
                      const SubIcon = subtab.icon;
                      const isActive = activeTab === subtab.id;
                      return (
                        <button
                          key={subtab.id}
                          onClick={() => onNavigate(subtab.id)}
                          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300 group text-sm ${
                            isActive
                              ? 'bg-white/10 text-gold-400'
                              : 'text-white/40 hover:bg-white/5 hover:text-white/60'
                          }`}
                        >
                          <SubIcon className={`w-3.5 h-3.5 ${isActive ? 'text-gold-400' : 'text-white/20'}`} />
                          <span className="font-medium tracking-wide">{subtab.label}</span>
                          {isActive && (
                            <div className="ml-auto w-1 h-1 bg-gold-400 rounded-full" />
                          )}
                        </button>
                      );
                    })}
                </div>

                {/* SEPARATOR */}
                <div className="my-1 border-t border-white/10" />

                {/* PRIEST SECTION */}
                <div className="py-1">
                  <div className="px-4 py-1.5 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                    Priest
                  </div>
                  {parishSubtabs
                    .filter(sub => sub.section === 'PRIEST')
                    .map((subtab) => {
                      const SubIcon = subtab.icon;
                      const isActive = activeTab === subtab.id;
                      return (
                        <button
                          key={subtab.id}
                          onClick={() => onNavigate(subtab.id)}
                          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300 group text-sm ${
                            isActive
                              ? 'bg-white/10 text-gold-400'
                              : 'text-white/40 hover:bg-white/5 hover:text-white/60'
                          }`}
                        >
                          <SubIcon className={`w-3.5 h-3.5 ${isActive ? 'text-gold-400' : 'text-white/20'}`} />
                          <span className="font-medium tracking-wide">{subtab.label}</span>
                          {isActive && (
                            <div className="ml-auto w-1 h-1 bg-gold-400 rounded-full" />
                          )}
                        </button>
                      );
                    })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Other Navigation Items */}
        {navItems.filter((item) => item.id !== 'home').map((item) => {
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
