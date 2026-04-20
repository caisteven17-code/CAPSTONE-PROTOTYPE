'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Heart, Plus, Trash2, Edit2, X, Calendar, Users, Cake, Stethoscope } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../firebase';
import { formatDate } from '../lib/format';

interface PriestRecord {
  id: string;
  name: string;
  position: string;
  parish: string;
  birthDate: string;
  age: number;
  lastCheckup: string;
  healthStatus: 'good' | 'fair' | 'needs-attention';
  notes: string;
  email: string;
  phone: string;
}

const HEALTH_STATUS_COLORS = {
  good: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
  fair: 'bg-amber-500/10 text-amber-700 border-amber-200',
  'needs-attention': 'bg-rose-500/10 text-rose-700 border-rose-200',
};

const HEALTH_STATUS_ICONS = {
  good: '✓',
  fair: '⚠',
  'needs-attention': '!',
};

export function HealthTracker() {
  const { user } = useAuth();
  const [priests, setPriests] = useState<PriestRecord[]>(() => {
    const saved = localStorage.getItem('priest_health_records');
    return saved ? JSON.parse(saved) : [];
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPriest, setSelectedPriest] = useState<PriestRecord | null>(null);
  const [filter, setFilter] = useState<'all' | 'birthdays' | 'checkups'>('all');

  const [formData, setFormData] = useState({
    name: '',
    position: '',
    parish: '',
    birthDate: '',
    lastCheckup: '',
    healthStatus: 'good' as const,
    notes: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    localStorage.setItem('priest_health_records', JSON.stringify(priests));
  }, [priests]);

  const canManageRecords = user?.role === 'bishop' || user?.role === 'admin';

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getUpcomingBirthdays = () => {
    const today = new Date();
    return priests
      .map(p => ({
        ...p,
        age: calculateAge(p.birthDate),
        daysUntilBirthday: getDaysUntilBirthday(p.birthDate),
      }))
      .filter(p => p.daysUntilBirthday <= 30 && p.daysUntilBirthday >= 0)
      .sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);
  };

  const getDaysUntilBirthday = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    const thisYearBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    
    if (thisYearBirthday < today) {
      thisYearBirthday.setFullYear(today.getFullYear() + 1);
    }
    
    const diff = thisYearBirthday.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const needsCheckup = (lastCheckup: string) => {
    const last = new Date(lastCheckup);
    const today = new Date();
    const monthsDiff = (today.getFullYear() - last.getFullYear()) * 12 + today.getMonth() - last.getMonth();
    return monthsDiff > 12;
  };

  const handleAddRecord = useCallback(() => {
    if (!formData.name.trim() || !formData.birthDate) {
      alert('Please fill in required fields');
      return;
    }

    if (editingId) {
      setPriests(prev =>
        prev.map(p =>
          p.id === editingId
            ? {
              ...p,
              ...formData,
              age: calculateAge(formData.birthDate),
            }
            : p
        )
      );
      setEditingId(null);
    } else {
      const newRecord: PriestRecord = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
        age: calculateAge(formData.birthDate),
      };
      setPriests(prev => [...prev, newRecord]);
    }

    setFormData({
      name: '',
      position: '',
      parish: '',
      birthDate: '',
      lastCheckup: new Date().toISOString().split('T')[0],
      healthStatus: 'good',
      notes: '',
      email: '',
      phone: '',
    });
    setShowForm(false);
  }, [formData, editingId]);

  const handleDelete = useCallback((id: string) => {
    if (confirm('Delete this record?')) {
      setPriests(prev => prev.filter(p => p.id !== id));
    }
  }, []);

  const handleEdit = useCallback((priest: PriestRecord) => {
    setFormData({
      name: priest.name,
      position: priest.position,
      parish: priest.parish,
      birthDate: priest.birthDate,
      lastCheckup: priest.lastCheckup,
      healthStatus: priest.healthStatus,
      notes: priest.notes,
      email: priest.email,
      phone: priest.phone,
    });
    setEditingId(priest.id);
    setShowForm(true);
  }, []);

  const upcomingBirthdays = getUpcomingBirthdays();
  const priestsNeedingCheckup = priests.filter(p => needsCheckup(p.lastCheckup));

  let filteredPriests = priests;
  if (filter === 'birthdays') {
    filteredPriests = upcomingBirthdays;
  } else if (filter === 'checkups') {
    filteredPriests = priestsNeedingCheckup;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-6 pb-20 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500 rounded-lg">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Executive Health Tracker</h1>
              <p className="text-slate-600">Manage priest health check-ups and birthdays</p>
            </div>
          </div>
          {canManageRecords && (
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  name: '',
                  position: '',
                  parish: '',
                  birthDate: '',
                  lastCheckup: new Date().toISOString().split('T')[0],
                  healthStatus: 'good',
                  notes: '',
                  email: '',
                  phone: '',
                });
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Record
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg border border-slate-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Priests</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{priests.length}</p>
              </div>
              <Users className="w-12 h-12 text-slate-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg border border-slate-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Upcoming Birthdays (30d)</p>
                <p className="text-3xl font-bold text-emerald-600 mt-2">{upcomingBirthdays.length}</p>
              </div>
              <Cake className="w-12 h-12 text-slate-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg border border-slate-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Need Check-up</p>
                <p className="text-3xl font-bold text-amber-600 mt-2">{priestsNeedingCheckup.length}</p>
              </div>
              <Stethoscope className="w-12 h-12 text-slate-400" />
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {['all', 'birthdays', 'checkups'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat as any)}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === cat
                  ? 'bg-rose-500 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat === 'all' ? '👥 All' : cat === 'birthdays' ? '🎂 Birthdays' : '⚕️ Check-ups'}
            </button>
          ))}
        </div>

        {/* Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowForm(false)}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-96 overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {editingId ? 'Edit Record' : 'Add Priest Record'}
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Full name"
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                    />
                    <input
                      type="text"
                      value={formData.position}
                      onChange={e => setFormData({ ...formData, position: e.target.value })}
                      placeholder="Position (e.g., Pastor, Vicar)"
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={formData.parish}
                      onChange={e => setFormData({ ...formData, parish: e.target.value })}
                      placeholder="Parish"
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                    />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Email"
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Phone"
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                    />
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-slate-600 mb-1 block">Last Check-up</label>
                      <input
                        type="date"
                        value={formData.lastCheckup}
                        onChange={e => setFormData({ ...formData, lastCheckup: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-600 mb-1 block">Health Status</label>
                      <select
                        value={formData.healthStatus}
                        onChange={e => setFormData({ ...formData, healthStatus: e.target.value as any })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                      >
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="needs-attention">Needs Attention</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-slate-600 mb-1 block">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes"
                      rows={3}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleAddRecord}
                      className="flex-1 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                    >
                      {editingId ? 'Update' : 'Save'}
                    </button>
                    <button
                      onClick={() => setShowForm(false)}
                      className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 px-4 py-2 rounded-lg transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Records List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredPriests.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-12"
              >
                <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No records to display</p>
              </motion.div>
            ) : (
              filteredPriests.map((priest, index) => (
                <motion.div
                  key={priest.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedPriest(priest)}
                  className={`bg-white rounded-lg border-l-4 p-6 cursor-pointer hover:shadow-md transition-all ${
                    HEALTH_STATUS_COLORS[priest.healthStatus]
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-900">{priest.name}</h3>
                      <p className="text-sm text-slate-600">{priest.position} • {priest.parish}</p>
                    </div>
                    {canManageRecords && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleEdit(priest);
                          }}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-5 h-5 text-blue-600" />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleDelete(priest.id);
                          }}
                          className="p-2 hover:bg-rose-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5 text-rose-600" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Age:</span>
                      {priest.age} years
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Last Check-up:</span>
                      {formatDate(new Date(priest.lastCheckup))}
                      {needsCheckup(priest.lastCheckup) && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">Overdue</span>
                      )}
                    </div>
                    {priest.notes && (
                      <div className="flex items-start gap-2">
                        <span className="font-semibold flex-shrink-0">Notes:</span>
                        <p className="line-clamp-2">{priest.notes}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Detail Modal */}
        <AnimatePresence>
          {selectedPriest && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedPriest(null)}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{selectedPriest.name}</h2>
                    <p className="text-slate-600">{selectedPriest.position} • {selectedPriest.parish}</p>
                  </div>
                  <button
                    onClick={() => setSelectedPriest(null)}
                    className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Birth Date</p>
                    <p className="text-lg font-semibold text-slate-900 mt-1">{formatDate(new Date(selectedPriest.birthDate))}</p>
                    <p className="text-sm text-slate-600 mt-1">Age: {selectedPriest.age} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Health Status</p>
                    <p className={`text-lg font-semibold mt-1 ${HEALTH_STATUS_COLORS[selectedPriest.healthStatus].split(' ')[1]}`}>
                      {selectedPriest.healthStatus.replace('-', ' ').toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Email</p>
                    <p className="text-lg font-semibold text-slate-900 mt-1">{selectedPriest.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Phone</p>
                    <p className="text-lg font-semibold text-slate-900 mt-1">{selectedPriest.phone || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-slate-600 font-medium">Last Check-up</p>
                    <p className="text-lg font-semibold text-slate-900 mt-1">{formatDate(new Date(selectedPriest.lastCheckup))}</p>
                    {needsCheckup(selectedPriest.lastCheckup) && (
                      <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded mt-2">
                        ⚠️ Health check-up is overdue. Please schedule immediately.
                      </p>
                    )}
                  </div>
                  {selectedPriest.notes && (
                    <div className="col-span-2">
                      <p className="text-sm text-slate-600 font-medium">Notes</p>
                      <p className="text-slate-700 mt-2 bg-slate-50 p-3 rounded">{selectedPriest.notes}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
