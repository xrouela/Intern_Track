import React, { useState, useEffect } from 'react';
import { api } from '../../services/apiService';
import { AlertCircle, AlertTriangle, Clock, Calendar, CheckCircle2, Search, Filter, Check, X, Eye, ChevronRight, ChevronDown, Flag, User, Info, MoreVertical, LayoutGrid, List } from 'lucide-react';
import { format, isToday, isYesterday, subWeeks } from 'date-fns';
import { parseUTCDate } from '../../utils/dateUtils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';

type AlertSeverity = 'critical' | 'warning' | 'info';

export default function QuickAlerts() {
  const { profile } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterTimeRange, setFilterTimeRange] = useState('all');
  const [needsActionOnly, setNeedsActionOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const isAdmin = profile?.role === 'admin' || profile?.email === 'admin-internship@cp-360.com';
  const isManager = profile?.role === 'manager' || isAdmin;

  const fetchData = async () => {
    if (!profile || (!isAdmin && !isManager)) return;
    try {
      const [allUsers, allShifts] = await Promise.all([
        api.getUsers(),
        api.getShifts(undefined, 'completed')
      ]);
      
      setUsers(allUsers);
      
      const exceptions = allShifts.filter((s: any) => 
        s.is_late || s.is_undertime || s.overtime_hours > 0 || s.is_incomplete
      ).map((s: any) => {
        let severity: AlertSeverity = 'info';
        let alertTitle = 'Alert';
        let interpretation = '';

        if (s.overtime_hours > 2) {
          severity = 'critical';
          alertTitle = 'Critical Overtime';
          interpretation = `Worked ${(s.net_work_hours || 0).toFixed(1)}h (↑ ${(s.overtime_hours).toFixed(1)}h over limit)`;
        } else if (s.overtime_hours > 0) {
          severity = 'warning';
          alertTitle = 'Moderate Overtime';
          interpretation = `Exceeded daily limit by ${(s.overtime_hours).toFixed(1)}h`;
        } else if (s.is_late) {
          severity = s.late_minutes > 30 ? 'critical' : 'warning';
          alertTitle = s.late_minutes > 30 ? 'Significant Latency' : 'Late Clock-in';
          interpretation = `Clocked in ${s.late_minutes}m past schedule`;
        } else if (s.is_undertime) {
          severity = 'warning';
          alertTitle = 'Undertime Alert';
          interpretation = `Finished ${(s.regular_hours || 0).toFixed(1)}h short of goal`;
        }

        return { ...s, severity, alertTitle, interpretation };
      });
      
      setAlerts(exceptions);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [profile]);

  const handleAction = async (alertId: string, action: 'approve' | 'flag' | 'view') => {
    try {
      if (action === 'approve') {
        await api.updateShift(alertId, {
          alert_status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: profile?.uid
        });
      } else if (action === 'flag') {
        await api.updateShift(alertId, {
          alert_status: 'flagged',
          flagged_at: new Date().toISOString(),
          flagged_by: profile?.uid
        });
      }
      fetchData();
    } catch (err) {
      console.error('Failed to update alert:', err);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const user = users.find(u => u.uid === alert.user_id);
    const matchesSearch = alert.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || 
      (filterType === 'late' && alert.is_late) ||
      (filterType === 'undertime' && alert.is_undertime) ||
      (filterType === 'overtime' && alert.overtime_hours > 0) ||
      (filterType === 'incomplete' && alert.is_incomplete);
    
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    const matchesDepartment = filterDepartment === 'all' || user?.department === filterDepartment;
    const matchesAction = !needsActionOnly || !alert.alert_status || alert.alert_status === 'new';

    let matchesTime = true;
    if (filterTimeRange !== 'all') {
      const date = parseUTCDate(alert.clock_in);
      const now = new Date();
      if (filterTimeRange === 'today') matchesTime = isToday(date);
      else if (filterTimeRange === 'week') matchesTime = date > subWeeks(now, 1);
    }
    
    return matchesSearch && matchesType && matchesSeverity && matchesDepartment && matchesAction && matchesTime;
  });

  const groupedAlerts = filteredAlerts.reduce((acc: any, alert) => {
    const dateStr = alert.clock_in ? format(parseUTCDate(alert.clock_in), 'yyyy-MM-dd') : 'Unknown';
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(alert);
    return acc;
  }, {});

  const dates = Object.keys(groupedAlerts).sort((a, b) => b.localeCompare(a));

  const stats = {
    total: filteredAlerts.length,
    critical: filteredAlerts.filter(a => a.severity === 'critical').length,
    warning: filteredAlerts.filter(a => a.severity === 'warning').length,
    info: filteredAlerts.filter(a => a.severity === 'info').length,
  };

  return (
    <div className="space-y-6">
      {/* Header & Situational Awareness */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Quick Alerts
            {stats.critical > 0 && (
              <motion.span 
                animate={{ scale: [1, 1.1, 1] }} 
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full"
              >
                {stats.critical} CRITICAL
              </motion.span>
            )}
          </h1>
          <p className="text-slate-500 text-sm mt-1">Intelligent monitoring of attendance anomalies and compliance risks.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center min-w-[100px]">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
             <span className="text-xl font-black text-slate-900">{stats.total}</span>
          </div>
          <div className="px-4 py-2 bg-red-50 rounded-xl border border-red-100 flex flex-col items-center justify-center min-w-[100px]">
             <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Critical</span>
             <span className="text-xl font-black text-red-600">{stats.critical}</span>
          </div>
          <div className="px-4 py-2 bg-orange-50 rounded-xl border border-orange-100 flex flex-col items-center justify-center min-w-[100px]">
             <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Warning</span>
             <span className="text-xl font-black text-orange-600">{stats.warning}</span>
          </div>
          <div className="px-4 py-2 bg-blue-50 rounded-xl border border-blue-100 flex flex-col items-center justify-center min-w-[100px]">
             <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Minor</span>
             <span className="text-xl font-black text-blue-600">{stats.info}</span>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search member name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all"
            />
          </div>

          <div className="relative">
            <select 
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-wider outline-none appearance-none cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="critical">🔴 Critical Only</option>
              <option value="warning">🟠 Warnings</option>
              <option value="info">🔵 Info / Minor</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
          </div>

          <div className="relative">
            <select 
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-wider outline-none appearance-none cursor-pointer"
            >
              <option value="all">Everywhere</option>
              {Array.from(new Set(users.map(u => u.department).filter(Boolean))).map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
          </div>

          <div className="relative">
            <select 
              value={filterTimeRange}
              onChange={(e) => setFilterTimeRange(e.target.value)}
              className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-wider outline-none appearance-none cursor-pointer"
            >
              <option value="all">History</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
          </div>

          <button 
            onClick={() => setNeedsActionOnly(!needsActionOnly)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
              needsActionOnly 
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' 
              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {needsActionOnly ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            Needs Action
          </button>
        </div>
      </div>

      {/* Alert List Grouped by Date */}
      <div className="space-y-8">
        {dates.map(date => {
          const groupAlerts = groupedAlerts[date];
          const isExpanded = expandedGroups[date] !== false;
          const displayDate = isToday(parseUTCDate(date)) ? 'Today' : isYesterday(parseUTCDate(date)) ? 'Yesterday' : format(parseUTCDate(date), 'PPPP');

          return (
            <div key={date} className="space-y-4">
              <button 
                onClick={() => setExpandedGroups({ ...expandedGroups, [date]: !isExpanded })}
                className="flex items-center gap-3 w-full group"
              >
                <div className="h-px bg-slate-200 flex-1" />
                <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:bg-slate-200 transition-colors">
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  {displayDate} ({groupAlerts.length})
                </div>
                <div className="h-px bg-slate-200 flex-1" />
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white rounded-3xl border border-slate-100 divide-y divide-slate-50 overflow-hidden shadow-sm"
                  >
                    {groupAlerts.map((alert: any) => {
                      const user = users.find(u => u.uid === alert.user_id);
                      const isNew = !alert.alert_status || alert.alert_status === 'new';
                      const isCritical = alert.severity === 'critical';
                      const isResolved = alert.alert_status === 'resolved';
                      const isFlagged = alert.alert_status === 'flagged';

                      return (
                        <motion.div
                          layout
                          key={alert.id}
                          className={`group relative flex flex-col md:flex-row md:items-center p-4 gap-4 transition-all hover:bg-slate-50/80 ${
                            isResolved ? 'opacity-60' : ''
                          }`}
                        >
                          {/* Severity Indicator Strip */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                            isCritical ? 'bg-red-500' : 
                            alert.severity === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                          }`} />

                          {/* 1. Severity Icon & Headline */}
                          <div className="flex items-center gap-3 md:w-1/4 min-w-[200px]">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                              isCritical ? 'bg-red-50 text-red-600' : 
                              alert.severity === 'warning' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                              {isCritical ? <AlertTriangle size={16} /> : <Info size={16} />}
                            </div>
                            <div className="flex flex-col">
                              <span className={`text-sm font-black tracking-tight ${
                                isCritical ? 'text-red-600' : 
                                alert.severity === 'warning' ? 'text-orange-600' : 'text-blue-600'
                              }`}>
                                {alert.overtime_hours > 0 ? `+${alert.overtime_hours.toFixed(1)}h Overtime` : 
                                 alert.is_late ? 'Late Clock-in' : 
                                 alert.is_undertime ? 'Undertime Exception' : 'Shift Alert'}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">
                                {alert.alertTitle}
                              </span>
                            </div>
                          </div>

                          {/* 2. Employee & Meta */}
                          <div className="flex items-center gap-3 md:w-1/4">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {user?.photoURL ? (
                                <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <User className="text-slate-400" size={14} />
                              )}
                            </div>
                            <div className="flex flex-col truncate">
                              <h4 className="text-sm font-bold text-slate-800 truncate">{alert.user_name}</h4>
                              <p className="text-[10px] font-medium text-slate-500">
                                {user?.department || 'Staff'} • {format(new Date(date), 'MMM d')}
                              </p>
                            </div>
                          </div>

                          {/* 3. Detail Interpretation */}
                          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 flex-grow">
                          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-500 bg-slate-100/50 px-2 py-1 rounded-md border border-slate-100/50 min-w-[120px] justify-center">
                            <span className="text-emerald-600">{alert.clock_in ? format(parseUTCDate(alert.clock_in), 'HH:mm') : '--:--'}</span>
                            <ChevronRight size={10} className="text-slate-300" />
                            <span>{alert.clock_out ? format(parseUTCDate(alert.clock_out), 'HH:mm') : '--:--'}</span>
                          </div>
                            <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5 min-w-[150px]">
                              <Clock size={12} className="text-slate-400" />
                              {alert.interpretation}
                            </p>
                          </div>

                          {/* 4. Status Pill */}
                          <div className="flex items-center justify-end md:w-32">
                             <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                               isResolved ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                               isFlagged ? 'bg-orange-50 text-orange-600 border-orange-100' :
                               'bg-slate-50 text-slate-400 border-slate-100'
                             }`}>
                               {isResolved ? 'Resolved' : isFlagged ? 'Flagged' : 'Pending'}
                             </div>
                          </div>

                          {/* 5. Row Actions (Hover-reveal) */}
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all ml-4">
                            {!isResolved && (
                              <button 
                                onClick={() => handleAction(alert.id, 'approve')}
                                className="p-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm transition-colors"
                                title="Approve"
                              >
                                <Check size={14} />
                              </button>
                            )}
                            {!isFlagged && (
                              <button 
                                onClick={() => handleAction(alert.id, 'flag')}
                                className="p-2 rounded-xl bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors"
                                title="Flag for Review"
                              >
                                <Flag size={14} />
                              </button>
                            )}
                            <button 
                              className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                              title="View Details"
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {dates.length === 0 && !loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[40px] border border-dashed border-slate-200"
          >
            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="text-emerald-500" size={48} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Maximum Compliance Reached</h3>
            <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed">All exceptions have been resolved or filtered. Your monitoring dashboard is perfectly clean.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

