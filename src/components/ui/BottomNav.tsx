'use client';

import React from 'react';
import { Home, Church, User, Settings, Zap, Bell, Heart } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  role?: string;
}

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home, roles: ['bishop', 'admin'] },
  { id: 'parish-dashboard', label: 'Parish', icon: Church, roles: ['parish_priest', 'parish_secretary'] },
  { id: 'priest-dashboard', label: 'Priest', icon: User, roles: ['parish_priest'] },
  { id: 'aitwin', label: 'Digital Twin', icon: Zap, roles: ['bishop', 'admin', 'school', 'seminary'] },
  { id: 'announcements', label: 'News', icon: Bell, roles: ['bishop', 'admin', 'parish_priest', 'parish_secretary'] },
  { id: 'health', label: 'Health', icon: Heart, roles: ['bishop', 'admin'] },
  { id: 'settings', label: 'Settings', icon: Settings, roles: ['bishop', 'admin', 'parish_priest', 'parish_secretary', 'school', 'seminary'] },
];

export function BottomNav({ activeTab, onNavigate, role = 'bishop' }: BottomNavProps) {
  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50 flex justify-between items-center safe-area-bottom">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${
              isActive ? 'text-church-green' : 'text-gray-400'
            }`}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span className={`text-[10px] font-medium ${isActive ? 'text-church-green' : 'text-gray-400'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
