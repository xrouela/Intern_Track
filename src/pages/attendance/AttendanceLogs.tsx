import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { 
  Clock, 
  Calendar, 
  Filter,
  TrendingUp,
  LayoutDashboard
} from 'lucide-react';
import { motion } from 'motion/react';
import { format, isSameDay } from 'date-fns';
import { Link } from 'react-router-dom';
import ExportReportButton from '../../components/ExportReportButton';
import { parseUTCDate } from '../../utils/dateUtils';

export default function AttendanceLogs() {
  const { profile } = useAuth();
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'MM'));
  const [selectedYear, setSelectedYear] = useState(format(new Date(), 'yyyy'));
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async () => {
    if (!profile || !profile.uid) return;
    try {
      const allShifts = await api.getShifts(profile.uid);
      setShifts(allShifts);
    } catch (err) {
      console.error('Failed to fetch shifts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [profile]);

  // Filters
  const filteredShifts = useMemo(() => {
    return shifts.filter(s => {
      if (!s.clock_in) return false;
      const date = parseUTCDate(s.clock_in);
      
      const m = format(date, 'MM');
      const y = format(date, 'yyyy');
      
      const monthMatch = selectedMonth === 'all' || m === selectedMonth;
      const yearMatch = selectedYear === 'all' || y === selectedYear;
      
      let dateRangeMatch = true;
      if (startDate) {
        dateRangeMatch = dateRangeMatch && (date >= new Date(startDate));
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateRangeMatch = dateRangeMatch && (date <= end);
      }

      return monthMatch && yearMatch && dateRangeMatch;
    });
  }, [shifts, selectedMonth, selectedYear, startDate, endDate]);

  // Today Summary
  const todayShift = useMemo(() => {
    const today = new Date();
    return shifts.find(s => {
      if (!s.clock_in) return false;
      const date = parseUTCDate(s.clock_in);
      return isSameDay(date, today);
    });
  }, [shifts]);

  // Aggregate Stats
  const stats = useMemo(() => {
    const totalDays = filteredShifts.filter(s => s.status === 'completed').length;
    const totalHrs = filteredShifts.reduce((acc, s) => acc + (s.total_hours || 0), 0);
    const totalOT = filteredShifts.reduce((acc, s) => acc + (s.overtime_hours || 0), 0);
    return { totalDays, totalHrs, totalOT };
  }, [filteredShifts]);

  const months = [
    { label: 'All Months', value: 'all' },
    { label: 'January', value: '01' },
    { label: 'February', value: '02' },
    { label: 'March', value: '03' },
    { label: 'April', value: '04' },
    { label: 'May', value: '05' },
    { label: 'June', value: '06' },
    { label: 'July', value: '07' },
    { label: 'August', value: '08' },
    { label: 'September', value: '09' },
    { label: 'October', value: '10' },
    { label: 'November', value: '11' },
    { label: 'December', value: '12' },
  ];

  const years = ['all', '2024', '2025', '2026'];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance & Logs</h1>
          <p className="text-slate-500">Track and export your detailed shift attendance records.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-xs font-bold text-primary hover:underline">
            <LayoutDashboard size={14} /> View in Dashboard
          </Link>
          <ExportReportButton 
            filters={{
              month: selectedMonth,
              year: selectedYear,
              startDate: startDate,
              endDate: endDate,
              userId: profile?.uid
            }}
          />
        </div>
      </div>

      {/* Top Section: Today Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Time In', value: todayShift?.clock_in ? format(parseUTCDate(todayShift.clock_in), 'HH:mm') : '--:--', color: 'text-slate-600', bg: 'bg-white' },
          { label: 'Time Out', value: todayShift?.clock_out ? format(parseUTCDate(todayShift.clock_out), 'HH:mm') : '--:--', color: 'text-slate-600', bg: 'bg-white' },
          { label: 'Total Hours', value: (todayShift?.total_hours || 0).toFixed(1) + 'h', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Overtime Hours', value: (todayShift?.overtime_hours || 0).toFixed(1) + 'h', color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map((card, i) => (
          <div key={i} className={`${card.bg} p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center justify-center`}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
            <p className={`text-xl font-black ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Summary Row (Above Table) */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center gap-8 shadow-xl">
         <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
             <Calendar size={24} />
           </div>
           <div>
             <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Total Days Worked</p>
             <p className="text-2xl font-black">{stats.totalDays} Days</p>
           </div>
         </div>
         <div className="h-10 w-px bg-white/10 hidden md:block" />
         <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
             <Clock size={24} />
           </div>
         <div>
             <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Total Hours Worked</p>
             <p className="text-2xl font-black">{stats.totalHrs.toFixed(1)} <span className="text-sm font-bold opacity-40">hrs</span></p>
           </div>
         </div>
         <div className="h-10 w-px bg-white/10 hidden md:block" />
         <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
             <TrendingUp size={24} />
           </div>
           <div>
             <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Total Overtime Hours</p>
             <p className="text-2xl font-black text-indigo-400">{stats.totalOT.toFixed(1)} <span className="text-sm font-bold opacity-40">hrs</span></p>
           </div>
         </div>
      </div>

      {/* Logs Table Section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-800">My Attendance Logs</h3>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 italic">
               <Filter size={14} className="text-slate-400" />
               <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-600 outline-none"
               >
                 {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
               </select>
               <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-600 outline-none ml-2"
               >
                 {years.map(y => <option key={y} value={y}>{y === 'all' ? 'All Years' : y}</option>)}
               </select>
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Time In</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Time Out</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Total Hours</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">OT</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredShifts.map((shift, i) => {
                const clockIn = parseUTCDate(shift.clock_in);
                const clockOut = shift.clock_out ? parseUTCDate(shift.clock_out) : null;
                
                return (
                  <tr key={shift.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-bold text-slate-600">{format(clockIn, 'MMM d, yyyy')}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{format(clockIn, 'EEEE')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-bold text-slate-900">{format(clockIn, 'HH:mm')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-bold text-slate-900">{clockOut ? format(clockOut, 'HH:mm') : '--:--'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[11px] font-black">
                        {(shift.total_hours || 0).toFixed(1)}h
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`text-[11px] font-black ${shift.overtime_hours > 0 ? 'text-indigo-600' : 'text-slate-300'}`}>
                        {(shift.overtime_hours || 0).toFixed(1)}h
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(!shift.clock_in || !shift.clock_out) && shift.status !== 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-bold">
                          🟡 Incomplete
                        </span>
                      ) : shift.is_late ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">
                          🔴 Late
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-bold">
                          🟢 Present
                        </span>
                      )}
                      {shift.status === 'active' && (
                         <span className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold">
                          🔵 Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className={`text-[10px] font-bold uppercase tracking-tight ${shift.source === 'Bulk Entry' ? 'text-indigo-500' : 'text-slate-400'}`}>
                         {shift.source || 'Timer System'}
                       </span>
                    </td>
                  </tr>
                );
              })}
              {filteredShifts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-xs italic">
                    No attendance records found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

