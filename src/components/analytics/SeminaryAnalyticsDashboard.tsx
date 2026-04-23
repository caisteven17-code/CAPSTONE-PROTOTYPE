'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ComposedChart,
  Treemap, ErrorBar, ScatterChart, Scatter
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, AlertTriangle, 
  ArrowUpRight, Target, Shield, Zap, Calendar, Activity, 
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

export default function SeminaryAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState(0);

  // Derived metrics for Dashboard Tab
  const latestMonth = seminaryMockData[seminaryMockData.length - 1];
  const priorMonth = seminaryMockData[seminaryMockData.length - 2];

  const dashboardKPIs = useMemo(() => [
    {
      title: 'Total Income',
      value: latestMonth.totalIncome,
      priorValue: priorMonth.totalIncome,
      icon: Wallet,
      data: seminaryMockData.map(d => ({ value: d.totalIncome }))
    },
    {
      title: 'Total Expenses',
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
      title: 'Largest Expense',
      value: 'Salaries & Wages',
      priorValue: 1, // dummy for indicator
      icon: Users,
      data: seminaryMockData.map(d => ({ value: d.salaries }))
    },
    {
      title: 'Cost Growth (MoM)',
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

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardKPIs.map((kpi, idx) => (
          <KPICard key={idx} {...kpi} />
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[400px]">
          <h3 className="text-lg font-black text-church-green mb-6 uppercase tracking-wider">Financial Overview Trend</h3>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={seminaryMockData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} tickFormatter={(val) => `${val/1000}k`} />
              <Tooltip formatter={(val: number) => formatCurrency(val)} />
              <Legend />
              <Bar dataKey="totalIncome" name="Total Income" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="totalExpenses" name="Total Expenses" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="netSurplus" name="Net Surplus" stroke={COLORS.gold} strokeWidth={3} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <div className="text-center">
            <Shield className="w-16 h-16 text-gold mx-auto mb-4 opacity-20" />
            <h3 className="text-2xl font-black text-church-green mb-2">Steward AI Insight</h3>
            <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed">
              The seminary currently shows a <span className="font-bold text-emerald-600">healthy surplus of {formatCurrency(latestMonth.netSurplus)}</span> for this period. 
              However, subsidy dependency is at <span className="font-bold text-amber-500">{formatPercent(latestMonth.dependencyRatio)}</span>, which suggests a need for diversified revenue streams.
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
    </div>
  );

  const renderDescriptive = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. Revenue Mix */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[350px]">
        <h3 className="text-sm font-black text-church-green mb-6 uppercase tracking-wider">Revenue Mix</h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={revenueMixData}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {revenueMixData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(val: number) => formatCurrency(val)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 2. Fee Structure Breakdown */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[350px]">
        <h3 className="text-sm font-black text-church-green mb-6 uppercase tracking-wider">Fee Structure Breakdown</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={feeBreakdownData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} width={100} />
            <Tooltip formatter={(val: number) => formatCurrency(val)} />
            <Bar dataKey="value" fill={CHART_COLORS[1]} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 3. Cost Composition */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[350px]">
        <h3 className="text-sm font-black text-church-green mb-6 uppercase tracking-wider">Cost Composition</h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={costCompositionData} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
              {costCompositionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index + 3]} />
              ))}
            </Pie>
            <Tooltip formatter={(val: number) => formatCurrency(val)} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 4. Operating Surplus/Deficit */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[350px] lg:col-span-2">
        <h3 className="text-sm font-black text-church-green mb-6 uppercase tracking-wider">Operating Surplus/Deficit Monthly</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={seminaryMockData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 'bold' }} />
            <YAxis tickFormatter={(val) => `${val/1000}k`} tick={{ fontSize: 10, fontWeight: 'bold' }} />
            <Tooltip formatter={(val: number) => formatCurrency(val)} />
            <Legend />
            <Bar dataKey="totalIncome" name="Income" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
            <Bar dataKey="totalExpenses" name="Expenses" fill={CHART_COLORS[5]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 5. Dependency Ratio */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[350px]">
        <h3 className="text-sm font-black text-church-green mb-6 uppercase tracking-wider">Dependency Ratio</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={seminaryMockData} stackOffset="expand">
            <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 'bold' }} />
            <YAxis tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} tick={{ fontSize: 10, fontWeight: 'bold' }} />
            <Tooltip formatter={(val: number) => formatPercent(val)} />
            <Bar dataKey="donations" name="Donations" stackId="a" fill={CHART_COLORS[1]} />
            <Bar dataKey="subsidyRCBSP" name="Subsidies" stackId="a" fill={CHART_COLORS[0]} />
            <Bar dataKey="fees" name="Own Income" stackId="a" fill={CHART_COLORS[2]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 6. People vs Operational Cost */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[350px]">
        <h3 className="text-sm font-black text-church-green mb-6 uppercase tracking-wider">People vs Operational Cost</h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={[
                { name: 'People', value: latestMonth.salaries + latestMonth.benefits + latestMonth.labor },
                { name: 'Operational', value: latestMonth.totalExpenses - (latestMonth.salaries + latestMonth.benefits + latestMonth.labor) },
              ]}
              innerRadius={50}
              outerRadius={70}
              dataKey="value"
            >
              <Cell fill={CHART_COLORS[0]} />
              <Cell fill={CHART_COLORS[1]} />
            </Pie>
            <Tooltip formatter={(val: number) => formatCurrency(val)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 7. Maintenance Burden */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[350px]">
        <h3 className="text-sm font-black text-church-green mb-6 uppercase tracking-wider">Maintenance Burden</h3>
        <div className="text-center mb-4">
          <p className="text-3xl font-black text-gold">{formatPercent(latestMonth.repairs / latestMonth.totalExpenses)}</p>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Share of Total Expenses</p>
        </div>
        <ResponsiveContainer width="100%" height="200px">
          <AreaChart data={seminaryMockData}>
            <Area type="monotone" dataKey="repairs" stroke={CHART_COLORS[5]} fill={CHART_COLORS[5]} fillOpacity={0.2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 8. Monthly Trend */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[350px] lg:col-span-3">
        <h3 className="text-sm font-black text-church-green mb-6 uppercase tracking-wider">Key Income vs Expense Trend</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={seminaryMockData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 'bold' }} />
            <YAxis tickFormatter={(val) => `${val/1000}k`} tick={{ fontSize: 10, fontWeight: 'bold' }} />
            <Tooltip formatter={(val: number) => formatCurrency(val)} />
            <Legend />
            <Line type="monotone" dataKey="fees" name="Seminary Fees" stroke={CHART_COLORS[0]} strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="salaries" name="Salaries" stroke={CHART_COLORS[1]} strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="donations" name="Donations" stroke={CHART_COLORS[2]} strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="repairs" name="Maintenance" stroke={CHART_COLORS[5]} strokeWidth={2} strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderPredictive = () => {
    const forecastData = getLinearForecast(seminaryMockData, 'totalIncome', 4);
    const expenseData = seminaryMockData.map(d => ({
      ...d,
      isHigh: d.totalExpenses > 1300000 ? d.totalExpenses : null,
      isNormal: d.totalExpenses <= 1300000 ? d.totalExpenses : null
    }));

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* 1. Revenue Forecast */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[350px] lg:col-span-2">
          <h3 className="text-sm font-black text-church-green mb-6 uppercase tracking-wider">Revenue Forecast (Linear Regression)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 'bold' }} />
              <YAxis tickFormatter={(val) => `${val/1000}k`} tick={{ fontSize: 10, fontWeight: 'bold' }} />
              <Tooltip formatter={(val: number) => formatCurrency(val)} />
              <Legend />
              <Line type="monotone" dataKey="totalIncome" name="Actual Income" stroke={CHART_COLORS[0]} strokeWidth={3} />
              <Line type="monotone" dataKey="totalIncomeForecast" name="Forecasted" stroke={CHART_COLORS[1]} strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 2. Expense Escalation */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[350px]">
          <h3 className="text-sm font-black text-church-green mb-6 uppercase tracking-wider">Expense Escalation Warning</h3>
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
          <div className="flex items-center gap-2 mt-2 text-rose-600 font-bold text-[10px] uppercase">
            <AlertTriangle className="w-4 h-4" /> Threshold Exceeded in Dec, Apr, May
          </div>
        </div>

        {/* 3. Cash Flow Projection */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[350px]">
          <h3 className="text-sm font-black text-church-green mb-6 uppercase tracking-wider">Cash Flow Projection</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={seminaryMockData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 'bold' }} />
              <YAxis tickFormatter={(val) => `${val/1000}k`} tick={{ fontSize: 10, fontWeight: 'bold' }} />
              <Tooltip formatter={(val: number) => formatCurrency(val)} />
              <Area type="monotone" dataKey="netSurplus" fill={CHART_COLORS[2]} stroke={CHART_COLORS[2]} fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 4. Donation Volatility */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[350px]">
          <h3 className="text-sm font-black text-church-green mb-6 uppercase tracking-wider">Donation Volatility (Std Dev)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={seminaryMockData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 'bold' }} />
              <YAxis tickFormatter={(val) => `${val/1000}k`} tick={{ fontSize: 10, fontWeight: 'bold' }} />
              <Tooltip formatter={(val: number) => formatCurrency(val)} />
              <Bar dataKey="donations" fill={CHART_COLORS[1]}>
                <ErrorBar dataKey="donations" width={4} strokeWidth={2} stroke={CHART_COLORS[0]} direction="y" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 5. Enrollment Simulation */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[350px]">
          <h3 className="text-sm font-black text-church-green mb-6 uppercase tracking-wider">Enrollment Simulation (Impact on Fee Income)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { name: 'Baseline', value: latestMonth.fees },
              { name: '+10%', value: latestMonth.fees * 1.1 },
              { name: '+20%', value: latestMonth.fees * 1.2 },
              { name: '+30%', value: latestMonth.fees * 1.3 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold' }} />
              <YAxis tickFormatter={(val) => `${val/1000}k`} tick={{ fontSize: 10, fontWeight: 'bold' }} />
              <Tooltip formatter={(val: number) => formatCurrency(val)} />
              <Bar dataKey="value" fill={CHART_COLORS[4]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 6. Infrastructure Spend Trend */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[350px]">
          <h3 className="text-sm font-black text-church-green mb-6 uppercase tracking-wider">Infrastructure Spend Trend</h3>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={seminaryMockData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 'bold' }} />
              <YAxis tickFormatter={(val) => `${val/1000}k`} tick={{ fontSize: 10, fontWeight: 'bold' }} />
              <Tooltip formatter={(val: number) => formatCurrency(val)} />
              <Bar dataKey="construction" name="Construction" fill={CHART_COLORS[6]} radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="repairs" name="Rolling Repairs Avg" stroke={CHART_COLORS[5]} strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 7. Subsidy Risk Simulation */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[350px] lg:col-span-2">
          <h3 className="text-sm font-black text-church-green mb-6 uppercase tracking-wider">Subsidy Risk Simulation (RCBSP Cut Impact)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { scenario: 'Current', subsidy: latestMonth.subsidyRCBSP, net: latestMonth.netSurplus },
              { scenario: '-20% Cut', subsidy: latestMonth.subsidyRCBSP * 0.8, net: latestMonth.netSurplus - latestMonth.subsidyRCBSP * 0.2 },
              { scenario: '-35% Cut', subsidy: latestMonth.subsidyRCBSP * 0.65, net: latestMonth.netSurplus - latestMonth.subsidyRCBSP * 0.35 },
              { scenario: '-50% Cut', subsidy: latestMonth.subsidyRCBSP * 0.5, net: latestMonth.netSurplus - latestMonth.subsidyRCBSP * 0.5 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="scenario" tick={{ fontSize: 10, fontWeight: 'bold' }} />
              <YAxis tickFormatter={(val) => `${val/1000}k`} tick={{ fontSize: 10, fontWeight: 'bold' }} />
              <Tooltip formatter={(val: number) => formatCurrency(val)} />
              <Legend />
              <Bar dataKey="subsidy" name="Projected Subsidy" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="net" name="Projected Net Surplus" fill={CHART_COLORS[5]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderPrescriptive = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Cost Optimization Table */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-black text-church-green mb-6 uppercase tracking-wider">Cost Optimization Roadmap</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-black uppercase text-gray-400">
                  <th className="py-3 px-2">Expense Category</th>
                  <th className="py-3 px-2">Recommended Cut</th>
                  <th className="py-3 px-2">Projected Savings</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { cat: 'Utilities', cut: '15%', savings: latestMonth.utilities * 0.15 },
                  { cat: 'Office Supplies', cut: '20%', savings: latestMonth.supplies * 0.20 },
                  { cat: 'Repairs (Preventive)', cut: '10%', savings: latestMonth.repairs * 0.10 },
                  { cat: 'Others', cut: '25%', savings: latestMonth.othersExpenses * 0.25 },
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

        {/* 2. Fee Calibration Table */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-black text-church-green mb-6 uppercase tracking-wider">Break-Even Tuition Calibration</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-black uppercase text-gray-400">
                  <th className="py-3 px-2">Cost Scenario</th>
                  <th className="py-3 px-2">Current Rate</th>
                  <th className="py-3 px-2">Target Rate</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { scenario: 'Baseline Costs', current: '₱25,000', target: '₱24,500' },
                  { scenario: '10% Inflation', current: '₱25,000', target: '₱27,800' },
                  { scenario: '50% Subsidy Cut', current: '₱25,000', target: '₱35,200' },
                ].map((row, i) => (
                  <tr key={i} className={`${i % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'} border-b border-gray-50`}>
                    <td className="py-3 px-2 font-bold text-church-green">{row.scenario}</td>
                    <td className="py-3 px-2 text-gray-500 font-bold">{row.current}</td>
                    <td className="py-3 px-2 font-black text-gold">{row.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3. Resilience Gap Analysis */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1">
          <h3 className="text-sm font-black text-church-green mb-6 uppercase tracking-wider">Income Diversification Gap</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[
              { name: 'Donations', current: 15, target: 30 },
              { name: 'Self-Income', current: 40, target: 50 },
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

        {/* 4. Program ROI Table */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-sm font-black text-church-green mb-6 uppercase tracking-wider">Program Performance Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-black uppercase text-gray-400">
                  <th className="py-3 px-2">Program</th>
                  <th className="py-3 px-2">Monthly Revenue</th>
                  <th className="py-3 px-2">Monthly Cost</th>
                  <th className="py-3 px-2">ROI %</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'DRM Program', rev: latestMonth.drm, cost: 15000, roi: ((latestMonth.drm - 15000) / 15000 * 100).toFixed(1) },
                  { name: 'SRA Program', rev: latestMonth.sra, cost: 12000, roi: ((latestMonth.sra - 12000) / 12000 * 100).toFixed(1) },
                  { name: 'Retreats', rev: 120000, cost: 85000, roi: ((120000 - 85000) / 85000 * 100).toFixed(1) },
                ].map((row, i) => (
                  <tr key={i} className={`${i % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'} border-b border-gray-50`}>
                    <td className="py-3 px-2 font-bold text-church-green">{row.name}</td>
                    <td className="py-3 px-2 text-church-green font-bold">{formatCurrency(row.rev as number)}</td>
                    <td className="py-3 px-2 text-rose-600 font-bold">{formatCurrency(row.cost)}</td>
                    <td className="py-3 px-2 font-black text-emerald-600">{row.roi}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 5. Budget Reallocation Matrix */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-black text-church-green mb-6 uppercase tracking-wider">Strategic Budget Reallocation</h3>
          <div className="space-y-3">
            {[
              { priority: 'High', action: 'Deferred Maintenance Fund', amount: '₱500,000', color: 'bg-rose-50 text-rose-700' },
              { priority: 'Medium', action: 'LMS Digital Integration', amount: '₱120,000', color: 'bg-amber-50 text-amber-700' },
              { priority: 'Low', action: 'Staff Development Program', amount: '₱85,000', color: 'bg-emerald-50 text-emerald-700' },
            ].map((item, idx) => (
              <div key={idx} className={`p-4 rounded-xl ${item.color} flex justify-between items-center border border-current border-opacity-10`}>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest block mb-1 opacity-60">{item.priority} Priority</span>
                  <p className="font-bold">{item.action}</p>
                </div>
                <span className="text-lg font-black">{item.amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Salary Sustainability Threshold */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[350px]">
          <h3 className="text-sm font-black text-church-green mb-6 uppercase tracking-wider">Salary Sustainability Threshold</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[
              { increase: '0%', minIncome: 1200000 },
              { increase: '5%', minIncome: 1260000 },
              { increase: '10%', minIncome: 1320000 },
              { increase: '15%', minIncome: 1380000 },
              { increase: '20%', minIncome: 1440000 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="increase" label={{ value: 'Salary Increase', position: 'insideBottom', offset: -5 }} tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={(val) => `${val/1000}k`} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="stepAfter" dataKey="minIncome" stroke={CHART_COLORS[0]} strokeWidth={4} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7. CapEx Planning Timeline */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-black text-church-green mb-6 uppercase tracking-wider">CapEx Strategic Timeline</h3>
          <div className="relative pt-4 pb-12 px-6">
            <div className="absolute left-6 right-6 top-1/2 h-1 bg-gray-100 -translate-y-1/2" />
            <div className="flex justify-between relative">
              {[
                { year: '2026', event: 'Roof Restoration', cost: '₱2M' },
                { year: '2027', event: 'New Solar Panels', cost: '₱800k' },
                { year: '2028', event: 'IT Infrastructure', cost: '₱500k' },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center relative">
                  <div className="w-4 h-4 rounded-full bg-gold border-4 border-white shadow-sm z-10" />
                  <div className="absolute top-8 text-center w-32">
                    <p className="text-[10px] font-black text-gray-400">{item.year}</p>
                    <p className="text-xs font-bold text-church-green">{item.event}</p>
                    <p className="text-[10px] font-bold text-gold">{item.cost}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 8. Self-Sufficiency Roadmap */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[350px]">
          <h3 className="text-sm font-black text-church-green mb-6 uppercase tracking-wider">Self-Sufficiency Roadmap (3yr)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[
              { year: '2026', subsidy: 45, own: 55 },
              { year: '2027', subsidy: 30, own: 70 },
              { year: '2028', subsidy: 15, own: 85 },
            ]}>
              <XAxis dataKey="year" tick={{ fontSize: 10, fontWeight: 'bold' }} />
              <YAxis tickFormatter={(val) => `${val}%`} tick={{ fontSize: 10, fontWeight: 'bold' }} />
              <Tooltip />
              <Area type="monotone" dataKey="subsidy" name="RCBSP Subsidy %" stackId="1" stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.8} />
              <Area type="monotone" dataKey="own" name="Own Source %" stackId="1" stroke={CHART_COLORS[1]} fill={CHART_COLORS[1]} fillOpacity={0.8} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-4xl font-black text-church-green tracking-tight uppercase">Seminary Strategic Dashboard</h2>
          <p className="text-gray-500 font-bold mt-1">Financial Oversight & Predictive Modeling — Diocese of San Pablo</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
          <Calendar className="w-5 h-5 text-gold ml-2" />
          <span className="text-sm font-bold text-church-green pr-4 border-r border-gray-100">Fiscal Year 2026</span>
          <div className="flex items-center gap-2 pl-2 pr-4">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Live Simulation</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 mb-8 bg-white/60 p-1.5 rounded-2xl border border-gray-200 w-fit">
        {[
          { label: 'Overview', icon: Target },
          { label: 'Descriptive', icon: PieChartIcon },
          { label: 'Predictive', icon: BarChart2 },
          { label: 'Prescriptive', icon: Zap }
        ].map((tab, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300
              ${activeTab === idx 
                ? 'bg-church-green text-white shadow-lg shadow-church-green/20 scale-105' 
                : 'text-gray-500 hover:bg-white hover:text-church-green'
              }
            `}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="min-h-[600px]">
        {activeTab === 0 && renderDashboard()}
        {activeTab === 1 && renderDescriptive()}
        {activeTab === 2 && renderPredictive()}
        {activeTab === 3 && renderPrescriptive()}
      </div>

      {/* Footer / Status */}
      <div className="mt-12 flex justify-between items-center border-t border-gray-200 pt-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">© 2026 Diocese of San Pablo Financial Intelligence Unit</p>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-church-green" />
            <span className="text-[10px] font-black uppercase text-gray-400">Actuals</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gold" />
            <span className="text-[10px] font-black uppercase text-gray-400">Projections</span>
          </div>
        </div>
      </div>
    </div>
  );
}
