'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  description?: string;
}

export function KPICard({ title, value, icon: Icon, trend, trendUp, description }: KPICardProps) {
  return (
    <Card className="border-l-4 border-l-gold-500">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 mb-0">
        <CardTitle className="text-sm font-medium text-church-grey">{title}</CardTitle>
        <Icon className="h-5 w-5 text-gold-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-church-black">{value}</div>
        {(trend || description) && (
          <p className="text-xs text-gray-500 mt-1 flex items-center">
            {trend && (
              <span className={`mr-1 font-bold px-2 py-0.5 rounded-full ${trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {trend}
              </span>
            )}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
