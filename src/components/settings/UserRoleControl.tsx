'use client';

import React, { useState } from 'react';
import { Search, Plus, ShieldCheck, Trash, Edit2 } from 'lucide-react';
import { UserRole } from '../../types';
import { ALL_PERMISSIONS, PREDEFINED_ROLE_IDS } from '../../constants';

interface UserRoleControlProps {
  roles: UserRole[];
  onUpdateRoles: (roles: UserRole[]) => void;
}

export function UserRoleControl({ roles, onUpdateRoles }: UserRoleControlProps) {
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState<{show: boolean, message: string}>({ show: false, message: '' });
  const [tempRole, setTempRole] = useState<UserRole | null>(null);
  const [roleForm, setRoleForm] = useState({ 
    name: '', 
    color: '#D4AF37',
    permissions: Object.keys(roles[0].permissions).reduce((acc, key) => ({ ...acc, [key]: false }), {})
  });

  const selectedRole = roles.find(r => r.id === selectedRoleId) || roles[0];
  const isPredefined = PREDEFINED_ROLE_IDS.includes(selectedRole.id);

  const startEditing = () => {
    setTempRole({ ...selectedRole });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setTempRole(null);
  };

  const saveChanges = () => {
    if (!tempRole) return;
    onUpdateRoles(roles.map(r => r.id === tempRole.id ? tempRole : r));
    setShowSuccess({ show: true, message: 'Role updated successfully!' });
    setTimeout(() => setShowSuccess({ show: false, message: '' }), 3000);
    setIsEditing(false);
    setTempRole(null);
  };

  const togglePermission = (permId: string) => {
    if (isPredefined || !isEditing || !tempRole) return; 

    setTempRole({
      ...tempRole,
      permissions: {
        ...tempRole.permissions,
        [permId]: !tempRole.permissions[permId as keyof typeof tempRole.permissions]
      }
    });
  };

  const handleOpenCreateModal = () => {
    setRoleForm({ 
      name: '', 
      color: '#' + Math.floor(Math.random()*16777215).toString(16),
      permissions: Object.keys(roles[0].permissions).reduce((acc, key) => ({ ...acc, [key]: false }), {})
    });
    setIsModalOpen(true);
  };

  const handleSaveNewRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.name) return;

    const id = roleForm.name.toLowerCase().replace(/\s+/g, '_');
    const newRole = {
      id,
      name: roleForm.name,
      color: roleForm.color,
      permissions: { ...roleForm.permissions }
    };
    onUpdateRoles([...roles, newRole]);
    setSelectedRoleId(id);
    setShowSuccess({ show: true, message: 'Role created successfully!' });
    setTimeout(() => setShowSuccess({ show: false, message: '' }), 3000);
    setIsModalOpen(false);
  };

  const handleDeleteRole = () => {
    if (PREDEFINED_ROLE_IDS.slice(0, 2).includes(selectedRole.id)) {
      alert('Core system roles cannot be deleted.');
      return;
    }
    if (roles.length <= 1) {
      alert('Cannot delete the last role.');
      return;
    }
    
    const newRoles = roles.filter(r => r.id !== selectedRole.id);
    onUpdateRoles(newRoles);
    setSelectedRoleId(newRoles[0].id);
    setShowSuccess({ show: true, message: 'Role deleted successfully!' });
    setTimeout(() => setShowSuccess({ show: false, message: '' }), 3000);
    setIsDeleteModalOpen(false);
  };

  const filteredRoles = roles.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex h-[700px] relative">
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-[120] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto border border-rose-100">
                <Trash className="w-8 h-8 text-rose-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-900">Delete Role</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Are you sure you want to delete the <span className="font-bold text-gray-900">"{selectedRole.name}"</span> role? This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteRole}
                  className="flex-1 px-6 py-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-[110] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="bg-[#1A1A1A] p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <h3 className="text-2xl font-bold">Create New Role</h3>
                  <p className="text-white/50 text-sm mt-1">Define a new set of permissions for users.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>
            </div>
            <form onSubmit={handleSaveNewRole} className="flex flex-col h-[600px]">
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Role Name</label>
                    <input
                      type="text"
                      required
                      value={roleForm.name}
                      onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all placeholder:text-gray-400"
                      placeholder="e.g. Parish Volunteer"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Role Color</label>
                    <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                      <input
                        type="color"
                        value={roleForm.color}
                        onChange={(e) => setRoleForm({ ...roleForm, color: e.target.value })}
                        className="w-10 h-10 border-0 p-0 bg-transparent cursor-pointer rounded-lg overflow-hidden shadow-inner"
                      />
                      <span className="text-sm text-gray-600 font-mono font-bold">{roleForm.color.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                    Assign Permissions
                  </h4>
                  <div className="space-y-8">
                    {ALL_PERMISSIONS.map((category, idx) => (
                      <div key={idx} className="space-y-3">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{category.category}</div>
                        <div className="grid grid-cols-1 gap-2">
                          {category.permissions.map(perm => (
                            <label key={perm.id} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 cursor-pointer transition-all border border-transparent hover:border-gray-100 group">
                              <div className="mt-1 relative flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  checked={(roleForm.permissions as any)[perm.id]}
                                  onChange={(e) => setRoleForm({
                                    ...roleForm,
                                    permissions: {
                                      ...roleForm.permissions,
                                      [perm.id]: e.target.checked
                                    }
                                  })}
                                  className="w-5 h-5 rounded-md border-gray-300 text-[#D4AF37] focus:ring-[#D4AF37] transition-all cursor-pointer"
                                />
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-bold text-gray-900 group-hover:text-[#D4AF37] transition-colors">{perm.name}</div>
                                <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{perm.description}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-[#D4AF37] text-white rounded-xl font-bold hover:bg-[#B5952F] transition-all shadow-lg shadow-[#D4AF37]/20 text-sm"
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Left Sidebar - Roles List */}
      <div className={`w-80 bg-[#F9FAFB] border-r border-gray-200 flex flex-col flex-shrink-0 transition-opacity ${isEditing ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="p-8 border-b border-gray-200 bg-white">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2.5 ml-1">
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            System Roles
          </h3>
          <div className="relative group">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#D4AF37] transition-colors" />
            <input
              type="text"
              placeholder="Search roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 transition-all placeholder:text-gray-400"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {filteredRoles.map(role => (
            <button
              key={role.id}
              onClick={() => setSelectedRoleId(role.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all text-left group border ${
                selectedRoleId === role.id 
                  ? 'bg-white text-gray-900 shadow-lg shadow-gray-200/50 border-gray-100' 
                  : 'text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-md border-transparent'
              }`}
            >
              <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm ring-2 ring-offset-2 ring-transparent group-hover:ring-gray-100 transition-all" style={{ backgroundColor: role.color }} />
              <div className="flex flex-col min-w-0">
                <span className={`text-sm font-bold truncate ${selectedRoleId === role.id ? 'text-gray-900' : 'text-gray-600'}`}>{role.name}</span>
                {PREDEFINED_ROLE_IDS.includes(role.id) && (
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">System Default</span>
                )}
              </div>
            </button>
          ))}
        </div>
        <div className="p-8 border-t border-gray-200 bg-white">
          <button 
            onClick={handleOpenCreateModal}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            Create Role
          </button>
        </div>
      </div>

      {/* Right Content - Permissions */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        <div className="px-10 py-8 border-b border-gray-200 flex-shrink-0 bg-white z-10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {isEditing && tempRole ? (
              <div className="flex items-center gap-5">
                <div className="relative group">
                  <input 
                    type="color" 
                    value={tempRole.color} 
                    onChange={e => setTempRole({...tempRole, color: e.target.value})}
                    className="w-10 h-10 border-0 p-0 bg-transparent cursor-pointer rounded-full overflow-hidden shadow-inner"
                  />
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                    Change Color
                  </div>
                </div>
                <input 
                  type="text" 
                  value={tempRole.name} 
                  onChange={e => setTempRole({...tempRole, name: e.target.value})}
                  className="text-3xl font-serif font-bold text-gray-900 border-b-2 border-[#D4AF37] focus:outline-none bg-transparent px-1 pb-1"
                  placeholder="Role Name"
                  autoFocus
                />
              </div>
            ) : (
              <>
                <div className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: selectedRole.color }} />
                <div>
                  <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-serif font-bold text-gray-900">{selectedRole.name}</h2>
                    {isPredefined && (
                      <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                        Predefined
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1.5 font-medium">
                    {isPredefined 
                      ? 'System-defined role. Permissions are locked for security.' 
                      : 'Edit role settings and permissions for this group.'}
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {showSuccess.show && (
              <span className="text-emerald-600 text-sm font-bold animate-in fade-in slide-in-from-right-2 mr-3">
                {showSuccess.message}
              </span>
            )}
            {!PREDEFINED_ROLE_IDS.slice(0, 2).includes(selectedRole.id) && (
              <>
                {!isEditing ? (
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={startEditing}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all active:scale-95"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Role
                    </button>
                    <button 
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="text-rose-500 hover:text-rose-700 p-2.5 rounded-xl hover:bg-rose-50 transition-all"
                      title="Delete Role"
                    >
                      <Trash className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={cancelEditing}
                      className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={saveChanges}
                      className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 bg-gray-50/50">
          <div className="max-w-4xl space-y-12">
            {ALL_PERMISSIONS.map((category, idx) => (
              <div key={idx}>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2.5 ml-1">
                  {category.icon && <category.icon className="w-4 h-4" />}
                  {category.category}
                </h3>
                <div className="bg-white border border-gray-100 rounded-[24px] overflow-hidden divide-y divide-gray-50 shadow-sm">
                  {category.permissions.map(perm => {
                    const isEnabled = isEditing && tempRole 
                      ? tempRole.permissions[perm.id as keyof typeof tempRole.permissions]
                      : selectedRole.permissions[perm.id as keyof typeof selectedRole.permissions];
                    const canEdit = !isPredefined && isEditing;
                    return (
                      <div key={perm.id} className={`p-6 flex items-center justify-between gap-8 transition-all ${!canEdit ? 'opacity-60' : 'hover:bg-gray-50/30'}`}>
                        <div className="flex-1 pr-10">
                          <div className="text-sm font-bold text-gray-900 mb-1.5">{perm.name}</div>
                          <div className="text-sm text-gray-500 leading-relaxed font-medium">{perm.description}</div>
                        </div>
                        <button
                          onClick={() => togglePermission(perm.id)}
                          disabled={!canEdit}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none ${
                            !canEdit ? 'cursor-not-allowed' : 'cursor-pointer focus:ring-4 focus:ring-[#22C55E]/20 focus:ring-offset-0'
                          } ${
                            isEnabled ? 'bg-[#22C55E]' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out ${
                              isEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
