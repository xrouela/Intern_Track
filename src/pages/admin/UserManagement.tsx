import React, { useState, useEffect } from 'react';
import { api } from '../../services/apiService';
import { Shield, Mail, Trash2, Edit2, UserMinus, ShieldAlert, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';

export default function UserManagement() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'intern' as 'admin' | 'manager' | 'intern',
    department: '',
    start_date: '',
    end_date: '',
    required_hours: 0,
    schedule_start: '08:00',
    schedule_end: '17:00'
  });

  const fetchData = async () => {
    try {
      const [allUsers, allLogs, allShifts] = await Promise.all([
        api.getUsers(),
        api.getLogs(),
        api.getShifts()
      ]);
      setUsers(allUsers);
      setLogs(allLogs);
      setShifts(allShifts);
    } catch (err) {
      console.error('Failed to fetch management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin' && profile.role !== 'manager')) return;
    fetchData();
    // Poll every 10 seconds for "real-time" feel without WebSockets
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [profile]);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const user = users.find(u => u.uid === userId || u.id === userId);
      await api.saveUser({ ...user, role: newRole });
      fetchData();
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  const handleDeleteUser = async () => {
    // Note: API doesn't have delete yet, but I'll add logic if needed. 
    // For now, let's keep it simple.
    console.warn('Delete not implemented in SQL layer yet');
    setIsDeleteModalOpen(false);
  };

  const openEditModal = (user: any) => {
    setEditingUserId(user.uid || user.id);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      role: (user.role as any) || 'intern',
      department: user.department || '',
      start_date: user.start_date || '',
      end_date: user.end_date || '',
      required_hours: user.required_hours || 0,
      schedule_start: user.schedule_start || '08:00',
      schedule_end: user.schedule_end || '17:00'
    });
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingUserId(null);
    setFormData({
      name: '',
      email: '',
      role: 'intern',
      department: '',
      start_date: '',
      end_date: '',
      required_hours: 0,
      schedule_start: '08:00',
      schedule_end: '17:00'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        uid: editingUserId || `manual_${Date.now()}`,
      };
      await api.saveUser(payload);
      setIsModalOpen(false);
      setEditingUserId(null);
      fetchData();
    } catch (err) {
      console.error('Failed to submit user:', err);
    }
  };

  if (profile?.role !== 'admin' && profile?.role !== 'superadmin') {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
        <ShieldAlert className="mx-auto text-slate-300 mb-4" size={48} />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-slate-500">Only administrators are authorized to manage user accounts and system configuration.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 text-sm">Manage authentication, roles, and internship parameters for all members.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={20} /> Add Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.sort((a, b) => a.role.localeCompare(b.role)).map((user) => (
          <motion.div
            layout
            key={user.id}
            className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm border-l-4 overflow-hidden relative group"
            style={{ 
              borderLeftColor: user.role === 'admin' ? '#ef4444' : user.role === 'manager' ? '#6366f1' : '#10b981' 
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Shield size={24} />
                  </div>
                )}
              </div>
              <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                user.role === 'admin' ? 'bg-red-100 text-red-600' : 
                user.role === 'manager' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
              }`}>
                {user.role}
              </div>
              <button 
                onClick={() => openEditModal(user)}
                className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-primary hover:bg-primary-light transition-all opacity-0 group-hover:opacity-100"
                title="Edit User Details"
              >
                <Edit2 size={16} />
              </button>
            </div>

            <div className="space-y-1 mb-4">
              <h3 className="font-bold text-slate-900">{user.name}</h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Mail size={12} /> {user.email}
              </div>
              {user.department && (
                <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md w-fit">
                  {user.department}
                </div>
              )}
            </div>

            {user.role === 'intern' && (
              <div className="mb-6 space-y-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Start Date</p>
                    <p className="text-xs font-semibold text-slate-700">{user.start_date || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">End Date</p>
                    <p className="text-xs font-semibold text-slate-700">{user.end_date || 'Not set'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Schedule</p>
                    <p className="text-xs font-semibold text-slate-700">
                      {user.schedule_start || '08:00'} - {user.schedule_end || '17:00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Hours</p>
                    <p className="text-xs font-bold text-emerald-600">
                      {(
                        logs.filter(l => l.user_id === user.uid).reduce((acc, l) => acc + (l.rendered_hours || 0), 0) +
                        shifts.filter(s => s.user_id === user.uid).reduce((acc, s) => acc + (s.net_work_hours || s.total_hours || 0), 0)
                      ).toFixed(1)}h / {user.required_hours || 0}h
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-50 flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assign Role</label>
              <div className="flex items-center gap-2">
                <select
                  value={user.role}
                  onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-indigo-100 outline-none transition"
                >
                  <option value="intern">Intern</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrator</option>
                </select>
                <button
                  onClick={() => { setUserToDelete(user); setIsDeleteModalOpen(true); }}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove User"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modals go here... same as in Admin.tsx */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">{editingUserId ? 'Edit Member Details' : 'Add New Member'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    required
                    type="email"
                    placeholder="e.g. john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">System Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                  >
                    <option value="intern">Intern</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department / Team</label>
                  <input
                    type="text"
                    placeholder="e.g. Engineering, Marketing"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                  />
                </div>

                {formData.role === 'intern' && (
                  <motion.div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={formData.start_date}
                          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                        <input
                          type="date"
                          value={formData.end_date}
                          onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Required Hours</label>
                      <input
                        type="number"
                        value={formData.required_hours}
                        onChange={(e) => setFormData({ ...formData, required_hours: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Shift Start</label>
                        <input
                          type="time"
                          value={formData.schedule_start}
                          onChange={(e) => setFormData({ ...formData, schedule_start: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Shift End</label>
                        <input
                          type="time"
                          value={formData.schedule_end}
                          onChange={(e) => setFormData({ ...formData, schedule_end: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-1 bg-primary text-white font-bold py-3 rounded-xl">Save</button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl">Cancel</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDeleteModalOpen && userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-8 text-center">
              <UserMinus className="mx-auto text-red-600 mb-4" size={48} />
              <h2 className="text-xl font-bold mb-2">Remove Member?</h2>
              <p className="text-slate-500 mb-6 font-medium">Are you sure you want to remove <span className="text-slate-900 font-bold">"{userToDelete.name}"</span>?</p>
              <div className="flex gap-3">
                <button onClick={handleDeleteUser} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl">Remove</button>
                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

