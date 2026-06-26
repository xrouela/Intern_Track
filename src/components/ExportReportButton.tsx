import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileDown, Calendar, Users, Briefcase, ChevronDown, CheckCircle, Clock } from 'lucide-react';
import { api } from '../services/apiService';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { parseUTCDate } from '../utils/dateUtils';
import { motion, AnimatePresence } from 'motion/react';

interface ExportReportButtonProps {
  className?: string;
  // Optional filters passed from parent pages
  filters?: {
    month?: string;
    year?: string;
    startDate?: string;
    endDate?: string;
    userId?: string;
    department?: string;
  };
}

export default function ExportReportButton({ className, filters }: ExportReportButtonProps) {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const isManager = profile?.role === 'manager';

  const handleExport = async (type: 'attendance' | 'tasks', scope: 'my' | 'team' | 'all') => {
    setLoading(true);
    setIsOpen(false);
    try {
      const month = filters?.month || format(new Date(), 'MM');
      const year = filters?.year || format(new Date(), 'yyyy');
      const monthYearLabel = `${month}_${year}`;

      let data: any[] = [];
      let fileName = '';

      if (type === 'attendance') {
        let shifts = await api.getShifts();
        if (scope === 'my') {
          shifts = shifts.filter((s: any) => s.user_id === profile?.uid);
          fileName = `Attendance_My_${monthYearLabel}.xlsx`;
        } else {
          shifts = shifts.filter((s: any) => s.status === 'completed');
          fileName = scope === 'team' ? `Attendance_Team_${monthYearLabel}.xlsx` : `Attendance_All_${monthYearLabel}.xlsx`;
        }
        
        const allUsers = await api.getUsers();

        const filtered = shifts.filter((s: any) => {
          if (!s.clock_in) return false;
          const d = parseUTCDate(s.clock_in);
          const m = format(d, 'MM');
          const y = format(d, 'yyyy');
          
          const monthMatch = month === 'all' || m === month;
          const yearMatch = year === 'all' || y === year;

          const user = allUsers.find((u: any) => (u.uid || u.id) === s.user_id);

          if (scope === 'team' && user?.department !== profile?.department) return false;
          if (filters?.department && filters.department !== 'all' && user?.department !== filters.department) return false;
          if (filters?.userId && s.user_id !== filters.userId) return false;

          return monthMatch && yearMatch;
        });

        data = filtered.map((s: any) => {
          const clockIn = parseUTCDate(s.clock_in);
          const clockOut = s.clock_out ? parseUTCDate(s.clock_out) : null;
          return {
            Intern: s.user_name || 'N/A',
            Date: format(clockIn, 'yyyy-MM-dd'),
            'Time In': format(clockIn, 'HH:mm'),
            'Time Out': clockOut ? format(clockOut, 'HH:mm') : '--',
            'Lunch Deduction': (s.lunch_deduction || 0).toFixed(1),
            'Net Hours': (s.net_work_hours || 0).toFixed(2),
            'Regular Hours': (s.regular_hours || 0).toFixed(2),
            'Overtime Hours': (s.overtime_hours || 0).toFixed(2),
            Status: s.is_late ? 'Late' : (s.is_undertime ? 'Undertime' : 'Normal')
          };
        });
      } else {
        // Tasks
        let tasks = await api.getTasks();
        if (scope === 'my') {
          tasks = tasks.filter((t: any) => t.assigned_to === profile?.uid);
          fileName = `Tasks_My_${monthYearLabel}.xlsx`;
        } else {
          fileName = scope === 'team' ? `Tasks_Team_${monthYearLabel}.xlsx` : `Tasks_All_${monthYearLabel}.xlsx`;
        }

        const allUsers = await api.getUsers();

        const filtered = tasks.filter((t: any) => {
          const user = allUsers.find((u: any) => (u.uid || u.id) === t.assigned_to);

          if (scope === 'team' && user?.department !== profile?.department) return false;
          if (filters?.department && filters.department !== 'all' && user?.department !== filters.department) return false;
          if (filters?.userId && t.assigned_to !== filters.userId) return false;

          return true;
        });

        data = filtered.map((t: any) => ({
          'Task Name': t.title || 'N/A',
          Description: t.description || '',
          'Start Date': t.start_date || '--',
          'End Date': t.end_date || '--',
          Status: t.status || 'Pending',
          Priority: t.priority || 'Medium'
        }));
      }

      if (data.length === 0) {
        alert('No data found for the selected criteria.');
        return;
      }

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, type === 'attendance' ? 'Attendance' : 'Tasks');
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-2 bg-slate-900 border border-slate-700 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-900/10 active:scale-95 disabled:opacity-50"
      >
        <FileDown size={20} className={loading ? 'animate-bounce' : ''} />
        {loading ? 'Processing...' : 'Export Report'}
        <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden p-2 origin-top-right"
            >
              {/* Attendance Group */}
              <div className="p-2">
                <div className="flex items-center gap-2 px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  <Clock size={12} /> Attendance
                </div>
                <div className="space-y-1">
                  <button 
                    onClick={() => handleExport('attendance', 'my')}
                    className="w-full text-left px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors flex items-center justify-between group"
                  >
                    <span>My Attendance</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">User</span>
                  </button>
                  {isManager && (
                    <button 
                      onClick={() => handleExport('attendance', 'team')}
                      className="w-full text-left px-3 py-2 text-sm font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors flex items-center justify-between group"
                    >
                      <span>Team Attendance</span>
                      <span className="text-[10px] bg-indigo-100 text-indigo-500 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Manager</span>
                    </button>
                  )}
                  {isAdmin && (
                    <button 
                      onClick={() => handleExport('attendance', 'all')}
                      className="w-full text-left px-3 py-2 text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors flex items-center justify-between group"
                    >
                      <span>All Attendance</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-500 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Admin</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="h-px bg-slate-100 my-1 mx-2" />

              {/* Tasks Group */}
              <div className="p-2">
                <div className="flex items-center gap-2 px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  <Briefcase size={12} /> Tasks
                </div>
                <div className="space-y-1">
                  <button 
                    onClick={() => handleExport('tasks', 'my')}
                    className="w-full text-left px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors flex items-center justify-between group"
                  >
                    <span>My Tasks</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">User</span>
                  </button>
                  {isManager && (
                    <button 
                      onClick={() => handleExport('tasks', 'team')}
                      className="w-full text-left px-3 py-2 text-sm font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors flex items-center justify-between group"
                    >
                      <span>Team Tasks</span>
                      <span className="text-[10px] bg-indigo-100 text-indigo-500 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Manager</span>
                    </button>
                  )}
                  {isAdmin && (
                    <button 
                      onClick={() => handleExport('tasks', 'all')}
                      className="w-full text-left px-3 py-2 text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors flex items-center justify-between group"
                    >
                      <span>All Tasks</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-500 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Admin</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

