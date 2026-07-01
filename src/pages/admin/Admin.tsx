import React, { useState, useEffect } from 'react';
import { api } from '../../services/apiService';
import { Users, Clock, AlertTriangle, ShieldCheck, ArrowRight, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { parseUTCDate } from '../../utils/dateUtils';
import { Link } from 'react-router-dom';

export default function Admin() {
  const { profile } = useAuth();
  const [userCount, setUserCount] = useState(0);
  const [recentShifts, setRecentShifts] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState(0);
  const [exceptionsCount, setExceptionsCount] = useState(0);

  const fetchData = async () => {
    if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) return;
    try {
      const [allUsers, allShifts] = await Promise.all([
        api.getUsers(),
        api.getShifts() // We might need a limit here, but for now we filter in JS
      ]);

      setUserCount(allUsers.length);
      
      // Sort and take top 5
      const sortedShifts = [...allShifts]
        .sort((a, b) => parseUTCDate(b.clock_in).getTime() - parseUTCDate(a.clock_in).getTime())
        .slice(0, 5);
      
      setRecentShifts(sortedShifts);
      setActiveUsers(allShifts.filter((s: any) => s.status === 'active').length);
      setExceptionsCount(allShifts.filter((s: any) => s.is_late || s.is_undertime).length);
    } catch (err) {
      console.error('Failed to fetch admin metrics:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [profile]);

  const cards = [
    { label: 'Total Members', value: userCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', link: '/users' },
    { label: 'Currently On-Shift', value: activeUsers, icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/logs' },
    { label: 'Recent Exceptions', value: exceptionsCount, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', link: '/alerts' },
    { label: 'System Health', value: 'Optimal', icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50', link: null },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Overview</h1>
          <p className="text-slate-500">System metrics and administrative quick-actions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden"
          >
            <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.color} flex items-center justify-center mb-4`}>
              <card.icon size={24} />
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{card.label}</div>
            <div className="text-2xl font-black text-slate-900">{card.value}</div>
            {card.link && (
              <Link to={card.link} className="absolute bottom-4 right-4 text-slate-300 hover:text-primary transition-colors">
                <ArrowRight size={18} />
              </Link>
            )}
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity Feed */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
           <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
             <Clock size={20} className="text-primary" />
             Latest System Activity
           </h3>
           <div className="space-y-4">
             {recentShifts.map((shift, i) => (
               <div key={i} className="flex items-center gap-4 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                 <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-bold text-xs text-slate-400 border border-slate-100">
                    {shift.user_name?.substring(0, 2).toUpperCase()}
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{shift.user_name}</p>
                    <p className="text-[10px] text-slate-500">
                      {shift.status === 'active' ? 'Clocked in just now' : `Completed ${shift.total_hours?.toFixed(1)}h session`}
                    </p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 italic">
                      {shift.clock_in ? format(parseUTCDate(shift.clock_in), 'HH:mm') : '--:--'}
                    </p>
                    {shift.is_late && <span className="text-[8px] font-black text-red-600 bg-red-100 px-1 rounded">LATE</span>}
                 </div>
               </div>
             ))}
           </div>
           <Link to="/logs" className="mt-6 w-full py-3 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors">
             View All Time Logs <ArrowRight size={14} />
           </Link>
        </div>

        {/* Quick Management Actions */}
        <div className="space-y-6">
           <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <UserPlus size={20} />
                Quick Onboarding
              </h3>
              <p className="text-sm opacity-80 mb-6">Add new interns or staff members directly from here.</p>
              <Link to="/users" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-xl font-bold transition-all">
                Access User Management <ArrowRight size={18} />
              </Link>
           </div>

           <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
             <h3 className="text-lg font-bold text-slate-800 mb-4">Module Controls</h3>
             <div className="grid grid-cols-1 gap-3">
                <Link to="/alerts" className="p-4 bg-orange-50/50 border border-orange-100 rounded-xl flex items-center justify-between hover:bg-orange-50 transition-colors">
                   <div className="flex items-center gap-3 text-orange-700">
                      <AlertTriangle size={20} />
                      <span className="font-bold text-sm">Review Exceptions</span>
                   </div>
                   <ArrowRight size={16} className="text-orange-400" />
                </Link>
                <Link to="/reports" className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between hover:bg-emerald-50 transition-colors">
                   <div className="flex items-center gap-3 text-emerald-700">
                      <ShieldCheck size={20} />
                      <span className="font-bold text-sm">Download Reports</span>
                   </div>
                   <ArrowRight size={16} className="text-emerald-400" />
                </Link>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

