'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  ArrowLeft, FileText, Upload, Download, CheckCircle, AlertCircle, Clock,
  DollarSign, X, Calendar, ChevronDown, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SUBMISSION_CONFIG } from '../constants';
import { FinancialRecord } from '../types';

interface ParishDataSubmissionProps {
  parishName?: string;
  vicariate?: string;
  parishClass?: string;
  year?: number;
  onBack?: () => void;
  onImport?: (records: FinancialRecord[]) => void;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const iafrHistory = [
  { month: 'Jan 2026', deadline: new Date(2026, 0, 15), submitted: new Date(2026, 0, 13), ok: true },
  { month: 'Feb 2026', deadline: new Date(2026, 1, 15), submitted: new Date(2026, 1, 11), ok: true },
  { month: 'Mar 2026', deadline: new Date(2026, 2, 15), submitted: new Date(2026, 2, 14), ok: true },
  { month: 'Apr 2026', deadline: new Date(2026, 3, 15), submitted: new Date(2026, 3, 12), ok: true },
  { month: 'May 2026', deadline: new Date(2026, 4, 15), submitted: null, ok: false },
];

const fmt = (d: Date) =>
  `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

export function ParishDataSubmission({
  parishName = 'San Isidro Labrador Parish',
  vicariate = 'Holy Family Vicariate',
  parishClass = 'Class B',
  year = 2026,
  onBack,
  onImport,
}: ParishDataSubmissionProps) {
  const [activeTab, setActiveTab] = useState<'submit' | 'history' | 'budget'>('submit');
  const [selectedMonth, setSelectedMonth] = useState(4); // May (0-indexed)
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [budgetAnnual, setBudgetAnnual] = useState(0);
  const [budgetMonthly, setBudgetMonthly] = useState(0);
  const [budgetInputType, setBudgetInputType] = useState<'annual' | 'monthly'>('annual');
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nextDeadline = useMemo(() => {
    const today = new Date();
    const month = today.getMonth();
    const yr = today.getFullYear();
    let d = new Date(yr, month, SUBMISSION_CONFIG.DEADLINE_DAY);
    if (today.getDate() >= SUBMISSION_CONFIG.DEADLINE_DAY) {
      d = new Date(yr, month + 1, SUBMISSION_CONFIG.DEADLINE_DAY);
    }
    return d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
  }, []);

  const downloadTemplate = useCallback(() => {
    const months = MONTHS_SHORT;
    const header = 'Month,Collections (PHP),Consumable Collections (PHP),Disbursements (PHP),Sacraments Rate (%),Sacraments Arancel (PHP),Sacraments Parish Share (PHP),Sacraments Over & Above (PHP),Collections Mass (PHP),Collections Other (PHP),Collections Other Receipts (PHP),Expenses Pastoral (PHP),Expenses Parish (PHP),Net Receipts (PHP),Mass Intentions Not Claimed (PHP),Mass Intentions Claimed (PHP),Special Collections (PHP),Pastoral Fund Total Net Receipts (PHP)\n';
    const rows = months.map((m) => `${m},0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${parishName}_IAFR_Template_${year}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setUploadStatus('success');
    setUploadMessage('Template downloaded successfully.');
    setTimeout(() => setUploadStatus('idle'), 3000);
  }, [parishName, year]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter((l) => l.trim());
      if (lines.length < 2) throw new Error('Invalid CSV format');

      const records: FinancialRecord[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim());
        if (values.length < 4) continue;
        const record: FinancialRecord = {
          month: values[0],
          collections: parseFloat(values[1]) || 0,
          consumableCollections: parseFloat(values[2]) || 0,
          disbursements: parseFloat(values[3]) || 0,
          entityType: 'parish',
          sacraments_rate: parseFloat(values[4]) || undefined,
          sacraments_arancel: parseFloat(values[5]) || undefined,
          sacraments_parishShare: parseFloat(values[6]) || undefined,
          sacraments_overAbove: parseFloat(values[7]) || undefined,
          collections_mass: parseFloat(values[8]) || undefined,
          collections_other: parseFloat(values[9]) || undefined,
          collections_otherReceipts: parseFloat(values[10]) || undefined,
          expenses_pastoral: parseFloat(values[11]) || undefined,
          expenses_parish: parseFloat(values[12]) || undefined,
          netReceipts: parseFloat(values[13]) || undefined,
          others_massIntentionsNotClaimed: parseFloat(values[14]) || undefined,
          others_massIntentionsClaimed: parseFloat(values[15]) || undefined,
          others_specialCollections: parseFloat(values[16]) || undefined,
          pastoralParishFundTotalNetReceipts: parseFloat(values[17]) || undefined,
        };
        if (record.month && (record.collections > 0 || record.consumableCollections > 0 || record.disbursements > 0)) {
          records.push(record);
        }
      }
      if (records.length === 0) throw new Error('No valid records found in the CSV');
      onImport?.(records);
      setUploadStatus('success');
      setUploadMessage(`Successfully submitted IAFR with ${records.length} month(s) of data.`);
    } catch (err) {
      setUploadStatus('error');
      setUploadMessage(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setUploadStatus('idle'), 4000);
    }
  }, [onImport]);

  const handleBudgetSave = useCallback(() => {
    setUploadStatus('success');
    setUploadMessage('Budget saved successfully.');
    setIsBudgetOpen(false);
    setTimeout(() => setUploadStatus('idle'), 3000);
  }, []);

  const tabs = [
    { id: 'submit', label: 'Submit IAFR' },
    { id: 'history', label: 'Submission History' },
    { id: 'budget', label: 'Budget' },
  ] as const;

  return (
    <div className="min-h-full bg-church-light">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-church-green bg-church-green/5 px-2 py-0.5 rounded-lg border border-church-green/10">
                IAFR Submission
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-gold-600 bg-gold-50 px-2 py-0.5 rounded-lg border border-gold-200">
                {parishClass}
              </span>
            </div>
            <h1 className="text-lg font-serif font-black text-church-green truncate leading-tight">
              {parishName}
            </h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{vicariate}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Next Deadline</p>
            <p className="text-xs font-black text-red-600">{nextDeadline}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-xs font-bold relative transition-colors whitespace-nowrap ${
                  activeTab === tab.id ? 'text-church-green' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-church-green rounded-t"
                    layoutId="submissionTab"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Status Alerts */}
        <AnimatePresence>
          {uploadStatus === 'success' && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">{uploadMessage}</span>
            </motion.div>
          )}
          {uploadStatus === 'error' && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">{uploadMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit IAFR Tab */}
        {activeTab === 'submit' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Current Status Banner */}
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-5 w-5 text-red-600 flex-shrink-0" />
                <span className="text-sm font-bold text-red-700">Not Submitted</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-red-700">
                <p><strong>Next Deadline:</strong> {nextDeadline}</p>
                <p><strong>Status:</strong> No submission yet</p>
              </div>
            </div>

            {/* Month Selector */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4 text-church-green" />
                <h3 className="text-sm font-black text-gray-800">Select Month for IAFR</h3>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <span>{MONTHS[selectedMonth]} {year}</span>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${showMonthDropdown ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showMonthDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden"
                    >
                      <div className="grid grid-cols-3 gap-1 p-2">
                        {MONTHS.map((m, i) => {
                          const isPast = iafrHistory.find((h) => h.month === `${MONTHS_SHORT[i]} ${year}`)?.ok;
                          return (
                            <button
                              key={m}
                              onClick={() => { setSelectedMonth(i); setShowMonthDropdown(false); }}
                              className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                                selectedMonth === i
                                  ? 'bg-church-green text-white'
                                  : isPast
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              {MONTHS_SHORT[i]}
                              {isPast && selectedMonth !== i && (
                                <span className="ml-1 text-emerald-500">✓</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
              <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-700 space-y-1">
                <p className="font-bold">How to submit your IAFR:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-600">
                  <li>Download the CSV template below</li>
                  <li>Fill in all financial data for {MONTHS[selectedMonth]} {year}</li>
                  <li>Upload the completed file using the Upload Data button</li>
                </ol>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-black text-gray-800 mb-4">
                Submit IAFR — {MONTHS[selectedMonth]} {year}
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={downloadTemplate}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold-500 px-4 py-3 text-sm font-bold text-black shadow-sm transition-all hover:bg-gold-600 hover:scale-[1.01]"
                >
                  <Download className="h-4 w-4" />
                  Download Template
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-church-green px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-church-green/90 hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Upload className="h-4 w-4" />
                  {isUploading ? 'Uploading...' : 'Upload Data'}
                </button>
                <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Submission History Tab */}
        {activeTab === 'history' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <h3 className="text-sm font-black text-gray-800">IAFR Submission History — {year}</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Due every 15th of the month</p>
              </div>
              <div className="divide-y divide-gray-50">
                {iafrHistory.map((row, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                        row.ok ? 'bg-emerald-50 border-emerald-100' : 'bg-orange-50 border-orange-100'
                      }`}>
                        {row.ok
                          ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                          : <AlertCircle className="w-4 h-4 text-orange-500" />
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-church-green">IAFR — {row.month}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          {row.ok && row.submitted
                            ? `Submitted ${fmt(row.submitted)}`
                            : `Due ${fmt(row.deadline)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider border ${
                        row.ok
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-orange-50 text-orange-700 border-orange-100'
                      }`}>
                        {row.ok ? 'Submitted' : 'Pending'}
                      </span>
                      {!row.ok && (
                        <button
                          onClick={() => setActiveTab('submit')}
                          className="text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider bg-church-green text-white border border-church-green/80 hover:bg-church-green/90 transition-colors"
                        >
                          Submit
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Budget Tab */}
        {activeTab === 'budget' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="border-b border-gold-200 bg-gradient-to-r from-gold-50 to-gold-100/50 px-5 py-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-gold-600" />
                  <h3 className="text-base font-bold text-gray-900">Annual Budget</h3>
                </div>
              </div>
              <div className="px-5 py-5 space-y-4">
                {budgetAnnual > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-gray-600">Annual Budget</span>
                      <span className="text-2xl font-bold text-gold-600">
                        PHP {(budgetAnnual / 1000).toLocaleString('en', { maximumFractionDigits: 0 })}K
                      </span>
                    </div>
                    <div className="h-px bg-gray-100" />
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-gray-600">Monthly Budget</span>
                      <span className="text-lg font-bold text-gray-900">
                        PHP {((budgetAnnual / 12) / 1000).toLocaleString('en', { maximumFractionDigits: 0 })}K
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No budget set yet. Use the button below to add one.</p>
                )}
                <button
                  onClick={() => setIsBudgetOpen(true)}
                  className="w-full rounded-xl bg-gold-500 px-4 py-3 text-sm font-bold text-black transition-colors hover:bg-gold-600"
                >
                  {budgetAnnual > 0 ? 'Update Budget' : 'Set Budget'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Budget Modal */}
      <AnimatePresence>
        {isBudgetOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Set Budget</h3>
                <button onClick={() => setIsBudgetOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2 rounded-xl bg-gray-100 p-1.5">
                  <button
                    onClick={() => setBudgetInputType('annual')}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${budgetInputType === 'annual' ? 'bg-gold-500 text-black shadow-sm' : 'text-gray-700 hover:bg-gray-200'}`}
                  >
                    Annual
                  </button>
                  <button
                    onClick={() => setBudgetInputType('monthly')}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${budgetInputType === 'monthly' ? 'bg-gold-500 text-black shadow-sm' : 'text-gray-700 hover:bg-gray-200'}`}
                  >
                    Monthly
                  </button>
                </div>
                {budgetInputType === 'annual' ? (
                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">Annual Budget (PHP)</label>
                    <input
                      type="number"
                      value={budgetAnnual || ''}
                      onChange={(e) => { const v = parseFloat(e.target.value) || 0; setBudgetAnnual(v); setBudgetMonthly(v / 12); }}
                      placeholder="e.g. 1200000"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200"
                    />
                    {budgetAnnual > 0 && (
                      <p className="mt-1.5 text-xs text-gray-500">
                        = PHP {(budgetAnnual / 12 / 1000).toFixed(1)}K per month
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">Monthly Budget (PHP)</label>
                    <input
                      type="number"
                      value={budgetMonthly || ''}
                      onChange={(e) => { const v = parseFloat(e.target.value) || 0; setBudgetMonthly(v); setBudgetAnnual(v * 12); }}
                      placeholder="e.g. 100000"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200"
                    />
                    {budgetMonthly > 0 && (
                      <p className="mt-1.5 text-xs text-gray-500">
                        = PHP {(budgetMonthly * 12 / 1000).toFixed(0)}K annually
                      </p>
                    )}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setIsBudgetOpen(false)}
                    className="flex-1 rounded-xl bg-gray-100 px-4 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBudgetSave}
                    className="flex-1 rounded-xl bg-gold-500 px-4 py-3 text-sm font-bold text-black transition-colors hover:bg-gold-600"
                  >
                    Save Budget
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
