'use client';

import React, { useState, useRef } from 'react';
import { Download, Upload, AlertCircle, CheckCircle, X, Calendar, DollarSign, Clock } from 'lucide-react';
import { FinancialRecord } from '../../types';
import { motion } from 'motion/react';

interface DataImportExportProps {
  entityName: string;
  entityType: 'parish' | 'school' | 'seminary';
  year: number;
  onImport: (records: FinancialRecord[]) => void;
  lastSubmissionDate?: Date;
  budgetData?: { monthly: number; annual: number };
  onBudgetSave?: (monthly: number, annual: number) => void;
}

export function DataImportExport({ entityName, entityType, year, onImport, lastSubmissionDate, budgetData, onBudgetSave }: DataImportExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const [budgetMonthly, setBudgetMonthly] = useState(budgetData?.monthly || 0);
  const [budgetAnnual, setBudgetAnnual] = useState(budgetData?.annual || 0);
  const [budgetInputType, setBudgetInputType] = useState<'annual' | 'monthly'>('annual');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate submission status
  /**
   * Determines submission status based on deadline (15th of each month).
   * Returns status, styling, and how many months late.
   */
  const getSubmissionStatus = () => {
    if (!lastSubmissionDate) {
      return { status: 'not-submitted', color: 'bg-red-50 border-red-200', badge: '🔴 Not Submitted', textColor: 'text-red-700', monthsLate: 0 };
    }

    const today = new Date();
    const lastSubmission = new Date(lastSubmissionDate);
    
    // Calculate months late (deadline is 15th of following month)
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Deadline: 15th of current month if before 15th, else 15th of next month
    let deadline = new Date(currentYear, currentMonth, 15);
    if (today.getDate() > 15) {
      deadline = new Date(currentYear, currentMonth + 1, 15);
    }

    const timeDiff = today.getTime() - lastSubmission.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
    const monthsLate = Math.floor(daysDiff / 30);

    if (lastSubmission >= deadline) {
      return { status: 'on-time', color: 'bg-green-50 border-green-200', badge: '🟢 On Time', textColor: 'text-green-700', monthsLate: 0 };
    } else if (monthsLate >= 1 && monthsLate <= 3) {
      return { status: 'warning', color: 'bg-amber-50 border-amber-200', badge: '🟠 Warning (1-3 months late)', textColor: 'text-amber-700', monthsLate };
    } else if (monthsLate >= 4) {
      return { status: 'action-required', color: 'bg-red-50 border-red-200', badge: '🔴 Action Required (4+ months late)', textColor: 'text-red-700', monthsLate };
    }

    return { status: 'on-time', color: 'bg-green-50 border-green-200', badge: '🟢 On Time', textColor: 'text-green-700', monthsLate: 0 };
  };

  const submissionStatus = getSubmissionStatus();

  /**
   * Calculates the next submission deadline (15th of current or next month).
   * @returns Formatted deadline date string
   */
  const getNextDeadline = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let deadline = new Date(currentYear, currentMonth, 15);
    if (today.getDate() >= 15) {
      deadline = new Date(currentYear, currentMonth + 1, 15);
    }
    
    return deadline.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  /**
   * Saves budget data and shows success message
   */
  const handleBudgetSave = React.useCallback(() => {
    if (onBudgetSave) {
      onBudgetSave(budgetMonthly, budgetAnnual);
      setImportStatus('success');
      setImportMessage('Budget saved successfully!');
      setIsBudgetOpen(false);
      setTimeout(() => setImportStatus('idle'), 3000);
    }
  }, [onBudgetSave, budgetMonthly, budgetAnnual]);

  /**
   * Generates and downloads CSV template for financial data entry
   */
  const downloadTemplate = React.useCallback(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const csvHeader = 'Month,Collections (₱),Consumable Collections (₱),Disbursements (₱),Sacraments Rate (%),Sacraments Arancel (₱),Sacraments Parish Share (₱),Sacraments Over & Above (₱),Collections Mass (₱),Collections Other (₱),Collections Other Receipts (₱),Expenses Pastoral (₱),Expenses Parish (₱),Net Receipts (₱),Mass Intentions Not Claimed (₱),Mass Intentions Claimed (₱),Special Collections (₱),Pastoral Fund Total Net Receipts (₱)\n';
    
    const csvRows = months.map(month => 
      `${month},0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0`
    ).join('\n');

    const csvContent = csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${entityName}_Financial_Template_${year}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setImportStatus('success');
    setImportMessage('Template downloaded successfully!');
    setTimeout(() => setImportStatus('idle'), 3000);
  }, [entityName, year]);

  /**
   * Handles CSV file selection and parsing.
   * Validates file format and creates financial records.
   */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('Invalid CSV format');
      }

      const records: FinancialRecord[] = [];
      
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        if (values.length < 4) continue;

        const month = values[0];
        const collections = parseFloat(values[1]) || 0;
        const consumableCollections = parseFloat(values[2]) || 0;
        const disbursements = parseFloat(values[3]) || 0;
        
        // Optional sacraments fields
        const sacraments_rate = parseFloat(values[4]) || undefined;
        const sacraments_arancel = parseFloat(values[5]) || undefined;
        const sacraments_parishShare = parseFloat(values[6]) || undefined;
        const sacraments_overAbove = parseFloat(values[7]) || undefined;
        
        // Optional collections breakdown
        const collections_mass = parseFloat(values[8]) || undefined;
        const collections_other = parseFloat(values[9]) || undefined;
        const collections_otherReceipts = parseFloat(values[10]) || undefined;
        
        // Optional expenses
        const expenses_pastoral = parseFloat(values[11]) || undefined;
        const expenses_parish = parseFloat(values[12]) || undefined;
        
        // Optional net and special
        const netReceipts = parseFloat(values[13]) || undefined;
        const others_massIntentionsNotClaimed = parseFloat(values[14]) || undefined;
        const others_massIntentionsClaimed = parseFloat(values[15]) || undefined;
        const others_specialCollections = parseFloat(values[16]) || undefined;
        const pastoralParishFundTotalNetReceipts = parseFloat(values[17]) || undefined;

        if (month && (collections > 0 || consumableCollections > 0 || disbursements > 0)) {
          records.push({
            month,
            collections,
            consumableCollections,
            disbursements,
            entityType: entityType,
            sacraments_rate: sacraments_rate || undefined,
            sacraments_arancel: sacraments_arancel || undefined,
            sacraments_parishShare: sacraments_parishShare || undefined,
            sacraments_overAbove: sacraments_overAbove || undefined,
            collections_mass: collections_mass || undefined,
            collections_other: collections_other || undefined,
            collections_otherReceipts: collections_otherReceipts || undefined,
            expenses_pastoral: expenses_pastoral || undefined,
            expenses_parish: expenses_parish || undefined,
            netReceipts: netReceipts || undefined,
            others_massIntentionsNotClaimed: others_massIntentionsNotClaimed || undefined,
            others_massIntentionsClaimed: others_massIntentionsClaimed || undefined,
            others_specialCollections: others_specialCollections || undefined,
            pastoralParishFundTotalNetReceipts: pastoralParishFundTotalNetReceipts || undefined,
          });
        }
      }

      if (records.length === 0) {
        throw new Error('No valid records found in the CSV');
      }

      onImport(records);
      setImportStatus('success');
      setImportMessage(`Successfully imported ${records.length} month(s) of data!`);
      setIsOpen(false);
      setTimeout(() => setImportStatus('idle'), 3000);
    } catch (error: any) {
      setImportStatus('error');
      setImportMessage(error.message || 'Failed to import file');
      setTimeout(() => setImportStatus('idle'), 3000);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3 md:space-y-5">
      {/* Status Messages */}
      {importStatus === 'success' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3 md:p-4 text-green-700"
        >
          <CheckCircle className="w-4 md:w-5 h-4 md:h-5 flex-shrink-0" />
          <span className="text-xs md:text-sm font-medium">{importMessage}</span>
        </motion.div>
      )}

      {importStatus === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 text-red-700"
        >
          <AlertCircle className="w-4 md:w-5 h-4 md:h-5 flex-shrink-0" />
          <span className="text-xs md:text-sm font-medium">{importMessage}</span>
        </motion.div>
      )}

      {/* Submission Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border rounded-lg p-4 md:p-5 ${submissionStatus.color}`}
      >
        <div className="flex items-start justify-between gap-3 md:gap-4">
          <div className="flex-1 space-y-1.5 md:space-y-2">
            <div className="flex items-center gap-2 md:gap-3 mb-2">
              <Clock className={`w-4 md:w-5 h-4 md:h-5 flex-shrink-0 ${submissionStatus.textColor}`} />
              <span className={`font-bold text-xs md:text-sm ${submissionStatus.textColor}`}>{submissionStatus.badge}</span>
            </div>
            <div className="space-y-1 md:space-y-2 text-[11px] md:text-sm">
              <p className={submissionStatus.textColor}>
                <strong>Next Deadline:</strong> {getNextDeadline()}
              </p>
              {lastSubmissionDate ? (
                <>
                  <p className={submissionStatus.textColor}>
                    <strong>Last Submitted:</strong> {new Date(lastSubmissionDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  {submissionStatus.monthsLate > 0 && (
                    <p className={`${submissionStatus.textColor} font-bold`}>
                      ⏱️ {submissionStatus.monthsLate} month(s) late
                    </p>
                  )}
                </>
              ) : (
                <p className={submissionStatus.textColor}>
                  <strong>Status:</strong> No submission yet
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Budget Card - Full Width with Better Layout */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-base"
      >
        <div className="bg-gradient-to-r from-gold-50 to-gold-100/50 px-4 md:px-5 py-2.5 md:py-3 border-b border-gold-200">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 md:w-5 h-4 md:h-5 text-gold-600 flex-shrink-0" />
            <h3 className="font-bold text-sm md:text-base text-gray-900">Annual Budget</h3>
          </div>
        </div>
        
        <div className="px-4 md:px-5 py-3 md:py-4">
          {budgetAnnual > 0 ? (
            <div className="space-y-2 md:space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[11px] md:text-sm text-gray-600">Annual Budget:</span>
                <span className="text-xl md:text-2xl font-bold text-gold-600">₱{(budgetAnnual / 1000).toLocaleString('en', {maximumFractionDigits:0})}K</span>
              </div>
              <div className="h-px bg-gray-200"></div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[11px] md:text-sm text-gray-600">Monthly Budget:</span>
                <span className="text-base md:text-lg font-bold text-gray-900">₱{((budgetAnnual / 12) / 1000).toLocaleString('en', {maximumFractionDigits:0})}K</span>
              </div>
            </div>
          ) : (
            <p className="text-xs md:text-sm text-gray-500 italic">No budget set yet. Click "Set Budget" to configure your financial targets.</p>
          )}
          <button
            onClick={() => setIsBudgetOpen(true)}
            className="w-full mt-3 md:mt-4 bg-gold-500 hover:bg-gold-600 text-black font-bold py-2 md:py-2.5 px-4 rounded-lg transition-colors text-xs md:text-sm hover:scale-105"
          >
            {budgetAnnual > 0 ? 'Update Budget' : 'Set Budget'}
          </button>
        </div>
      </motion.div>

      {/* Action Buttons - Side by Side and Responsive */}
      <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
        <button
          onClick={downloadTemplate}
          className="flex-1 flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-600 text-black font-bold py-2.5 md:py-3 px-4 md:px-6 rounded-lg transition-all shadow-md hover:shadow-lg hover:scale-105 text-xs md:text-sm"
        >
          <Download className="w-4 md:w-5 h-4 md:h-5 flex-shrink-0" />
          <span className="hidden sm:inline">Download Template</span>
          <span className="sm:hidden">Download</span>
        </button>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 md:py-3 px-4 md:px-6 rounded-lg transition-all shadow-md hover:shadow-lg hover:scale-105 text-xs md:text-sm"
        >
          <Upload className="w-4 md:w-5 h-4 md:h-5 flex-shrink-0" />
          <span className="hidden sm:inline">Upload Data</span>
          <span className="sm:hidden">Upload</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Upload Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-4 md:p-6"
          >
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-base md:text-lg font-bold text-gray-900">Upload Financial Data</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 md:w-5 h-4 md:h-5" />
              </button>
            </div>

            <p className="text-gray-600 text-xs md:text-sm mb-4 md:mb-6">
              Select a CSV file with financial data for {entityName}. Download the template first to see the correct format.
            </p>

            <div className="space-y-3 md:space-y-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gold-400 rounded-lg p-6 md:p-8 text-center hover:bg-gold-50 transition-colors cursor-pointer hover:scale-105"
              >
                <Upload className="w-6 md:w-8 h-6 md:h-8 text-gold-500 mx-auto mb-2" />
                <p className="text-xs md:text-sm font-medium text-gray-900">Click to select CSV file</p>
                <p className="text-[9px] md:text-xs text-gray-500 mt-1">or drag and drop</p>
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 md:py-2.5 px-4 rounded-lg transition-colors text-xs md:text-sm"
              >
                Cancel
              </button>
            </div>

            <div className="mt-4 md:mt-6 p-3 md:p-4 bg-blue-50 rounded-lg space-y-1.5 md:space-y-2">
              <p className="text-[9px] md:text-xs text-gray-600">
                <strong>Required:</strong> Month, Collections, Consumable Collections, Disbursements
              </p>
              <p className="text-[9px] md:text-xs text-gray-600">
                <strong>Optional Sacraments:</strong> Rate, Arancel, Parish Share, Over & Above
              </p>
              <p className="text-[9px] md:text-xs text-gray-600">
                <strong>Optional Collections:</strong> Mass, Other, Other Receipts
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Budget Modal */}
      {isBudgetOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Set Budget</h3>
              <button
                onClick={() => setIsBudgetOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Budget Input Type Toggle */}
              <div className="flex gap-2 bg-gray-100 rounded-lg p-2">
                <button
                  onClick={() => setBudgetInputType('annual')}
                  className={`flex-1 py-2 px-3 rounded-lg font-bold text-sm transition-colors ${
                    budgetInputType === 'annual'
                      ? 'bg-gold-500 text-black'
                      : 'bg-transparent text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Annual Budget
                </button>
                <button
                  onClick={() => setBudgetInputType('monthly')}
                  className={`flex-1 py-2 px-3 rounded-lg font-bold text-sm transition-colors ${
                    budgetInputType === 'monthly'
                      ? 'bg-gold-500 text-black'
                      : 'bg-transparent text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Monthly Budget
                </button>
              </div>

              {/* Annual Budget Input */}
              {budgetInputType === 'annual' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Annual Budget (₱)
                  </label>
                  <input
                    type="number"
                    value={budgetAnnual}
                    onChange={(e) => {
                      const annual = parseFloat(e.target.value) || 0;
                      setBudgetAnnual(annual);
                      setBudgetMonthly(annual / 12);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold-500"
                    placeholder="Enter annual budget"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Monthly: <span className="font-bold">₱{(budgetAnnual / 12).toLocaleString('en-PH', { maximumFractionDigits: 0 })}</span>
                  </p>
                </div>
              )}

              {/* Monthly Budget Input */}
              {budgetInputType === 'monthly' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Monthly Budget (₱)
                  </label>
                  <input
                    type="number"
                    value={budgetMonthly}
                    onChange={(e) => {
                      const monthly = parseFloat(e.target.value) || 0;
                      setBudgetMonthly(monthly);
                      setBudgetAnnual(monthly * 12);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold-500"
                    placeholder="Enter monthly budget"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Annual: <span className="font-bold">₱{(budgetMonthly * 12).toLocaleString('en-PH', { maximumFractionDigits: 0 })}</span>
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsBudgetOpen(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBudgetSave}
                  className="flex-1 bg-gold-500 hover:bg-gold-600 text-black font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Save Budget
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
