import React, { useState, useEffect } from 'react';
import { api } from '../../services/apiService';
import { Shield, Mail, Trash2, Edit2, UserMinus, ShieldAlert, Plus, X, KeyRound, RotateCcw, CheckCircle2, AlertCircle, Hash, User, Copy, Check } from 'lucide-react';
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

  // Success modal state
  const [successModal, setSuccessModal] = useState<{ show: boolean; password: string; username: string } | null>(null);
  // Reset password modal state
  const [resetModal, setResetModal] = useState<{ show: boolean; user: any } | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetResult, setResetResult] = useState<{ success: boolean; password?: string; error?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    employee_id: '',
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
    if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) return;
    fetchData();
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
    if (!userToDelete || !profile) return;
    try {
      await api.deleteUser(userToDelete.uid || userToDelete.id, profile.uid);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      fetchData();
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  // Auto-generate username from full name
  const generateUsername = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const openEditModal = (user: any) => {
    setEditingUserId(user.uid || user.id);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      username: user.username || '',
      employee_id: user.employee_id || '',
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
      username: '',
      employee_id: '',
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
      const payload: any = {
        ...formData,
        uid: editingUserId || `manual_${Date.now()}`,
      };

      // Auto-generate username if empty
      if (!payload.username && payload.name) {
        payload.username = generateUsername(payload.name);
      }

      const result = await api.saveUser(payload);
      setIsModalOpen(false);
      setEditingUserId(null);

      // Show success modal with default password for new users
      if (result.created && result.defaultPassword) {
        setSuccessModal({
          show: true,
          password: result.defaultPassword,
          username: payload.username || '',
        });
      }

      fetchData();
    } catch (err) {
      console.error('Failed to submit user:', err);
    }
  };

  const handleResetPassword = async () => {
    if (!resetModal?.user || !profile) return;
    setResetLoading(true);
    setResetResult(null);
    try {
      const result = await api.resetPassword(resetModal.user.uid, profile.uid);
      setResetResult({ success: true, password: result.defaultPassword });
      fetchData();
    } catch (err: any) {
      setResetResult({ success: false, error: err.message || 'Failed to reset password.' });
    } finally {
      setResetLoading(false);
    }
  };

  const handleCopyPassword = (pw: string) => {
    navigator.clipboard.writeText(pw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (profile?.role !== 'admin' && profile?.role !== 'manager') {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
        <ShieldAlert className="mx-auto text-slate-300 mb-4" size={48} />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-slate-500">Only administrators and managers are authorized to manage user accounts and system configuration.</p>
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

      {/* User Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Name</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Username</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ID Number</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Role</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Password Status</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.sort((a, b) => a.role.localeCompare(b.role)).map((user) => (
                <tr key={user.uid || user.id} className="hover:bg-slate-50/50 transition-colors group">
                  {/* Name + Email */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <User size={16} className="text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-[13px] truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                          <Mail size={10} /> {user.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Username */}
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-md">
                      {user.username || <span className="text-slate-300 italic">not set</span>}
                    </span>
                  </td>

                  {/* ID Number */}
                  <td className="px-5 py-4">
                    <span className="text-xs text-slate-600 font-medium">
                      {user.employee_id || <span className="text-slate-300 italic">not set</span>}
                    </span>
                  </td>

                  {/* Role */}
                  <td className="px-5 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleUpdateRole(user.uid || user.id, e.target.value)}
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border-0 cursor-pointer appearance-none ${
                        user.role === 'admin'
                          ? 'bg-red-50 text-red-600'
                          : user.role === 'manager'
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      <option value="intern">Intern</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>

                  {/* Password Status */}
                  <td className="px-5 py-4">
                    {user.is_default_password || user.is_default_password === 1 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                        <KeyRound size={10} /> DEFAULT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <CheckCircle2 size={10} /> UPDATED
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Edit User"
                      >
                        <Edit2 size={15} />
                      </button>
                      {(profile?.role === 'admin' || profile?.role === 'manager') && (
                        <button
                          onClick={() => { setResetModal({ show: true, user }); setResetResult(null); }}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                          title="Reset Password"
                        >
                          <RotateCcw size={15} />
                        </button>
                      )}
                      {(profile?.uid !== (user.uid || user.id)) && (profile?.role === 'admin' || profile?.role === 'manager') && (
                        <button
                          onClick={() => { setUserToDelete(user); setIsDeleteModalOpen(true); }}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Remove User"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400 italic">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== */}
      {/* ADD / EDIT USER MODAL */}
      {/* ==================== */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 max-h-[90vh] overflow-y-auto"
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
                    placeholder="e.g. Juan Dela Cruz"
                    value={formData.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setFormData({
                        ...formData,
                        name: newName,
                        // Auto-generate username while typing (only for new users)
                        ...(!editingUserId ? { username: generateUsername(newName) } : {}),
                      });
                    }}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                      <User size={14} /> Username
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. juandelacruz"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                      <Hash size={14} /> ID Number
                    </label>
                    <input
                      required={!editingUserId}
                      type="text"
                      placeholder="e.g. 2026001"
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none font-mono text-sm"
                    />
                  </div>
                </div>

                {/* Password Preview for new users */}
                {!editingUserId && formData.username && formData.employee_id && (
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Default Password (auto-generated)</p>
                    <p className="font-mono text-sm text-indigo-800 font-bold">{formData.username}@{formData.employee_id}</p>
                    <p className="text-[10px] text-indigo-500 mt-1">User will be required to change this on first login.</p>
                  </div>
                )}

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

      {/* ======================== */}
      {/* USER CREATED SUCCESS MODAL */}
      {/* ======================== */}
      <AnimatePresence>
        {successModal?.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">User Created Successfully</h2>
              <p className="text-sm text-slate-500 mb-6">The new user account has been created with a default password.</p>

              <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left space-y-2">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username</p>
                  <p className="font-mono text-sm font-bold text-slate-800">{successModal.username}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Default Password</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-bold text-indigo-700">{successModal.password}</p>
                    <button
                      onClick={() => handleCopyPassword(successModal.password)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title="Copy password"
                    >
                      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 mb-6">
                <p className="text-xs text-amber-700 font-medium">User will be required to change this password after their first login.</p>
              </div>

              <button
                onClick={() => setSuccessModal(null)}
                className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================== */}
      {/* RESET PASSWORD MODAL */}
      {/* ======================== */}
      <AnimatePresence>
        {resetModal?.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-8 text-center"
            >
              {!resetResult ? (
                <>
                  <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <RotateCcw size={26} className="text-amber-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">Reset Password?</h2>
                  <p className="text-sm text-slate-500 mb-2">
                    Reset the password for <span className="font-bold text-slate-900">{resetModal.user.name}</span>?
                  </p>
                  {resetModal.user.username && resetModal.user.employee_id ? (
                    <div className="bg-slate-50 rounded-xl p-3 mb-6">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">New Default Password</p>
                      <p className="font-mono text-sm font-bold text-slate-700">{resetModal.user.username}@{resetModal.user.employee_id}</p>
                    </div>
                  ) : (
                    <div className="bg-red-50 rounded-xl p-3 mb-6 border border-red-100">
                      <p className="text-xs text-red-600 font-medium">
                        Cannot reset: Username or ID Number not set. Edit this user first.
                      </p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={handleResetPassword}
                      disabled={resetLoading || !resetModal.user.username || !resetModal.user.employee_id}
                      className={`flex-1 font-bold py-3 rounded-xl transition ${
                        !resetModal.user.username || !resetModal.user.employee_id
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-amber-500 text-white hover:bg-amber-600'
                      }`}
                    >
                      {resetLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                    <button onClick={() => setResetModal(null)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl">Cancel</button>
                  </div>
                </>
              ) : resetResult.success ? (
                <>
                  <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={26} className="text-emerald-600" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mb-2">Password Reset Successfully</h2>
                  <div className="bg-slate-50 rounded-xl p-3 mb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Default Password</p>
                    <div className="flex items-center justify-center gap-2">
                      <p className="font-mono text-sm font-bold text-indigo-700">{resetResult.password}</p>
                      <button
                        onClick={() => handleCopyPassword(resetResult.password || '')}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg transition-all"
                      >
                        {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-amber-600 font-medium mb-6">User must change password on next login.</p>
                  <button onClick={() => setResetModal(null)} className="w-full bg-primary text-white font-bold py-3 rounded-xl">Done</button>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={26} className="text-red-600" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mb-2">Reset Failed</h2>
                  <p className="text-sm text-red-500 mb-6">{resetResult.error}</p>
                  <div className="flex gap-3">
                    <button onClick={handleResetPassword} className="flex-1 bg-amber-500 text-white font-bold py-3 rounded-xl">Retry</button>
                    <button onClick={() => setResetModal(null)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl">Close</button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ======================== */}
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
