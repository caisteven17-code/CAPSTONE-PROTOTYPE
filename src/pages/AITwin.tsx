'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Zap, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Save, 
  RotateCcw, 
  Play,
  Trash2,
  ChevronRight,
  ArrowRight,
  LayoutDashboard,
  History
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

// Mock parish data
const parishes = [
  { id: 1, name: "St. Matthew's Parish", cashBalance: 200000, monthlyIncome: 50000, monthlyExpenses: 60000, healthScore: 58 },
  { id: 2, name: "San Roque Parish", cashBalance: 80000, monthlyIncome: 35000, monthlyExpenses: 45000, healthScore: 41 },
  { id: 3, name: "Our Lady of Peace", cashBalance: 350000, monthlyIncome: 80000, monthlyExpenses: 70000, healthScore: 82 },
  { id: 4, name: "St. Peter's Parish", cashBalance: 120000, monthlyIncome: 45000, monthlyExpenses: 48000, healthScore: 65 }
];

interface SimulationParams {
  collectionsChange: number;
  expensesChange: number;
  oneTimeIncome: number;
  oneTimeIncomeDesc: string;
  oneTimeExpense: number;
  oneTimeExpenseDesc: string;
  externalSupport: number;
  timeline: number;
}

interface SavedScenario {
  id: string;
  name: string;
  parishId: number;
  params: SimulationParams;
  timestamp: number;
}

export function AITwin() {
  const [selectedParishId, setSelectedParishId] = useState(parishes[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>(() => {
    const saved = localStorage.getItem('church_sim_scenarios');
    return saved ? JSON.parse(saved) : [];
  });

  const [params, setParams] = useState<SimulationParams>({
    collectionsChange: 0,
    expensesChange: 0,
    oneTimeIncome: 0,
    oneTimeIncomeDesc: '',
    oneTimeExpense: 0,
    oneTimeExpenseDesc: '',
    externalSupport: 0,
    timeline: 12
  });

  const selectedParish = useMemo(() => 
    parishes.find(p => p.id === selectedParishId) || parishes[0]
  , [selectedParishId]);

  const calculateResults = (currentParams: SimulationParams, parish: typeof parishes[0]) => {
    const { 
      collectionsChange, 
      expensesChange, 
      oneTimeIncome, 
      oneTimeExpense, 
      externalSupport, 
      timeline 
    } = currentParams;

    const baseMonthlyIncome = parish.monthlyIncome;
    const baseMonthlyExpenses = parish.monthlyExpenses;
    
    const simMonthlyIncome = baseMonthlyIncome * (1 + collectionsChange / 100);
    const simMonthlyExpenses = baseMonthlyExpenses * (1 + expensesChange / 100);
    const monthlyNet = simMonthlyIncome - simMonthlyExpenses;

    let currentCash = parish.cashBalance + oneTimeIncome - oneTimeExpense + externalSupport;
    const projectedData = [];

    // Initial state (Month 0)
    projectedData.push({
      month: 'Now',
      baseline: parish.cashBalance,
      simulated: currentCash
    });

    let baselineCash = parish.cashBalance;
    const baselineMonthlyNet = baseMonthlyIncome - baseMonthlyExpenses;

    for (let i = 1; i <= timeline; i++) {
      baselineCash += baselineMonthlyNet;
      currentCash += monthlyNet;
      
      projectedData.push({
        month: `Month ${i}`,
        baseline: Math.max(0, baselineCash),
        simulated: Math.max(0, currentCash)
      });
    }

    // Calculate runway
    let runwayMonths = -1; // Infinite
    if (monthlyNet < 0) {
      runwayMonths = Math.floor(currentCash / Math.abs(monthlyNet));
    }

    // Risk level
    let riskLevel = 'Low';
    let riskColor = 'text-emerald-500';
    let riskBg = 'bg-emerald-500/10';

    if (runwayMonths !== -1) {
      if (runwayMonths < 3) {
        riskLevel = 'Critical';
        riskColor = 'text-rose-500';
        riskBg = 'bg-rose-500/10';
      } else if (runwayMonths < 6) {
        riskLevel = 'High';
        riskColor = 'text-orange-500';
        riskBg = 'bg-orange-500/10';
      } else if (runwayMonths < 12) {
        riskLevel = 'Medium';
        riskColor = 'text-amber-500';
        riskBg = 'bg-amber-500/10';
      }
    }

    // AI Recommendation
    let recommendation = "Financial outlook is stable. Consider building a reserve fund for future projects.";
    if (monthlyNet < 0) {
      if (runwayMonths < 6) {
        recommendation = `Urgent action required. Projected deficit of ₱${Math.abs(monthlyNet).toLocaleString()} monthly. Prioritize expense reduction or seek emergency diocese support.`;
      } else {
        recommendation = "Projected spending exceeds income. Review operational costs and explore new collection strategies to ensure long-term sustainability.";
      }
    } else if (collectionsChange > 10) {
      recommendation = "Ambitious collection targets set. Ensure community engagement programs are in place to support this growth.";
    }

    return {
      runwayMonths,
      projectedData,
      recommendation,
      riskLevel,
      riskColor,
      riskBg,
      monthlyNet
    };
  };

  const [simulationResults, setSimulationResults] = useState(() => calculateResults(params, selectedParish));

  // Update results when parish changes (initial load for new parish)
  useEffect(() => {
    setSimulationResults(calculateResults(params, selectedParish));
  }, [selectedParishId]);

  const handleRunSimulation = () => {
    setIsSimulating(true);
    // Simulate a delay for the "AI" to think
    setTimeout(() => {
      setSimulationResults(calculateResults(params, selectedParish));
      setIsSimulating(false);
    }, 800);
  };

  const handleSaveScenario = () => {
    const name = prompt('Enter a name for this scenario:');
    if (!name) return;

    const newScenario: SavedScenario = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      parishId: selectedParishId,
      params: { ...params },
      timestamp: Date.now()
    };

    const updated = [newScenario, ...savedScenarios];
    setSavedScenarios(updated);
    localStorage.setItem('church_sim_scenarios', JSON.stringify(updated));
  };

  const handleDeleteScenario = (id: string) => {
    const updated = savedScenarios.filter(s => s.id !== id);
    setSavedScenarios(updated);
    localStorage.setItem('church_sim_scenarios', JSON.stringify(updated));
  };

  const handleLoadScenario = (scenario: SavedScenario) => {
    setSelectedParishId(scenario.parishId);
    setParams(scenario.params);
    const parish = parishes.find(p => p.id === scenario.parishId) || parishes[0];
    setSimulationResults(calculateResults(scenario.params, parish));
  };

  const handleReset = () => {
    setParams({
      collectionsChange: 0,
      expensesChange: 0,
      oneTimeIncome: 0,
      oneTimeIncomeDesc: '',
      oneTimeExpense: 0,
      oneTimeExpenseDesc: '',
      externalSupport: 0,
      timeline: 12
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 bg-emerald-500/10';
    if (score >= 60) return 'text-amber-500 bg-amber-500/10';
    return 'text-rose-500 bg-rose-500/10';
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-gold-500">
            <Zap className="w-5 h-5 fill-current" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Financial Intelligence</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-church-black">AI Twin: Cash Flow Simulator</h1>
          <p className="text-church-grey text-sm">Simulate "what-if" scenarios to test financial decisions before implementation.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-church-grey/20 text-church-grey hover:bg-white transition-all text-sm font-bold"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button 
            onClick={handleSaveScenario}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-church-black text-white hover:bg-church-grey transition-all text-sm font-bold shadow-lg shadow-black/10"
          >
            <Save className="w-4 h-4" />
            Save Scenario
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Controls */}
        <div className="lg:col-span-5 space-y-8">
          {/* Section A: Parish Selector */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-church-grey/10 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-gold-500/10 flex items-center justify-center">
                <Search className="w-5 h-5 text-gold-600" />
              </div>
              <h3 className="text-lg font-bold text-church-black">Select Parish</h3>
            </div>
            
            <div className="relative">
              <select 
                value={selectedParishId}
                onChange={(e) => setSelectedParishId(Number(e.target.value))}
                className="w-full pl-4 pr-10 py-4 bg-church-light border border-church-grey/10 rounded-2xl text-church-black focus:outline-none focus:ring-2 focus:ring-gold-500 appearance-none font-medium"
              >
                {parishes.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-church-grey">
                <ChevronRight className="w-5 h-5 rotate-90" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl border border-church-grey/5 flex flex-col gap-1 ${getHealthColor(selectedParish.healthScore)}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Health Score</span>
                <span className="text-2xl font-bold">{selectedParish.healthScore}</span>
              </div>
              <div className="p-4 rounded-2xl bg-church-light border border-church-grey/5 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-church-grey uppercase tracking-wider">Current Runway</span>
                <span className="text-2xl font-bold text-church-black">
                  {selectedParish.monthlyIncome >= selectedParish.monthlyExpenses ? '∞' : `${Math.floor(selectedParish.cashBalance / (selectedParish.monthlyExpenses - selectedParish.monthlyIncome))}m`}
                </span>
              </div>
            </div>
          </div>

          {/* Section C: Simulation Parameters */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-church-grey/10 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-church-black">Simulation Controls</h3>
              </div>
              <div className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
                What-If Mode
              </div>
            </div>

            <div className="space-y-8">
              {/* Collections Change */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-church-black flex items-center gap-2">
                    Collections Change
                    <Info className="w-3.5 h-3.5 text-church-grey cursor-help" />
                  </label>
                  <span className={`text-sm font-bold ${params.collectionsChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {params.collectionsChange > 0 ? '+' : ''}{params.collectionsChange}%
                  </span>
                </div>
                <input 
                  type="range" 
                  min="-50" 
                  max="50" 
                  value={params.collectionsChange}
                  onChange={(e) => setParams({...params, collectionsChange: Number(e.target.value)})}
                  className="w-full h-2 bg-church-light rounded-lg appearance-none cursor-pointer accent-gold-500"
                />
                <div className="flex justify-between text-[10px] font-bold text-church-grey uppercase tracking-widest">
                  <span>-50%</span>
                  <span>Baseline</span>
                  <span>+50%</span>
                </div>
              </div>

              {/* Expenses Change */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-church-black flex items-center gap-2">
                    Expenses Change
                    <Info className="w-3.5 h-3.5 text-church-grey cursor-help" />
                  </label>
                  <span className={`text-sm font-bold ${params.expensesChange <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {params.expensesChange > 0 ? '+' : ''}{params.expensesChange}%
                  </span>
                </div>
                <input 
                  type="range" 
                  min="-50" 
                  max="50" 
                  value={params.expensesChange}
                  onChange={(e) => setParams({...params, expensesChange: Number(e.target.value)})}
                  className="w-full h-2 bg-church-light rounded-lg appearance-none cursor-pointer accent-gold-500"
                />
                <div className="flex justify-between text-[10px] font-bold text-church-grey uppercase tracking-widest">
                  <span>-50%</span>
                  <span>Baseline</span>
                  <span>+50%</span>
                </div>
              </div>

              {/* One-time Income/Expense */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-church-grey uppercase tracking-widest ml-1">One-time Income</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-church-grey font-bold">₱</span>
                    <input 
                      type="number" 
                      value={params.oneTimeIncome || ''}
                      onChange={(e) => setParams({...params, oneTimeIncome: Number(e.target.value)})}
                      className="w-full pl-8 pr-4 py-3 bg-church-light border border-church-grey/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 font-medium"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-church-grey uppercase tracking-widest ml-1">One-time Expense</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-church-grey font-bold">₱</span>
                    <input 
                      type="number" 
                      value={params.oneTimeExpense || ''}
                      onChange={(e) => setParams({...params, oneTimeExpense: Number(e.target.value)})}
                      className="w-full pl-8 pr-4 py-3 bg-church-light border border-church-grey/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 font-medium"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* External Support & Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-church-grey uppercase tracking-widest ml-1">External Support</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-church-grey font-bold">₱</span>
                    <input 
                      type="number" 
                      value={params.externalSupport || ''}
                      onChange={(e) => setParams({...params, externalSupport: Number(e.target.value)})}
                      className="w-full pl-8 pr-4 py-3 bg-church-light border border-church-grey/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 font-medium"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-church-grey uppercase tracking-widest ml-1">Timeline (Months)</label>
                  <select 
                    value={params.timeline}
                    onChange={(e) => setParams({...params, timeline: Number(e.target.value)})}
                    className="w-full px-4 py-3 bg-church-light border border-church-grey/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 font-medium"
                  >
                    <option value={3}>3 Months</option>
                    <option value={6}>6 Months</option>
                    <option value={12}>12 Months</option>
                    <option value={24}>24 Months</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="w-full py-4 bg-gold-500 text-church-black rounded-2xl font-bold hover:bg-gold-600 transition-all shadow-lg shadow-gold-500/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSimulating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-church-black/30 border-t-church-black rounded-full animate-spin" />
                    Calculating Scenarios...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    Run Simulation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-7 space-y-8">
          {/* Section D: Simulation Results */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-church-grey/10 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-church-black">Simulation Results</h3>
              </div>
              <div className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm ${simulationResults.riskBg} ${simulationResults.riskColor}`}>
                <AlertTriangle className="w-4 h-4" />
                {simulationResults.riskLevel} Risk Level
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-[24px] bg-church-light border border-church-grey/5 space-y-2">
                <span className="text-[10px] font-bold text-church-grey uppercase tracking-widest">New Cash Runway</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-church-black">
                    {simulationResults.runwayMonths === -1 ? '∞' : `${simulationResults.runwayMonths}m`}
                  </span>
                  {simulationResults.runwayMonths !== -1 && (
                    <span className={`text-xs font-bold ${simulationResults.runwayMonths < 6 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {simulationResults.runwayMonths < 6 ? 'Critical' : 'Stable'}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-6 rounded-[24px] bg-church-light border border-church-grey/5 space-y-2">
                <span className="text-[10px] font-bold text-church-grey uppercase tracking-widest">Monthly Net Flow</span>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-bold ${simulationResults.monthlyNet >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    ₱{Math.abs(simulationResults.monthlyNet).toLocaleString()}
                  </span>
                  <span className="text-xs text-church-grey font-medium">/mo</span>
                </div>
              </div>
              <div className="p-6 rounded-[24px] bg-church-light border border-church-grey/5 space-y-2">
                <span className="text-[10px] font-bold text-church-grey uppercase tracking-widest">Final Balance</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-church-black">
                    ₱{simulationResults.projectedData[simulationResults.projectedData.length - 1].simulated.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-church-black">Projected Cash Balance</h4>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-church-grey/20" />
                    <span className="text-[10px] font-bold text-church-grey uppercase tracking-wider">Baseline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gold-500" />
                    <span className="text-[10px] font-bold text-church-grey uppercase tracking-wider">Simulated</span>
                  </div>
                </div>
              </div>
              <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={simulationResults.projectedData}>
                    <defs>
                      <linearGradient id="colorSim" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={true} 
                      tickLine={true} 
                      tick={{fontSize: 10, fontWeight: 600, fill: '#9CA3AF'}}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={true} 
                      tickLine={true} 
                      tick={{fontSize: 10, fontWeight: 600, fill: '#9CA3AF'}}
                      tickFormatter={(value) => `₱${value/1000}k`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1A1A1A',
                        border: 'none',
                        borderRadius: '16px',
                        color: '#fff',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value: number) => [`₱${value.toLocaleString()}`, '']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="baseline" 
                      stroke="#9CA3AF" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fill="transparent" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="simulated" 
                      stroke="#D4AF37" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorSim)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Recommendation */}
            <div className="p-6 rounded-[24px] bg-gold-500/5 border border-gold-500/10 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="flex items-center gap-2 text-gold-600 relative z-10">
                <Zap className="w-4 h-4 fill-current" />
                <span className="text-[10px] font-bold uppercase tracking-widest">AI Recommendation</span>
              </div>
              <p className="text-sm text-church-black font-medium leading-relaxed relative z-10">
                {simulationResults.recommendation}
              </p>
            </div>
          </div>

          {/* Section E: Saved Scenarios */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-church-grey/10 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                  <History className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-church-black">Saved Scenarios</h3>
              </div>
              <span className="text-xs font-bold text-church-grey">{savedScenarios.length} Saved</span>
            </div>

            {savedScenarios.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedScenarios.map(scenario => (
                  <div 
                    key={scenario.id}
                    className="p-5 rounded-2xl bg-church-light border border-church-grey/5 hover:border-gold-500/30 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-church-black group-hover:text-gold-600 transition-colors">{scenario.name}</h4>
                        <p className="text-[10px] text-church-grey font-medium">
                          {parishes.find(p => p.id === scenario.parishId)?.name} • {new Date(scenario.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleDeleteScenario(scenario.id)}
                        className="p-2 text-church-grey hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <button 
                      onClick={() => handleLoadScenario(scenario)}
                      className="w-full py-2.5 bg-white border border-church-grey/10 rounded-xl text-xs font-bold text-church-black hover:bg-gold-500 hover:text-white hover:border-gold-500 transition-all flex items-center justify-center gap-2"
                    >
                      Load Scenario
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-church-light flex items-center justify-center">
                  <History className="w-8 h-8 text-church-grey/30" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-church-black">No saved scenarios yet</p>
                  <p className="text-xs text-church-grey">Run a simulation and save it to see it here.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
