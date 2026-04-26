'use client';

import React from 'react';
import { 
  Home, 
  Church, 
  BookOpen, 
  GraduationCap, 
  Briefcase, 
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
import { auth } from '../../firebase';
import { getAccessRoleLabel } from '../../lib/access';

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
  const [showPriestDropdown, setShowPriestDropdown] = React.useState(activeTab.startsWith('priest'));
  const [showSeminaryDropdown, setShowSeminaryDropdown] = React.useState(activeTab === 'seminaries' || activeTab.startsWith('seminary'));
  const [showSchoolDropdown, setShowSchoolDropdown] = React.useState(activeTab === 'school' || activeTab.startsWith('school'));

  // Auto-expand dropdowns for their active sections
  React.useEffect(() => {
    setShowParishDropdown(activeTab.startsWith('parish'));
    setShowPriestDropdown(activeTab.startsWith('priest'));
    setShowSeminaryDropdown(activeTab === 'seminaries' || activeTab.startsWith('seminary'));
    setShowSchoolDropdown(activeTab === 'school' || activeTab.startsWith('school'));
  }, [activeTab]);

  /**
   * Handle timeframe selection and close dropdown
   */
  const handleTimeframeSelect = React.useCallback((tf: Timeframe) => {
    onTimeframeChange?.(tf);
    setShowTimeframeDropdown(false);
  }, [onTimeframeChange]);

  const isDioceseRole = role === 'bishop' || role === 'admin';
  const isParishRole = role === 'parish_priest' || role === 'parish_secretary';

  const parishSubtabs = isParishRole
    ? [{ id: 'parish-dashboard', label: 'Dashboard', icon: BarChart3, section: 'PARISH' }]
    : [
        { id: 'parish-dashboard', label: 'Dashboard', icon: BarChart3, section: 'PARISH' },
        { id: 'parish-aitwin', label: 'Digital Twin', icon: Zap, section: 'PARISH' },
      ];

  const priestSubtabs = isParishRole
    ? [{ id: 'priest-dashboard', label: 'Dashboard', icon: BarChart3 }]
    : [
        { id: 'priest-dashboard', label: 'Dashboard', icon: BarChart3 },
        { id: 'priest-health', label: 'Health Tracker', icon: Heart, section: 'PRIEST' },
        { id: 'priest-aitwin', label: 'Digital Twin', icon: Zap, section: 'PRIEST' },
      ];

  const seminarySubtabs = [
    { id: 'seminaries', label: 'Dashboard', icon: BarChart3, section: 'SEMINARY' },
    { id: 'seminary-aitwin', label: 'Digital Twin', icon: Zap, section: 'SEMINARY' },
  ];

  const schoolSubtabs = [
    { id: 'school', label: 'Dashboard', icon: BarChart3, section: 'SCHOOL' },
    { id: 'school-aitwin', label: 'Digital Twin', icon: Zap, section: 'SCHOOL' },
  ];

  const topNavItems = isDioceseRole
    ? [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'announcements', label: 'Announcements', icon: Bell },
      ]
    : isParishRole
      ? [{ id: 'announcements', label: 'Announcements', icon: Bell }]
      : [];

  const bottomNavItems = isDioceseRole
    ? [{ id: 'projects', label: 'Project', icon: Briefcase }]
    : [];

  const canViewSidebar = isDioceseRole || isParishRole;
  const canViewPriestSection = isDioceseRole || role === 'parish_priest';

  if (!canViewSidebar) return null;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#07090f] text-white h-screen sticky top-0 left-0 z-40 shadow-2xl border-r border-white/5">
      {/* Navigation Section */}
      <nav className="flex-1 px-3 pt-5 space-y-5">
        {topNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-300 group ${
                isActive
                  ? 'bg-white/10 text-gold-400 shadow-[0_10px_30px_rgba(255,255,255,0.06)]'
                  : 'text-white/50 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-gold-400' : 'text-white/30 group-hover:text-white'}`} />
              <span className="text-sm font-medium tracking-wide">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-gold-400 rounded-full shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
              )}
            </button>
          );
        })}

        {/* Parishes Dropdown */}
        <div className="pt-1">
          <div className={`relative w-full flex items-center gap-3 rounded-full transition-all duration-300 ${
            activeTab.startsWith('parish')
              ? 'bg-white/10 text-gold-400 shadow-[0_10px_30px_rgba(255,255,255,0.06)]'
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
              <Church className={`w-4 h-4 transition-colors ${activeTab.startsWith('parish') ? 'text-gold-400' : 'text-white/20 group-hover:text-white/40'}`} />
              <span className="text-sm font-bold tracking-wide">Parish</span>
            </button>

            {/* Dropdown Toggle - Only for Chevron */}
            <button
              onClick={() => setShowParishDropdown(!showParishDropdown)}
              className="px-3 py-3 hover:bg-white/10 rounded-r-xl transition-colors"
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showParishDropdown ? 'rotate-180' : ''}`} />
            </button>

            {activeTab.startsWith('parish') && (
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
                className="space-y-1 mt-2 pl-6"
              >
                <div className="py-1">
                  {parishSubtabs.map((subtab) => {
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

        {/* Priest Dropdown */}
        {canViewPriestSection && (
          <div className="pt-4">
            <div className={`relative w-full flex items-center gap-3 rounded-full transition-all duration-300 ${
              activeTab.startsWith('priest')
                ? 'bg-white/10 text-gold-400 shadow-[0_10px_30px_rgba(255,255,255,0.06)]'
                : 'text-white/50'
            }`}>
              <button
                onClick={() => {
                  onNavigate('priest-dashboard');
                  setShowPriestDropdown(false);
                }}
                className="flex-1 flex items-center gap-3 px-4 py-3 hover:text-white transition-colors group"
              >
                <User className={`w-4 h-4 transition-colors ${activeTab.startsWith('priest') ? 'text-gold-400' : 'text-white/20 group-hover:text-white/40'}`} />
                <span className="text-sm font-bold tracking-wide">Priest</span>
              </button>

              <button
                onClick={() => setShowPriestDropdown(!showPriestDropdown)}
                className="px-3 py-3 hover:bg-white/10 rounded-r-xl transition-colors"
              >
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showPriestDropdown ? 'rotate-180' : ''}`} />
              </button>

              {activeTab.startsWith('priest') && (
                <div className="absolute right-3 w-1.5 h-1.5 bg-gold-400 rounded-full shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
              )}
            </div>

            <AnimatePresence>
              {showPriestDropdown && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1 mt-2 pl-6"
                >
                  <div className="py-1">
                    {priestSubtabs.map((subtab) => {
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
        )}

        {isDioceseRole && (
          <>
            {/* Seminaries Dropdown */}
            <div>
              <div className={`relative w-full flex items-center gap-3 rounded-full transition-all duration-300 ${
                activeTab === 'seminaries' || activeTab.startsWith('seminary')
                  ? 'bg-white/10 text-gold-400 shadow-[0_10px_30px_rgba(255,255,255,0.06)]'
                  : 'text-white/50'
              }`}>
                <button
                  onClick={() => {
                    onNavigate('seminaries');
                    setShowSeminaryDropdown(false);
                  }}
                  className="flex-1 flex items-center gap-3 px-4 py-3 hover:text-white transition-colors group"
                >
                  <BookOpen className={`w-4 h-4 transition-colors ${activeTab === 'seminaries' || activeTab.startsWith('seminary') ? 'text-gold-400' : 'text-white/20 group-hover:text-white/40'}`} />
                  <span className="text-xs font-bold tracking-wide">Seminary</span>
                </button>

                <button
                  onClick={() => setShowSeminaryDropdown(!showSeminaryDropdown)}
                  className="px-3 py-3 hover:bg-white/10 rounded-r-xl transition-colors"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showSeminaryDropdown ? 'rotate-180' : ''}`} />
                </button>

                {(activeTab === 'seminaries' || activeTab.startsWith('seminary')) && (
                  <div className="absolute right-3 w-1.5 h-1.5 bg-gold-400 rounded-full shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                )}
              </div>

              <AnimatePresence>
                {showSeminaryDropdown && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-0 mt-1 pl-6"
                  >
                    <div className="py-1">
                      {seminarySubtabs.map((subtab) => {
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

            {/* Schools Dropdown */}
            <div>
              <div className={`relative w-full flex items-center gap-3 rounded-full transition-all duration-300 ${
                activeTab === 'school' || activeTab.startsWith('school')
                  ? 'bg-white/10 text-gold-400 shadow-[0_10px_30px_rgba(255,255,255,0.06)]'
                  : 'text-white/50'
              }`}>
                <button
                  onClick={() => {
                    onNavigate('school');
                    setShowSchoolDropdown(false);
                  }}
                  className="flex-1 flex items-center gap-3 px-4 py-3 hover:text-white transition-colors group"
                >
                  <GraduationCap className={`w-4 h-4 transition-colors ${activeTab === 'school' || activeTab.startsWith('school') ? 'text-gold-400' : 'text-white/20 group-hover:text-white/40'}`} />
                  <span className="text-xs font-bold tracking-wide">School</span>
                </button>

                <button
                  onClick={() => setShowSchoolDropdown(!showSchoolDropdown)}
                  className="px-3 py-3 hover:bg-white/10 rounded-r-xl transition-colors"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showSchoolDropdown ? 'rotate-180' : ''}`} />
                </button>

                {(activeTab === 'school' || activeTab.startsWith('school')) && (
                  <div className="absolute right-3 w-1.5 h-1.5 bg-gold-400 rounded-full shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                )}
              </div>

              <AnimatePresence>
                {showSchoolDropdown && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-0 mt-1 pl-6"
                  >
                    <div className="py-1">
                      {schoolSubtabs.map((subtab) => {
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
          </>
        )}

        {/* Project Button */}
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-300 group ${
                isActive 
                  ? 'bg-white/10 text-gold-400 shadow-[0_10px_30px_rgba(255,255,255,0.06)]'
                  : 'text-white/50 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-gold-400' : 'text-white/30 group-hover:text-white'}`} />
              <span className="text-sm font-medium tracking-wide">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-gold-400 rounded-full shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
