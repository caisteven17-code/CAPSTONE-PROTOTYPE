'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { TrendingUp, AlertTriangle, ArrowUpDown, Search, BrainCircuit, HeartPulse, Info, X, TrendingDown, Filter, Download, ChevronRight, ArrowUpRight, ArrowDownRight, Menu, Settings, Bell, User, LogOut, HelpCircle, FileText, Activity, Target, Zap, Clock, CalendarDays, Sparkles, ArrowRight, ArrowUp, Cpu, Award } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Line, LineChart, AreaChart, Area, ComposedChart, PieChart, Pie, Cell, Tooltip, Legend,
  ReferenceArea, ReferenceLine
} from 'recharts';
import { dataService } from '../services/dataService';
import { FinancialRecord, FinancialHealthScore, DiagnosticResult } from '../types';
import { auth } from '../firebase';
import { FinancialHealthGauge } from '../components/ui/FinancialHealthGauge';
import { HealthDimensionBar } from '../components/ui/HealthDimensionBar';
import { DiagnosticCard } from '../components/ui/DiagnosticCard';
import { StewardChatbot } from '../components/ui/StewardChatbot';
import { DashboardHeader } from '../components/layout/DashboardHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { DataImportExport } from '../components/projects/DataImportExport';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, formatMillions } from '../lib/format';
import { usePriestDashboardData } from '../hooks/usePriestDashboardData';
import { FadeIn } from '../components/ui/FadeIn';

interface PriestDashboardProps {
  role?: 'priest' | 'school' | 'seminary' | 'bishop';
  entityName?: string;
  entityType?: string;
  entityClass?: string;
  isEmbedded?: boolean;
  timeframe?: '3m' | '6m' | '12m';
  year?: number;
  onNavigate?: (page: string) => void;
  onYearChange?: (year: number) => void;
  onLogout?: () => void;
}

const stripVicariatePrefix = (name: string) => name.replace('Vicariate of ', '');

const COMPARISON_MONTH_OPTIONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const COMPARISON_YEAR_OPTIONS = ['2024', '2025', '2026'] as const;
const GENERATE_COMPARISON_REPORT_EVENT = 'generate-comparison-report';

interface ComparisonRecord {
  period: string;
  collections: number;
  budget: number;
  variance: number;
  variancePercent: number;
  year: string;
}

const donationTrendsData = [
  { name: 'Msgr. Gerardo Santos', barValue: 1250000, lineValue: 3450000 },
  { name: 'Fr. Juan Dela Cruz', barValue: 980000, lineValue: 2100000 },
  { name: 'Fr. Ricardo Reyes', barValue: 750000, lineValue: 1500000 },
  { name: 'Fr. Miguel Santos', barValue: 620000, lineValue: 1100000 },
  { name: 'Fr. Antonio Luna', barValue: 450000, lineValue: 800000 },
  { name: 'Fr. Jose Rizal', barValue: 380000, lineValue: 600000 },
  { name: 'Fr. Andres Bonifacio', barValue: 250000, lineValue: 400000 },
  { name: 'Fr. Emilio Aguinaldo', barValue: 120000, lineValue: 250000 },
  { name: 'Fr. Apolinario Mabini', barValue: 85000, lineValue: 150000 },
  { name: 'Fr. Marcelo H. Del Pilar', barValue: 60000, lineValue: 50000 },
];

const CustomizedTick = (props: any) => {
  const { x, y, payload, fontSize = 11 } = props;
  const value = typeof payload.value === 'string' ? stripVicariatePrefix(payload.value) : payload.value;
  const words = value.split(' ');
  
  if (words.length > 5) {
    const line1 = words.slice(0, 5).join(' ');
    const line2 = words.slice(5).join(' ');
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={12} textAnchor="end" fill="#6B7280" fontSize={fontSize} fontWeight={500} transform="rotate(-25)">
          <tspan x={0} dy="0">{line1}</tspan>
          <tspan x={0} dy="1.2em">{line2}</tspan>
        </text>
      </g>
    );
  }
  
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="end" fill="#6B7280" fontSize={fontSize} fontWeight={500} transform="rotate(-25)">
        {value}
      </text>
    </g>
  );
};

const CustomForecastTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Filter out null values (future actuals)
    const validPayload = payload.filter((entry: any) => entry.value !== null && entry.value !== undefined);
    
    if (validPayload.length === 0) return null;

    return (
      <div className="bg-white p-4 border border-gray-100 shadow-xl rounded-xl">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{label}</p>
        <div className="space-y-1.5">
          {validPayload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                <span className="text-xs font-medium text-gray-600">{entry.name}:</span>
              </div>
              <span className="text-xs font-bold text-church-black">
                {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const AdvancedForecastChart = ({ 
  data, 
  actualKey, 
  forecastKey, 
  yAxisLabel, 
  title,
  metrics = {
    mae: 35.22,
    rmse: 42.02,
    mape: 20.88,
    mase: 0.380,
    wape: 19.72,
    mpe: 4.46
  }
}: { 
  data: any[], 
  actualKey: string, 
  forecastKey: string, 
  yAxisLabel: string,
  title: string,
  metrics?: any
}) => {
  const pastEnd = 'Apr';
  const presentEnd = 'May';
  const futureEnd = 'Jun';

  // Process data to ensure historical line stops at present, and forecast starts at present
  const processedData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const presentIndex = months.indexOf(presentEnd);
    const pastIndex = months.indexOf(pastEnd);
    
    return data.map(item => {
      const itemIndex = months.indexOf(item.month);
      const actualFieldName = `${actualKey}_actual`;
      const forecastFieldName = `${forecastKey}_forecast`;
      
      return {
        ...item,
        [actualFieldName]: itemIndex <= presentIndex ? item[actualKey] : null,
        [forecastFieldName]: itemIndex >= pastIndex ? item[forecastKey] : null
      };
    });
  }, [data, actualKey, forecastKey, presentEnd, pastEnd]);

  return (
    <div className="flex flex-col w-full bg-white/50 rounded-2xl p-3 border border-gray-100/50">
      <div className="h-[240px] flex items-center">
        <div className="w-8 flex-shrink-0 flex items-center justify-center h-full">
          <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em] -rotate-90 whitespace-nowrap">{yAxisLabel}</span>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={processedData} margin={{ top: 20, right: 20, left: 5, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#F3F4F6" />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }} 
              tickFormatter={(value) => `${value / 1000}k`} 
              width={40} 
            />
            <Tooltip content={<CustomForecastTooltip />} />
            
            <ReferenceArea x1="Jan" x2={pastEnd} fill="#F0F9FF" fillOpacity={0.4} label={{ position: 'insideTopLeft', value: 'PAST', fill: '#0EA5E9', fontSize: 8, fontWeight: 800, offset: 10 }} />
            <ReferenceArea x1={pastEnd} x2={presentEnd} fill="#FFF7ED" fillOpacity={0.4} label={{ position: 'insideTopLeft', value: 'PRESENT', fill: '#F97316', fontSize: 8, fontWeight: 800, offset: 10 }} />
            <ReferenceArea x1={presentEnd} x2={futureEnd} fill="#F0FDF4" fillOpacity={0.4} label={{ position: 'insideTopLeft', value: 'FUTURE', fill: '#22C55E', fontSize: 8, fontWeight: 800, offset: 10 }} />
            
            <ReferenceLine x={presentEnd} stroke="#D1D5DB" strokeDasharray="4 4" label={{ position: 'top', value: 'SPLIT', fill: '#9CA3AF', fontSize: 8, fontWeight: 700 }} />

            <Line 
              type="monotone" 
              dataKey={`${actualKey}_actual`} 
              name="Historical (Actual)" 
              stroke="#1a472a" 
              strokeWidth={3} 
              dot={{ r: 3, fill: '#1a472a', strokeWidth: 2, stroke: '#fff' }} 
              activeDot={{ r: 6, strokeWidth: 0 }} 
              connectNulls={false}
            />
            <Line 
              type="monotone" 
              dataKey={`${forecastKey}_forecast`} 
              name="Forecast (ML Model)" 
              stroke="#D4AF37" 
              strokeWidth={3} 
              strokeDasharray="8 4"
              dot={{ r: 3, fill: '#D4AF37', strokeWidth: 2, stroke: '#fff' }} 
              activeDot={{ r: 6, strokeWidth: 0 }} 
            />
            
            <Legend 
              verticalAlign="top" 
              align="right" 
              height={40} 
              iconType="circle" 
              wrapperStyle={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#4B5563' }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-6 bg-gray-50/50 rounded-xl p-3 border border-gray-100">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Model Performance Metrics</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[8px] font-bold text-green-600 uppercase tracking-wider">Active Learning</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-gray-400 uppercase tracking-wider font-bold">
                <th className="text-left pb-1.5 pl-1.5">Model</th>
                <th className="text-center pb-1.5">MAE</th>
                <th className="text-center pb-1.5">RMSE</th>
                <th className="text-center pb-1.5">MAPE%</th>
                <th className="text-center pb-1.5">MASE</th>
                <th className="text-center pb-1.5 pr-1.5">WAPE%</th>
              </tr>
            </thead>
            <tbody className="text-church-black font-semibold">
              <tr className="bg-white rounded-lg shadow-sm">
                <td className="py-2 pl-2 rounded-l-lg border-y border-l border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <div className="p-0.5 bg-gold-50 rounded">
                      <Cpu className="w-2.5 h-2.5 text-gold-600" />
                    </div>
                    <span>LSTM + Seasonal</span>
                  </div>
                </td>
                <td className="text-center py-2 border-y border-gray-100">{metrics.mae}</td>
                <td className="text-center py-2 border-y border-gray-100">{metrics.rmse}</td>
                <td className="text-center py-2 border-y border-gray-100 text-gold-600 font-bold">{metrics.mape}%</td>
                <td className="text-center py-2 border-y border-gray-100">{metrics.mase}</td>
                <td className="text-center py-2 pr-2 rounded-r-lg border-y border-r border-gray-100">{metrics.wape}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-center gap-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
        <p className="text-[8px] font-bold text-gray-300 uppercase tracking-[0.15em]">
          {title}
        </p>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
      </div>
    </div>
  );
};

export function PriestDashboard({ 
  role = 'priest',
  entityName,
  entityType,
  entityClass,
  isEmbedded = false,
  timeframe = '6m',
  year = 2026,
  onNavigate,
  onYearChange,
  onLogout
}: PriestDashboardProps) {
  const [analyticsView, setAnalyticsView] = useState<'descriptive' | 'predictive' | 'prescriptive' | 'health'>('descriptive');
  const [selectedDiagnostic, setSelectedDiagnostic] = useState<DiagnosticResult | null>(null);
  const [collectionsTimeframe, setCollectionsTimeframe] = useState<'6m' | '12m'>('12m');
  const [disbursementsTimeframe, setDisbursementsTimeframe] = useState<'6m' | '12m'>('12m');
  const [collectionsFilter, setCollectionsFilter] = useState<'all' | 'collections_mass' | 'sacraments_rate' | 'collections_other'>('all');
  const [disbursementsFilter, setDisbursementsFilter] = useState<'all' | 'expenses_parish' | 'expenses_pastoral'>('all');
  const [budgetFilter, setBudgetFilter] = useState<'all' | 'budget' | 'actual'>('all');
  const [enrollmentFilter, setEnrollmentFilter] = useState<'all' | 'enrollment' | 'capacity'>('all');
  const [staffRatioFilter, setStaffRatioFilter] = useState<'all' | 'seminarians' | 'staff'>('all');
  const [formationFilter, setFormationFilter] = useState<'all' | 'propaedeutic' | 'philosophy' | 'theology'>('all');
  const [pipelineFilter, setPipelineFilter] = useState<'all' | 'applicants' | 'admitted'>('all');
  const [attritionFilter, setAttritionFilter] = useState<'all' | 'risk' | 'actual'>('all');
  const [yieldFilter, setYieldFilter] = useState<'all' | 'yield' | 'target'>('all');
  const [collectionsDisbursementsFilter, setCollectionsDisbursementsFilter] = useState<'all' | 'collections' | 'disbursements'>('all');
  const [enrollmentForecastFilter, setEnrollmentForecastFilter] = useState<'all' | 'enrollment' | 'capacity'>('all');
  const [ratioFilter, setRatioFilter] = useState<'all' | 'staff' | 'seminarians'>('all');
  const [clusteringFilter, setClusteringFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [optimizationFilter, setOptimizationFilter] = useState<'all' | 'personnel' | 'utilities' | 'programs'>('all');
  const [donationTrendsFilter, setDonationTrendsFilter] = useState<'all' | 'actual' | 'potential'>('all');
  const [donationTrendsMode, setDonationTrendsMode] = useState<'amount' | 'performance'>('performance');
  const [showPriestFilters, setShowPriestFilters] = useState(false);
  const [comparisonMonth1, setComparisonMonth1] = useState<(typeof COMPARISON_MONTH_OPTIONS)[number]>('Jan');
  const [comparisonYear1, setComparisonYear1] = useState<(typeof COMPARISON_YEAR_OPTIONS)[number]>('2025');
  const [comparisonMonth2, setComparisonMonth2] = useState<(typeof COMPARISON_MONTH_OPTIONS)[number]>('Jan');
  const [comparisonYear2, setComparisonYear2] = useState<(typeof COMPARISON_YEAR_OPTIONS)[number]>('2026');
  const [medicalStatusFilter, setMedicalStatusFilter] = useState<'all' | 'urgent' | 'followup'>('all');
  const [priestScope, setPriestScope] = useState<'overall' | 'specific'>('overall');

  const mappedType = useMemo(() => {
    if (role === 'priest') return 'parish';
    if (role === 'school') return 'school';
    if (role === 'seminary') return 'seminary';
    return 'parish';
  }, [role]);

  const currentEntityId = useMemo(() => isEmbedded ? entityName : auth.currentUser?.uid, [isEmbedded, entityName]);

  const { 
    records, 
    healthScore, 
    kpis, 
    isLoading, 
    userEntityInfo 
  } = usePriestDashboardData(
    currentEntityId,
    mappedType as any,
    entityClass
  );

  // Filter main dashboard records based on navbar timeframe selector
  const filteredRecords = useMemo(() => {
    if (timeframe === '3m') return records.slice(-3);
    if (timeframe === '6m') return records.slice(-6);
    return records; // '12m' or 'all' - return all records
  }, [timeframe, records]);

  const filteredCollectionsData = useMemo(() => {
    return filteredRecords;
  }, [filteredRecords]);

  const filteredDisbursementsData = useMemo(() => {
    return filteredRecords;
  }, [filteredRecords]);

  const donationTrendDisplayData = useMemo(() => {
    const totalActual = donationTrendsData.reduce((sum, row) => sum + row.barValue, 0);
    const totalPotential = donationTrendsData.reduce((sum, row) => sum + row.lineValue, 0);

    return donationTrendsData.map((row) => ({
      ...row,
      barPercentage: totalActual > 0 ? (row.barValue / totalActual) * 100 : 0,
      linePercentage: totalPotential > 0 ? (row.lineValue / totalPotential) * 100 : 0,
    }));
  }, []);

  const handleDiagnosticRequest = async (month: string) => {
    const entityId = isEmbedded ? entityName : (auth.currentUser?.entityId || 'default');
    const result = await dataService.getDiagnostic(entityId as string, month);
    setSelectedDiagnostic(result);
  };

  // Helper for backward compatibility - always shows all sections since search is removed
  const isVisible = () => true;

  const totalCollections = useMemo(() => filteredRecords.reduce((sum, r) => sum + r.collections, 0), [filteredRecords]);
  const totalDisbursements = useMemo(() => filteredRecords.reduce((sum, r) => sum + r.disbursements, 0), [filteredRecords]);

  const priestAssignmentScore = useMemo(() => {
    const scoped = filteredRecords.slice(-12);
    const monthCount = scoped.length;

    if (monthCount === 0) return null;

    const clamp = (value: number) => Math.max(0, Math.min(100, value));
    const rollingAverage = (series: number[], windowSize: number) => {
      return series.map((_, index) => {
        const start = Math.max(0, index - windowSize + 1);
        const window = series.slice(start, index + 1);
        return window.reduce((sum, value) => sum + value, 0) / window.length;
      });
    };
    const collections = scoped.map((r) => r.collections || 0);
    const disbursements = scoped.map((r) => r.disbursements || 0);
    const net = collections.map((c, i) => c - disbursements[i]);
    const smoothedCollections = rollingAverage(collections, 3);
    const smoothedNet = rollingAverage(net, 3);

    const totalC = collections.reduce((sum, value) => sum + value, 0);
    const totalD = disbursements.reduce((sum, value) => sum + value, 0);
    const meanCollections = smoothedCollections.reduce((sum, value) => sum + value, 0) / monthCount;
    const variance = smoothedCollections.reduce((sum, value) => sum + Math.pow(value - meanCollections, 2), 0) / monthCount;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = meanCollections > 0 ? stdDev / meanCollections : 1;

    const positiveMonths = net.filter((value) => value > 0).length;
    const positiveRate = (positiveMonths / monthCount) * 100;

    const segmentSize = Math.max(1, Math.floor(monthCount / 3));
    const earlyWindow = smoothedCollections.slice(0, segmentSize);
    const lateWindow = smoothedCollections.slice(-segmentSize);
    const earlyAvg = earlyWindow.reduce((sum, value) => sum + value, 0) / earlyWindow.length;
    const lateAvg = lateWindow.reduce((sum, value) => sum + value, 0) / lateWindow.length;
    const growthPct = earlyAvg > 0 ? ((lateAvg - earlyAvg) / earlyAvg) * 100 : 0;

    const classFactorMap: Record<string, number> = {
      'Class A': 0.80,
      'Class B': 0.90,
      'Class C': 1.00,
      'Class D': 1.10,
      'Class E': 1.20,
    };
    const classFactor = classFactorMap[entityClass || userEntityInfo.class || 'Class C'] || 1;

    const contribution = clamp((positiveRate * 0.6) + (Math.min(100, (totalC / (monthCount * 220000)) * 100) * 0.4));
    const growthConsistency = clamp(50 + (growthPct * 1.8) + (positiveRate * 0.2));
    const discipline = clamp(totalC > 0 ? (50 + (((totalC - totalD) / totalC) * 100)) : 0);
    const stability = clamp(100 - (coefficientOfVariation * 120));
    const assignmentBase = Math.min(100, (totalC / (monthCount * 220000)) * 100);
    const assignmentFairness = clamp(assignmentBase * classFactor);

    const weightedNeutral =
      (contribution * 0.30) +
      (growthConsistency * 0.25) +
      (discipline * 0.20) +
      (stability * 0.15) +
      (assignmentBase * 0.10);

    const weightedWithContext =
      (contribution * 0.30) +
      (growthConsistency * 0.25) +
      (discipline * 0.20) +
      (stability * 0.15) +
      (assignmentFairness * 0.10);

    const contextAdjustment = Math.max(-10, Math.min(10, weightedWithContext - weightedNeutral));
    const rawComposite = weightedNeutral + contextAdjustment;

    const confidenceFactor = Math.min(1, monthCount / 6);
    const compositeScore = Math.round(50 + ((rawComposite - 50) * confidenceFactor));
    const isProvisional = monthCount < 6;

    const prevWindow = smoothedNet.slice(-6, -3);
    const currWindow = smoothedNet.slice(-3);
    const prevAvg = prevWindow.length
      ? prevWindow.reduce((sum, value) => sum + value, 0) / prevWindow.length
      : 0;
    const currAvg = currWindow.length
      ? currWindow.reduce((sum, value) => sum + value, 0) / currWindow.length
      : 0;
    const trendDelta = prevAvg !== 0 ? ((currAvg - prevAvg) / Math.abs(prevAvg)) * 100 : (currAvg > 0 ? 100 : 0);

    const trend: 'up' | 'down' | 'stable' = trendDelta > 2 ? 'up' : trendDelta < -2 ? 'down' : 'stable';

    const dimensions = {
      contribution,
      growthConsistency,
      discipline,
      stability,
      assignmentFairness,
    };

    const weakest = Object.entries(dimensions).sort((a, b) => a[1] - b[1])[0];
    const weakestLabelMap: Record<string, string> = {
      contribution: 'Contribution Quality',
      growthConsistency: 'Growth Consistency',
      discipline: 'Financial Discipline',
      stability: 'Stability',
      assignmentFairness: 'Assignment Context',
    };

    return {
      compositeScore,
      trend,
      trendDelta,
      confidenceMonths: monthCount,
      isProvisional,
      dimensions,
      weakestDimension: weakestLabelMap[weakest[0]] || 'Stability',
    };
  }, [filteredRecords, entityClass, userEntityInfo.class]);

  const seasonalityData = useMemo(() => filteredRecords.map(r => ({
    month: r.month,
    value: (r.collections / 10000).toFixed(0)
  })), [filteredRecords]);

  const seminaryDonationSources = useMemo(() => [
    { name: 'Diocesan Support', value: 35, color: '#1a472a' },
    { name: 'Parish Support', value: 25, color: '#D4AF37' },
    { name: 'Alumni Giving', value: 20, color: '#1a472a' },
    { name: 'Individual Donors', value: 15, color: '#E6C27A' },
    { name: 'Grants', value: 5, color: '#1a472a' },
  ], []);

  const formationStageData = useMemo(() => [
    { stage: 'Propaedeutic', count: 15 },
    { stage: 'Philosophy', count: 35 },
    { stage: 'Theology', count: 45 },
    { stage: 'Pastoral Year', count: 12 },
    { stage: 'Deaconate', count: 8 },
  ], []);

  const attritionRiskData = useMemo(() => [
    { year: '1st Year', risk: 15, historical: 12 },
    { year: '2nd Year', risk: 8, historical: 10 },
    { year: '3rd Year', risk: 5, historical: 7 },
    { year: '4th Year', risk: 3, historical: 4 },
  ], []);

  const vocationYieldData = useMemo(() => [
    { region: 'Holy Family', inquiries: 45, accepted: 8 },
    { region: 'San Isidro Labrador', inquiries: 32, accepted: 5 },
    { region: 'San Pedro Apostol', inquiries: 28, accepted: 4 },
    { region: 'Sta. Rosa De Lima', inquiries: 15, accepted: 2 },
  ], []);

  const endowmentGrowthData = useMemo(() => [
    { year: '2021', amount: 5.2 },
    { year: '2022', amount: 5.8 },
    { year: '2023', amount: 6.5 },
    { year: '2024', amount: 7.2 },
    { year: '2025', amount: 8.1 },
  ], []);

  const vocationInterestData = useMemo(() => [
    { month: 'Jan', inquiries: 45 },
    { month: 'Feb', inquiries: 52 },
    { month: 'Mar', inquiries: 48 },
    { month: 'Apr', inquiries: 61 },
    { month: 'May', inquiries: 55 },
    { month: 'Jun', inquiries: 67 },
  ], []);

  const seminaryEnrollmentData = useMemo(() => [
    { year: '2021', students: 85 },
    { year: '2022', students: 92 },
    { year: '2023', students: 105 },
    { year: '2024', students: 118 },
    { year: '2025', students: 125 },
  ], []);

  const enrollmentForecastData = useMemo(() => [
    { year: '2021', enrollment: 85, capacity: 150 },
    { year: '2022', enrollment: 92, capacity: 150 },
    { year: '2023', enrollment: 105, capacity: 150 },
    { year: '2024', enrollment: 118, capacity: 150 },
    { year: '2025', enrollment: 125, capacity: 150 },
  ], []);

  const vocationPipelineData = useMemo(() => [
    { stage: 'Inquiry', count: 45 },
    { stage: 'Application', count: 28 },
    { stage: 'Interview', count: 18 },
    { stage: 'Accepted', count: 12 },
  ], []);

  const seminaryCostBreakdown = useMemo(() => [
    { name: 'Faculty & Staff', value: 40, color: '#1a472a' },
    { name: 'Maintenance', value: 20, color: '#D4AF37' },
    { name: 'Food & Board', value: 25, color: '#1a472a' },
    { name: 'Utilities', value: 15, color: '#E6C27A' },
  ], []);

  const staffRatioData = useMemo(() => [
    { name: 'Full-time Faculty', count: 12 },
    { name: 'Part-time Faculty', count: 8 },
    { name: 'Spiritual Directors', count: 5 },
    { name: 'Support Staff', count: 15 },
  ], []);

  const budgetVsActualData = useMemo(() => [
    { month: 'Jan', budget: 350000, actual: 365000, variance: 15000 },
    { month: 'Feb', budget: 350000, actual: 340000, variance: -10000 },
    { month: 'Mar', budget: 380000, actual: 410000, variance: 30000 },
    { month: 'Apr', budget: 400000, actual: 425000, variance: 25000 },
    { month: 'May', budget: 380000, actual: 375000, variance: -5000 },
    { month: 'Jun', budget: 350000, actual: 360000, variance: 10000 },
  ], []);

  const comparisonData = useMemo<ComparisonRecord[]>(() => {
    const month1Data = budgetVsActualData.find(d => d.month === comparisonMonth1);
    const month2Data = budgetVsActualData.find(d => d.month === comparisonMonth2);
    
    if (!month1Data || !month2Data) return [];
    
    return [
      {
        period: `${comparisonMonth1} ${comparisonYear1}`,
        collections: month1Data.actual,
        budget: month1Data.budget,
        variance: month1Data.actual - month1Data.budget,
        variancePercent: month1Data.budget > 0 ? ((month1Data.actual - month1Data.budget) / month1Data.budget) * 100 : 0,
        year: comparisonYear1
      },
      {
        period: `${comparisonMonth2} ${comparisonYear2}`,
        collections: month2Data.actual,
        budget: month2Data.budget,
        variance: month2Data.actual - month2Data.budget,
        variancePercent: month2Data.budget > 0 ? ((month2Data.actual - month2Data.budget) / month2Data.budget) * 100 : 0,
        year: comparisonYear2
      }
    ];
  }, [comparisonMonth1, comparisonYear1, comparisonMonth2, comparisonYear2, budgetVsActualData]);

  const comparisonDelta = useMemo(() => {
    if (comparisonData.length !== 2) {
      return { amount: 0, percent: 0 };
    }

    const amount = comparisonData[1].collections - comparisonData[0].collections;
    const percent = comparisonData[0].collections > 0 ? (amount / comparisonData[0].collections) * 100 : 0;
    return { amount, percent };
  }, [comparisonData]);

  const handleGenerateComparisonReport = useCallback(() => {
    if (comparisonData.length !== 2) return;

    const [periodOne, periodTwo] = comparisonData;

    const reportLines = [
      'STEWARDSHIP COMPARISON REPORT',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      `Period 1: ${periodOne.period}`,
      `  Collections: ${formatCurrency(periodOne.collections)}`,
      `  Budget: ${formatCurrency(periodOne.budget)}`,
      `  Variance: ${formatCurrency(periodOne.variance)} (${periodOne.variancePercent.toFixed(1)}%)`,
      '',
      `Period 2: ${periodTwo.period}`,
      `  Collections: ${formatCurrency(periodTwo.collections)}`,
      `  Budget: ${formatCurrency(periodTwo.budget)}`,
      `  Variance: ${formatCurrency(periodTwo.variance)} (${periodTwo.variancePercent.toFixed(1)}%)`,
      '',
      `Comparison: ${comparisonDelta.amount >= 0 ? '+' : ''}${formatCurrency(comparisonDelta.amount)} (${comparisonDelta.percent.toFixed(1)}%)`,
    ];

    const blob = new Blob([reportLines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stewardship-comparison-${comparisonMonth1}-${comparisonYear1}-vs-${comparisonMonth2}-${comparisonYear2}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [comparisonData, comparisonDelta, comparisonMonth1, comparisonMonth2, comparisonYear1, comparisonYear2]);

  useEffect(() => {
    const handleGlobalGenerateReport = () => handleGenerateComparisonReport();

    window.addEventListener(GENERATE_COMPARISON_REPORT_EVENT, handleGlobalGenerateReport);
    return () => {
      window.removeEventListener(GENERATE_COMPARISON_REPORT_EVENT, handleGlobalGenerateReport);
    };
  }, [handleGenerateComparisonReport]);

  const clusteringData = useMemo(() => [
    { week: 'Week 1', value: 85, status: 'high' },
    { week: 'Week 2', value: 65, status: 'medium' },
    { week: 'Week 3', value: 45, status: 'low' },
    { week: 'Week 4', value: 75, status: 'high' },
    { week: 'Week 5', value: 90, status: 'high' },
    { week: 'Week 6', value: 55, status: 'medium' },
  ], []);

  const optimizationData = useMemo(() => [
    { category: 'Personnel', current: 450000, optimized: 410000, savings: 40000 },
    { category: 'Utilities', current: 120000, optimized: 95000, savings: 25000 },
    { category: 'Programs', current: 280000, optimized: 250000, savings: 30000 },
    { category: 'Maintenance', current: 150000, optimized: 135000, savings: 15000 },
  ], []);

  const priestMedicalSubmissionQueue = useMemo(() => [
    { name: 'Fr. Noel Artillaga', vicariate: 'South Vicariate', priestClass: 'Class D', birthMonth: 'January', lastSubmission: 'Dec 2024', category: 'urgent' as const },
    { name: 'Fr. Michael Santos', vicariate: 'Central Vicariate', priestClass: 'Class C', birthMonth: 'February', lastSubmission: 'Jan 2025', category: 'urgent' as const },
    { name: 'Fr. Rafael Mendoza', vicariate: 'North Vicariate', priestClass: 'Class B', birthMonth: 'March', lastSubmission: 'Mar 2025', category: 'followup' as const },
    { name: 'Fr. Paulo Dela Cruz', vicariate: 'East Vicariate', priestClass: 'Class C', birthMonth: 'April', lastSubmission: 'Apr 2025', category: 'followup' as const },
    { name: 'Fr. Vincent Reyes', vicariate: 'West Vicariate', priestClass: 'Class A', birthMonth: 'February', lastSubmission: 'Feb 2025', category: 'urgent' as const },
  ], []);

  const priestsPendingMedicalResults = useMemo(() => {
    const monthIndex: Record<string, number> = {
      January: 0,
      February: 1,
      March: 2,
      April: 3,
      May: 4,
      June: 5,
      July: 6,
      August: 7,
      September: 8,
      October: 9,
      November: 10,
      December: 11,
    };
    const currentMonth = new Date().getMonth();

    return priestMedicalSubmissionQueue
      .filter((row) => monthIndex[row.birthMonth] < currentMonth)
      .filter((row) => medicalStatusFilter === 'all' || row.category === medicalStatusFilter);
  }, [priestMedicalSubmissionQueue, medicalStatusFilter]);

  const seasonalExpenseSpikes = useMemo(() => [
    { event: 'Holy Week', month: 'March/April', expectedIncrease: '+25%', driver: 'Liturgical supplies, extra staff, security' },
    { event: 'Fiesta Season', month: 'May', expectedIncrease: '+40%', driver: 'Decorations, food, stipends for guest priests' },
    { event: 'Back to School', month: 'August', expectedIncrease: '+15%', driver: 'Scholarships, school supplies distribution' },
    { event: 'Christmas', month: 'December', expectedIncrease: '+35%', driver: 'Simbang Gabi expenses, bonuses, charity' },
  ], []);

  // In a real app, this would be filtered by the logged-in user's entity ID
  const entityInfo = useMemo(() => {
    if (entityName && entityType && entityClass) {
      return { name: entityName, type: entityType, class: entityClass };
    }
    return userEntityInfo;
  }, [entityName, entityType, entityClass, userEntityInfo]);

  const entityLabel = role === 'school' ? 'School' : role === 'seminary' ? 'Seminary' : role === 'priest' ? 'Priest' : 'Parish';
  const isPriestOverallView = role === 'priest' && priestScope === 'overall';

  const displayEntityName = useMemo(() => {
    if (isPriestOverallView) return 'All Priests in Diocese';
    return entityInfo.name;
  }, [isPriestOverallView, entityInfo.name]);

  const handleImportRecords = async (importedRecords: FinancialRecord[]) => {
    try {
      // Add entityId and entityType to records
      const recordsWithEntity = importedRecords.map(record => ({
        ...record,
        entityId: entityInfo.name.toLowerCase().replace(/\s+/g, '_'),
        entityType: role as 'parish' | 'school' | 'seminary',
        year: year,
      }));
      
      // Save to dataService
      await dataService.saveRecords(recordsWithEntity);
    } catch (error) {
      console.error('Error importing records:', error);
    }
  };

  if (isLoading && !isEmbedded) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-church-green"></div>
      </div>
    );
  }

  return (
    <>
      {role !== 'priest' && (
        <DashboardHeader 
          title="Parish Financial Dashboard"
          subtitle={entityInfo.name}
          priestName="Parish Priest: Rev. Fr. Noel Artillaga"
          userInitial={auth.currentUser?.email?.[0]?.toUpperCase() || 'P'}
          timeframe={timeframe as '3m' | '6m' | '12m'}
          onTimeframeChange={(tf) => {
            // Since timeframe is passed as prop, we need onTimeframeChange from props
            // For now, just trigger year change for demo
          }}
          year={year}
          onYearChange={onYearChange}
          onSettingsClick={() => {
            onNavigate?.('settings');
          }}
          onLogout={() => {
            localStorage.removeItem('currentUser');
            onLogout?.();
          }}
        />
      )}

      {role === 'priest' && (
        <div className="max-w-[1800px] mx-auto px-4 md:px-6 lg:px-12 pt-4 md:pt-5">
          <div className="bg-black rounded-full px-4 md:px-5 py-2.5 flex items-center justify-between shadow-xl border border-white/5 gap-3">
            <button
              onClick={() => setShowPriestFilters((prev) => !prev)}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black border border-white/15 text-gray-200 hover:text-white hover:border-gold-400/40 transition-all"
            >
              <Filter size={14} />
              <span className="text-xs font-black uppercase tracking-[0.2em]">Filters</span>
            </button>

            <div className="flex items-center gap-3 flex-wrap justify-end">
              <div className="w-9 h-9 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center text-black font-black border border-gold-300 shadow-[0_0_16px_rgba(212,175,55,0.35)]">
                {auth.currentUser?.email?.[0]?.toUpperCase() || 'P'}
              </div>
            </div>
          </div>

          {showPriestFilters && (
            <div className="mt-3 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center gap-3 flex-wrap">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Scope</label>
              <select
                value={priestScope}
                onChange={(e) => setPriestScope(e.target.value as 'overall' | 'specific')}
                className="bg-gray-100 border-none text-[10px] font-bold text-church-green rounded-lg px-3 py-2 outline-none cursor-pointer hover:bg-gray-200 transition-colors"
              >
                <option value="overall">OVERALL DIOCESE PRIESTS</option>
                <option value="specific">SPECIFIC FILTERED VIEW</option>
              </select>

              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Medical Queue</label>
              <select
                value={medicalStatusFilter}
                onChange={(e) => setMedicalStatusFilter(e.target.value as 'all' | 'urgent' | 'followup')}
                className="bg-gray-100 border-none text-[10px] font-bold text-church-green rounded-lg px-3 py-2 outline-none cursor-pointer hover:bg-gray-200 transition-colors"
              >
                <option value="all">ALL PENDING</option>
                <option value="urgent">URGENT OVERDUE</option>
                <option value="followup">FOLLOW-UP REQUIRED</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-6 pb-24 md:pb-12 max-w-[1800px] mx-auto px-4 md:px-6 lg:px-12 pt-6 md:pt-5">
      {/* Welcome & Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Welcome Card */}
        <FadeIn 
          direction="up"
          className="lg:col-span-2 bg-gradient-to-br from-[#FFFBF0] via-white to-white border-none rounded-[1.5rem] p-5 shadow-xl flex flex-col justify-center relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-gold-500/10 transition-colors duration-700"></div>
          <div className={`relative z-10 ${role === 'priest' ? 'grid gap-5 md:grid-cols-[minmax(0,1fr)_220px] md:items-center' : 'space-y-5'}`}>
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 bg-gold-50 text-gold-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-gold-100 shadow-sm">
                <Sparkles size={12} />
                <span>Welcome</span>
              </div>
              <h2 className="font-serif text-4xl md:text-5xl text-church-green leading-[1.1] tracking-tight">
                {entityLabel} <br className="hidden md:block" />
                <span className="text-gold-600 italic">Dashboard</span>
              </h2>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 shadow-sm">
                  {displayEntityName}
                </span>
                {role === 'priest' && (
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5 shadow-sm flex items-center gap-1.5">
                    <AlertTriangle size={12} />
                    Medical Results Follow-up
                  </span>
                )}
              </div>
            </div>

            {role === 'priest' && (
              <div className="relative mx-auto hidden h-full w-full max-w-[220px] md:flex items-end justify-center">
                <div className="absolute inset-x-6 bottom-0 h-24 rounded-[2rem] bg-gradient-to-t from-black/10 to-transparent blur-2xl"></div>
                <div className="relative flex h-[240px] w-[180px] items-end justify-center">
                  <div className="absolute bottom-0 h-[190px] w-[132px] rounded-t-[4rem] rounded-b-[2.4rem] bg-gradient-to-b from-black via-[#161616] to-[#050505] shadow-[0_24px_40px_rgba(0,0,0,0.25)]"></div>
                  <div className="absolute bottom-[126px] h-7 w-10 rounded-b-2xl bg-white shadow-sm"></div>
                  <div className="absolute bottom-[112px] h-12 w-16 rounded-t-[1rem] bg-[#0f0f0f]"></div>
                  <div className="absolute bottom-[176px] h-16 w-16 rounded-full bg-[#f3d8bc] shadow-md"></div>
                  <div className="absolute bottom-[206px] h-9 w-[74px] rounded-t-full rounded-b-[1.6rem] bg-[#151515]"></div>
                  <div className="absolute bottom-[104px] flex w-full justify-center">
                    <div className="rounded-full border border-gold-200 bg-white/95 px-3 py-1 text-[9px] font-black uppercase tracking-[0.25em] text-gold-600 shadow-lg">
                      Parish Priest
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </FadeIn>
        
        {/* Submission Tracking / Entity Profile */}
        <FadeIn 
          direction="up"
          delay={0.1}
          className="lg:col-span-2"
        >
          <div className="h-full bg-gradient-to-b from-white to-white/50 rounded-[1.5rem] p-6 shadow-xl border border-gray-100/50 relative overflow-hidden group flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gold-500 rounded-full"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-gold-500/10 transition-colors duration-700"></div>
            
            <div className="flex flex-col gap-1 relative z-10">
              <div className="bg-church-green/5 text-church-green px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest w-fit border border-church-green/10 mb-1">
                {entityLabel} Profile
              </div>
              <h1 className="text-3xl md:text-4xl font-serif font-black text-church-green tracking-tight">
                {isPriestOverallView ? 'Diocese Priests Overview' : entityInfo.name}
              </h1>
              <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-400 font-black uppercase tracking-[0.15em] mt-1">
                <span>{isPriestOverallView ? 'Diocese of San Pablo' : stripVicariatePrefix(entityInfo.type)}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-gold-500"></span>
                <span className="text-gold-600">{isPriestOverallView ? 'Overall' : entityInfo.class}</span>
              </div>
            </div>

            <div className="mt-6 space-y-2.5 relative z-10">
              {role === 'priest' ? (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Medical Submission Tracking</p>
                    <span className="text-[9px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded-lg font-black uppercase tracking-wider border border-orange-100">
                      Action Required
                    </span>
                  </div>

                  <p className="text-[10px] text-gray-500 font-semibold mb-2">
                    Priests with pending medical results despite birth month already passed
                  </p>

                  <div className="max-h-[280px] overflow-y-auto pr-1 space-y-2">
                    {priestsPendingMedicalResults.map((item) => (
                      <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group/item hover:bg-gold-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm border border-gray-100 text-church-green">
                            <HeartPulse size={16} />
                          </div>
                          <div>
                            <p className="text-base md:text-lg font-black text-black leading-tight">{item.name}</p>
                            <p className="text-[11px] text-gray-500 font-black uppercase tracking-[0.12em]">
                              {item.vicariate} • {item.priestClass}
                            </p>
                            <p className="text-[11px] text-gray-600 font-semibold mt-0.5">
                              Birth Month: {item.birthMonth} • Last Submitted: {item.lastSubmission}
                            </p>
                          </div>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded-lg font-black uppercase tracking-wider border ${
                          item.category === 'urgent'
                            ? 'bg-red-50 text-red-700 border-red-100'
                            : 'bg-orange-50 text-orange-700 border-orange-100'
                        }`}>
                          {item.category === 'urgent' ? 'URGENT' : 'FOLLOW-UP'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {priestsPendingMedicalResults.length === 0 && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm border border-gray-100 text-church-green">
                          <HeartPulse size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-700">No pending priest medical submissions</p>
                          <p className="text-[10px] text-gray-500 font-semibold">All required priests are up to date.</p>
                        </div>
                      </div>
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg font-black uppercase tracking-wider border border-emerald-100">
                        Cleared
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group/item hover:bg-gold-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm border border-gray-100 text-church-green">
                        <FileText size={16} />
                      </div>
                      <span className="text-xs font-bold text-gray-600">Monthly Remittance</span>
                    </div>
                    <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg font-black uppercase tracking-wider border border-emerald-100">Submitted</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group/item hover:bg-gold-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm border border-gray-100 text-church-green">
                        <Activity size={16} />
                      </div>
                      <span className="text-xs font-bold text-gray-600">Quarterly Audit</span>
                    </div>
                    <span className="text-[9px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded-lg font-black uppercase tracking-wider border border-orange-100">Pending</span>
                  </div>

                  {role !== 'seminary' && (
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <div className="mb-3">
                        <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Data Management</p>
                        <DataImportExport
                          entityName={entityInfo.name}
                          entityType={role as 'parish' | 'school' | 'seminary'}
                          year={year || 2026}
                          onImport={handleImportRecords}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </FadeIn>
      </div>

      {role === 'seminary' && (
        <FadeIn direction="up" delay={0.15}>
          <DataImportExport
            entityName={entityInfo.name}
            entityType="seminary"
            year={year || 2026}
            onImport={handleImportRecords}
          />
        </FadeIn>
      )}


      {/* Priest Assignment Health Score */}
      {priestAssignmentScore && (
        <FadeIn 
          direction="up"
          className="grid grid-cols-1 gap-3"
        >
            <Card className="border-none shadow-xl bg-white overflow-hidden group relative">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-church-green z-10"></div>
              <div className="absolute top-0 right-0 w-48 h-48 bg-church-green/5 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-church-green/10 transition-colors duration-700"></div>
              <CardHeader className="pb-1 pt-4 relative z-20">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-church-green text-white flex items-center justify-center shadow-md shadow-church-green/20">
                        <Award size={16} />
                      </div>
                      <h3 className="text-lg md:text-xl font-black text-church-green tracking-tight uppercase">Priest Assignment Health Score</h3>
                      <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-blue-100 shadow-sm">
                        <Sparkles size={10} />
                        <span>Frontend Preview</span>
                      </div>
                      {priestAssignmentScore.isProvisional && (
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-amber-100 shadow-sm">
                          <Clock size={10} />
                          <span>Provisional</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] md:text-xs text-gray-400 font-medium ml-10">Performance of priest in assigned parish (local dashboard computation)</p>
                  </div>
                  <div className="flex flex-col items-start sm:items-end bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Confidence</span>
                    <span className="text-[10px] font-black text-church-green">{priestAssignmentScore.confidenceMonths} mo. data{priestAssignmentScore.isProvisional ? ' (provisional)' : ''}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 pb-6 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-center">
                  <div className="lg:col-span-5 flex flex-col items-center justify-center relative py-2">
                    <div className="absolute inset-0 bg-radial-gradient from-church-green/10 to-transparent opacity-50 blur-2xl"></div>
                    <FinancialHealthGauge 
                      score={priestAssignmentScore.compositeScore} 
                      size={220} 
                      description={`Assignment performance is ${priestAssignmentScore.compositeScore >= 70 ? 'in the strong zone' : priestAssignmentScore.compositeScore >= 50 ? 'in the watch zone' : 'in the intervention zone'}.`}
                    />
                  </div>
                  <div className="lg:col-span-7">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                      <div className="sm:col-span-2 mb-1 flex items-center justify-between">
                        <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Dimension Breakdown</h4>
                        <div className="h-px flex-1 bg-gradient-to-r from-gray-100 to-transparent mx-3"></div>
                      </div>
                      <HealthDimensionBar label="Contribution" score={Math.round(priestAssignmentScore.dimensions.contribution)} weight={30} />
                      <HealthDimensionBar label="Growth Consistency" score={Math.round(priestAssignmentScore.dimensions.growthConsistency)} weight={25} />
                      <HealthDimensionBar label="Discipline" score={Math.round(priestAssignmentScore.dimensions.discipline)} weight={20} />
                      <HealthDimensionBar label="Stability" score={Math.round(priestAssignmentScore.dimensions.stability)} weight={15} />
                      <div className="sm:col-span-2">
                        <HealthDimensionBar label="Assignment Context" score={Math.round(priestAssignmentScore.dimensions.assignmentFairness)} weight={10} />
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-gradient-to-br from-church-green/5 to-transparent rounded-2xl border border-church-green/10 flex items-start gap-3 relative overflow-hidden">
                      <div className="w-10 h-10 rounded-xl bg-church-green text-white flex items-center justify-center shrink-0 shadow-lg shadow-church-green/20">
                        <BrainCircuit size={20} />
                      </div>
                      <div className="relative z-10">
                        <h5 className="text-[9px] font-black text-church-green uppercase tracking-[0.2em] mb-1">Steward's Insight</h5>
                        <p className="text-xs text-gray-600 leading-relaxed font-medium">
                          {`Strongest visibility comes from contribution and trend behavior. Current focus area: ${priestAssignmentScore.weakestDimension}.`}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-2">
                          {priestAssignmentScore.trend === 'up' ? `Trend improving (+${priestAssignmentScore.trendDelta.toFixed(1)}%)` : priestAssignmentScore.trend === 'down' ? `Trend declining (${priestAssignmentScore.trendDelta.toFixed(1)}%)` : 'Trend stable'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
        </FadeIn>
      )}
           {/* Diagnostic Insights Section */}
      {selectedDiagnostic && (
        <FadeIn direction="up" className="mb-8">
          <DiagnosticCard 
            diagnostic={selectedDiagnostic} 
            onClose={() => setSelectedDiagnostic(null)} 
          />
        </FadeIn>
      )}

      {/* KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {isVisible(`MONTHLY ${entityLabel.toUpperCase()} COLLECTIONS / RECEIPTS`) && (
          <FadeIn 
            direction="up"
            className="bg-white rounded-[1.5rem] p-5 shadow-xl border-none relative overflow-hidden group hover:-translate-y-1 transition-all duration-500 min-h-[140px] flex flex-col"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-church-green/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-church-green/10 transition-colors"></div>
            <div>
              <h3 className="text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase mb-2 relative z-10">Monthly {entityLabel} Collections</h3>
              <div className="text-2xl md:text-3xl font-black text-church-green tracking-tighter relative z-10 group-hover:scale-105 transition-transform origin-left duration-500 line-clamp-1">
                {formatCurrency(totalCollections)}
              </div>
            </div>
            <div className="flex items-center justify-between w-full mt-auto pt-3 relative z-10">
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg text-[9px] font-black border border-emerald-100 shadow-sm whitespace-nowrap">
                  <ArrowUpRight className="w-2.5 h-2.5 flex-shrink-0" /> +4.2%
                </span>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider hidden sm:inline">vs last month</span>
              </div>
              <button 
                onClick={() => handleDiagnosticRequest('Jan')}
                className="w-8 h-8 bg-gray-50 hover:bg-gold-500 hover:text-black rounded-lg text-church-green transition-all duration-300 flex items-center justify-center border border-gray-100 hover:border-gold-600 shadow-sm flex-shrink-0"
                title="AI Diagnostic"
              >
                <BrainCircuit size={16} />
              </button>
            </div>
          </FadeIn>
        )}
        
        {isVisible(`MONTHLY ${entityLabel.toUpperCase()} DISBURSEMENTS`) && (
          <FadeIn 
            direction="up"
            delay={0.1}
            className="bg-white rounded-[1.5rem] p-5 shadow-xl border-none relative overflow-hidden group hover:-translate-y-1 transition-all duration-500 min-h-[140px] flex flex-col"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-red-500/10 transition-colors"></div>
            <div>
              <h3 className="text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase mb-2 relative z-10">Monthly {entityLabel} Disbursements</h3>
              <div className="text-2xl md:text-3xl font-black text-church-green tracking-tighter relative z-10 group-hover:scale-105 transition-transform origin-left duration-500 line-clamp-1">
                {formatCurrency(totalDisbursements)}
              </div>
            </div>
            <div className="flex items-center gap-1.5 relative z-10 mt-auto pt-3">
              <span className="flex items-center gap-1 bg-red-50 text-red-700 px-2 py-0.5 rounded-lg text-[9px] font-black border border-red-100 shadow-sm whitespace-nowrap">
                <ArrowUp className="w-2.5 h-2.5 flex-shrink-0" /> +1.2%
              </span>
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider hidden sm:inline">vs last month</span>
            </div>
          </FadeIn>
        )}

        <FadeIn 
          direction="up"
          delay={0.2}
          className="bg-white rounded-[1.5rem] p-5 shadow-xl border-none relative overflow-hidden group hover:-translate-y-1 transition-all duration-500 min-h-[140px] flex flex-col"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gold-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-gold-500/10 transition-colors"></div>
          <div>
            <h3 className="text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase mb-2 relative z-10">Net Balance</h3>
            <div className="text-2xl md:text-3xl font-black text-gold-600 tracking-tighter relative z-10 group-hover:scale-105 transition-transform origin-left duration-500 line-clamp-1">
              {formatCurrency(totalCollections - totalDisbursements)}
            </div>
          </div>
          <div className="flex items-center gap-1.5 relative z-10 mt-auto pt-3">
            <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg text-[9px] font-black border border-emerald-100 shadow-sm whitespace-nowrap">
              <TrendingUp className="w-2.5 h-2.5 flex-shrink-0" /> Healthy
            </span>
          </div>
        </FadeIn>

        {isVisible('CLASSIFICATION') && (
          <FadeIn 
            direction="up"
            delay={0.3}
            className="bg-white rounded-[1.5rem] p-5 shadow-xl border-none relative overflow-hidden group hover:-translate-y-1 transition-all duration-500 min-h-[140px] flex flex-col"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gold-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-gold-500/10 transition-colors"></div>
            <div>
              <h3 className="text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase mb-2 relative z-10">Classification</h3>
              <div className="text-4xl md:text-5xl font-black text-gold-500 tracking-tighter relative z-10 group-hover:scale-105 transition-transform origin-left duration-500">
                {entityInfo.class}
              </div>
            </div>
            <div className="flex items-center justify-end relative z-10 mt-auto pt-4">
              <div className="w-9 h-9 bg-gold-50 rounded-xl text-gold-600 flex items-center justify-center border border-gold-100 shadow-sm flex-shrink-0">
                <Award size={18} />
              </div>
            </div>
          </FadeIn>
        )}
      </div>


      {/* Analytics Toggle (Line + Text) */}
      <div className="relative flex justify-center py-2">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-[#E2E8F0]"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-church-light px-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.3em]">{entityLabel} Analytics</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-2 overflow-x-auto pb-2 scrollbar-hide">
        <div className="grid grid-cols-4 bg-black rounded-full p-1 min-w-max md:w-full max-w-4xl items-center shadow-xl border border-white/5">
          <button
            onClick={() => setAnalyticsView("descriptive")}
            className={`w-full rounded-full text-[9px] md:text-[10px] font-black transition-all uppercase tracking-[0.2em] whitespace-nowrap ${
              analyticsView === "descriptive" 
                ? "bg-white text-gold-600 py-3 md:py-4 px-4 md:px-8 shadow-lg" 
                : "bg-transparent text-gray-500 hover:text-gray-300 py-3 md:py-4 px-4 md:px-8"
            }`}
          >
            Descriptive
          </button>
          <button
            onClick={() => setAnalyticsView("health")}
            className={`w-full rounded-full text-[9px] md:text-[10px] font-black transition-all uppercase tracking-[0.2em] whitespace-nowrap ${
              analyticsView === "health" 
                ? "bg-white text-gold-600 py-3 md:py-4 px-4 md:px-8 shadow-lg" 
                : "bg-transparent text-gray-500 hover:text-gray-300 py-3 md:py-4 px-4 md:px-8"
            }`}
          >
            Diagnostic
          </button>
          <button
            onClick={() => setAnalyticsView("predictive")}
            className={`w-full rounded-full text-[9px] md:text-[10px] font-black transition-all uppercase tracking-[0.2em] whitespace-nowrap ${
              analyticsView === "predictive" 
                ? "bg-white text-gold-600 py-3 md:py-4 px-4 md:px-8 shadow-lg" 
                : "bg-transparent text-gray-500 hover:text-gray-300 py-3 md:py-4 px-4 md:px-8"
            }`}
          >
            Predictive
          </button>
          <button
            onClick={() => setAnalyticsView("prescriptive")}
            className={`w-full rounded-full text-[9px] md:text-[10px] font-black transition-all uppercase tracking-[0.2em] whitespace-nowrap ${
              analyticsView === "prescriptive" 
                ? "bg-white text-gold-600 py-3 md:py-4 px-4 md:px-8 shadow-lg" 
                : "bg-transparent text-gray-500 hover:text-gray-300 py-3 md:py-4 px-4 md:px-8"
            }`}
          >
            Prescriptive
          </button>
        </div>
      </div>

      {/* Diagnostic View Content */}
      {analyticsView === 'health' && healthScore && (
        <div className="grid grid-cols-1 gap-6">
        </div>
      )}

      {/* Diagnostic Overlay */}
      <AnimatePresence>
        {selectedDiagnostic && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="max-w-2xl w-full relative">
              <button 
                onClick={() => setSelectedDiagnostic(null)}
                className="absolute -top-12 right-0 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
              <DiagnosticCard diagnostic={selectedDiagnostic} />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Charts Area */}
      {analyticsView === 'descriptive' && (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Descriptive Analytics</p>
                <h3 className="text-lg font-black text-church-green">Priest Stewardship Current-State View</h3>
              </div>
              <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                <Target size={12} />
                <span>Current performance, mix, and discipline</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-church-green">Period Comparison</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">Month 1</label>
                <select
                  value={comparisonMonth1}
                  onChange={(e) => setComparisonMonth1(e.target.value as (typeof COMPARISON_MONTH_OPTIONS)[number])}
                  className="w-full mt-2 bg-gray-100 border-none text-[11px] font-bold text-church-green rounded-lg px-3 py-2 outline-none cursor-pointer"
                >
                  {COMPARISON_MONTH_OPTIONS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">Year 1</label>
                <select
                  value={comparisonYear1}
                  onChange={(e) => setComparisonYear1(e.target.value as (typeof COMPARISON_YEAR_OPTIONS)[number])}
                  className="w-full mt-2 bg-gray-100 border-none text-[11px] font-bold text-church-green rounded-lg px-3 py-2 outline-none cursor-pointer"
                >
                  {COMPARISON_YEAR_OPTIONS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">Month 2</label>
                <select
                  value={comparisonMonth2}
                  onChange={(e) => setComparisonMonth2(e.target.value as (typeof COMPARISON_MONTH_OPTIONS)[number])}
                  className="w-full mt-2 bg-gray-100 border-none text-[11px] font-bold text-church-green rounded-lg px-3 py-2 outline-none cursor-pointer"
                >
                  {COMPARISON_MONTH_OPTIONS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">Year 2</label>
                <select
                  value={comparisonYear2}
                  onChange={(e) => setComparisonYear2(e.target.value as (typeof COMPARISON_YEAR_OPTIONS)[number])}
                  className="w-full mt-2 bg-gray-100 border-none text-[11px] font-bold text-church-green rounded-lg px-3 py-2 outline-none cursor-pointer"
                >
                  {COMPARISON_YEAR_OPTIONS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {comparisonData.length === 2 && (
              <>
                <div className="h-[280px] mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} tickFormatter={(value) => `${value / 1000}k`} width={50} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="collections" fill="#1a472a" name="Actual Collections" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="budget" fill="#D4AF37" name="Budget" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-2">Period 1 Collections</p>
                    <p className="text-2xl font-bold text-church-green">{formatCurrency(comparisonData[0].collections)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-2">Period 2 Collections</p>
                    <p className="text-2xl font-bold text-church-green">{formatCurrency(comparisonData[1].collections)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-2">Growth/Decline</p>
                    <p className={`text-2xl font-bold ${comparisonDelta.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {comparisonDelta.amount >= 0 ? '+' : ''}{formatCurrency(comparisonDelta.amount)}
                    </p>
                    <p className={`text-xs font-semibold mt-1 ${comparisonDelta.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ({comparisonDelta.percent.toFixed(1)}%)
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-5">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-church-green">Donation Trends by Priest Assignment</h3>
                <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setDonationTrendsMode('performance')}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-colors ${donationTrendsMode === 'performance' ? 'bg-white text-church-green shadow-sm' : 'text-gray-500 hover:text-church-green'}`}
                  >
                    Performance %
                  </button>
                  <button
                    type="button"
                    onClick={() => setDonationTrendsMode('amount')}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-colors ${donationTrendsMode === 'amount' ? 'bg-white text-church-green shadow-sm' : 'text-gray-500 hover:text-church-green'}`}
                  >
                    Income Amount
                  </button>
                </div>
              </div>
              <select
                value={donationTrendsFilter}
                onChange={(e) => setDonationTrendsFilter(e.target.value as 'all' | 'actual' | 'potential')}
                className="bg-gray-100 border-none text-[10px] font-bold text-church-green rounded-lg px-3 py-2 outline-none cursor-pointer hover:bg-gray-200 transition-colors"
              >
                <option value="all">ALL CATEGORIES</option>
                <option value="actual">ACTUAL DONATIONS</option>
                <option value="potential">PROJECTED POTENTIAL</option>
              </select>
            </div>
            <div className="h-[320px] flex items-center">
              <div className="w-8 flex-shrink-0 flex items-center justify-center h-full">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] -rotate-90 whitespace-nowrap">{donationTrendsMode === 'performance' ? 'Performance (%)' : 'Amount (PHP)'}</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={donationTrendDisplayData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="priestDonationGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4AF37" stopOpacity={1} />
                      <stop offset="100%" stopColor="#B5952F" stopOpacity={0.85} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" axisLine={{ stroke: '#E5E7EB' }} tickLine={false} tick={<CustomizedTick fontSize={9} />} interval={0} height={78} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10 }} tickFormatter={(value) => donationTrendsMode === 'performance' ? `${Number(value).toFixed(0)}%` : formatMillions(value)} width={50} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      donationTrendsMode === 'performance' ? `${value.toFixed(2)}%` : formatCurrency(value),
                      name === 'barValue' || name === 'barPercentage'
                        ? (donationTrendsMode === 'performance' ? 'Actual Share of Total Income' : 'Actual Donations')
                        : (donationTrendsMode === 'performance' ? 'Potential Share of Total Income' : 'Projected Potential')
                    ]}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '11px' }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
                    formatter={(value) =>
                      value === 'barValue' || value === 'barPercentage'
                        ? (donationTrendsMode === 'performance' ? 'Actual Share of Total Income' : 'Actual Donations')
                        : (donationTrendsMode === 'performance' ? 'Potential Share of Total Income' : 'Projected Potential')
                    }
                  />
                  {(donationTrendsFilter === 'all' || donationTrendsFilter === 'actual') && (
                    <Bar
                      dataKey={donationTrendsMode === 'performance' ? 'barPercentage' : 'barValue'}
                      name={donationTrendsMode === 'performance' ? 'Actual Share of Total Income' : 'Actual Donations'}
                      fill="url(#priestDonationGradient)"
                      radius={[5, 5, 0, 0]}
                      maxBarSize={38}
                    />
                  )}
                  {(donationTrendsFilter === 'all' || donationTrendsFilter === 'potential') && (
                    <Line
                      type="monotone"
                      dataKey={donationTrendsMode === 'performance' ? 'linePercentage' : 'lineValue'}
                      name={donationTrendsMode === 'performance' ? 'Potential Share of Total Income' : 'Projected Potential'}
                      stroke="#1a472a"
                      strokeWidth={3}
                      dot={{ r: 3, fill: '#1a472a', stroke: '#fff', strokeWidth: 1.5 }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-2 text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">Priest</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-church-green">Budget vs Actual Stewardship</h3>
              <select
                value={budgetFilter}
                onChange={(e) => setBudgetFilter(e.target.value as 'all' | 'budget' | 'actual')}
                className="bg-gray-100 border-none text-[10px] font-bold text-church-green rounded-lg px-3 py-2 outline-none cursor-pointer hover:bg-gray-200 transition-colors"
              >
                <option value="all">ALL</option>
                <option value="budget">BUDGET</option>
                <option value="actual">ACTUAL</option>
              </select>
            </div>
            <div className="h-[300px] flex items-center">
              <div className="w-6 flex-shrink-0 flex items-center justify-center h-full">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] -rotate-90 whitespace-nowrap">Amount (PHP)</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetVsActualData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={true} stroke="#E5E7EB" />
                  <XAxis dataKey="month" axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} />
                  <YAxis axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} tickFormatter={(value) => `${value / 1000}k`} width={40} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  {(budgetFilter === 'all' || budgetFilter === 'budget') && (
                    <Bar dataKey="budget" name="Budget" fill="#D4AF37" radius={[3, 3, 0, 0]} barSize={budgetFilter === 'all' ? 14 : 28} />
                  )}
                  {(budgetFilter === 'all' || budgetFilter === 'actual') && (
                    <Bar dataKey="actual" name="Actual" fill="#1a472a" radius={[3, 3, 0, 0]} barSize={budgetFilter === 'all' ? 14 : 28} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-2 text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">Month</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-church-green">Collections Trend</h3>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={budgetVsActualData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} tickFormatter={(value) => `${value / 1000}k`} width={50} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="actual" stroke="#1a472a" strokeWidth={3} dot={{ r: 3 }} name="Actual Collections" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {analyticsView === 'prescriptive' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Prescriptive Analytics</p>
                <h3 className="text-lg font-black text-church-green">Priest Action Playbook</h3>
              </div>
              <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                <Zap size={12} />
                <span>Recommended actions to improve stewardship</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-church-green">Priest-Led Cost Optimization Opportunities</h3>
              <select
                value={optimizationFilter}
                onChange={(e) => setOptimizationFilter(e.target.value as 'all' | 'personnel' | 'utilities' | 'programs')}
                className="bg-gray-100 border-none text-[10px] font-bold text-church-green rounded-lg px-3 py-2 outline-none cursor-pointer hover:bg-gray-200 transition-colors"
              >
                <option value="all">ALL CATEGORIES</option>
                <option value="personnel">PERSONNEL</option>
                <option value="utilities">UTILITIES</option>
                <option value="programs">PROGRAMS</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {optimizationData
                .filter((row) => {
                  if (optimizationFilter === 'all') return true;
                  return row.category.toLowerCase() === optimizationFilter;
                })
                .map((row) => (
                  <div key={row.category} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">{row.category}</p>
                    <p className="text-xs text-gray-500 font-bold">Current: {formatCurrency(row.current)}</p>
                    <p className="text-xs text-gray-500 font-bold">Optimized: {formatCurrency(row.optimized)}</p>
                    <p className="text-sm font-black text-emerald-700 mt-2">Savings: {formatCurrency(row.savings)}</p>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-church-green mb-5">Priest Seasonal Expense Risk Calendar</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-100">
                    <th className="py-3 pr-4">Event</th>
                    <th className="py-3 pr-4">Month</th>
                    <th className="py-3 pr-4">Expected Increase</th>
                    <th className="py-3">Primary Cost Driver</th>
                  </tr>
                </thead>
                <tbody>
                  {seasonalExpenseSpikes.map((item) => (
                    <tr key={item.event} className="border-b border-gray-50">
                      <td className="py-3 pr-4 font-bold text-church-green">{item.event}</td>
                      <td className="py-3 pr-4 text-gray-600 font-semibold">{item.month}</td>
                      <td className="py-3 pr-4 text-orange-700 font-bold">{item.expectedIncrease}</td>
                      <td className="py-3 text-gray-600">{item.driver}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <StewardChatbot currentEntityId={currentEntityId || undefined} />
      </div>
    </>
  );
}
