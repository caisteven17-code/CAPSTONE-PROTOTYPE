'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Plus, Trash2, Edit2, X, Send, User, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../firebase';
import { formatDate } from '../lib/format';

interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  authorRole: string;
  createdAt: number;
  priority: 'low' | 'medium' | 'high';
  category: 'general' | 'financial' | 'administrative' | 'event';
}

const PRIORITY_COLORS = {
  low: 'bg-blue-500/10 text-blue-700 border-blue-200',
  medium: 'bg-amber-500/10 text-amber-700 border-amber-200',
  high: 'bg-rose-500/10 text-rose-700 border-rose-200',
};

const CATEGORY_ICONS = {
  general: '📢',
  financial: '💰',
  administrative: '📋',
  event: '📅',
};

export function Announcements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('announcements');
    return saved ? JSON.parse(saved) : [];
  });

  const [showForm, setShowForm] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'medium' as const,
    category: 'general' as const,
  });

  useEffect(() => {
    localStorage.setItem('announcements', JSON.stringify(announcements));
  }, [announcements]);

  const canCreateAnnouncements = user?.role === 'bishop' || user?.role === 'admin';

  const handleAddAnnouncement = useCallback(() => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Please fill in all fields');
      return;
    }

    if (editingId) {
      setAnnouncements(prev =>
        prev.map(a =>
          a.id === editingId
            ? {
              ...a,
              title: formData.title,
              content: formData.content,
              priority: formData.priority,
              category: formData.category,
            }
            : a
        )
      );
      setEditingId(null);
    } else {
      const newAnnouncement: Announcement = {
        id: Math.random().toString(36).substr(2, 9),
        title: formData.title,
        content: formData.content,
        author: user?.name || 'Chancellor\'s Office',
        authorRole: user?.role || 'admin',
        createdAt: Date.now(),
        priority: formData.priority,
        category: formData.category,
      };
      setAnnouncements(prev => [newAnnouncement, ...prev]);
    }

    setFormData({
      title: '',
      content: '',
      priority: 'medium',
      category: 'general',
    });
    setShowForm(false);
  }, [formData, editingId, user]);

  const handleDelete = useCallback((id: string) => {
    if (confirm('Delete this announcement?')) {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }
  }, []);

  const handleEdit = useCallback((announcement: Announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      category: announcement.category,
    });
    setEditingId(announcement.id);
    setShowForm(true);
  }, []);

  const filteredAnnouncements = filter === 'all'
    ? announcements
    : announcements.filter(a => a.category === filter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-6 pb-20 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500 rounded-lg">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Chancellor's Board</h1>
              <p className="text-slate-600">Diocese announcements and updates</p>
            </div>
          </div>
          {canCreateAnnouncements && (
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({ title: '', content: '', priority: 'medium', category: 'general' });
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Announcement
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'general', 'financial', 'administrative', 'event'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                filter === cat
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat === 'all' ? '📍 All' : CATEGORY_ICONS[cat as keyof typeof CATEGORY_ICONS] + ' ' + cat}
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
                className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {editingId ? 'Edit Announcement' : 'New Announcement'}
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Announcement title"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Content
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={e => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Announcement content"
                      rows={6}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value="general">General</option>
                        <option value="financial">Financial</option>
                        <option value="administrative">Administrative</option>
                        <option value="event">Event</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Priority
                      </label>
                      <select
                        value={formData.priority}
                        onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleAddAnnouncement}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                    >
                      <Send className="w-4 h-4" />
                      {editingId ? 'Update' : 'Publish'}
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

        {/* Announcements List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredAnnouncements.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No announcements yet</p>
              </motion.div>
            ) : (
              filteredAnnouncements.map((announcement, index) => (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedAnnouncement(announcement)}
                  className={`bg-white rounded-lg border-l-4 p-6 cursor-pointer hover:shadow-md transition-all ${
                    PRIORITY_COLORS[announcement.priority]
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">
                        {CATEGORY_ICONS[announcement.category]}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-slate-900">
                          {announcement.title}
                        </h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {announcement.author}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(new Date(announcement.createdAt))}
                          </div>
                        </div>
                      </div>
                    </div>
                    {canCreateAnnouncements && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleEdit(announcement);
                          }}
                          className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-5 h-5 text-blue-600" />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleDelete(announcement.id);
                          }}
                          className="p-2 hover:bg-rose-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5 text-rose-600" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-slate-700 line-clamp-2">{announcement.content}</p>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Detail Modal */}
        <AnimatePresence>
          {selectedAnnouncement && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedAnnouncement(null)}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-96 overflow-y-auto"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {selectedAnnouncement.title}
                    </h2>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {selectedAnnouncement.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(new Date(selectedAnnouncement.createdAt))}
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${PRIORITY_COLORS[selectedAnnouncement.priority]}`}>
                        {selectedAnnouncement.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedAnnouncement(null)}
                    className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-slate-700 whitespace-pre-wrap">{selectedAnnouncement.content}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
