'use client';

import React from 'react';
import { PriestDashboard } from './PriestDashboard';

interface ParishContainerProps {
  role: 'parish_priest' | 'parish_secretary' | 'bishop' | 'admin';
  timeframe: '6m' | '1y' | 'all';
  year: number;
  onYearChange: (year: number) => void;
  onNavigate: (tab: string) => void;
  onLogout: () => void;
}

export function ParishContainer({
  role,
  timeframe,
  year,
  onYearChange,
  onNavigate,
  onLogout,
}: ParishContainerProps) {
  const mapTimeframe = (tf: '6m' | '1y' | 'all'): '3m' | '6m' | '12m' => {
    if (tf === '6m') return '6m';
    if (tf === '1y') return '12m';
    return '12m'; // 'all' maps to 12m
  };

  const mappedTimeframe = mapTimeframe(timeframe);

  return (
    <div className="flex flex-col h-full min-h-screen w-full bg-church-light overflow-auto">
      <div className="p-4 lg:p-6">
        <PriestDashboard
          role="priest"
          timeframe={mappedTimeframe}
          year={year}
          onYearChange={onYearChange}
          onNavigate={onNavigate}
          onLogout={onLogout}
          isEmbedded={true}
        />
      </div>
    </div>
  );
}
