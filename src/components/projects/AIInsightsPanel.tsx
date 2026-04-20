'use client';

import React from 'react';
import { Sparkles, TrendingUp, Calendar, Zap, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Project } from '../../types';

interface AIInsightsPanelProps {
  project: Project;
  role?: string;
}

export function AIInsightsPanel({ project, role }: AIInsightsPanelProps) {
  const isParish = role === 'priest' || role === 'school' || role === 'seminary';
  
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-100';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-rose-600 bg-rose-50 border-rose-100';
  };

  const getHealthStatus = (score: number) => {
    if (score >= 80) return 'Optimal';
    if (score >= 50) return 'Attention Required';
    return 'Critical Risk';
  };

  const isOverspending = project.totalExpenses !== undefined && project.totalExpenses > project.currentAmount;
  const isInefficient = project.totalExpenses !== undefined && (project.currentAmount - project.totalExpenses > 50000);

  return (
    <div className="space-y-8 pt-4">
      <div className="flex items-center gap-4 mb-6 px-2">
        <div className="w-14 h-14 rounded-2xl bg-gold-500/10 flex items-center justify-center text-gold-600 shadow-inner group transition-transform hover:rotate-12">
          <Sparkles className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-2xl font-serif font-bold text-church-black leading-tight">Steward AI Insights</h3>
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-[0.3em] mt-1">Real-time Predictive Engine</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {/* Success Prediction & Health Score Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
          {/* Success Prediction */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gold-500/5 rounded-full -mr-12 -mt-12" />
            <div className="flex items-center justify-between mb-5 relative z-10">
              <div className="flex items-center gap-2 text-gray-400">
                <TrendingUp className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Success Probability</span>
              </div>
              <span className="text-2xl font-serif font-bold text-gold-600">{project.successProbability}%</span>
            </div>
            <div className="h-2.5 bg-gray-50 rounded-full overflow-hidden mb-4 relative z-10 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${project.successProbability}%` }}
                transition={{ duration: 1.5, ease: "circOut" }}
                className="h-full bg-gold-500 rounded-full shadow-sm"
              />
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed relative z-10">
              Projected likelihood of achieving the <span className="font-bold text-church-black">₱{project.targetAmount.toLocaleString()}</span> target by the set deadline.
            </p>
          </motion.div>

          {/* Project Health Score */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 text-gray-400">
                <Zap className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Vitality Index</span>
              </div>
              <div className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider shadow-sm ${getHealthColor(project.healthScore)}`}>
                {getHealthStatus(project.healthScore)}
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-serif font-bold text-church-black">{project.healthScore}</span>
              <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">/ 100</span>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Composite score derived from donation velocity, community engagement, and resource allocation efficiency.
            </p>
          </motion.div>
        </div>

        {/* Expense vs Collection Analysis */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-gray-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Fiscal Analysis</span>
            </div>
            {project.totalExpenses !== undefined && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                isOverspending 
                  ? 'text-rose-600 bg-rose-50 border-rose-100'
                  : isInefficient
                  ? 'text-amber-600 bg-amber-50 border-amber-100'
                  : 'text-green-600 bg-green-50 border-green-100'
              }`}>
                {isOverspending ? 'Deficit Risk' : isInefficient ? 'Under-utilized' : 'Balanced'}
              </div>
            )}
          </div>
          
          <div className="space-y-4 mb-6 relative z-10">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gold-500" />
                <span className="text-xs text-gray-500 font-medium">Total Collections</span>
              </div>
              <span className="text-sm font-bold text-church-black">₱{project.currentAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                <span className="text-xs text-gray-500 font-medium">Total Expenses</span>
              </div>
              <span className="text-sm font-bold text-church-black">₱{(project.totalExpenses || 0).toLocaleString()}</span>
            </div>
            
            {/* Visual Bar Comparison */}
            <div className="h-2 bg-gray-50 rounded-full overflow-hidden flex shadow-inner">
              <div 
                className="h-full bg-gold-500 transition-all duration-1000" 
                style={{ width: `${(project.currentAmount / (project.currentAmount + (project.totalExpenses || 0)) * 100) || 0}%` }} 
              />
              <div 
                className="h-full bg-gray-200 transition-all duration-1000" 
                style={{ width: `${((project.totalExpenses || 0) / (project.currentAmount + (project.totalExpenses || 0)) * 100) || 0}%` }} 
              />
            </div>

            <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Net Variance</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${(project.currentAmount - (project.totalExpenses || 0)) < 0 ? 'bg-rose-500' : 'bg-green-500'}`} />
                  <span className={`text-base font-serif font-bold ${
                    (project.currentAmount - (project.totalExpenses || 0)) < 0 ? 'text-rose-600' : 'text-green-600'
                  }`}>
                    ₱{(project.currentAmount - (project.totalExpenses || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest block">Confidence</span>
                <span className="text-xs font-bold text-church-black">98.4%</span>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border flex gap-3 ${
            isOverspending 
              ? 'bg-rose-50 border-rose-100 text-rose-700' 
              : isInefficient 
              ? 'bg-amber-50 border-amber-100 text-amber-700' 
              : 'bg-green-50 border-green-100 text-green-700'
          }`}>
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed font-medium">
              {isOverspending ? (
                "Critical: Current expenditures exceed total funds raised. Recommend immediate suspension of non-essential spending."
              ) : isInefficient ? (
                "Notice: Significant surplus detected relative to project phase. Verify if project execution is meeting scheduled milestones."
              ) : (
                "Optimal: Fiscal management is aligned with fundraising progress. Continue current allocation strategy."
              )}
            </p>
          </div>
        </motion.div>

        {/* Timeline Optimization */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gold-500/5 rounded-[24px] border border-gold-500/10 p-6 relative overflow-hidden"
        >
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gold-500/10 rounded-full blur-2xl" />
          <div className="flex items-center gap-2 text-gold-600 mb-4 relative z-10">
            <Calendar className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Temporal Strategy</span>
          </div>
          <p className="text-sm font-serif font-medium text-church-black leading-relaxed mb-5 italic relative z-10">
            "Historical data indicates a 40% surge in contributions during the May fiesta period. Align major outreach efforts with this window."
          </p>
          {isParish && (
            <button className="flex items-center gap-2 text-gold-600 text-[11px] font-bold hover:gap-3 transition-all relative z-10 group">
              OPTIMIZE TIMELINE <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </motion.div>

        {/* Next Best Action */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-church-green-dark rounded-[24px] p-6 text-white shadow-xl shadow-church-green-dark/20 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-xl" />
          <div className="flex items-center gap-2 text-gold-500 mb-4 relative z-10">
            <Zap className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Strategic Directive</span>
          </div>
          <p className="text-sm font-medium leading-relaxed mb-6 relative z-10">
            {project.recommendation}
          </p>
          {isParish && (
            <button className="w-full py-3.5 bg-gold-500 text-church-green-dark rounded-xl text-xs font-bold hover:bg-gold-600 transition-all shadow-lg shadow-gold-500/20 relative z-10 active:scale-[0.98]">
              EXECUTE DIRECTIVE
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
