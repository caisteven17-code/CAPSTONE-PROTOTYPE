'use client';

import React, { useState, useMemo } from 'react';
import {
  Download, Filter, Search, LogIn, LogOut, Eye, FileDown,
  Settings, UserCog, RefreshCw, AlertTriangle, CheckCircle,
  BarChart3, FileText, Shield, Database, Users, ChevronDown
} from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type LogCategory = 'all' | 'auth' | 'finance' | 'analytics' | 'reports' | 'system' | 'access';
type LogSeverity = 'info' | 'warning' | 'error' | 'success';

interface AuditEntry {
  id: string;
  user: string;
  role: string;
  isSystem?: boolean;
  category: Exclude<LogCategory, 'all'>;
  severity: LogSeverity;
  action: string;
  detail: string;
  timestamp: string;
  ip: string;
  entity?: string;
}

// ─────────────────────────────────────────────
// Mock audit log data — all events relate to
// the Diocesan Financial Management System
// ─────────────────────────────────────────────
const RAW_LOGS: AuditEntry[] = [
  { id: 'LOG-5041', user: 'Bp. Jose Reyes', role: 'Bishop', category: 'auth', severity: 'success', action: 'Login', detail: 'Bishop logged in to the diocesan portal', timestamp: 'Apr 27, 2026 · 8:02 AM', ip: '192.168.1.2' },
  { id: 'LOG-5040', user: 'Admin (System)', role: 'Admin', category: 'system', severity: 'info', action: 'Backup Completed', detail: 'Daily automated database backup completed successfully', timestamp: 'Apr 27, 2026 · 3:00 AM', ip: 'system', isSystem: true },
  { id: 'LOG-5039', user: 'Fr. Manny Cruz', role: 'Priest', category: 'finance', severity: 'success', action: 'Report Submitted', detail: 'Monthly collection report for San Isidro Labrador Parish — March 2026 submitted', timestamp: 'Apr 26, 2026 · 5:45 PM', ip: '192.168.1.11', entity: 'San Isidro Labrador Parish' },
  { id: 'LOG-5038', user: 'Admin Dela Cruz', role: 'Admin', category: 'reports', severity: 'info', action: 'Report Exported', detail: 'Exported Consolidated Financial Statement — Q1 2026 as PDF', timestamp: 'Apr 26, 2026 · 4:30 PM', ip: '192.168.1.5' },
  { id: 'LOG-5037', user: 'Bp. Jose Reyes', role: 'Bishop', category: 'analytics', severity: 'info', action: 'Dashboard Viewed', detail: 'Accessed Parish Analytics — Predictive tab, Collections Forecast', timestamp: 'Apr 26, 2026 · 2:15 PM', ip: '192.168.1.2' },
  { id: 'LOG-5036', user: 'Admin Dela Cruz', role: 'Admin', category: 'access', severity: 'warning', action: 'Role Changed', detail: 'User role updated: Fr. Santos — Priest → Seminary Admin', timestamp: 'Apr 26, 2026 · 11:30 AM', ip: '192.168.1.5' },
  { id: 'LOG-5035', user: 'Admin (System)', role: 'System', category: 'system', severity: 'info', action: 'Forecast Generated', detail: 'Automated ML forecast generation completed for all 12 parishes', timestamp: 'Apr 26, 2026 · 6:00 AM', ip: 'system', isSystem: true },
  { id: 'LOG-5034', user: 'Bp. Jose Reyes', role: 'Bishop', category: 'analytics', severity: 'info', action: 'Dashboard Viewed', detail: 'Accessed Seminary Analytics — Prescriptive tab', timestamp: 'Apr 25, 2026 · 3:55 PM', ip: '192.168.1.2', entity: 'Seminaries' },
  { id: 'LOG-5033', user: 'Fr. Ben Salazar', role: 'Priest', category: 'finance', severity: 'info', action: 'Data Accessed', detail: 'Viewed disbursement breakdown for San Roque Parish — April 2026', timestamp: 'Apr 25, 2026 · 2:40 PM', ip: '192.168.1.14', entity: 'San Roque Parish' },
  { id: 'LOG-5032', user: 'Admin Dela Cruz', role: 'Admin', category: 'reports', severity: 'info', action: 'Report Exported', detail: 'Exported Entity Health Rankings — All Parishes, April 2026 as CSV', timestamp: 'Apr 25, 2026 · 1:10 PM', ip: '192.168.1.5' },
  { id: 'LOG-5031', user: 'Admin (System)', role: 'System', category: 'system', severity: 'warning', action: 'Anomaly Detected', detail: 'Unusual disbursement spike detected — Santo Cristo Parish exceeded 150% of 3-month average', timestamp: 'Apr 25, 2026 · 9:30 AM', ip: 'system', isSystem: true, entity: 'Santo Cristo Parish' },
  { id: 'LOG-5030', user: 'Fr. Manny Cruz', role: 'Priest', category: 'auth', severity: 'info', action: 'Logout', detail: 'Fr. Manny Cruz logged out of the diocesan portal', timestamp: 'Apr 24, 2026 · 6:02 PM', ip: '192.168.1.11' },
  { id: 'LOG-5029', user: 'Admin Dela Cruz', role: 'Admin', category: 'access', severity: 'info', action: 'User Created', detail: 'New user account created — Sr. Clara Mendoza (School Admin)', timestamp: 'Apr 24, 2026 · 3:45 PM', ip: '192.168.1.5' },
  { id: 'LOG-5028', user: 'Bp. Jose Reyes', role: 'Bishop', category: 'finance', severity: 'info', action: 'Data Accessed', detail: 'Viewed diocese-wide collections vs disbursements summary — YTD 2026', timestamp: 'Apr 24, 2026 · 11:20 AM', ip: '192.168.1.2' },
  { id: 'LOG-5027', user: 'Admin (System)', role: 'System', category: 'system', severity: 'info', action: 'AI Twin Synced', detail: 'AI Digital Twin model weights updated using latest collection data', timestamp: 'Apr 24, 2026 · 5:00 AM', ip: 'system', isSystem: true },
  { id: 'LOG-5026', user: 'Admin Dela Cruz', role: 'Admin', category: 'analytics', severity: 'info', action: 'Dashboard Viewed', detail: 'Accessed Diocesan Schools Analytics — Diagnostic tab', timestamp: 'Apr 23, 2026 · 4:10 PM', ip: '192.168.1.5', entity: 'Diocesan Schools' },
  { id: 'LOG-5025', user: 'Admin Dela Cruz', role: 'Admin', category: 'system', severity: 'info', action: 'Settings Updated', detail: 'System alert threshold updated: Disbursement anomaly flag set to 140%', timestamp: 'Apr 23, 2026 · 2:00 PM', ip: '192.168.1.5' },
  { id: 'LOG-5024', user: 'Fr. Alex Tan', role: 'Priest', category: 'finance', severity: 'success', action: 'Report Submitted', detail: 'Monthly collection report for Sto. Niño Parish — March 2026 submitted', timestamp: 'Apr 23, 2026 · 10:30 AM', ip: '192.168.1.19', entity: 'Sto. Niño Parish' },
  { id: 'LOG-5023', user: 'Admin (System)', role: 'System', category: 'system', severity: 'error', action: 'Sync Failed', detail: 'Firebase sync timeout for parish report data — retry scheduled in 30 min', timestamp: 'Apr 22, 2026 · 11:45 PM', ip: 'system', isSystem: true },
  { id: 'LOG-5022', user: 'Bp. Jose Reyes', role: 'Bishop', category: 'auth', severity: 'success', action: 'Login', detail: 'Bishop logged in to the diocesan portal', timestamp: 'Apr 22, 2026 · 9:00 AM', ip: '192.168.1.2' },
  { id: 'LOG-5021', user: 'Admin Dela Cruz', role: 'Admin', category: 'reports', severity: 'info', action: 'Audit Log Exported', detail: 'Exported full audit log for April 1–21, 2026 as CSV', timestamp: 'Apr 22, 2026 · 8:50 AM', ip: '192.168.1.5' },
  { id: 'LOG-5020', user: 'Admin (System)', role: 'System', category: 'system', severity: 'info', action: 'Backup Completed', detail: 'Daily automated database backup completed successfully', timestamp: 'Apr 22, 2026 · 3:00 AM', ip: 'system', isSystem: true },
  { id: 'LOG-5019', user: 'Fr. Manny Cruz', role: 'Priest', category: 'auth', severity: 'success', action: 'Login', detail: 'Fr. Manny Cruz logged in to the diocesan portal', timestamp: 'Apr 21, 2026 · 8:15 AM', ip: '192.168.1.11' },
  { id: 'LOG-5018', user: 'Admin Dela Cruz', role: 'Admin', category: 'access', severity: 'warning', action: 'Password Reset', detail: 'Admin-initiated password reset for Fr. Ben Salazar', timestamp: 'Apr 20, 2026 · 3:30 PM', ip: '192.168.1.5' },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const CATEGORY_LABELS: Record<Exclude<LogCategory, 'all'>, string> = {
  auth: 'Auth',
  finance: 'Finance',
  analytics: 'Analytics',
  reports: 'Reports',
  system: 'System',
  access: 'Access',
};

const CATEGORY_COLORS: Record<Exclude<LogCategory, 'all'>, string> = {
  auth: 'bg-blue-100 text-blue-700',
  finance: 'bg-emerald-100 text-emerald-700',
  analytics: 'bg-purple-100 text-purple-700',
  reports: 'bg-amber-100 text-amber-700',
  system: 'bg-gray-100 text-gray-600',
  access: 'bg-rose-100 text-rose-700',
};

const SEVERITY_ICON: Record<LogSeverity, React.ReactNode> = {
  success: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  info: <Eye className="w-4 h-4 text-blue-400" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  error: <AlertTriangle className="w-4 h-4 text-red-500" />,
};

const SEVERITY_BG: Record<LogSeverity, string> = {
  success: 'bg-emerald-50',
  info: 'bg-blue-50',
  warning: 'bg-amber-50',
  error: 'bg-red-50',
};

const FILTER_TABS: { id: LogCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'auth', label: 'Auth' },
  { id: 'finance', label: 'Finance' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'reports', label: 'Reports' },
  { id: 'system', label: 'System' },
  { id: 'access', label: 'Access' },
];

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export function AuditLog() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<LogCategory>('all');

  const filtered = useMemo(() => {
    return RAW_LOGS.filter(log => {
      const matchesCategory = activeFilter === 'all' || log.category === activeFilter;
      const q = search.toLowerCase();
      const matchesSearch = !q || (
        log.user.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.detail.toLowerCase().includes(q) ||
        log.id.toLowerCase().includes(q) ||
        (log.entity ?? '').toLowerCase().includes(q)
      );
      return matchesCategory && matchesSearch;
    });
  }, [search, activeFilter]);

  const stats = useMemo(() => ({
    total: RAW_LOGS.length,
    userActions: RAW_LOGS.filter(l => !l.isSystem).length,
    systemEvents: RAW_LOGS.filter(l => l.isSystem).length,
    alerts: RAW_LOGS.filter(l => l.severity === 'warning' || l.severity === 'error').length,
  }), []);

  const handleExport = () => {
    const rows = [
      ['Log ID', 'User', 'Role', 'Category', 'Action', 'Detail', 'Entity', 'Timestamp', 'IP'],
      ...filtered.map(l => [l.id, l.user, l.role, CATEGORY_LABELS[l.category], l.action, l.detail, l.entity ?? '', l.timestamp, l.ip]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Reports / Audit Trail</p>
          <h1 className="text-2xl font-black text-church-black">Comprehensive Audit Trail & Activity Log</h1>
          <p className="text-sm text-gray-500 mt-1">Full history of all user and system actions across the platform</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 bg-white hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> Export Log
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 bg-white hover:bg-gray-50 transition-colors shadow-sm">
            <Filter className="w-4 h-4" /> Advanced Filter
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'TOTAL EVENTS (30D)', value: stats.total, sub: 'all users & systems', icon: Database, color: 'text-purple-500', bg: 'bg-purple-50' },
          { label: 'USER ACTIONS', value: stats.userActions, sub: 'manual entries', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'SYSTEM EVENTS', value: stats.systemEvents, sub: 'automated triggers', icon: RefreshCw, color: 'text-gray-500', bg: 'bg-gray-100' },
          { label: 'ALERTS TRIGGERED', value: stats.alerts, sub: 'this month', icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50' },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{card.label}</p>
                <p className="text-4xl font-black text-church-black">{card.value}</p>
                <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
              </div>
              <div className={`p-3 rounded-xl ${card.bg}`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-green/20 focus:border-church-green/40 transition"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeFilter === tab.id
                  ? 'bg-church-black text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-sm font-semibold">
            No logs match your search or filter.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(log => (
              <div key={log.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors group">
                {/* Severity Icon */}
                <div className={`mt-1 p-2 rounded-xl shrink-0 ${SEVERITY_BG[log.severity]}`}>
                  {SEVERITY_ICON[log.severity]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-church-black">{log.user}</span>
                    <span className="text-[10px] text-gray-400 font-medium">({log.role})</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${CATEGORY_COLORS[log.category]}`}>
                      {CATEGORY_LABELS[log.category]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{log.detail}</p>
                  {log.entity && (
                    <p className="text-[10px] font-bold text-church-green mt-1 uppercase tracking-wide">↳ {log.entity}</p>
                  )}
                </div>

                {/* Meta */}
                <div className="shrink-0 text-right">
                  <p className="text-xs font-semibold text-gray-500 whitespace-nowrap">{log.timestamp}</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">{log.ip}</p>
                  <p className="text-[10px] text-gray-300">{log.id}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer count */}
      <p className="text-xs text-gray-400 text-center font-medium">
        Showing {filtered.length} of {RAW_LOGS.length} events &nbsp;·&nbsp; Audit data retained for 90 days
      </p>
    </div>
  );
}
