'use client';

import React, { useState } from 'react';
import { Users, Shield, LogOut, UserPlus, Edit2, Save, Trash2, Database, ArrowRight, UserCog, Eye, Plus, Pencil, Trash, Search, ShieldCheck, Building2, TrendingUp } from 'lucide-react';

import { Role } from '../App';
import { UserRole, Parish, Seminary, DiocesanSchool } from '../types';
import { INITIAL_ROLES, VICARIATES, CLASSES, INITIAL_PARISHES, INITIAL_SEMINARIES, INITIAL_SCHOOLS } from '../constants';
import { auth } from '../firebase';
import { dataService } from '../services/dataService';

interface SettingsProps {
  onBack: () => void;
  onLogout: () => void;
  onNavigate?: (page: string) => void;
  role?: Role;
}

import { UserRoleControl } from '../components/settings/UserRoleControl';
import { DataManagementControl } from '../components/settings/DataManagementControl';
import { EntityManagementControl } from '../components/settings/EntityManagementControl';
import { ParishClassificationLogic } from '../components/settings/ParishClassificationLogic';
import { DashboardHeader } from '../components/layout/DashboardHeader';

export function Settings({ onBack, onLogout, onNavigate, role = 'bishop' }: SettingsProps) {
  const [activeTab, setActiveTab] = useState((role === 'bishop' || role === 'admin') ? 'user-management' : 'security');
  
  const [accounts, setAccounts] = useState<any[]>([]);
  const [roles, setRoles] = useState<UserRole[]>(INITIAL_ROLES);
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [seminaries, setSeminaries] = useState<Seminary[]>([]);
  const [schools, setSchools] = useState<DiocesanSchool[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to users
  React.useEffect(() => {
    const update = () => {
      const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const mappedAccounts = storedUsers.map((u: any) => ({
        id: u.id,
        entity: u.entityName || 'Unassigned',
        leader: u.displayName || u.email.split('@')[0],
        email: u.email,
        role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
        status: u.status || 'active',
        entityId: u.entityId,
        entityType: u.entityType
      }));
      setAccounts(mappedAccounts);
      setIsLoading(false);
    };
    
    window.addEventListener('storage_update', update);
    update();
    return () => window.removeEventListener('storage_update', update);
  }, []);

  // Subscribe to entities
  React.useEffect(() => {
    const update = () => {
      setParishes(JSON.parse(localStorage.getItem('parishes') || '[]'));
      setSeminaries(JSON.parse(localStorage.getItem('seminaries') || '[]'));
      setSchools(JSON.parse(localStorage.getItem('schools') || '[]'));
    };
    
    window.addEventListener('storage_update', update);
    update();
    return () => window.removeEventListener('storage_update', update);
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [accountToArchive, setAccountToArchive] = useState<number | null>(null);
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null);
  const [showAccountSuccess, setShowAccountSuccess] = useState<{show: boolean, message: string}>({ show: false, message: '' });
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '' });
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');

  const handleUpdatePassword = () => {
    if (passwords.current && passwords.new) {
      setShowPasswordSuccess(true);
      setPasswords({ current: '', new: '' });
      setTimeout(() => setShowPasswordSuccess(false), 3000);
    }
  };

  // Auto-save roles when they change
  React.useEffect(() => {
    // localStorage.setItem('diocese_roles', JSON.stringify(roles));
  }, [roles]);

  // Auto-save accounts when they change
  React.useEffect(() => {
    // localStorage.setItem('diocese_accounts', JSON.stringify(accounts));
  }, [accounts]);

  // Auto-save entities when they change
  React.useEffect(() => {
    // localStorage.setItem('diocese_parishes', JSON.stringify(parishes));
  }, [parishes]);

  React.useEffect(() => {
    // localStorage.setItem('diocese_seminaries', JSON.stringify(seminaries));
  }, [seminaries]);

  React.useEffect(() => {
    // localStorage.setItem('diocese_schools', JSON.stringify(schools));
  }, [schools]);

  const [searchQuery, setSearchQuery] = useState('');
  
  const [formState, setFormState] = useState({
    entity: '',
    leader: '',
    email: '',
    role: INITIAL_ROLES[2].name // Default to Parish Priest
  });

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.entity || !formState.leader || !formState.email || !formState.role) return;
    
    try {
      const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
      if (editingAccountId !== null) {
        const updatedUsers = storedUsers.map((u: any) => 
          u.id === editingAccountId.toString() ? {
            ...u,
            email: formState.email,
            role: formState.role.toLowerCase(),
            entityName: formState.entity,
            displayName: formState.leader
          } : u
        );
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        setShowAccountSuccess({ show: true, message: 'Account updated successfully!' });
      } else {
        const newUser = {
          id: Date.now().toString(),
          email: formState.email,
          role: formState.role.toLowerCase(),
          entityName: formState.entity,
          displayName: formState.leader,
          status: 'active',
          createdAt: new Date().toISOString()
        };
        localStorage.setItem('users', JSON.stringify([...storedUsers, newUser]));
        setShowAccountSuccess({ show: true, message: 'New account created successfully!' });
      }
      window.dispatchEvent(new Event('storage_update'));
    } catch (error) {
      console.error("Error saving account:", error);
    }
    
    setTimeout(() => setShowAccountSuccess({ show: false, message: '' }), 3000);
    closeModal();
  };

  const handleEditClick = (account: any) => {
    setEditingAccountId(account.id);
    setFormState({
      entity: account.entity,
      leader: account.leader,
      email: account.email,
      role: account.role
    });
    setIsModalOpen(true);
  };

  const handleArchiveAccount = (id: number) => {
    setAccountToArchive(id);
    setIsArchiveModalOpen(true);
  };

  const toggleAccountStatus = async (id: string | number) => {
    try {
      const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const acc = storedUsers.find((a: any) => a.id === id.toString());
      if (acc) {
        const newStatus = acc.status === 'active' ? 'archived' : 'active';
        const updatedUsers = storedUsers.map((u: any) => 
          u.id === id.toString() ? { ...u, status: newStatus } : u
        );
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        window.dispatchEvent(new Event('storage_update'));
      }
    } catch (error) {
      console.error("Error toggling status:", error);
    }
    setIsArchiveModalOpen(false);
    setAccountToArchive(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAccountId(null);
    setFormState({ entity: '', leader: '', email: '', role: roles[2]?.name || 'Parish Priest' });
  };

  const filteredAccounts = accounts.filter(acc => 
    acc.status === viewMode && (
      acc.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.leader.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.role.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <>
      <div className="min-h-[calc(100vh-80px)] bg-[#F3F4F6] flex flex-col">
      {isArchiveModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
                <Database className="w-8 h-8 text-amber-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-serif font-bold text-gray-900">
                  {viewMode === 'active' ? 'Archive Account' : 'Restore Account'}
                </h3>
                <p className="text-gray-500">
                  {viewMode === 'active' 
                    ? 'Are you sure you want to archive this account? It will be moved to the archive list.' 
                    : 'Are you sure you want to restore this account to active status?'}
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => {
                    setIsArchiveModalOpen(false);
                    setAccountToArchive(null);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (accountToArchive !== null) {
                      toggleAccountStatus(accountToArchive);
                    }
                  }}
                  className={`flex-1 px-6 py-3 text-white rounded-xl font-bold transition-colors shadow-md ${
                    viewMode === 'active' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'
                  }`}
                >
                  {viewMode === 'active' ? 'Archive' : 'Restore'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
                <LogOut className="w-8 h-8 text-rose-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-serif font-bold text-gray-900">Sign Out</h3>
                <p className="text-gray-500">Are you sure you wanna log out?</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={onLogout}
                  className="flex-1 px-6 py-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-colors shadow-md"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-church-green p-6 text-white">
              <h3 className="text-2xl font-serif font-bold">
                {editingAccountId !== null ? 'Edit User Account' : 'Add User Account'}
              </h3>
              <p className="text-white/60 text-sm">
                {editingAccountId !== null ? 'Update access credentials for this user.' : 'Create new access credentials for a user.'}
              </p>
            </div>
            
            <form onSubmit={handleSaveAccount} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Entity Name</label>
                  <select 
                    required
                    value={formState.entity}
                    onChange={(e) => setFormState({...formState, entity: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all appearance-none bg-white"
                  >
                    <option value="" disabled>Select an entity</option>
                    {Array.from(new Set([
                      ...parishes.map(p => p.name),
                      ...seminaries.map(s => s.name),
                      ...schools.map(s => s.name)
                    ])).sort().map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Assigned Leader</label>
                  <input 
                    type="text" 
                    required
                    value={formState.leader}
                    onChange={(e) => setFormState({...formState, leader: e.target.value})}
                    placeholder="e.g. Fr. John Doe"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={formState.email}
                    onChange={(e) => setFormState({...formState, email: e.target.value})}
                    placeholder="e.g. stjude@diocese.ph"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Account Role</label>
                  <select 
                    required
                    value={formState.role}
                    onChange={(e) => setFormState({...formState, role: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all appearance-none bg-white"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gold-500 text-church-black rounded-xl font-bold hover:bg-gold-600 transition-colors shadow-md"
                >
                  {editingAccountId !== null ? 'Update Account' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Sub-header */}
      <div className="bg-white border-b border-gray-200 px-8 py-10">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-4xl font-serif font-bold text-gray-900 tracking-tight">Account & Settings</h2>
            <p className="text-sm text-gray-500 font-medium">Manage your diocese personnel, roles, and system data.</p>
          </div>
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-[#D4AF37] hover:text-[#B8962E] hover:bg-[#D4AF37]/5 rounded-xl transition-all group"
          >
            <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-[1600px] mx-auto w-full px-8 py-12 flex gap-12">
        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-1.5">
          {(role === 'bishop' || role === 'admin') && (
            <>
              <button
                onClick={() => setActiveTab('user-management')}
                className={`flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all text-left ${
                  activeTab === 'user-management' 
                    ? 'bg-[#D4AF37] text-white shadow-xl shadow-[#D4AF37]/20' 
                    : 'text-gray-500 hover:bg-white hover:text-gray-900'
                }`}
              >
                <Users className={`w-5 h-5 ${activeTab === 'user-management' ? 'text-white' : 'text-gray-400'}`} />
                User Management
              </button>
              <button
                onClick={() => setActiveTab('role-control')}
                className={`flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all text-left ${
                  activeTab === 'role-control' 
                    ? 'bg-[#D4AF37] text-white shadow-xl shadow-[#D4AF37]/20' 
                    : 'text-gray-500 hover:bg-white hover:text-gray-900'
                }`}
              >
                <UserCog className={`w-5 h-5 ${activeTab === 'role-control' ? 'text-white' : 'text-gray-400'}`} />
                User Role Control
              </button>
              <button
                onClick={() => setActiveTab('entity-management')}
                className={`flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all text-left ${
                  activeTab === 'entity-management' 
                    ? 'bg-[#D4AF37] text-white shadow-xl shadow-[#D4AF37]/20' 
                    : 'text-gray-500 hover:bg-white hover:text-gray-900'
                }`}
              >
                <Building2 className={`w-5 h-5 ${activeTab === 'entity-management' ? 'text-white' : 'text-gray-400'}`} />
                Entity Management
              </button>
              <button
                onClick={() => setActiveTab('data-management')}
                className={`flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all text-left ${
                  activeTab === 'data-management' 
                    ? 'bg-[#D4AF37] text-white shadow-xl shadow-[#D4AF37]/20' 
                    : 'text-gray-500 hover:bg-white hover:text-gray-900'
                }`}
              >
                <Database className={`w-5 h-5 ${activeTab === 'data-management' ? 'text-white' : 'text-gray-400'}`} />
                Data Management
              </button>
              <button
                onClick={() => setActiveTab('parish-classification')}
                className={`flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all text-left ${
                  activeTab === 'parish-classification' 
                    ? 'bg-[#D4AF37] text-white shadow-xl shadow-[#D4AF37]/20' 
                    : 'text-gray-500 hover:bg-white hover:text-gray-900'
                }`}
              >
                <TrendingUp className={`w-5 h-5 ${activeTab === 'parish-classification' ? 'text-white' : 'text-gray-400'}`} />
                Parish Classification
              </button>
            </>
          )}
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all text-left ${
              activeTab === 'security' 
                ? 'bg-[#D4AF37] text-white shadow-xl shadow-[#D4AF37]/20' 
                : 'text-gray-500 hover:bg-white hover:text-gray-900'
            }`}
          >
            <Shield className={`w-5 h-5 ${activeTab === 'security' ? 'text-white' : 'text-gray-400'}`} />
            Security
          </button>
          
          <div className="h-px bg-gray-200 my-8 mx-5"></div>
          
          <button 
            onClick={() => setIsLogoutModalOpen(true)}
            className="flex items-center gap-3 px-5 py-4 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 transition-all text-left"
          >
            <LogOut className="w-5 h-5" />
            Sign out
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === 'user-management' && (
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-12">
              <div className="flex items-center justify-between mb-12">
                <div className="space-y-1">
                  <h3 className="text-3xl font-serif font-bold text-gray-900">User Account Management</h3>
                  <p className="text-sm text-gray-500">Manage access and roles for diocese personnel.</p>
                </div>
                <div className="flex items-center gap-5">
                  <div className="flex p-1.5 bg-gray-100 rounded-2xl">
                    <button 
                      onClick={() => setViewMode('active')}
                      className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        viewMode === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      Active
                    </button>
                    <button 
                      onClick={() => setViewMode('archived')}
                      className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        viewMode === 'archived' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      Archived
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      setEditingAccountId(null);
                      setIsModalOpen(true);
                    }}
                    className="bg-[#D4AF37] hover:bg-[#B8962E] text-white px-7 py-3.5 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-[#D4AF37]/20 active:scale-95 whitespace-nowrap"
                  >
                    <UserPlus className="w-5 h-5" />
                    Add User Account
                  </button>
                </div>
              </div>

              <div className="relative mb-12">
                <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search entities, leaders, or emails..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-8 py-4.5 bg-gray-50 border border-gray-100 rounded-[24px] text-gray-900 focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 transition-all font-medium"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-5 font-bold text-gray-400 text-[11px] uppercase tracking-widest w-1/4">Entity Name</th>
                      <th className="pb-5 font-bold text-gray-400 text-[11px] uppercase tracking-widest w-1/4">Assigned Leader</th>
                      <th className="pb-5 font-bold text-gray-400 text-[11px] uppercase tracking-widest w-1/4">Email Address</th>
                      <th className="pb-5 font-bold text-gray-400 text-[11px] uppercase tracking-widest w-1/6">Role</th>
                      <th className="pb-5 font-bold text-gray-400 text-[11px] uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredAccounts.length > 0 ? (
                      filteredAccounts.map((account) => (
                        <tr key={account.id} className="group hover:bg-gray-50/50 transition-colors">
                          <td className="py-7 pr-4">
                            <div className="font-bold text-gray-900">{account.entity}</div>
                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-1">{account.entityType || 'Entity'}</div>
                          </td>
                          <td className="py-7 pr-4 text-gray-600 font-medium">{account.leader}</td>
                          <td className="py-7 pr-4 text-gray-500 font-mono text-xs">{account.email}</td>
                          <td className="py-7 pr-4">
                            <span className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              account.role === 'Bishop' ? 'bg-amber-100 text-amber-700' : 
                              account.role === 'Admin' ? 'bg-gray-900 text-white' : 
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {account.role}
                            </span>
                          </td>
                          <td className="py-7 text-right">
                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {viewMode === 'active' && (
                                <button 
                                  onClick={() => handleEditClick(account)}
                                  className="p-2.5 text-gray-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-xl transition-all"
                                  title="Edit Account"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              )}
                              <button 
                                onClick={() => handleArchiveAccount(account.id)}
                                className={`p-2.5 rounded-xl transition-all ${
                                  viewMode === 'active' 
                                    ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50' 
                                    : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                                }`}
                                title={viewMode === 'active' ? 'Archive Account' : 'Restore Account'}
                              >
                                {viewMode === 'active' ? <Database className="w-4 h-4" /> : <ArrowRight className="w-4 h-4 rotate-180" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-24 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                              <Users className="w-10 h-10 text-gray-200" />
                            </div>
                            <p className="text-gray-400 font-medium">No accounts found matching your search.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'role-control' && (
            <UserRoleControl roles={roles} onUpdateRoles={setRoles} />
          )}

          {activeTab === 'entity-management' && (
            <EntityManagementControl 
              parishes={parishes}
              seminaries={seminaries}
              schools={schools}
              onUpdateParishes={setParishes}
              onUpdateSeminaries={setSeminaries}
              onUpdateSchools={setSchools}
              onNavigate={onNavigate}
            />
          )}

          {activeTab === 'data-management' && (
            <DataManagementControl />
          )}

          {activeTab === 'parish-classification' && (
            <ParishClassificationLogic
              parishes={parishes.map(p => ({
                id: p.id,
                name: p.name,
                annualCollections: p.collections || 0,
                annualDisbursements: 0,
                currentClass: p.class,
                isSubsidized: false,
              }))}
              records={[]}
              onClassificationChange={(parishId, newClass, subsidyNeeded) => {
                const updatedParishes = parishes.map(p => 
                  p.id === parishId ? { ...p, class: newClass } : p
                );
                setParishes(updatedParishes);
              }}
            />
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-10">
              <div className="space-y-1 mb-10">
                <h3 className="text-3xl font-bold text-gray-900">Account Security</h3>
                <p className="text-sm text-gray-500 font-medium">Update your password and manage account access.</p>
              </div>
              
              <div className="max-w-xl">
                <div className="bg-gray-50/50 rounded-[32px] p-10 border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                  <h4 className="text-lg font-bold text-gray-900 mb-8 relative z-10">Change Account Password</h4>
                  
                  {showPasswordSuccess && (
                    <div className="mb-8 p-5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2 flex items-center gap-3 relative z-10">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      Password updated successfully!
                    </div>
                  )}
                  
                  <div className="space-y-6 mb-10 relative z-10">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Current Password</label>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        value={passwords.current}
                        onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                        className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 transition-all font-medium placeholder:text-gray-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        value={passwords.new}
                        onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                        className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 transition-all font-medium placeholder:text-gray-300"
                      />
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleUpdatePassword}
                    className="w-full bg-[#D4AF37] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#B5952F] transition-all shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-3 relative z-10 active:scale-[0.98]"
                  >
                    <Save className="w-5 h-5" />
                    Update Account Password
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
