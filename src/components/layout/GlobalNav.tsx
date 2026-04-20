'use client';

import React, { useState } from 'react';
import { Home, Church, BarChart3, Settings, Menu, X, LogOut } from 'lucide-react';
import { Role } from '../../App';
import { ROLE_LABELS } from '../../constants';

interface GlobalNavProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  role: Role;
  onLogout: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" />, roles: ['bishop', 'admin', 'priest', 'school', 'seminary'] },
  { id: 'projects', label: 'Projects', icon: <BarChart3 className="w-5 h-5" />, roles: ['bishop', 'admin', 'priest', 'school', 'seminary'] },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" />, roles: ['bishop', 'admin', 'priest', 'school', 'seminary'] },
];

export function GlobalNav({ activeTab, onNavigate, role, onLogout }: GlobalNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(role));

  // Memoized handler to prevent unnecessary re-renders
  const handleNavigate = React.useCallback((tab: string) => {
    onNavigate(tab);
    setIsMenuOpen(false);
  }, [onNavigate]);

  const getRoleLabel = () => {
    const roleLabels = {
      bishop: 'Bishop',
      admin: 'Administrator',
      priest: 'Parish Priest',
      school: 'School',
      seminary: 'Seminary',
    };
    return roleLabels[role];
  };

  return (
    <>
      {/* Top Navigation Bar - Always visible above sidebar */}
      <nav className="sticky top-0 z-50 bg-black text-white border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Left: Logo & Brand */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 border border-[#D4AF37] rounded-lg flex items-center justify-center text-[#D4AF37] shrink-0">
                <Church className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="hidden sm:flex flex-col min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-white/60 uppercase tracking-wider">Diocese of San Pablo</p>
                <p className="text-xs sm:text-sm font-medium text-white truncate">{getRoleLabel()}</p>
              </div>
            </div>

            {/* Center: Desktop Navigation (hidden on mobile) */}
            <div className="hidden md:flex items-center gap-1 flex-1 px-4">
              {visibleItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === item.id
                      ? 'bg-[#D4AF37] text-black'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Right: Logout Button (Desktop) & Mobile Menu */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={onLogout}
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden lg:inline">Logout</span>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-gray-800 py-3 space-y-1">
              {visibleItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === item.id
                      ? 'bg-[#D4AF37] text-black'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
              <button
                onClick={() => {
                  onLogout();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all border-t border-gray-800 mt-2 pt-3"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
