import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Shield, Award, Calendar, CheckSquare, Clock, Edit2, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../services/apiService';

export default function Profile() {
  const { profile, refreshProfile } = useAuth();
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0 });
  const [totalHours, setTotalHours] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');

  useEffect(() => {
    if (profile) setEditedName(profile.name);
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      await api.saveUser({
        ...profile,
        name: editedName
      });
      await refreshProfile();
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const fetchData = async () => {
    if (!profile) return;
    try {
      const [tasks, logs, shifts] = await Promise.all([
        api.getTasks(profile.uid),
        api.getLogs(profile.uid),
        api.getShifts(profile.uid)
      ]);

      setTaskStats({
        total: tasks.length,
        completed: tasks.filter((t: any) => t.status === 'completed').length
      });

      const taskHours = logs.reduce((acc: number, log: any) => acc + (log.rendered_hours || 0), 0);
      const shiftHours = shifts.reduce((acc: number, shift: any) => acc + (shift.total_hours || 0), 0);
      setTotalHours(taskHours + shiftHours);
    } catch (err) {
      console.error('Failed to fetch profile stats:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [profile]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 relative group">
        <div className="h-32 bg-indigo-600"></div>
        <div className="px-8 pb-8">
          <div className="flex flex-col md:flex-row items-center gap-6 -mt-12 mb-6">
            <div className="w-32 h-32 rounded-3xl bg-white p-1 shadow-lg">
              <div className="w-full h-full rounded-2xl bg-slate-100 overflow-hidden">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={64} className="w-full h-full p-6 text-slate-300" />
                )}
              </div>
            </div>
            <div className="text-center md:text-left pt-6 md:pt-12 flex-1">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <h1 className="text-3xl font-bold text-slate-900">{profile?.name}</h1>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-slate-300 hover:text-primary transition-colors"
                  title="Update Display Name"
                >
                   <Edit2 size={18} />
                </button>
              </div>
              <p className="text-slate-500 font-medium">{profile?.email}</p>
              {profile?.department && (
                <div className="mt-2 flex items-center gap-2 justify-center md:justify-start">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
                    Department: {profile.department}
                  </span>
                </div>
              )}
            </div>
            <div className="md:ml-auto h-fit mt-12">
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider ${
                profile?.role === 'admin' ? 'bg-red-100 text-red-600' : 
                profile?.role === 'manager' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
              }`}>
                {profile?.role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6 border-t border-slate-50">
            <div className="p-6 bg-slate-50 rounded-2xl text-center">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <CheckSquare size={20} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{taskStats.completed} / {taskStats.total}</p>
              <p className="text-sm text-slate-500">Tasks Completed</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl text-center">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Clock size={20} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{totalHours.toFixed(1)}</p>
              <p className="text-sm text-slate-500">Hours Logged</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl text-center">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                < Award size={20} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{profile?.required_hours || 0}</p>
              <p className="text-sm text-slate-500">Required Hours</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl text-center">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Calendar size={20} />
              </div>
              <p className="text-lg font-bold text-slate-900 leading-tight">
                {profile?.role === 'intern' ? (Math.max((profile?.required_hours || 0) - totalHours, 0)).toFixed(1) : 'Verified'}
              </p>
              <p className="text-sm text-slate-500">{profile?.role === 'intern' ? 'Hours Left' : 'Account Status'}</p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-sm rounded-[24px] shadow-xl p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">Update Profile</h2>
                <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
                  <input
                    required
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                   <button
                    type="submit"
                    className="flex-1 bg-primary text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  >
                    <Save size={18} /> Save Changes
                  </button>
                   <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Shield size={20} className="text-indigo-600" /> Security
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Google Account</p>
                <p className="text-sm text-slate-500">Authentication linked via Google</p>
              </div>
              <div className="text-emerald-500 font-bold text-xs uppercase">Connected</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Role Permissions</p>
                <p className="text-sm text-slate-500">Limited to {profile?.role} functions</p>
              </div>
              <div className="text-indigo-500 font-bold text-xs uppercase">Managed</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Calendar size={20} className="text-indigo-600" /> Internship Timeline
          </h3>
          <div className="space-y-4">
             <div className="flex justify-between py-2 border-b border-slate-50">
               <span className="text-slate-500">Starting Date</span>
               <span className="font-medium text-slate-900">{profile?.start_date || 'Not specified'}</span>
             </div>
             <div className="flex justify-between py-2 border-b border-slate-50">
               <span className="text-slate-500">End Date</span>
               <span className="font-medium text-slate-900">{profile?.end_date || 'Not specified'}</span>
             </div>
             <div className="flex justify-between py-2 border-b border-slate-50">
               <span className="text-slate-500">Internship Rank</span>
               <span className="font-medium text-slate-900 capitalize">{profile?.role}</span>
             </div>
             {profile?.role === 'intern' && (
               <div className="flex justify-between py-2 border-b border-slate-50">
                 <span className="text-slate-500">Working Schedule</span>
                 <span className="font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg text-xs font-bold">
                   {profile.schedule_start || '08:00'} - {profile.schedule_end || '17:00'}
                 </span>
               </div>
             )}
             <div className="flex justify-between py-2">
               <span className="text-slate-500">Database ID</span>
               <span className="font-mono text-[10px] text-slate-400">{profile?.uid}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

