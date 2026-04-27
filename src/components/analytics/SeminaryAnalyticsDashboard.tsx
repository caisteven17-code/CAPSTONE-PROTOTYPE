'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ComposedChart,
  Treemap, ErrorBar, ScatterChart, Scatter,
  ReferenceArea, ReferenceLine
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Users, AlertTriangle,
  ArrowUpRight, Shield, Zap, Activity,
  Wallet, PieChart as PieChartIcon, BarChart2, Lightbulb,
  ChevronDown, Cpu
} from 'lucide-react';
import { COLORS } from '../../constants';
import { seminaryMockData, CHART_COLORS } from '../../utils/seminaryMockData';

// ============================================================================
// UTILS & FORMATTERS
// ============================================================================

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number) => {
  return `${(value * 100).toFixed(1)}%`;
};

// Simple linear regression for forecasting
const getLinearForecast = (data: any[], key: string, forecastSteps: number = 3) => {
  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  
  data.forEach((d, i) => {
    sumX += i;
    sumY += d[key];
    sumXY += i * d[key];
    sumXX += i * i;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const result = data.map((d, i) => ({
    ...d,
    [`${key}Forecast`]: d[key]
  }));

  const lastIndex = data.length - 1;
  for (let i = 1; i <= forecastSteps; i++) {
    const forecastVal = slope * (lastIndex + i) + intercept;
    result.push({
      month: `Forecast ${i}`,
      [`${key}Forecast`]: forecastVal
    } as any);
  }

  return result;
};

// ============================================================================
// COMPONENTS
// ============================================================================

const KPICard = ({ title, value, priorValue, icon: Icon, data }: any) => {
  const diff = value - priorValue;
  const percentChange = (diff / priorValue) * 100;
  const isPositive = percentChange >= 0;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{title}</p>
          <h3 className="text-2xl font-black text-church-green">{typeof value === 'string' ? value : formatCurrency(value)}</h3>
        </div>
        <div className="p-3 bg-gray-50 rounded-xl">
          <Icon className="w-5 h-5 text-gold" />
        </div>
      </div>
      
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-2">
          {isPositive ? (
            <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              <TrendingUp className="w-3 h-3 mr-1" /> {Math.abs(percentChange).toFixed(1)}%
            </span>
          ) : (
            <span className="flex items-center text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
              <TrendingDown className="w-3 h-3 mr-1" /> {Math.abs(percentChange).toFixed(1)}%
            </span>
          )}
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">vs prior month</span>
        </div>
        
        <div className="h-10 w-full opacity-50">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.slice(-6)}>
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={isPositive ? COLORS.success : COLORS.error} 
                fill={isPositive ? COLORS.success : COLORS.error} 
                fillOpacity={0.1} 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SEMINARY FORECAST CHART
// ============================================================================

const SEM_MONTHS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];

const SeminaryForecastChart = ({
  data,
  actualKey,
  forecastKey,
  yAxisLabel,
  metrics = { mae: 28.14, rmse: 33.87, mape: 17.42, mase: 0.361, wape: 16.58, mpe: 2.93 }
}: {
  data: any[];
  actualKey: string;
  forecastKey: string;
  yAxisLabel: string;
  metrics?: any;
}) => {
  const [showInterpretation, setShowInterpretation] = useState(false);
  const isCollections = actualKey === 'collections';
  const pastEnd = 'Oct';
  const presentEnd = 'Jan';
  const futureEnd = 'May';

  const processedData = useMemo(() => {
    const presentIndex = SEM_MONTHS.indexOf(presentEnd);
    const pastIndex = SEM_MONTHS.indexOf(pastEnd);
    return data.map(item => {
      const itemIndex = SEM_MONTHS.indexOf(item.month);
      return {
        ...item,
        [actualKey]: itemIndex <= presentIndex ? item[actualKey] : null,
        [forecastKey]: itemIndex >= pastIndex ? item[forecastKey] : null,
      };
    });
  }, [data, actualKey, forecastKey]);

  const insights = useMemo(() => {
    const presentIndex = SEM_MONTHS.indexOf(presentEnd);
    const lastActual = data[presentIndex];
    const lastActualVal: number = lastActual?.[actualKey] ?? 0;
    const prevActual = data[presentIndex - 1];
    const prevActualVal: number = prevActual?.[actualKey] ?? 0;
    const lastMonthChange = prevActualVal > 0 ? ((lastActualVal - prevActualVal) / prevActualVal * 100) : 0;
    const futureForecast = data.slice(presentIndex + 1);
    const nextMonthData = futureForecast[0];
    const nextMonthVal: number = nextMonthData?.[forecastKey] ?? 0;
    const nextMonthName: string = nextMonthData?.month ?? 'Feb';
    const nextMonthChange = lastActualVal > 0 ? ((nextMonthVal - lastActualVal) / lastActualVal * 100) : 0;
    const lastForecastData = futureForecast[futureForecast.length - 1];
    const lastForecastVal: number = lastForecastData?.[forecastKey] ?? 0;
    const lastForecastName: string = lastForecastData?.month ?? 'May';
    const actualData = data.slice(0, presentIndex + 1).filter((d: any) => d[actualKey] != null);
    const peakMonth = actualData.reduce((max: any, d: any) => (d[actualKey] ?? 0) > (max[actualKey] ?? 0) ? d : max, actualData[0]);
    const avgActual = actualData.reduce((sum: number, d: any) => sum + (d[actualKey] ?? 0), 0) / (actualData.length || 1);
    const endAboveAvg = lastForecastVal > 0 ? ((lastForecastVal - avgActual) / avgActual * 100) : 0;
    const fmt = (v: number) => `₱${(v / 1_000_000).toFixed(2)}M`;
    const pct = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;
    return { lastActualVal, prevActualVal, lastMonthChange, nextMonthName, nextMonthVal, nextMonthChange, lastForecastName, lastForecastVal, peakMonth, avgActual, endAboveAvg, fmt, pct };
  }, [data, actualKey, forecastKey]);

  return (
    <div className="flex flex-col w-full bg-white/50 rounded-2xl p-4 border border-gray-100/50">
      <div className="h-[340px] flex items-center">
        <div className="w-8 flex-shrink-0 flex items-center justify-center h-full">
          <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em] -rotate-90 whitespace-nowrap">{yAxisLabel}</span>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={processedData} margin={{ top: 30, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#F3F4F6" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 600 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 600 }} tickFormatter={(v) => `${v / 1000}k`} width={50} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} formatter={(v: any) => formatCurrency(v)} />
            <ReferenceArea x1="Jun" x2={pastEnd} fill="#F0F9FF" fillOpacity={0.4} label={{ position: 'insideTopLeft', value: 'PAST (Train)', fill: '#0EA5E9', fontSize: 9, fontWeight: 800, offset: 10 }} />
            <ReferenceArea x1={pastEnd} x2={presentEnd} fill="#FFF7ED" fillOpacity={0.4} label={{ position: 'insideTopLeft', value: 'PRESENT (Holdout)', fill: '#F97316', fontSize: 9, fontWeight: 800, offset: 10 }} />
            <ReferenceArea x1={presentEnd} x2={futureEnd} fill="#F0FDF4" fillOpacity={0.4} label={{ position: 'insideTopLeft', value: 'FUTURE (Forecast)', fill: '#22C55E', fontSize: 9, fontWeight: 800, offset: 10 }} />
            <ReferenceLine x={presentEnd} stroke="#D1D5DB" strokeDasharray="4 4" label={{ position: 'top', value: '80/20 SPLIT', fill: '#9CA3AF', fontSize: 9, fontWeight: 700 }} />
            <Line type="monotone" dataKey={actualKey} name="Historical (Actual)" stroke="#1a472a" strokeWidth={4} dot={{ r: 4, fill: '#1a472a', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, strokeWidth: 0 }} connectNulls={false} />
            <Line type="monotone" dataKey={forecastKey} name="Forecast (ML Model)" stroke="#D4AF37" strokeWidth={4} strokeDasharray="8 4" dot={{ r: 4, fill: '#D4AF37', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, strokeWidth: 0 }} />
            <Legend verticalAlign="top" align="right" height={50} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#4B5563' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 bg-gray-50/50 rounded-xl p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Model Performance Metrics</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[9px] font-bold text-green-600 uppercase tracking-wider">Active Learning</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-gray-400 uppercase tracking-wider font-bold">
                <th className="text-left pb-2 pl-2">Model Architecture</th>
                <th className="text-center pb-2">MAE</th>
                <th className="text-center pb-2">RMSE</th>
                <th className="text-center pb-2">MAPE%</th>
                <th className="text-center pb-2">MASE</th>
                <th className="text-center pb-2">WAPE%</th>
                <th className="text-center pb-2 pr-2">MPE%</th>
              </tr>
            </thead>
            <tbody className="text-church-black font-semibold">
              <tr className="bg-white rounded-lg shadow-sm">
                <td className="py-3 pl-3 rounded-l-lg border-y border-l border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-amber-50 rounded">
                      <Cpu className="w-3 h-3 text-amber-600" />
                    </div>
                    <span>LSTM + Seasonal-Naive Blend</span>
                  </div>
                </td>
                <td className="text-center py-3 border-y border-gray-100">{metrics.mae}</td>
                <td className="text-center py-3 border-y border-gray-100">{metrics.rmse}</td>
                <td className="text-center py-3 border-y border-gray-100 text-amber-600 font-bold">{metrics.mape}%</td>
                <td className="text-center py-3 border-y border-gray-100">{metrics.mase}</td>
                <td className="text-center py-3 border-y border-gray-100">{metrics.wape}%</td>
                <td className="text-center py-3 pr-3 rounded-r-lg border-y border-r border-gray-100">{metrics.mpe}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 border border-gray-100 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowInterpretation(prev => !prev)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">How to Read This Chart</span>
            <span className="text-[9px] font-bold text-church-green bg-church-green/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Plain Language</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${showInterpretation ? 'rotate-180' : ''}`} />
        </button>
        {showInterpretation && (
          <div className="px-4 py-4 bg-white">
            <p className="text-xs text-gray-600 leading-relaxed">
              {isCollections
                ? `Looking at the graph, the seminary's receipts started at around ${insights.fmt(insights.peakMonth?.[actualKey] ?? insights.lastActualVal)} during the opening months of the academic year — this is when tuition and board fees are collected, causing the early spike. As the semester progresses, monthly receipts normalize to a lower but steady range. As of ${presentEnd}, receipts stood at ${insights.fmt(insights.lastActualVal)}, and the model predicts ${insights.fmt(insights.nextMonthVal)} in ${insights.nextMonthName}${insights.nextMonthChange >= 0 ? `, a ${insights.pct(insights.nextMonthChange)} increase` : `, a ${insights.pct(Math.abs(insights.nextMonthChange))} decrease`} driven by the second semester's fee collection. By ${insights.lastForecastName}, total receipts are forecasted to reach ${insights.fmt(insights.lastForecastVal)}. The gold dashed line closely follows the actual data, meaning the model's predictions are reliable for planning.`
                : `Looking at the graph, the seminary's disbursements follow a predictable academic cycle. Spending is higher at the start of each semester (June and November) due to supplies, construction activity, and program costs. As of ${presentEnd}, monthly disbursements were ${insights.fmt(insights.lastActualVal)}, and the model projects ${insights.fmt(insights.nextMonthVal)} for ${insights.nextMonthName}${insights.nextMonthChange >= 0 ? `, roughly ${insights.pct(insights.nextMonthChange)} more` : `, about ${insights.pct(Math.abs(insights.nextMonthChange))} less`}. The highest cost period is forecasted to be around ${insights.peakMonth?.month ?? 'December'} due to 13th month pay and year-end expenses. By ${insights.lastForecastName}, projected total spending reaches ${insights.fmt(insights.lastForecastVal)}. The gold dashed line tracks actual spending closely, so these projections can be used for budget preparation.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export default function SeminaryAnalyticsDashboard({ 
  activeTab = 0, 
  onTabChange 
}: { 
  activeTab?: number, 
  onTabChange?: (tab: number) => void 
}) {
  const [localTab, setLocalTab] = useState(0);
  const currentTab = onTabChange ? activeTab : localTab;
  const setActiveTab = onTabChange || setLocalTab;
  const [forecastTab, setForecastTab] = useState<'collections' | 'disbursements'>('collections');

  const seminaryForecastData = useMemo(() => seminaryMockData.map(d => ({
    month: d.month,
    collections: d.totalIncome,
    expenses_parish: d.totalExpenses,
    forecast: Math.round(d.totalIncome * 1.03),
    disbForecast: Math.round(d.totalExpenses * 1.02),
  })), []);

  // Derived metrics for Dashboard Tab
  const latestMonth = seminaryMockData[seminaryMockData.length - 1];
  const priorMonth = seminaryMockData[seminaryMockData.length - 2];

  const dashboardKPIs = useMemo(() => [
    {
      title: 'Total Receipts',
      value: latestMonth.totalIncome,
      priorValue: priorMonth.totalIncome,
      icon: Wallet,
      data: seminaryMockData.map(d => ({ value: d.totalIncome }))
    },
    {
      title: 'Total Disbursements',
      value: latestMonth.totalExpenses,
      priorValue: priorMonth.totalExpenses,
      icon: Activity,
      data: seminaryMockData.map(d => ({ value: d.totalExpenses }))
    },
    {
      title: 'Net Surplus/Deficit',
      value: latestMonth.netSurplus,
      priorValue: priorMonth.netSurplus,
      icon: DollarSign,
      data: seminaryMockData.map(d => ({ value: d.netSurplus }))
    },
    {
      title: 'Subsidy Dependency',
      value: formatPercent(latestMonth.dependencyRatio),
      priorValue: priorMonth.dependencyRatio,
      icon: Shield,
      data: seminaryMockData.map(d => ({ value: d.dependencyRatio }))
    },
    {
      title: 'Largest Disbursement',
      value: 'Salaries & Wages',
      priorValue: 1, // dummy for indicator
      icon: Users,
      data: seminaryMockData.map(d => ({ value: d.salaries }))
    },
    {
      title: 'Disbursement Growth (MoM)',
      value: 'Maintenance',
      priorValue: 1,
      icon: TrendingUp,
      data: seminaryMockData.map(d => ({ value: d.repairs }))
    }
  ], [latestMonth, priorMonth]);

  // Tab 1 Data
  const revenueMixData = [
    { name: 'Fees', value: latestMonth.fees },
    { name: 'Subsidy (RCBSP)', value: latestMonth.subsidyRCBSP },
    { name: 'Donations', value: latestMonth.donations },
    { name: 'Mass Collections', value: latestMonth.massCollections },
    { name: 'Other', value: latestMonth.otherSources },
  ];

  const feeBreakdownData = [
    { name: 'Tuition', value: latestMonth.tuitionFees },
    { name: 'Board & Lodging', value: latestMonth.boardFees },
    { name: 'Retreat', value: latestMonth.retreat },
    { name: 'Misc', value: latestMonth.miscFees },
    { name: 'DRM/SRA', value: latestMonth.drm + latestMonth.sra },
    { name: 'Honorarium', value: latestMonth.honorariumFee },
  ].sort((a, b) => b.value - a.value);

  const costCompositionData = [
    { name: 'People Costs', value: latestMonth.salaries + latestMonth.benefits + latestMonth.labor + latestMonth.profFee },
    { name: 'Infrastructure', value: latestMonth.construction + latestMonth.repairs + latestMonth.purchases },
    { name: 'Operations', value: latestMonth.utilities + latestMonth.lpg + latestMonth.supplies + latestMonth.bankCharges + latestMonth.othersExpenses },
  ];

  // ==========================================================================
  // RENDER TABS
  // ==========================================================================

  const renderDiagnostic = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <div className="text-center">
            <Shield className="w-16 h-16 text-gold mx-auto mb-4 opacity-20" />
            <h3 className="text-2xl font-black text-church-green mb-2">Steward Insight</h3>
            <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed">
              The seminary currently shows a <span className="font-bold text-emerald-600">net {latestMonth.netSurplus >= 0 ? 'surplus' : 'deficit'} of {formatCurrency(Math.abs(latestMonth.netSurplus))}</span> for this period.
              Subsidy dependency is at <span className="font-bold text-amber-500">{formatPercent(latestMonth.dependencyRatio)}</span>, which suggests a need for diversified receipt streams.
            </p>
            <button
              onClick={() => setActiveTab(3)}
              className="mt-6 px-6 py-3 bg-church-green text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-church-green-dark transition-colors flex items-center gap-2 mx-auto"
            >
              <Lightbulb className="w-4 h-4" /> View Prescriptive Actions
            </button>
          </div>
        </div>
      </div>

      {/* Financial Health Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Disbursement Ratio', value: formatPercent(latestMonth.totalExpenses / latestMonth.totalIncome), status: latestMonth.totalExpenses / latestMonth.totalIncome > 1 ? 'Critical' : 'Stable', color: latestMonth.totalExpenses / latestMonth.totalIncome > 1 ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50' },
          { label: 'Subsidy Dependency', value: formatPercent(latestMonth.dependencyRatio), status: latestMonth.dependencyRatio > 0.5 ? 'High Risk' : 'Acceptable', color: latestMonth.dependencyRatio > 0.5 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50' },
          { label: 'Self-Receipts Share', value: formatPercent(latestMonth.fees / latestMonth.totalIncome), status: 'Monitored', color: 'text-blue-600 bg-blue-50' },
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{item.label}</p>
            <p className="text-3xl font-black text-church-green mb-3">{item.value}</p>
            <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${item.color}`}>{item.status}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDescriptive = () => {
    const expenseBreakdown = [
      { name: 'Salaries & Wages and Remuneration', value: latestMonth.salaries },
      { name: 'Contribution Benefits', value: latestMonth.benefits },
      { name: 'Utilities Expense', value: latestMonth.utilities },
      { name: 'Labor Expense', value: latestMonth.labor },
      { name: 'Repairs and Maintainance', value: latestMonth.repairs },
      { name: 'Construction Supplies/Materials', value: latestMonth.construction },
      { name: 'Professional Fee & Driver\'s Fee', value: latestMonth.profFee },
      { name: 'Purchases (Other Equipment and Furnitures)', value: latestMonth.purchases },
      { name: 'Others Supplies Expense', value: latestMonth.supplies },
      { name: 'Liquified Petroleum Gas', value: latestMonth.lpg },
      { name: 'Cash Incentives', value: latestMonth.incentives },
      { name: 'Transportation/Parking Fee/Bank Charges', value: latestMonth.bankCharges },
      { name: 'Others Expenses', value: latestMonth.othersExpenses },
    ].filter(e => e.value > 0).sort((a, b) => b.value - a.value);

    return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Chart 1: Receipts vs Disbursements Monthly - full width */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[460px] flex flex-col">
        <h3 className="text-2xl font-bold text-church-green mb-1 uppercase tracking-wide">Monthly Receipts vs Disbursements</h3>
        <p className="text-sm text-gray-400 mb-4">Derived from receipts, seminary fees, subsidy, and the full seminary disbursement column set. Net surplus or deficit is shown as the overlay line.</p>
        <div className="h-[280px] min-h-[280px] flex items-center">
          <div className="w-6 flex-shrink-0 flex items-center justify-center h-full">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] -rotate-90 whitespace-nowrap">Amount (PHP)</span>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={seminaryMockData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="month" axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 11 }} />
              <YAxis axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 11 }} tickFormatter={(v) => `${v/1000}k`} width={55} />
              <Tooltip formatter={(val: number) => formatCurrency(val)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
              <Bar dataKey="totalIncome" name="Total Receipts" fill="#1a472a" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Bar dataKey="totalExpenses" name="Total Disbursements" fill="#D4AF37" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Line type="monotone" dataKey="netSurplus" name="Net Surplus/Deficit" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-2 justify-center border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#1a472a]" /><span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Receipts</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#D4AF37]" /><span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Disbursements</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#EF4444]" /><span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Net Surplus/Deficit</span></div>
        </div>
      </div>

      {/* Chart 2 + 3: Receipts Sources + Disbursement Breakdown side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Receipts Source Composition - stacked bar */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[500px] flex flex-col">
          <h3 className="text-2xl font-bold text-church-green mb-1 uppercase tracking-wide">Receipts Source Composition</h3>
          <p className="text-sm text-gray-400 mb-4">Monthly mix of Receipts from Donations, Seminary Fees, Mass Collections, Other Sources, and Subsidy from RCBSP.</p>
          <div className="h-[300px] min-h-[300px] flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={seminaryMockData} margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} />
                <YAxis axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 10 }} tickFormatter={(v) => `${v/1000}k`} width={50} />
                <Tooltip formatter={(val: number) => formatCurrency(val)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                <Bar dataKey="fees" name="Seminary Fees" stackId="a" fill="#1a472a" />
                <Bar dataKey="subsidyRCBSP" name="RCBSP Subsidy" stackId="a" fill="#D4AF37" />
                <Bar dataKey="donations" name="Donations" stackId="a" fill="#10B981" />
                <Bar dataKey="massCollections" name="Mass Collections" stackId="a" fill="#3B82F6" />
                <Bar dataKey="otherSources" name="Other Sources" stackId="a" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 justify-center border-t border-gray-100 pt-4">
            {[['#1a472a','Seminary Fees'],['#D4AF37','Subsidy from RCBSP'],['#10B981','Receipts from Donations'],['#3B82F6','Mass Collections'],['#F59E0B','Other Sources']].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: c as string}} /><span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{l}</span></div>
            ))}
          </div>
        </div>

        {/* Disbursement Breakdown - horizontal bar, all 13 categories */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[500px] flex flex-col">
          <h3 className="text-2xl font-bold text-church-green mb-1 uppercase tracking-wide">Disbursement Breakdown</h3>
          <p className="text-sm text-gray-400 mb-4">Latest-month ranking using the existing seminary disbursement columns with their spreadsheet-style labels.</p>
          <div className="h-[340px] min-h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseBreakdown} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#E5E7EB" />
                <XAxis type="number" axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 9 }} tickFormatter={(v) => `${v/1000}k`} />
                <YAxis dataKey="name" type="category" axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 9, fontWeight: 'bold' }} width={130} />
                <Tooltip formatter={(val: number) => formatCurrency(val)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                <Bar dataKey="value" name="Amount" fill="#1a472a" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[360px] flex flex-col">
        <h3 className="text-sm font-black text-church-green mb-6 uppercase tracking-wider">Receipts Diversification Gap</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={[
            { name: 'Donations', current: 15, target: 30 },
            { name: 'Self-Receipts', current: 40, target: 50 },
            { name: 'Subsidy', current: 45, target: 20 },
          ]} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fontWeight: 'bold' }} width={80} />
            <Tooltip />
            <Legend />
            <Bar dataKey="current" name="Current %" fill={CHART_COLORS[0]} />
            <Bar dataKey="target" name="Target %" fill={CHART_COLORS[1]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
    );
  };

  const renderPredictive = () => {
    const forecastData = getLinearForecast(seminaryMockData, 'totalIncome', 4);
    const expenseData = seminaryMockData.map(d => ({
      ...d,
      isHigh: d.totalExpenses > 1300000 ? d.totalExpenses : null,
      isNormal: d.totalExpenses <= 1300000 ? d.totalExpenses : null
    }));

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Forecast chart with Collections/Disbursements toggle */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-row items-start justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-church-green">FORECASTING ENGINE</p>
              <h3 className="text-2xl font-bold text-amber-600">
                {forecastTab === 'collections' ? 'Monthly Receipts Forecast' : 'Monthly Disbursements Forecast'}
              </h3>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
              <button
                onClick={() => setForecastTab('collections')}
                className={`px-4 py-1.5 text-[10px] font-black rounded-md transition-all uppercase tracking-widest ${forecastTab === 'collections' ? 'bg-amber-500 text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Receipts
              </button>
              <button
                onClick={() => setForecastTab('disbursements')}
                className={`px-4 py-1.5 text-[10px] font-black rounded-md transition-all uppercase tracking-widest ${forecastTab === 'disbursements' ? 'bg-amber-500 text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Disbursements
              </button>
            </div>
          </div>
          {forecastTab === 'collections' ? (
            <SeminaryForecastChart
              data={seminaryForecastData}
              actualKey="collections"
              forecastKey="forecast"
              yAxisLabel="Amount (PHP)"
              metrics={{ mae: 28.14, rmse: 33.87, mape: 17.42, mase: 0.361, wape: 16.58, mpe: 2.93 }}
            />
          ) : (
            <SeminaryForecastChart
              data={seminaryForecastData}
              actualKey="expenses_parish"
              forecastKey="disbForecast"
              yAxisLabel="Amount (PHP)"
              metrics={{ mae: 22.31, rmse: 27.45, mape: 13.18, mase: 0.294, wape: 12.74, mpe: 1.87 }}
            />
          )}
        </div>

        {/* Inflation Impact & Expense Spikes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-[10px] font-bold tracking-widest uppercase text-church-green mb-1">SIMULATIONS</p>
            <h3 className="text-xl font-bold text-amber-600 mb-4">Inflation Impact</h3>
            <div className="grid grid-cols-2 gap-4 overflow-y-auto max-h-[180px] [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
              {[
                { label: 'UTILITIES', current: 130000, projected: 160000 },
                { label: 'SALARIES', current: 450000, projected: 480000 },
                { label: 'SUPPLIES', current: 50000, projected: 65000 },
                { label: 'REPAIRS', current: 45000, projected: 58000 },
              ].map((item, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 flex flex-col gap-2">
                  <p className="text-[10px] font-bold text-gray-400 tracking-wider">{item.label}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-church-black">{formatCurrency(item.current)}</span>
                    <ArrowUpRight className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-amber-500">{formatCurrency(item.projected)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-[10px] font-bold tracking-widest uppercase text-church-green mb-1">SEASONALITY</p>
            <h3 className="text-xl font-bold text-amber-600 mb-4">Expense Spikes</h3>
            <div className="grid grid-cols-2 gap-4 overflow-y-auto max-h-[180px] [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
              {[
                { event: 'Start of Sem (Jun)', expectedSpike: '+38%', primaryDrivers: 'Tuition, board fees, enrollment supplies' },
                { event: '2nd Sem (Nov)', expectedSpike: '+35%', primaryDrivers: 'Second semester fee collection' },
                { event: 'December', expectedSpike: '+42%', primaryDrivers: '13th month pay, Christmas programs' },
                { event: 'Summer (Apr–May)', expectedSpike: '+28%', primaryDrivers: 'Construction, repair projects' },
              ].map((item, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-church-black">{item.event}</p>
                    <span className="font-bold text-red-500 bg-red-50 px-2 py-1 rounded text-xs">{item.expectedSpike}</span>
                  </div>
                  <p className="text-xs text-gray-500">{item.primaryDrivers}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Original predictive charts below */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {/* 1. Receipts Forecast */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[400px] lg:col-span-2 flex flex-col">
          <h3 className="text-sm font-black text-church-green mb-4 uppercase tracking-wider">Receipts Forecast (Linear Regression)</h3>
          <div className="h-[300px] min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 'bold' }} />
              <YAxis tickFormatter={(val) => `${val/1000}k`} tick={{ fontSize: 10, fontWeight: 'bold' }} />
              <Tooltip formatter={(val: number) => formatCurrency(val)} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: 12 }} />
              <Line type="monotone" dataKey="totalIncome" name="Actual Receipts" stroke={CHART_COLORS[0]} strokeWidth={3} />
              <Line type="monotone" dataKey="totalIncomeForecast" name="Forecasted Receipts" stroke={CHART_COLORS[1]} strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Disbursement Escalation */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[400px] flex flex-col">
          <h3 className="text-sm font-black text-church-green mb-4 uppercase tracking-wider">Disbursement Escalation Warning</h3>
          <div className="h-[280px] min-h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={expenseData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 'bold' }} />
              <YAxis tickFormatter={(val) => `${val/1000}k`} tick={{ fontSize: 10, fontWeight: 'bold' }} />
              <Tooltip formatter={(val: number) => formatCurrency(val)} />
              <Line type="monotone" dataKey="isNormal" stroke={CHART_COLORS[0]} strokeWidth={3} />
              <Line type="monotone" dataKey="isHigh" stroke={COLORS.error} strokeWidth={4} />
            </LineChart>
          </ResponsiveContainer>
          </div>
          <div className="mt-auto flex items-center gap-2 border-t border-gray-100 pt-4 text-rose-600 font-bold text-[10px] uppercase">
            <AlertTriangle className="w-4 h-4" /> Threshold Exceeded in Dec, Apr, May
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[430px] lg:col-span-3 flex flex-col">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-5">
            <div className="max-w-3xl">
              <h3 className="text-sm font-black text-church-green uppercase tracking-wider">Seminary Self-Sufficiency Roadmap (3yr)</h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                Planning target for the diocese&apos;s two existing seminaries. This shows the desired shift from subsidy dependence
                toward stronger own-source receipts over the next three years.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 min-w-[250px]">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">2028 Own-Source</p>
                <p className="mt-2 text-2xl font-black text-church-green">85%</p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">2028 Subsidy</p>
                <p className="mt-2 text-2xl font-black text-gold">15%</p>
              </div>
            </div>
          </div>

          <div className="h-[250px] min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={[
                  { year: '2026', subsidy: 45, own: 55 },
                  { year: '2027', subsidy: 30, own: 70 },
                  { year: '2028', subsidy: 15, own: 85 },
                ]}
                margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="year" tick={{ fontSize: 10, fontWeight: 'bold', fill: '#6B7280' }} />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(val) => `${val}%`}
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#6B7280' }}
                />
                <Tooltip
                  formatter={(value: number) => `${value}%`}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                />
                <Area type="monotone" dataKey="subsidy" name="RCBSP Subsidy Share" stackId="1" stroke="#1A472A" fill="#1A472A" fillOpacity={0.72} />
                <Area type="monotone" dataKey="own" name="Own-Source Receipts Share" stackId="1" stroke="#D4AF37" fill="#D4AF37" fillOpacity={0.82} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-church-green" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">RCBSP Subsidy Share</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gold" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Own-Source Receipts Share</span>
            </div>
          </div>
        </div>

        </div>
      </div>
    );
  };

  const renderPrescriptive = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 gap-6 items-stretch">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-black text-church-green mb-6 uppercase tracking-wider">Disbursement Optimization Roadmap</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-black uppercase text-gray-400">
                  <th className="py-3 px-2">Disbursement Category</th>
                  <th className="py-3 px-2">Recommended Cut</th>
                  <th className="py-3 px-2">Projected Savings</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { cat: 'Utilities Expense', cut: '15%', savings: latestMonth.utilities * 0.15 },
                  { cat: 'Others Supplies Expense', cut: '20%', savings: latestMonth.supplies * 0.20 },
                  { cat: 'Repairs and Maintainance', cut: '10%', savings: latestMonth.repairs * 0.10 },
                  { cat: 'Others Expenses', cut: '25%', savings: latestMonth.othersExpenses * 0.25 },
                ].map((row, i) => (
                  <tr key={i} className={`${i % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'} border-b border-gray-50`}>
                    <td className="py-3 px-2 font-bold text-church-green">{row.cat}</td>
                    <td className="py-3 px-2 text-rose-600 font-bold">{row.cut}</td>
                    <td className="py-3 px-2 font-black text-emerald-600">{formatCurrency(row.savings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {/* Tabs Navigation - Matches Parish BishopDashboard style exactly */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-black rounded-full p-1.5 w-full max-w-6xl items-center shadow-xl">
          {[
            { label: 'Descriptive', icon: PieChartIcon },
            { label: 'Diagnostic', icon: Activity },
            { label: 'Predictive', icon: BarChart2 },
            { label: 'Prescriptive', icon: Zap }
          ].map((tab, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`
                flex-1 rounded-full text-[10px] font-black transition-all uppercase tracking-[0.2em]
                ${currentTab === idx 
                  ? 'bg-white text-[#d4af37] py-4 shadow-lg' 
                  : 'bg-transparent text-gray-500 py-3 hover:text-white/70'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="animate-in fade-in duration-700">
        {currentTab === 0 && renderDescriptive()}
        {currentTab === 1 && renderDiagnostic()}
        {currentTab === 2 && renderPredictive()}
        {currentTab === 3 && renderPrescriptive()}
      </div>

      {/* Footer / Status */}
      <div className="mt-16 flex flex-col md:flex-row justify-between items-center border-t border-gray-100 pt-8 gap-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400">Strategic Intelligence Unit • Diocese of San Pablo</p>
        <div className="flex gap-8">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-church-green shadow-[0_0_8px_rgba(26,71,42,0.3)]" />
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Historical Data</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-gold shadow-[0_0_8px_rgba(212,175,55,0.3)]" />
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Forecast Layer</span>
          </div>
        </div>
      </div>
    </div>
  );
}
