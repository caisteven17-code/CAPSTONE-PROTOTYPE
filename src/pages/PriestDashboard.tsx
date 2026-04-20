'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
import { formatCurrency } from '../lib/format';
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
  const [weekdayWeekendFilter, setWeekdayWeekendFilter] = useState<'all' | 'weekday' | 'weekend'>('all');
  const [enrollmentFilter, setEnrollmentFilter] = useState<'all' | 'enrollment' | 'capacity'>('all');
  const [staffRatioFilter, setStaffRatioFilter] = useState<'all' | 'seminarians' | 'staff'>('all');
  const [formationFilter, setFormationFilter] = useState<'all' | 'propaedeutic' | 'philosophy' | 'theology'>('all');
  const [pipelineFilter, setPipelineFilter] = useState<'all' | 'applicants' | 'admitted'>('all');
  const [attritionFilter, setAttritionFilter] = useState<'all' | 'risk' | 'actual'>('all');
  const [yieldFilter, setYieldFilter] = useState<'all' | 'yield' | 'target'>('all');
  const [collectionsDisbursementsFilter, setCollectionsDisbursementsFilter] = useState<'all' | 'collections' | 'disbursements'>('all');
  const [enrollmentForecastFilter, setEnrollmentForecastFilter] = useState<'all' | 'enrollment' | 'capacity'>('all');
  const [priestGapFilter, setPriestGapFilter] = useState<'all' | 'retirements' | 'ordinations'>('all');
  const [ratioFilter, setRatioFilter] = useState<'all' | 'staff' | 'seminarians'>('all');
  const [massScheduleFilter, setMassScheduleFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');
  const [clusteringFilter, setClusteringFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [optimizationFilter, setOptimizationFilter] = useState<'all' | 'personnel' | 'utilities' | 'programs'>('all');

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

  const handleDiagnosticRequest = async (month: string) => {
    const entityId = isEmbedded ? entityName : (auth.currentUser?.entityId || 'default');
    const result = await dataService.getDiagnostic(entityId as string, month);
    setSelectedDiagnostic(result);
  };

  // Helper for backward compatibility - always shows all sections since search is removed
  const isVisible = () => true;

  const totalCollections = useMemo(() => filteredRecords.reduce((sum, r) => sum + r.collections, 0), [filteredRecords]);
  const totalDisbursements = useMemo(() => filteredRecords.reduce((sum, r) => sum + r.disbursements, 0), [filteredRecords]);
  
  const weekdayWeekendData = useMemo(() => filteredRecords.map(r => ({
    month: r.month,
    weekday: (r as any).weekdayDonations || r.collections * 0.3,
    weekend: (r as any).weekendDonations || r.collections * 0.7
  })), [filteredRecords]);

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

  const priestGapData = useMemo(() => [
    { year: '2026', retirements: 5, ordinations: 4 },
    { year: '2027', retirements: 3, ordinations: 6 },
    { year: '2028', retirements: 6, ordinations: 3 },
    { year: '2029', retirements: 4, ordinations: 7 },
    { year: '2030', retirements: 5, ordinations: 5 },
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

  const massScheduleData = useMemo(() => [
    { month: 'Jan', morning: 120000, afternoon: 150000, evening: 180000 },
    { month: 'Feb', morning: 115000, afternoon: 145000, evening: 175000 },
    { month: 'Mar', morning: 130000, afternoon: 160000, evening: 190000 },
    { month: 'Apr', morning: 150000, afternoon: 180000, evening: 210000 },
    { month: 'May', morning: 140000, afternoon: 170000, evening: 200000 },
    { month: 'Jun', morning: 125000, afternoon: 155000, evening: 185000 },
  ], []);

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

  const entityLabel = role === 'school' ? 'School' : role === 'seminary' ? 'Seminary' : 'Parish';

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
      
      // Update local state
      setRecords(recordsWithEntity);
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
          <div className="space-y-5 relative z-10">
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
                {entityInfo.name}
              </span>
              {role === 'priest' && (
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5 shadow-sm flex items-center gap-1.5">
                  <AlertTriangle size={12} />
                  Report Due in 3 Days
                </span>
              )}
            </div>
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
              <h1 className="text-3xl md:text-4xl font-serif font-black text-church-green tracking-tight">{entityInfo.name}</h1>
              <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-400 font-black uppercase tracking-[0.15em] mt-1">
                <span>{stripVicariatePrefix(entityInfo.type)}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-gold-500"></span>
                <span className="text-gold-600">{entityInfo.class}</span>
              </div>
            </div>

            <div className="mt-6 space-y-2.5 relative z-10">
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
              
              {/* Data Management Controls */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="mb-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Data Management</p>
                  <DataImportExport 
                    entityName={entityInfo.name}
                    entityType={role as 'parish' | 'school' | 'seminary'}
                    year={year || 2026}
                    onImport={handleImportRecords}
                  />
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>


      {/* Financial Health Overview (Moved here) */}
      {healthScore && (
        <FadeIn 
          direction="up"
          className="grid grid-cols-1 gap-3"
        >
          <Card className="border-none shadow-xl bg-white overflow-hidden group relative">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gold-500 z-10"></div>
            <div className="absolute top-0 right-0 w-48 h-48 bg-gold-500/5 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-gold-500/10 transition-colors duration-700"></div>
            <CardHeader className="pb-1 pt-4 relative z-20">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gold-500 text-black flex items-center justify-center shadow-md shadow-gold-500/20">
                      <HeartPulse size={16} />
                    </div>
                    <h3 className="text-lg md:text-xl font-black text-church-green tracking-tight uppercase">Financial Health Score</h3>
                    <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-emerald-100 shadow-sm">
                      <TrendingUp size={10} />
                      <span>+1.5% Trend</span>
                    </div>
                  </div>
                  <p className="text-[10px] md:text-xs text-gray-400 font-medium ml-10">Detailed performance analysis for {entityInfo.name}</p>
                </div>
                <div className="flex flex-col items-start sm:items-end bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Last Updated</span>
                  <span className="text-[10px] font-black text-church-green">March 2026</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 pb-6 relative z-20">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-center">
                <div className="lg:col-span-5 flex flex-col items-center justify-center relative py-2">
                  <div className="absolute inset-0 bg-radial-gradient from-gold-500/10 to-transparent opacity-50 blur-2xl"></div>
                  <FinancialHealthGauge 
                    score={healthScore.compositeScore} 
                    size={220} 
                    description={`Your ${entityLabel.toLowerCase()} is currently in the Optimal Zone.`}
                  />
                </div>
                <div className="lg:col-span-7">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                    <div className="sm:col-span-2 mb-1 flex items-center justify-between">
                      <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Dimension Breakdown</h4>
                      <div className="h-px flex-1 bg-gradient-to-r from-gray-100 to-transparent mx-3"></div>
                    </div>
                    <HealthDimensionBar label="Liquidity" score={healthScore.dimensions.liquidity} weight={30} />
                    <HealthDimensionBar label="Sustainability" score={healthScore.dimensions.sustainability} weight={25} />
                    <HealthDimensionBar label="Efficiency" score={healthScore.dimensions.efficiency} weight={20} />
                    <HealthDimensionBar label="Stability" score={healthScore.dimensions.stability} weight={15} />
                    <div className="sm:col-span-2">
                      <HealthDimensionBar label="Growth" score={healthScore.dimensions.growth} weight={10} />
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-gradient-to-br from-church-green/5 to-transparent rounded-2xl border border-church-green/10 flex items-start gap-3 relative overflow-hidden group/note">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-church-green/5 rounded-full -mr-8 -mt-8 blur-2xl group-hover/note:bg-church-green/10 transition-colors"></div>
                    <div className="w-10 h-10 rounded-xl bg-gold-500 text-black flex items-center justify-center shrink-0 shadow-lg shadow-gold-500/20 transform group-hover/note:rotate-6 transition-transform">
                      <BrainCircuit size={20} />
                    </div>
                    <div className="relative z-10">
                      <h5 className="text-[9px] font-black text-church-green uppercase tracking-[0.2em] mb-1">Steward's Insight</h5>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">
                        "Your {entityLabel.toLowerCase()} shows strong efficiency. However, building a larger sustainability reserve would provide better long-term stability."
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
        <div className="inline-flex bg-black rounded-full p-1 min-w-max md:w-full max-w-4xl items-center shadow-xl border border-white/5">
          <button
            onClick={() => setAnalyticsView("descriptive")}
            className={`flex-1 rounded-full text-[9px] md:text-[10px] font-black transition-all uppercase tracking-[0.2em] whitespace-nowrap ${
              analyticsView === "descriptive" 
                ? "bg-white text-gold-600 py-3 md:py-4 px-4 md:px-8 shadow-lg -my-1.5 -mx-1.5 z-10 scale-[1.02]" 
                : "bg-transparent text-gray-500 hover:text-gray-300 py-1.5 md:py-2 px-4 md:px-8"
            }`}
          >
            Descriptive
          </button>
          <button
            onClick={() => setAnalyticsView("health")}
            className={`flex-1 rounded-full text-[9px] md:text-[10px] font-black transition-all uppercase tracking-[0.2em] whitespace-nowrap ${
              analyticsView === "health" 
                ? "bg-white text-gold-600 py-3 md:py-4 px-4 md:px-8 shadow-lg -my-1.5 -mx-1.5 z-10 scale-[1.02]" 
                : "bg-transparent text-gray-500 hover:text-gray-300 py-1.5 md:py-2 px-4 md:px-8"
            }`}
          >
            Diagnostic
          </button>
          <button
            onClick={() => setAnalyticsView("predictive")}
            className={`flex-1 rounded-full text-[9px] md:text-[10px] font-black transition-all uppercase tracking-[0.2em] whitespace-nowrap ${
              analyticsView === "predictive" 
                ? "bg-white text-gold-600 py-3 md:py-4 px-4 md:px-8 shadow-lg -my-1.5 -mx-1.5 z-10 scale-[1.02]" 
                : "bg-transparent text-gray-500 hover:text-gray-300 py-1.5 md:py-2 px-4 md:px-8"
            }`}
          >
            Predictive
          </button>
          <button
            onClick={() => setAnalyticsView("prescriptive")}
            className={`flex-1 rounded-full text-[9px] md:text-[10px] font-black transition-all uppercase tracking-[0.2em] whitespace-nowrap ${
              analyticsView === "prescriptive" 
                ? "bg-white text-gold-600 py-3 md:py-4 px-4 md:px-8 shadow-lg -my-1.5 -mx-1.5 z-10 scale-[1.02]" 
                : "bg-transparent text-gray-500 hover:text-gray-300 py-1.5 md:py-2 px-4 md:px-8"
            }`}
          >
            Prescriptive
          </button>
        </div>
      </div>

      {/* Diagnostic View Content */}
      {analyticsView === 'health' && healthScore && (
        <div className="space-y-5 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
            <div className="bg-church-green rounded-3xl p-6 md:p-8 shadow-sm text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <HeartPulse size={120} />
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-gold-400 uppercase tracking-wide mb-2">Steward's Insights</h3>
                <p className="text-sm text-white/60 mb-6">Personalized for your {entityLabel.toLowerCase()}</p>
                
                <div className="bg-white/10 p-5 rounded-2xl border border-white/10 mb-6">
                  <p className="text-sm leading-relaxed italic">
                    "Your {entityLabel.toLowerCase()} shows strong efficiency in resource management. However, building a larger sustainability reserve would provide better long-term stability."
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                      <TrendingUp size={14} />
                    </div>
                    <p className="text-xs text-white/80">Efficiency score is in the top 15% of the diocese.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 flex-shrink-0">
                      <AlertTriangle size={14} />
                    </div>
                    <p className="text-xs text-white/80">Growth has slowed slightly compared to the previous semester.</p>
                  </div>
                </div>

                <button 
                  onClick={() => handleDiagnosticRequest('Jan')}
                  className="w-full mt-8 bg-gold-500 hover:bg-gold-600 text-church-green font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20"
                >
                  <BrainCircuit size={20} />
                  Analyze Root Causes
                </button>
              </div>
            </div>
          </div>

          {/* Budget vs Actual Disbursements */}
          {isVisible('Budget vs Actual Disbursements') && (
            <Card className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-200">
              <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg md:text-xl font-bold text-church-green">Budget vs Actual Disbursements</CardTitle>
                  <p className="text-xs text-gray-500">Variance analysis of planned vs actual expenses</p>
                </div>
                <select 
                  value={budgetFilter}
                  onChange={(e) => setBudgetFilter(e.target.value as any)}
                  className="bg-gray-100 border-none text-[10px] font-bold text-church-green rounded-lg px-2 py-1.5 outline-none cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  <option value="all">ALL</option>
                  <option value="budget">BUDGETED</option>
                  <option value="actual">ACTUAL</option>
                </select>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="h-[280px] flex items-center">
                  <div className="w-6 flex-shrink-0 flex items-center justify-center h-full">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] -rotate-90 whitespace-nowrap">Amount (PHP)</span>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={budgetVsActualData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={true} stroke="#E5E7EB" />
                      <XAxis dataKey="month" axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} />
                      <YAxis axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} tickFormatter={(value) => `${value / 1000}k`} width={40} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      {(budgetFilter === 'all' || budgetFilter === 'budget') && (
                        <Bar dataKey="budget" name="Budgeted" fill="#1a472a" radius={[2, 2, 0, 0]} barSize={budgetFilter === 'all' ? 15 : 30} />
                      )}
                      {(budgetFilter === 'all' || budgetFilter === 'actual') && (
                        <Bar dataKey="actual" name="Actual" fill="#D4AF37" radius={[2, 2, 0, 0]} barSize={budgetFilter === 'all' ? 15 : 30} />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-1 text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">Month</div>
                <div className="flex items-center gap-4 justify-center mt-2">
                  <div className={`flex items-center gap-2 transition-opacity ${budgetFilter === 'all' || budgetFilter === 'budget' ? 'opacity-100' : 'opacity-30'}`}>
                    <div className="w-2 h-2 rounded-full bg-[#1a472a]"></div>
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Budgeted</span>
                  </div>
                  <div className={`flex items-center gap-2 transition-opacity ${budgetFilter === 'all' || budgetFilter === 'actual' ? 'opacity-100' : 'opacity-30'}`}>
                    <div className="w-2 h-2 rounded-full bg-[#D4AF37]"></div>
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Actual</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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
        <>
          {/* Charts Row 1 - Monthly Collections and Top Categories Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isVisible('Monthly Collections vs Disbursements') && (
              <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg border border-gray-100 transition-shadow duration-300">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-church-green">Monthly Collections vs Disbursements</h3>
                  <select 
                    value={collectionsDisbursementsFilter}
                    onChange={(e) => setCollectionsDisbursementsFilter(e.target.value as any)}
                    className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 text-[10px] font-bold text-church-green rounded-lg px-3 py-2 outline-none cursor-pointer hover:from-gray-100 hover:to-gray-150 transition-all duration-200 shadow-sm"
                  >
                    <option value="all">ALL</option>
                    <option value="collections">COLLECTIONS</option>
                    <option value="disbursements">DISBURSEMENTS</option>
                  </select>
                </div>
                <div className="h-[280px] flex items-center">
                  <div className="w-6 flex-shrink-0 flex items-center justify-center h-full">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] -rotate-90 whitespace-nowrap">Amount (PHP)</span>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredRecords} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={true} stroke="#E5E7EB" />
                      <XAxis dataKey="month" axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} />
                      <YAxis axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} tickFormatter={(value) => `${value / 1000}k`} width={40} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      {(collectionsDisbursementsFilter === 'all' || collectionsDisbursementsFilter === 'collections') && (
                        <Bar dataKey="collections" name="Collections" fill="#D4AF37" radius={[2, 2, 0, 0]} barSize={collectionsDisbursementsFilter === 'all' ? 15 : 30} />
                      )}
                      {(collectionsDisbursementsFilter === 'all' || collectionsDisbursementsFilter === 'disbursements') && (
                        <Bar dataKey="disbursements" name="Disbursements" fill="#1a472a" radius={[2, 2, 0, 0]} barSize={collectionsDisbursementsFilter === 'all' ? 15 : 30} />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-2 text-[8px] font-semibold text-gray-500 uppercase tracking-[0.15em] letter-spacing">Month</div>
                <div className="flex items-center gap-6 justify-center mt-3">
                  <div className={`flex items-center gap-2 transition-all duration-200 ${collectionsDisbursementsFilter === 'all' || collectionsDisbursementsFilter === 'collections' ? 'opacity-100' : 'opacity-40'}`}>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] shadow-sm"></div>
                    <span className="text-[8px] font-semibold text-gray-600 uppercase tracking-wider">Collections</span>
                  </div>
                  <div className={`flex items-center gap-2 transition-all duration-200 ${collectionsDisbursementsFilter === 'all' || collectionsDisbursementsFilter === 'disbursements' ? 'opacity-100' : 'opacity-40'}`}>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1a472a] shadow-sm"></div>
                    <span className="text-[8px] font-semibold text-gray-600 uppercase tracking-wider">Disbursements</span>
                  </div>
                </div>
              </div>
            )}

            {isVisible('Top Disbursement Categories') && (
              <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg border border-gray-100 transition-shadow duration-300">
                <h3 className="text-lg font-bold text-church-green mb-5">Top Disbursement Categories</h3>
                <div className="h-[280px] flex items-center">
                  <div className="w-6 flex-shrink-0 flex items-center justify-center h-full">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] -rotate-90 whitespace-nowrap">Category</span>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { category: 'Salaries & Wages', amount: 850000, percentage: 35 },
                      { category: 'Utilities', amount: 420000, percentage: 17 },
                      { category: 'Pastoral Programs', amount: 380000, percentage: 16 },
                      { category: 'Maintenance', amount: 310000, percentage: 13 },
                      { category: 'Charitable Works', amount: 240000, percentage: 10 },
                      { category: 'Other', amount: 220000, percentage: 9 },
                    ]} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                      <XAxis type="number" axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 9 }} tickFormatter={(value) => `${value / 1000}k`} />
                      <YAxis dataKey="category" type="category" axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 9 }} width={100} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', fontSize: '10px' }} />
                      <Bar dataKey="amount" fill="#1a472a" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-1 text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">Amount (PHP)</div>
              </div>
            )}
          </div>

          {/* Seminary Section */}
          {role === 'seminary' ? (
            isVisible('Donation Sources Breakdown') && (
              <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg border border-gray-100 transition-shadow duration-300">
                    <h3 className="text-lg font-bold text-church-green mb-5">Donation Sources Breakdown</h3>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={seminaryDonationSources}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {seminaryDonationSources.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {isVisible('Formation Progress by Stage') && (
                    <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg border border-gray-100 transition-shadow duration-300">
                      <h3 className="text-lg font-bold text-church-green mb-5">Formation Progress by Stage</h3>
                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={vocationPipelineData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10 }} width={100} />
                            <Tooltip cursor={{ fill: '#F3F4F6' }} />
                            <Bar dataKey="count" fill="#D4AF37" radius={[0, 4, 4, 0]} barSize={20} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {isVisible('Staff-to-Seminarian Ratio') && (
                    <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg border border-gray-100 transition-shadow duration-300">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-lg font-bold text-church-green">Staff-to-Seminarian Ratio</h3>
                        <select 
                          value={ratioFilter}
                          onChange={(e) => setRatioFilter(e.target.value as any)}
                          className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 text-[10px] font-bold text-church-green rounded-lg px-3 py-2 outline-none cursor-pointer hover:from-gray-100 hover:to-gray-150 transition-all duration-200 shadow-sm"
                        >
                          <option value="all">ALL</option>
                          <option value="staff">STAFF</option>
                          <option value="seminarians">SEMINARIANS</option>
                        </select>
                      </div>
                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { year: '2021', staff: 12, seminarians: 45 },
                            { year: '2022', staff: 14, seminarians: 48 },
                            { year: '2023', staff: 15, seminarians: 52 },
                            { year: '2024', staff: 18, seminarians: 58 },
                            { year: '2025', staff: 20, seminarians: 65 },
                          ]} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={true} stroke="#E5E7EB" />
                            <XAxis dataKey="year" axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} />
                            <YAxis axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} width={40} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: '10px' }} />
                            {(ratioFilter === 'all' || ratioFilter === 'staff') && (
                              <Bar dataKey="staff" name="Staff Count" fill="#1a472a" radius={[2, 2, 0, 0]} barSize={ratioFilter === 'all' ? 15 : 30} />
                            )}
                            {(ratioFilter === 'all' || ratioFilter === 'seminarians') && (
                              <Bar dataKey="seminarians" name="Seminarian Count" fill="#D4AF37" radius={[2, 2, 0, 0]} barSize={ratioFilter === 'all' ? 15 : 30} />
                            )}
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : null}

          {/* Detailed Disbursement & Collections Analytics - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Disbursement Breakdown */}
            {isVisible('Disbursement Breakdown') && (
              <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg border border-gray-100 transition-shadow duration-300">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-church-green">Disbursement Breakdown</h3>
                  <select 
                      value={disbursementsFilter}
                      onChange={(e) => setDisbursementsFilter(e.target.value as any)}
                      className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 text-[8px] font-bold text-church-green rounded-lg px-3 py-1.5 outline-none cursor-pointer hover:from-gray-100 hover:to-gray-150 transition-all duration-200 shadow-sm"
                    >
                      <option value="all">ALL</option>
                      <option value="expenses_parish">PARISH</option>
                      <option value="expenses_pastoral">PASTORAL</option>
                    </select>
                </div>
                <div className="h-[280px] flex items-center">
                  <div className="w-6 flex-shrink-0 flex items-center justify-center h-full">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] -rotate-90 whitespace-nowrap">Amount (PHP)</span>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredDisbursementsData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={true} stroke="#E5E7EB" />
                      <XAxis dataKey="month" axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} />
                      <YAxis axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} tickFormatter={(value) => `${value / 1000}k`} width={40} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      {(disbursementsFilter === 'all' || disbursementsFilter === 'expenses_parish') && (
                        <Bar dataKey="expenses_parish" name="Parish Expenses" fill="#1a472a" radius={[2, 2, 0, 0]} barSize={disbursementsFilter === 'all' ? 20 : 40} />
                      )}
                      {(disbursementsFilter === 'all' || disbursementsFilter === 'expenses_pastoral') && (
                        <Bar dataKey="expenses_pastoral" name="Pastoral Expenses" fill="#D4AF37" radius={[2, 2, 0, 0]} barSize={disbursementsFilter === 'all' ? 20 : 40} />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-2 text-[8px] font-semibold text-gray-500 uppercase tracking-[0.15em]">Month</div>
                <div className="flex items-center gap-6 justify-center mt-3">
                  <div className={`flex items-center gap-2 transition-all duration-200 ${disbursementsFilter === 'all' || disbursementsFilter === 'expenses_parish' ? 'opacity-100' : 'opacity-40'}`}>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1a472a] shadow-sm"></div>
                    <span className="text-[8px] font-semibold text-gray-600 uppercase tracking-wider">Parish</span>
                  </div>
                  <div className={`flex items-center gap-2 transition-all duration-200 ${disbursementsFilter === 'all' || disbursementsFilter === 'expenses_pastoral' ? 'opacity-100' : 'opacity-40'}`}>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] shadow-sm"></div>
                    <span className="text-[8px] font-semibold text-gray-600 uppercase tracking-wider">Pastoral</span>
                  </div>
                </div>
              </div>
            )}

            {/* Collections Breakdown */}
            {isVisible('Collections Breakdown') && (
              <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg border border-gray-100 transition-shadow duration-300">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-church-green">Collections Breakdown</h3>
                  <select 
                      value={collectionsFilter}
                      onChange={(e) => setCollectionsFilter(e.target.value as any)}
                      className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 text-[8px] font-bold text-church-green rounded-lg px-3 py-1.5 outline-none cursor-pointer hover:from-gray-100 hover:to-gray-150 transition-all duration-200 shadow-sm"
                    >
                      <option value="all">ALL</option>
                      <option value="collections_mass">MASS</option>
                      <option value="sacraments_rate">SACRAMENTS</option>
                      <option value="collections_other">OTHER</option>
                    </select>
                </div>
                <div className="h-[280px] flex items-center">
                  <div className="w-6 flex-shrink-0 flex items-center justify-center h-full">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] -rotate-90 whitespace-nowrap">Amount (PHP)</span>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredCollectionsData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={true} stroke="#E5E7EB" />
                      <XAxis dataKey="month" axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} />
                      <YAxis axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} tickFormatter={(value) => `${value / 1000}k`} width={40} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      {(collectionsFilter === 'all' || collectionsFilter === 'collections_mass') && (
                        <Bar dataKey="collections_mass" name="Mass Collections" fill="#D4AF37" radius={[2, 2, 0, 0]} barSize={collectionsFilter === 'all' ? 15 : 40} />
                      )}
                      {(collectionsFilter === 'all' || collectionsFilter === 'sacraments_rate') && (
                        <Bar dataKey="sacraments_rate" name="Sacraments" fill="#1a472a" radius={[2, 2, 0, 0]} barSize={collectionsFilter === 'all' ? 15 : 40} />
                      )}
                      {(collectionsFilter === 'all' || collectionsFilter === 'collections_other') && (
                        <Bar dataKey="collections_other" name="Other Collections" fill="#4ade80" radius={[2, 2, 0, 0]} barSize={collectionsFilter === 'all' ? 15 : 40} />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-1 text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">Month</div>
                <div className="flex items-center gap-4 justify-center mt-2">
                  <div className={`flex items-center gap-2 transition-opacity ${collectionsFilter === 'all' || collectionsFilter === 'collections_mass' ? 'opacity-100' : 'opacity-30'}`}>
                    <div className="w-2 h-2 rounded-full bg-[#D4AF37]"></div>
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Mass</span>
                  </div>
                  <div className={`flex items-center gap-2 transition-opacity ${collectionsFilter === 'all' || collectionsFilter === 'sacraments_rate' ? 'opacity-100' : 'opacity-30'}`}>
                    <div className="w-2 h-2 rounded-full bg-[#1a472a]"></div>
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Sacraments</span>
                  </div>
                  <div className={`flex items-center gap-2 transition-opacity ${collectionsFilter === 'all' || collectionsFilter === 'collections_other' ? 'opacity-100' : 'opacity-30'}`}>
                    <div className="w-2 h-2 rounded-full bg-[#4ade80]"></div>
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Other</span>
                  </div>
                </div>
              </div>
            )}
          </div>

            {isVisible('Collection Clustering by Week') && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-church-green">Collection Clustering</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Weekly Performance Analysis</p>
                  </div>
                  <select 
                    value={clusteringFilter}
                    onChange={(e) => setClusteringFilter(e.target.value as any)}
                    className="bg-gray-100 border-none text-[8px] font-bold text-church-green rounded-lg px-2 py-1.5 outline-none cursor-pointer hover:bg-gray-200 transition-colors"
                  >
                    <option value="all">ALL CLUSTERS</option>
                    <option value="high">HIGH PERFORMANCE</option>
                    <option value="medium">AVERAGE</option>
                    <option value="low">UNDERPERFORMING</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {clusteringData.filter(item => clusteringFilter === 'all' || item.status === clusteringFilter).map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-md transition-all group">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                        item.status === 'high' ? 'bg-emerald-100 text-emerald-600' :
                        item.status === 'medium' ? 'bg-gold-100 text-gold-600' :
                        'bg-red-100 text-red-600'
                      } group-hover:scale-110 transition-transform`}>
                        <TrendingUp size={20} />
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.week}</span>
                      <span className="text-lg font-black text-church-green">{item.value}%</span>
                      <span className={`text-[8px] font-black uppercase tracking-wider mt-1 px-2 py-0.5 rounded-full ${
                        item.status === 'high' ? 'bg-emerald-50 text-emerald-700' :
                        item.status === 'medium' ? 'bg-gold-50 text-gold-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}



          {/* Seasonality Section */}
          {isVisible('Seasonality Trends') && (
            <div className="bg-church-green rounded-2xl p-4 md:p-6 shadow-xl overflow-hidden">
              <div className="mb-4">
                <h3 className="text-[9px] md:text-[10px] font-bold text-gold-500 tracking-wider uppercase mb-1">SEASONALITY</h3>
                <h2 className="text-lg md:text-xl font-bold text-white">Seasonality Trends</h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
                <div className="lg:col-span-2 flex flex-col">
                  <div className="h-[280px] flex items-center">
                    <div className="w-6 flex-shrink-0 flex items-center justify-center h-full">
                      <span className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] -rotate-90 whitespace-nowrap">Value</span>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={seasonalityData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorSeasonality" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" axisLine={true} tickLine={true} tick={{ fill: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }} />
                        <YAxis axisLine={true} tickLine={true} tick={{ fill: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }} width={40} />
                        <Area type="monotone" dataKey="value" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorSeasonality)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-center mt-2 text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Month</div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
                  {role === 'seminary' ? (
                    <>
                      <div className="bg-church-green-dark rounded-2xl p-4 md:p-6">
                        <h4 className="text-gold-500 text-[10px] md:text-sm font-bold mb-1">Highlight</h4>
                        <p className="text-white font-bold text-xs md:text-base">Enrollment Peak (+42%)</p>
                      </div>
                      <div className="bg-church-green-dark rounded-2xl p-4 md:p-6">
                        <h4 className="text-gold-500 text-[10px] md:text-sm font-bold mb-1">Highlight</h4>
                        <p className="text-white font-bold text-xs md:text-base">Seminary Day (+15%)</p>
                      </div>
                      <div className="bg-church-green-dark rounded-2xl p-4 md:p-6">
                        <h4 className="text-gold-500 text-[10px] md:text-sm font-bold mb-1">Highlight</h4>
                        <p className="text-white font-bold text-xs md:text-base">Graduation Month (+28%)</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-church-green-dark rounded-2xl p-4 md:p-6">
                        <h4 className="text-gold-500 text-[10px] md:text-sm font-bold mb-1">Highlight</h4>
                        <p className="text-white font-bold text-xs md:text-base">Christmas Uplift (+42%)</p>
                      </div>
                      <div className="bg-church-green-dark rounded-2xl p-4 md:p-6">
                        <h4 className="text-gold-500 text-[10px] md:text-sm font-bold mb-1">Highlight</h4>
                        <p className="text-white font-bold text-xs md:text-base">Lent/Holy Week (+12%)</p>
                      </div>
                      <div className="bg-church-green-dark rounded-2xl p-4 md:p-6">
                        <h4 className="text-gold-500 text-[10px] md:text-sm font-bold mb-1">Highlight</h4>
                        <p className="text-white font-bold text-xs md:text-base">Patronal Fiestas (+24%)</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Additional Seminary Descriptive Chart */}
          {role === 'seminary' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {isVisible('Student Enrollment Trends') && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <h3 className="text-xl font-bold text-church-green mb-4">Student Enrollment Trends</h3>
                    <div className="h-[280px] flex items-center">
                      <div className="w-6 flex-shrink-0 flex items-center justify-center h-full">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] -rotate-90 whitespace-nowrap">Students</span>
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={seminaryEnrollmentData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={true} stroke="#E5E7EB" />
                          <XAxis dataKey="year" axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} />
                          <YAxis axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} width={40} />
                          <Bar dataKey="students" fill="#1a472a" radius={[4, 4, 0, 0]} barSize={25} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-center mt-1 text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">Year</div>
                  </div>
                )}

                {isVisible('Operational Cost Breakdown') && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <h3 className="text-xl font-bold text-church-green mb-4">Operational Cost Breakdown</h3>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={seminaryCostBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {seminaryCostBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              {isVisible('Staff-to-Seminarian Ratio') && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-xl font-bold text-church-green mb-4">Staff & Faculty Distribution</h3>
                  <div className="h-[300px] flex flex-col">
                    <div className="flex-1 flex items-center">
                      <div className="w-6 flex-shrink-0 flex items-center justify-center h-full">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] -rotate-90 whitespace-nowrap">Staff Category</span>
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={staffRatioData} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} stroke="#E5E7EB" />
                          <XAxis type="number" axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} />
                          <YAxis dataKey="name" type="category" axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} width={100} />
                          <Bar dataKey="count" fill="#D4AF37" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-center mt-1 text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">Count</div>
                  </div>
                </div>
              )}

              {isVisible('Formation Stage Breakdown') && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-xl font-bold text-church-green mb-4">Formation Stage Breakdown</h3>
                  <div className="h-[300px] flex flex-col">
                    <div className="flex-1 flex items-center">
                      <div className="w-6 flex-shrink-0 flex items-center justify-center h-full">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] -rotate-90 whitespace-nowrap">Count</span>
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={formationStageData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={true} stroke="#E5E7EB" />
                          <XAxis dataKey="stage" axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} dy={5} />
                          <YAxis axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} width={40} />
                          <Bar dataKey="count" fill="#1a472a" radius={[4, 4, 0, 0]} barSize={25} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-center mt-2 text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">Stage</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Donation Trends */}
          {isVisible('Donation Trends') && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-church-green mb-4">Donation Trends</h3>
              <div className="h-[300px] flex flex-col">
                <div className="flex-1 flex items-center">
                  <div className="w-6 flex-shrink-0 flex items-center justify-center h-full">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] -rotate-90 whitespace-nowrap">Amount (PHP)</span>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={records} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#E5E7EB" />
                      <XAxis dataKey="month" axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} dy={5} />
                      <YAxis axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} tickFormatter={(value) => `${value / 1000}k`} width={40} />
                      <Area type="monotone" dataKey="collections" fill="#D4AF37" fillOpacity={0.1} stroke="none" />
                      <Line type="monotone" dataKey="collections" stroke="#1a472a" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-2 text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">Month</div>
              </div>
            </div>
          )}
          {/* Row 2: Monthly Collections Decline Monitor */}
          <div className="bg-white rounded-[1.5rem] p-8 shadow-xl border-none relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-church-green">Monthly Collections Decline Monitor</h3>
                <p className="text-sm text-gray-400 mt-1">Flags categories with continuously decreasing collections over the past 4 months.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs font-bold text-church-green border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-4">Category</th>
                    <th className="px-4 py-4">Month 1</th>
                    <th className="px-4 py-4">Month 2</th>
                    <th className="px-4 py-4">Month 3</th>
                    <th className="px-4 py-4">Month 4</th>
                    <th className="px-4 py-4 text-right">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Mass Collections', w1: 450000, w2: 420000, w3: 390000, w4: 350000, trend: -22.2, type: 'down' },
                    { name: 'Sacraments', w1: 120000, w2: 115000, w3: 118000, w4: 110000, trend: -8.3, type: 'down' },
                    { name: 'Other Collections', w1: 85000, w2: 90000, w3: 82000, w4: 75000, trend: -11.7, type: 'down' },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 font-bold text-church-green/80">{row.name}</td>
                      <td className="px-4 py-4 text-gray-600">{formatCurrency(row.w1)}</td>
                      <td className="px-4 py-4 text-gray-600">{formatCurrency(row.w2)}</td>
                      <td className="px-4 py-4 text-gray-600">{formatCurrency(row.w3)}</td>
                      <td className="px-4 py-4 text-gray-600">{formatCurrency(row.w4)}</td>
                      <td className="px-4 py-4 text-right">
                        <span className={`px-3 py-1 rounded-full font-bold text-[10px] flex items-center justify-end gap-1 w-fit ml-auto ${
                          row.type === 'down' ? 'bg-orange-50 text-orange-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${row.type === 'down' ? 'bg-orange-500' : 'bg-emerald-500'}`}></div>
                          {row.trend}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {analyticsView === 'predictive' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {role === 'seminary' ? (
            <>
              {isVisible('Vocation Pipeline Forecast') && (
                <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-200 lg:col-span-2">
                  <h3 className="text-lg md:text-xl font-bold text-church-green mb-4">Vocation Pipeline Forecast</h3>
                  <div className="h-[280px] flex flex-col">
                    <div className="flex-1 flex items-center">
                      <div className="w-6 flex-shrink-0 flex items-center justify-center h-full">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] -rotate-90 whitespace-nowrap">Count</span>
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={vocationPipelineData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={true} stroke="#E5E7EB" />
                          <XAxis dataKey="stage" axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 9 }} dy={5} />
                          <YAxis axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 9 }} width={40} />
                          <Bar dataKey="count" fill="#D4AF37" radius={[4, 4, 0, 0]} barSize={window.innerWidth < 768 ? 20 : 35} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-center mt-2 text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">Stage</div>
                  </div>
                </div>
              )}

              {isVisible('Attrition Risk by Year') && (
                <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-200 lg:col-span-1">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg md:text-xl font-bold text-church-green">Attrition Risk by Year</h3>
                    <select 
                      value={attritionFilter}
                      onChange={(e) => setAttritionFilter(e.target.value as any)}
                      className="bg-gray-100 border-none text-[10px] font-bold text-church-green rounded-lg px-2 py-1.5 outline-none cursor-pointer hover:bg-gray-200 transition-colors"
                    >
                      <option value="all">ALL</option>
                      <option value="risk">CURRENT RISK</option>
                      <option value="actual">HISTORICAL AVG</option>
                    </select>
                  </div>
                  <div className="h-[280px] flex flex-col">
                    <div className="flex-1 flex items-center">
                      <div className="w-6 flex-shrink-0 flex items-center justify-center h-full">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] -rotate-90 whitespace-nowrap">Risk (%)</span>
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={attritionRiskData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={true} stroke="#E5E7EB" />
                          <XAxis dataKey="year" axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 9 }} />
                          <YAxis axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 9 }} width={40} />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: '10px' }} />
                          {(attritionFilter === 'all' || attritionFilter === 'risk') && (
                            <Bar dataKey="risk" name="Current Risk %" fill="#1a472a" radius={[2, 2, 0, 0]} barSize={attritionFilter === 'all' ? 15 : 30} />
                          )}
                          {(attritionFilter === 'all' || attritionFilter === 'actual') && (
                            <Bar dataKey="historical" name="Historical Avg %" fill="#D4AF37" radius={[2, 2, 0, 0]} barSize={attritionFilter === 'all' ? 15 : 30} />
                          )}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-center mt-1 text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">Year</div>
                    <div className="flex items-center gap-4 justify-center mt-2">
                      <div className={`flex items-center gap-2 transition-opacity ${attritionFilter === 'all' || attritionFilter === 'risk' ? 'opacity-100' : 'opacity-30'}`}>
                        <div className="w-2 h-2 rounded-full bg-[#1a472a]"></div>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Current Risk</span>
                      </div>
                      <div className={`flex items-center gap-2 transition-opacity ${attritionFilter === 'all' || attritionFilter === 'actual' ? 'opacity-100' : 'opacity-30'}`}>
                        <div className="w-2 h-2 rounded-full bg-[#D4AF37]"></div>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Historical Avg</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isVisible('Vocation Yield by Region') && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-church-green">Vocation Yield by Region</h3>
                    <select 
                      value={yieldFilter}
                      onChange={(e) => setYieldFilter(e.target.value as any)}
                      className="bg-gray-100 border-none text-[10px] font-bold text-church-green rounded-lg px-2 py-1.5 outline-none cursor-pointer hover:bg-gray-200 transition-colors"
                    >
                      <option value="all">ALL</option>
                      <option value="yield">INQUIRIES</option>
                      <option value="target">ACCEPTED</option>
                    </select>
                  </div>
                  <div className="h-[300px] flex flex-col">
                    <div className="flex-1 flex items-center">
                      <div className="w-6 flex-shrink-0 flex items-center justify-center h-full">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] -rotate-90 whitespace-nowrap">Count</span>
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={vocationYieldData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={true} stroke="#E5E7EB" />
                          <XAxis dataKey="region" axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} />
                          <YAxis axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} width={40} />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: '10px' }} />
                          {(yieldFilter === 'all' || yieldFilter === 'yield') && (
                            <Bar dataKey="inquiries" name="Inquiries" fill="#1a472a" radius={[2, 2, 0, 0]} barSize={yieldFilter === 'all' ? 15 : 30} />
                          )}
                          {(yieldFilter === 'all' || yieldFilter === 'target') && (
                            <Bar dataKey="accepted" name="Accepted" fill="#D4AF37" radius={[2, 2, 0, 0]} barSize={yieldFilter === 'all' ? 15 : 30} />
                          )}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-center mt-1 text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">Region</div>
                    <div className="flex items-center gap-4 justify-center mt-2">
                      <div className={`flex items-center gap-2 transition-opacity ${yieldFilter === 'all' || yieldFilter === 'yield' ? 'opacity-100' : 'opacity-30'}`}>
                        <div className="w-2 h-2 rounded-full bg-[#1a472a]"></div>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Inquiries</span>
                      </div>
                      <div className={`flex items-center gap-2 transition-opacity ${yieldFilter === 'all' || yieldFilter === 'target' ? 'opacity-100' : 'opacity-30'}`}>
                        <div className="w-2 h-2 rounded-full bg-[#D4AF37]"></div>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Accepted</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isVisible('Endowment Growth Forecast') && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 lg:col-span-1">
                  <h3 className="text-xl font-bold text-church-green mb-4">Endowment Growth (₱M)</h3>
                  <div className="h-[300px] flex flex-col">
                    <div className="flex-1 flex items-center">
                      <div className="w-6 flex-shrink-0 flex items-center justify-center h-full">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] -rotate-90 whitespace-nowrap">Amount (PHP)</span>
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={endowmentGrowthData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#E5E7EB" />
                          <XAxis dataKey="year" axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} />
                          <YAxis axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} width={40} />
                          <Tooltip />
                          <Area type="monotone" dataKey="amount" stroke="#1a472a" fill="#1a472a" fillOpacity={0.1} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-center mt-1 text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">Year</div>
                  </div>
                </div>
              )}

              {isVisible('Priest Supply vs Demand Gap') && (
                <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-200 lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg md:text-xl font-bold text-church-green">Priest Supply vs Demand Gap</h3>
                    <select 
                      value={priestGapFilter}
                      onChange={(e) => setPriestGapFilter(e.target.value as any)}
                      className="bg-gray-100 border-none text-[10px] font-bold text-church-green rounded-lg px-2 py-1.5 outline-none cursor-pointer hover:bg-gray-200 transition-colors"
                    >
                      <option value="all">ALL</option>
                      <option value="retirements">RETIREMENTS</option>
                      <option value="ordinations">ORDINATIONS</option>
                    </select>
                  </div>
                  <div className="h-[350px] flex flex-col">
                    <div className="flex-1 flex items-center">
                      <div className="w-6 flex-shrink-0 flex items-center justify-center h-full">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] -rotate-90 whitespace-nowrap">Count</span>
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={priestGapData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="year" axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} />
                          <YAxis axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} width={40} />
                          <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                          {(priestGapFilter === 'all' || priestGapFilter === 'retirements') && (
                            <Bar dataKey="retirements" name="Projected Retirements" fill="#1a472a" radius={[6, 6, 0, 0]} barSize={priestGapFilter === 'all' ? 20 : 40} />
                          )}
                          {(priestGapFilter === 'all' || priestGapFilter === 'ordinations') && (
                            <Bar dataKey="ordinations" name="Projected Ordinations" fill="#D4AF37" radius={[6, 6, 0, 0]} barSize={priestGapFilter === 'all' ? 20 : 40} />
                          )}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-center mt-2 text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">Year</div>
                    <div className="flex items-center gap-6 justify-center mt-4">
                      <div className={`flex items-center gap-2 transition-opacity ${priestGapFilter === 'all' || priestGapFilter === 'retirements' ? 'opacity-100' : 'opacity-30'}`}>
                        <div className="w-2 h-2 rounded-full bg-[#1a472a]"></div>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Projected Retirements</span>
                      </div>
                      <div className={`flex items-center gap-2 transition-opacity ${priestGapFilter === 'all' || priestGapFilter === 'ordinations' ? 'opacity-100' : 'opacity-30'}`}>
                        <div className="w-2 h-2 rounded-full bg-[#D4AF37]"></div>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Projected Ordinations</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isVisible('Enrollment vs. Capacity Forecast') && (
                <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-200 lg:col-span-1">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg md:text-xl font-bold text-church-green">Enrollment vs. Capacity</h3>
                    <select 
                      value={enrollmentForecastFilter}
                      onChange={(e) => setEnrollmentForecastFilter(e.target.value as any)}
                      className="bg-gray-100 border-none text-[10px] font-bold text-church-green rounded-lg px-2 py-1.5 outline-none cursor-pointer hover:bg-gray-200 transition-colors"
                    >
                      <option value="all">ALL</option>
                      <option value="enrollment">ENROLLMENT</option>
                      <option value="capacity">CAPACITY</option>
                    </select>
                  </div>
                  <div className="h-[350px] flex flex-col">
                    <div className="flex-1 flex items-center">
                      <div className="w-6 flex-shrink-0 flex items-center justify-center h-full">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] -rotate-90 whitespace-nowrap">Count</span>
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={enrollmentForecastData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="year" axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} />
                          <YAxis axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} width={40} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                          {(enrollmentForecastFilter === 'all' || enrollmentForecastFilter === 'enrollment') && (
                            <Bar dataKey="enrollment" name="Projected Enrollment" fill="#D4AF37" radius={[6, 6, 0, 0]} barSize={enrollmentForecastFilter === 'all' ? 20 : 40} />
                          )}
                          {(enrollmentForecastFilter === 'all' || enrollmentForecastFilter === 'capacity') && (
                            <Line type="monotone" dataKey="capacity" name="Maximum Capacity" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                          )}
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-center mt-2 text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">Year</div>
                    <div className="flex items-center gap-6 justify-center mt-4">
                      <div className={`flex items-center gap-2 transition-opacity ${enrollmentForecastFilter === 'all' || enrollmentForecastFilter === 'enrollment' ? 'opacity-100' : 'opacity-30'}`}>
                        <div className="w-2 h-2 rounded-full bg-[#D4AF37]"></div>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Enrollment</span>
                      </div>
                      <div className={`flex items-center gap-2 transition-opacity ${enrollmentForecastFilter === 'all' || enrollmentForecastFilter === 'capacity' ? 'opacity-100' : 'opacity-30'}`}>
                        <div className="w-2 h-2 rounded-full bg-[#EF4444]"></div>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Capacity</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isVisible('Vocation Interest Trends') && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 lg:col-span-1">
                  <h3 className="text-xl font-bold text-church-green mb-4">Vocation Interest Trends</h3>
                  <div className="h-[300px] flex flex-col">
                    <div className="flex-1 flex items-center">
                      <div className="w-6 flex-shrink-0 flex items-center justify-center h-full">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] -rotate-90 whitespace-nowrap">Inquiries</span>
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={vocationInterestData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#E5E7EB" />
                          <XAxis dataKey="month" axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} />
                          <YAxis axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} width={40} />
                          <Tooltip />
                          <Line type="monotone" dataKey="inquiries" name="Monthly Inquiries" stroke="#1a472a" strokeWidth={2} dot={{ r: 3, fill: '#1a472a' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-center mt-1 text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">Month</div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {isVisible('Forecasted monthly collections') && (
                <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-200 lg:col-span-2">
                  <div className="mb-3">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">FORECASTING ENGINE</p>
                    <h3 className="text-xl font-bold text-gold-500">Monthly Collections Forecast</h3>
                  </div>
                  <div className="flex flex-col">
                    <AdvancedForecastChart 
                      data={records.slice(0, 6)} 
                      actualKey="collections" 
                      forecastKey="collections" 
                      yAxisLabel="Amount (PHP)" 
                      title="MONTHLY COLLECTIONS"
                      metrics={{
                        mae: 35.22,
                        rmse: 42.02,
                        mape: 20.88,
                        mase: 0.38,
                        wape: 19.72,
                        mpe: 4.46
                      }}
                    />
                    <div className="text-center mt-4 text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">Monthly Collections — Predictive Analytics Engine V2.4</div>
                  </div>
                </div>
              )}

              {isVisible('Forecasted monthly disbursements') && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 lg:col-span-2">
                  <div className="mb-6">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">FORECASTING ENGINE</p>
                    <h3 className="text-2xl font-bold text-gold-500">Monthly Disbursements Forecast</h3>
                  </div>
                  <div className="flex flex-col">
                    <AdvancedForecastChart 
                      data={records.slice(0, 6)} 
                      actualKey="disbursements" 
                      forecastKey="disbursements" 
                      yAxisLabel="Amount (PHP)" 
                      title="MONTHLY DISBURSEMENTS"
                      metrics={{
                        mae: 28.45,
                        rmse: 34.12,
                        mape: 15.67,
                        mase: 0.412,
                        wape: 14.89,
                        mpe: 3.21
                      }}
                    />
                    <div className="text-center mt-4 text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">Monthly Disbursements — Predictive Analytics Engine V2.4</div>
                  </div>
                </div>
              )}

              {isVisible('Resource Optimization') && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 lg:col-span-2">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-church-green">Resource Optimization</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Prescriptive Cost-Saving Analysis</p>
                    </div>
                    <select 
                      value={optimizationFilter}
                      onChange={(e) => setOptimizationFilter(e.target.value as any)}
                      className="bg-gray-100 border-none text-[8px] font-bold text-church-green rounded-lg px-2 py-1.5 outline-none cursor-pointer hover:bg-gray-200 transition-colors"
                    >
                      <option value="all">ALL CATEGORIES</option>
                      <option value="personnel">PERSONNEL</option>
                      <option value="utilities">UTILITIES</option>
                      <option value="programs">PROGRAMS</option>
                    </select>
                  </div>
                  <div className="h-[300px] flex items-center">
                    <div className="w-6 flex-shrink-0 flex items-center justify-center h-full">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] -rotate-90 whitespace-nowrap">Amount (PHP)</span>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={optimizationData.filter(item => optimizationFilter === 'all' || item.category.toLowerCase() === optimizationFilter)} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={true} stroke="#E5E7EB" />
                        <XAxis dataKey="category" axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} />
                        <YAxis axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} tickFormatter={(value) => `${value / 1000}k`} width={40} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Bar dataKey="current" name="Current Spending" fill="#1a472a" radius={[4, 4, 0, 0]} barSize={20} />
                        <Bar dataKey="optimized" name="Optimized Target" fill="#D4AF37" radius={[4, 4, 0, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {optimizationData.filter(item => optimizationFilter === 'all' || item.category.toLowerCase() === optimizationFilter).map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                        <span className="text-[8px] font-black text-emerald-700 uppercase tracking-widest">{item.category} Savings</span>
                        <div className="text-sm font-black text-emerald-800 mt-1">{formatCurrency(item.savings)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isVisible('Strategic Recommendations') && (
                <div className="bg-church-green rounded-2xl p-8 shadow-xl lg:col-span-2 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-gold-500/10 transition-colors duration-700"></div>
                  <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-24 h-24 rounded-3xl bg-gold-500 text-black flex items-center justify-center shadow-2xl shadow-gold-500/40 shrink-0 transform -rotate-6 group-hover:rotate-0 transition-transform duration-500">
                      <BrainCircuit size={48} />
                    </div>
                    <div className="flex-1">
                      <div className="inline-flex items-center gap-2 bg-gold-500/10 text-gold-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 border border-gold-500/20">
                        <Sparkles size={12} />
                        <span>AI Strategic Advisory</span>
                      </div>
                      <h3 className="text-2xl font-serif font-black text-white mb-4 tracking-tight">Prescriptive Strategy for Q2 2026</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                          <h4 className="text-gold-500 text-[10px] font-black uppercase tracking-widest mb-2">Revenue Growth</h4>
                          <p className="text-white/80 text-xs leading-relaxed">Implement a "Digital Tithing" campaign targeting evening mass attendees to capture a 15% untapped potential.</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                          <h4 className="text-gold-500 text-[10px] font-black uppercase tracking-widest mb-2">Cost Efficiency</h4>
                          <p className="text-white/80 text-xs leading-relaxed">Transition to solar-powered lighting for the main nave to reduce utility overhead by an estimated 22% annually.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {isVisible('Alerts') && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-church-green mb-4">Alerts</h3>
              
              <div className="space-y-3">
                <div className="bg-orange-500 rounded-xl p-4 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-white flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-white text-xs">Projected Deficit Months</h4>
                    <p className="text-white/90 text-[11px] font-medium mt-0.5">Watch: January</p>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-4">
                  <h4 className="font-medium text-gray-500 text-[10px] mb-0.5">Inflation Note</h4>
                  <p className="text-church-green text-xs font-medium">Disbursements forecast assumes +1.2% monthly increase.</p>
                </div>

                <div className="border border-gray-200 rounded-xl p-4">
                  <h4 className="font-medium text-gray-500 text-[10px] mb-0.5">Event Spikes</h4>
                  <p className="text-church-green text-xs font-medium">Expected uplift during {entityLabel.toLowerCase()} fiestas and major holidays.</p>
                </div>
              </div>
            </div>
          )}

          {isVisible('Seasonal Expense Spikes') && (
            <Card className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-200 lg:col-span-3">
              <CardHeader className="px-0 pt-0 pb-4">
                <CardTitle className="text-lg md:text-xl font-bold text-church-green">Seasonal Expense Spikes</CardTitle>
                <p className="text-xs text-gray-500">Expected increases in disbursements during key events</p>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {seasonalExpenseSpikes.map((spike, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-gray-900 text-xs">{spike.event}</h4>
                        <span className="text-[9px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full">{spike.expectedIncrease}</span>
                      </div>
                      <p className="text-[10px] text-church-green font-medium mb-1">{spike.month}</p>
                      <p className="text-[10px] text-gray-500 leading-tight">{spike.driver}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {analyticsView === 'prescriptive' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Recommendations Section - Applicable to all roles */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200">
              <h3 className="text-xl md:text-2xl font-bold text-church-green mb-6">Recommendations to Improve Score</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                    <TrendingUp size={20} />
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm mb-2">Boost Growth</h4>
                  <p className="text-xs text-gray-500">Implement a recurring digital giving program to stabilize monthly contributions.</p>
                </div>
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                    <ArrowUpDown size={20} />
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm mb-2">Optimize Liquidity</h4>
                  <p className="text-xs text-gray-500">Review non-essential disbursements to increase cash-on-hand ratio.</p>
                </div>
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-gold-100 text-gold-600 flex items-center justify-center mb-4">
                    <Info size={20} />
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm mb-2">Enhance Stability</h4>
                  <p className="text-xs text-gray-500">Diversify income sources beyond Sunday collections to reduce seasonality impact.</p>
                </div>
              </div>
            </div>
          </div>

          {role === 'seminary' ? (
            <div className="space-y-6">
              {/* Row 1: Strategic Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Donor Engagement Strategy */}
                <Card className="bg-[#1A1A1A] text-white border-none shadow-sm">
                  <CardHeader>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-gold-500">DEVELOPMENT</p>
                    <h3 className="text-2xl font-bold text-white">Donor Engagement Strategy</h3>
                  </CardHeader>
                  <CardContent className="space-y-4 mt-4">
                    {[
                      { name: 'Endowment Campaign', potential: 'High', recommendation: 'Launch "Legacy of Faith" campaign targeting major donors.', impact: `+${formatCurrency(15000000)} Growth` },
                      { name: 'Alumni Network', potential: 'Medium', recommendation: 'Re-engage former seminarians for scholarship support.', impact: `+${formatCurrency(2000000)}/yr` },
                      { name: 'Parish Partnerships', potential: 'High', recommendation: 'Establish "Adopt-a-Seminarian" parish programs.', impact: '+20% Support' },
                    ].map((item, i) => (
                      <div key={i} className="bg-[#222222] border border-gray-800 rounded-xl p-5 flex justify-between items-center gap-4">
                        <div>
                          <h4 className="font-bold text-white text-sm">{item.name}</h4>
                          <p className="text-xs text-gray-400 mt-1">{item.recommendation}</p>
                          <p className="text-[10px] font-bold text-gold-500 mt-2 uppercase tracking-tighter">POTENTIAL: {item.potential}</p>
                        </div>
                        <span className="bg-gold-500/10 text-gold-400 px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap">{item.impact}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Faculty Development Plan */}
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-church-black">ACADEMIC</p>
                    <h3 className="text-2xl font-bold text-church-black">Faculty Development Plan</h3>
                  </CardHeader>
                  <CardContent className="space-y-4 mt-4">
                    {[
                      { name: 'Advanced Degrees', need: 'High', action: 'Sponsor 2 faculty members for doctoral studies in Rome.', saving: 'Long-term' },
                      { name: 'Spiritual Formation', need: 'Critical', action: 'Hire 1 additional full-time Spiritual Director.', saving: 'Immediate' },
                      { name: 'Digital Integration', need: 'Medium', action: 'Implement new LMS for hybrid learning capabilities.', saving: `${formatCurrency(200000)}/yr` },
                    ].map((item, i) => (
                      <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-5 flex justify-between items-center gap-4">
                        <div>
                          <h4 className="font-bold text-church-black text-sm">{item.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">{item.action}</p>
                          <p className="text-[10px] font-bold text-church-black mt-2 uppercase tracking-tighter">NEED LEVEL: {item.need}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-gold-600 text-xs font-bold block">{item.saving}</span>
                          <span className="text-[10px] text-gray-400 uppercase font-bold">EST. IMPACT</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Strategic Targeting: Vocation Campaign Priority */}
                <Card className="bg-[#1A1A1A] text-white border-none shadow-sm">
                  <CardHeader>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-gold-500">STRATEGIC TARGETING</p>
                    <h3 className="text-2xl font-bold text-white">Vocation Campaign Priority</h3>
                  </CardHeader>
                  <CardContent className="space-y-4 mt-4">
                    {[
                      { name: 'Northern Region', potential: 'High', recommendation: 'Deploy mobile vocation team for youth summit.', impact: '+12% Pipeline' },
                      { name: 'Holy Rosary Parish', potential: 'Medium', recommendation: 'Initiate "Shadow a Seminarian" weekend program.', impact: '+8% Pipeline' },
                      { name: 'St. Jude College Ministry', potential: 'High', recommendation: 'Establish permanent campus ministry presence.', impact: '+15% Pipeline' },
                    ].map((item, i) => (
                      <div key={i} className="bg-[#222222] border border-gray-800 rounded-xl p-5 flex justify-between items-center gap-4">
                        <div>
                          <h4 className="font-bold text-white text-sm">{item.name}</h4>
                          <p className="text-xs text-gray-400 mt-1">{item.recommendation}</p>
                          <p className="text-[10px] font-bold text-gold-500 mt-2 uppercase tracking-tighter">POTENTIAL: {item.potential}</p>
                        </div>
                        <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap">{item.impact}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Resource Allocation: Scholarship Optimization */}
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-gold-500">RESOURCE ALLOCATION</p>
                    <h3 className="text-2xl font-bold text-church-black">Scholarship Optimization</h3>
                  </CardHeader>
                  <CardContent className="space-y-4 mt-4">
                    {[
                      { name: 'Theology III Cohort', need: 'High', action: 'Increase tuition subsidy by 15% to prevent attrition.', saving: `${formatCurrency(120000)}/yr` },
                      { name: 'Philosophy I (New)', need: 'Critical', action: 'Allocate 5 full-ride merit scholarships for top recruits.', saving: `${formatCurrency(450000)}/yr` },
                      { name: 'Pastoral Year Interns', need: 'Low', action: 'Shift stipend burden to host parishes (Cost-sharing).', saving: `${formatCurrency(85000)}/yr` },
                    ].map((item, i) => (
                      <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-5 flex justify-between items-center gap-4">
                        <div>
                          <h4 className="font-bold text-church-black text-sm">{item.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">{item.action}</p>
                          <p className="text-[10px] font-bold text-church-black mt-2 uppercase tracking-tighter">NEED LEVEL: {item.need}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-gold-600 text-xs font-bold block">{item.saving}</span>
                          <span className="text-[10px] text-gray-400 uppercase font-bold">EST. IMPACT</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Card: Efficiency */}
                <Card className="bg-[#1A1A1A] text-white border-none shadow-sm">
                  <CardHeader>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-gold-500">EFFICIENCY</p>
                    <h3 className="text-2xl font-bold text-white">Utility Cost Reduction</h3>
                  </CardHeader>
                  <CardContent className="space-y-4 mt-4">
                    {[
                      { name: 'Lighting Retrofit', desc: 'Shift to LED fixtures across all facilities, review peak-hour usage.', ratio: '25% Savings' },
                      { name: 'HVAC Scheduling', desc: 'Implement automated scheduling for AC units in non-critical areas.', ratio: '18% Savings' },
                      { name: 'Water Management', desc: 'Install low-flow fixtures and monitor for leaks in irrigation systems.', ratio: '12% Savings' },
                    ].map((item, i) => (
                      <div key={i} className="bg-[#222222] border border-gray-800 rounded-xl p-5 flex justify-between items-center gap-4">
                        <div>
                          <h4 className="font-bold text-white text-sm">{item.name}</h4>
                          <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
                        </div>
                        <span className="bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap">{item.ratio}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Right Card: Action Plan */}
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-gold-500">ACTION PLAN</p>
                    <h3 className="text-2xl font-bold text-church-black">Sustainability Upgrades</h3>
                  </CardHeader>
                  <CardContent className="space-y-4 mt-4">
                    {[
                      { name: 'Financial Transparency', desc: 'Increase pledge giving + align disbursements to baseline utilities and wages.', from: 'C', to: 'B' },
                      { name: 'Internal Controls', desc: 'Formalize event fundraising calendar and document disbursement approvals.', from: 'D', to: 'C' },
                      { name: 'Reserve Building', desc: 'Allocate 5% of monthly collections to a dedicated sustainability fund.', from: 'D', to: 'C' },
                    ].map((item, i) => (
                      <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-5 flex justify-between items-center gap-4">
                        <div>
                          <h4 className="font-bold text-church-black text-sm">{item.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="w-6 h-6 rounded-full bg-church-black text-white flex items-center justify-center text-xs font-bold">{item.from}</div>
                          <ArrowUpRight className="w-4 h-4 text-gold-500" />
                          <div className="w-6 h-6 rounded-full bg-gold-500 text-church-black flex items-center justify-center text-xs font-bold">{item.to}</div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Disbursements Optimization */}
                <Card className="bg-[#1A1A1A] text-white border-none shadow-sm lg:col-span-2">
                  <CardHeader>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-gold-500">DISBURSEMENTS</p>
                    <h3 className="text-2xl font-bold text-white">Expense Optimization</h3>
                  </CardHeader>
                  <CardContent className="space-y-4 mt-4">
                    {[
                      { name: 'Centralized Purchasing', desc: 'Implement a vicariate-level procurement system for common supplies (candles, hosts, office materials) to leverage bulk pricing.', impact: '10-15% Savings' },
                      { name: 'Pastoral Program Synergy', desc: 'Encourage neighboring parishes within vicariates to co-host large pastoral events and training seminars to share costs.', impact: '20% Cost Reduction per Event' },
                      { name: 'Preventative Maintenance', desc: 'Establish a mandatory quarterly maintenance schedule for all parish facilities to reduce emergency repair disbursements.', impact: 'Long-term Stability' },
                    ].map((item, i) => (
                      <div key={i} className="bg-[#222222] border border-gray-800 rounded-xl p-5 flex justify-between items-center gap-4">
                        <div>
                          <h4 className="font-bold text-white text-sm">{item.name}</h4>
                          <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
                        </div>
                        <span className="bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap">{item.impact}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Row 3: Next Steps & Seasonal Effects */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            <Card className="bg-church-green text-white border-none shadow-sm lg:col-span-2">
              <CardHeader>
                <h3 className="text-xl font-bold text-white">Next Steps</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: 'Sustainability score', desc: 'Adopt monthly stewardship review with a simple dashboard printout.' },
                  { title: 'Classification upgrade', desc: 'Prioritize 3-month surplus streak + documented controls.' },
                  { title: 'Data Isolation', desc: `You can only view your ${entityLabel.toLowerCase()} analytics in this interface.` },
                ].map((step, i) => (
                  <div key={i} className="bg-white rounded-xl p-4">
                    <h4 className="font-bold text-church-green text-xs mb-0.5">{step.title}</h4>
                    <p className="text-gray-500 text-[10px]">{step.desc}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-church-green text-white border-none shadow-sm lg:col-span-1">
              <CardHeader>
                <h3 className="text-xl font-bold text-white">Seasonal Effects</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: 'Fiesta month impact', desc: 'Plan for volunteer staffing + offerings uplift during celebrations', highlight: 'Highlight' },
                  { title: 'Christmas & Holy Week', desc: 'Strengthen logistics for increased attendance and second collections.', highlight: 'Holiday' },
                  { title: 'Stable trend', desc: 'Track weekly headcount to connect attendance giving.', highlight: 'Attendance' },
                ].map((effect, i) => (
                  <div key={i} className="bg-church-green-dark rounded-xl p-4">
                    <h4 className="text-gold-500 text-[10px] font-bold mb-0.5">{effect.highlight}</h4>
                    <h5 className="text-white font-bold text-xs mb-0.5">{effect.title}</h5>
                    <p className="text-gray-400 text-[10px]">{effect.desc}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <StewardChatbot currentEntityId={currentEntityId || undefined} />
      </div>
    </>
  );
}
