'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ComposedChart,
  Treemap, ErrorBar, ScatterChart, Scatter
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, AlertTriangle, 
  ArrowUpRight, Shield, Zap, Activity, 
  Wallet, PieChart as PieChartIcon, BarChart2, Lightbulb
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch animate-in fade-in slide-in-from-bottom-4 duration-500">
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
