import React, { useState, useEffect } from 'react';
import { api } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { Plus, Download, FileText, Table, Clock, Calendar, MessageSquare, Trash2, X, CheckSquare, Upload, AlertCircle, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, differenceInMinutes, parse, isSameDay } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import { calculateAttendance } from '../../utils/attendanceUtils';
import { parseUTCDate } from '../../utils/dateUtils';

export default function TimeLogs() {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{success: number, errors: string[]} | null>(null);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [approvalComments, setApprovalComments] = useState('');
  const [filterIntern, setFilterIntern] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [interns, setInterns] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);

  // Form State
  const [logType, setLogType] = useState<'task' | 'attendance'>('task');
  const [formData, setFormData] = useState({
    task_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    date_out: format(new Date(), 'yyyy-MM-dd'),
    start_time: '08:00',
    end_time: '17:00',
    description: ''
  });

  const fetchData = async () => {
    if (!profile) return;
    try {
      const [allLogs, allTasks, allUsers, allShifts] = await Promise.all([
        api.getLogs(profile.role === 'intern' ? profile.uid : undefined),
        api.getTasks(profile.role === 'intern' ? profile.uid : undefined),
        api.getUsers(),
        api.getShifts(profile.role === 'intern' ? profile.uid : undefined)
      ]);

      setLogs(allLogs);
      setTasks(allTasks);
      setInterns(allUsers.filter((u: any) => u.role === 'intern'));
      setShifts(allShifts);
    } catch (err) {
      console.error('Failed to fetch time logs:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [profile]);

  const calculateHours = (start: string, end: string) => {
    const startTime = parse(start, 'HH:mm', new Date());
    const endTime = parse(end, 'HH:mm', new Date());
    const diff = differenceInMinutes(endTime, startTime);
    return diff / 60;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(`${formData.date}T${formData.start_time}`);
    const end = new Date(`${formData.date_out}T${formData.end_time}`);
    
    if (end < start) {
      alert('Invalid timeout. End time must be after start time.');
      return;
    }

    const renderedHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    try {
      if (editingLog) {
        if (logType === 'task') {
          await api.updateLog(editingLog.id, {
            ...formData,
            rendered_hours: renderedHours
          });
        } else {
          const metrics = calculateAttendance(start, end);
          
          await api.updateShift(editingLog.id, {
            clock_in: start.toISOString(),
            clock_out: end.toISOString(),
            ...metrics,
            description: formData.description
          });
        }
      } else if (logType === 'task') {
        const duplicate = logs.find(l => l.user_id === profile?.uid && l.date === formData.date && l.start_time === formData.start_time);
        if (duplicate) {
           alert('A task log with the same date and start time already exists.');
           return;
        }

        await api.createLog({
          ...formData,
          user_id: profile?.uid,
          user_name: profile?.name,
          task_name: tasks.find(t => t.id === Number(formData.task_id))?.title || 'Unknown',
          rendered_hours: renderedHours,
          status: 'pending'
        });
      } else {
        const metrics = calculateAttendance(start, end);

        await api.createShift({
          user_id: profile?.uid,
          user_name: profile?.name,
          clock_in: start.toISOString(),
          clock_out: end.toISOString(),
          status: 'completed',
          ...metrics,
          is_overtime: metrics.overtime_hours > 0,
          manual_entry: 1,
          source: 'Manual Entry',
          description: formData.description
        });
      }
      
      setIsModalOpen(false);
      setFormData({
        task_id: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        date_out: format(new Date(), 'yyyy-MM-dd'),
        start_time: '08:00',
        end_time: '17:00',
        description: ''
      });
      fetchData();
    } catch (err) {
      console.error('Failed to save log:', err);
    } finally {
      setEditingLog(null);
    }
  };

  const handleEditShift = (shift: any) => {
    setLogType('attendance');
    const clockIn = parseUTCDate(shift.clock_in);
    const clockOut = parseUTCDate(shift.clock_out);
    
    setFormData({
      task_id: '',
      date: format(clockIn, 'yyyy-MM-dd'),
      date_out: format(clockOut, 'yyyy-MM-dd'),
      start_time: format(clockIn, 'HH:mm'),
      end_time: format(clockOut, 'HH:mm'),
      description: shift.description || ''
    });
    setEditingLog(shift);
    setIsModalOpen(true);
  };

  const handleEditLog = (log: any) => {
    setLogType('task');
    setFormData({
      task_id: log.task_id.toString(),
      date: log.date,
      date_out: log.date_out || log.date,
      start_time: log.start_time,
      end_time: log.end_time,
      description: log.description || ''
    });
    setEditingLog(log);
    setIsModalOpen(true);
  };

  const exportCSV = (type: 'all' | 'tasks' | 'shifts' = 'all') => {
    let csvData: any[] = [];
    
    if (type === 'all' || type === 'tasks') {
      csvData.push(...logs.map(l => ({
        Type: 'Task Work',
        Date: l.date,
        User: l.user_name,
        Task: l.task_name,
        'Start Time': l.start_time,
        'End Time': l.end_time,
        'Rendered Hours': (l.rendered_hours || 0).toFixed(2),
        Status: l.status || 'pending',
        Description: l.description
      })));
    }
    
    if (type === 'all' || type === 'shifts') {
      csvData.push(...shifts.map(s => ({
        Type: 'Shift Session',
        Date: s.clock_in ? format(parseUTCDate(s.clock_in), 'yyyy-MM-dd') : 'N/A',
        User: s.user_name,
        Task: 'Shift Presence',
        'Start Time': s.clock_in ? format(parseUTCDate(s.clock_in), 'HH:mm') : 'N/A',
        'End Time': s.clock_out ? format(parseUTCDate(s.clock_out), 'HH:mm') : 'Active',
        'Rendered Hours': (s.total_hours || 0).toFixed(2),
        Status: s.status,
        Description: `Shift recorded through clock in/out`
      })));
    }

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const filename = type === 'all' ? 'combined' : (type === 'tasks' ? 'task_work' : 'shift_attendance');
    link.download = `${filename}_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };


  const exportPDF = (type: 'all' | 'tasks' | 'shifts' = 'all') => {
    const doc = new jsPDF() as any;
    const title = type === 'all' ? 'Combined Time & Shift Report' : (type === 'tasks' ? 'Task Work Report' : 'Shift Attendance Report');
    doc.text(`NexTrack - ${title}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${format(new Date(), 'PPP p')}`, 14, 22);

    const tableData: any[] = [];
    
    if (type === 'all' || type === 'tasks') {
      tableData.push(...logs.map(l => [
        'Task',
        l.date,
        l.user_name,
        l.task_name,
        `${l.start_time} - ${l.end_time}`,
        (l.rendered_hours || 0).toFixed(2),
        l.status || 'pending'
      ]));
    }
    
    if (type === 'all' || type === 'shifts') {
      tableData.push(...shifts.map(s => [
        'Shift',
        s.clock_in ? format(parseUTCDate(s.clock_in), 'yyyy-MM-dd') : 'N/A',
        s.user_name,
        'Active Presence',
        `${s.clock_in ? format(parseUTCDate(s.clock_in), 'HH:mm') : 'N/A'} - ${s.clock_out ? format(parseUTCDate(s.clock_out), 'HH:mm') : 'Active'}`,
        (s.total_hours || 0).toFixed(2),
        s.status || 'completed'
      ]));
    }

    autoTable(doc, {
      startY: 30,
      head: [['Type', 'Date', 'Intern', 'Task/Activity', 'Shift Time', 'Hours', 'Status']],
      body: tableData,
      headStyles: { fillColor: type === 'tasks' ? [79, 70, 229] : (type === 'shifts' ? [16, 185, 129] : [37, 99, 235]) }
    });

    const filename = type === 'all' ? 'combined' : (type === 'tasks' ? 'task_work' : 'shift_attendance');
    doc.save(`${filename}_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const handleApproval = async (status: 'approved' | 'rejected') => {
    if (!selectedLog || !profile) return;
    try {
      await api.updateLog(selectedLog.id, { status });
      await api.createApproval({
        log_id: selectedLog.id.toString(),
        approved_by: profile.uid,
        approved_by_name: profile.name,
        status: status,
        comments: approvalComments
      });

      setIsApprovalModalOpen(false);
      setSelectedLog(null);
      setApprovalComments('');
      fetchData();
    } catch (err) {
      console.error('Failed to approve/reject log:', err);
    }
  };

  const handleDeleteShift = async (id: string | number) => {
    if (!window.confirm('Are you sure you want to delete this shift record?')) return;
    try {
      await api.deleteShift(id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete shift:', err);
    }
  };

  const handleDeleteLog = async (id: string | number) => {
    if (!window.confirm('Are you sure you want to delete this log?')) return;
    try {
      await api.deleteLog(id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete log:', err);
    }
  };

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResults(null);
    const errors: string[] = [];
    let successCount = 0;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.trim().toUpperCase(),
      complete: async (results: Papa.ParseResult<Record<string, unknown>>) => {
        const data = results.data as Array<Record<string, unknown>>;
        
        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          const getVal = (row: any, keys: string[]) => {
            for (const k of keys) {
              const upperK = k.toUpperCase();
              if (row[upperK] !== undefined) return row[upperK].toString().trim();
            }
            return '';
          };

          const email = getVal(row, ['Email', 'EmailAddress']);
          const rowDate = getVal(row, ['DATE', 'Date']);
          const timeInStr = getVal(row, ['IN', 'TimeIn', 'ClockIn']);
          const timeOutStr = getVal(row, ['OUT', 'TimeOut', 'ClockOut']);

          if (!email || !rowDate) {
            errors.push(`Row ${i + 1}: Missing required fields (Email, DATE)`);
            continue;
          }

          const checkNonWorkingValue = (val: string) => {
            const s = val.toUpperCase().trim();
            return s === 'ABSNT' || s === 'ABSENT' || s === 'RD' || s === 'REST DAY';
          };

          if (checkNonWorkingValue(timeInStr) || checkNonWorkingValue(timeOutStr)) continue;

          if (!timeInStr || !timeOutStr) {
             errors.push(`Row ${i + 1}: Flagged as Incomplete Log (Missing In/Out)`);
             continue;
          }

          const targetUser = interns.find(u => u.email?.toLowerCase() === email.toLowerCase());
          if (!targetUser) {
            errors.push(`Row ${i + 1}: No intern found with email ${email}`);
            continue;
          }

          try {
            const parseTime = (t: string, baseDate: Date) => {
              const match = t.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
              if (match) {
                let hours = parseInt(match[1]);
                const mins = parseInt(match[2]);
                const ampm = match[3].toUpperCase();
                if (ampm === 'PM' && hours < 12) hours += 12;
                if (ampm === 'AM' && hours === 12) hours = 0;
                const d = new Date(baseDate);
                d.setHours(hours, mins, 0, 0);
                return d;
              }
              const match24 = t.match(/^(\d{1,2}):(\d{2})$/);
              if (match24) {
                const hours = parseInt(match24[1]);
                const mins = parseInt(match24[2]);
                const d = new Date(baseDate);
                d.setHours(hours, mins, 0, 0);
                return d;
              }
              return null;
            };

            let parsedBaseDate = new Date(rowDate);
            if (isNaN(parsedBaseDate.getTime())) {
                const d = rowDate.split(/[-/]/);
                if (d.length === 3) parsedBaseDate = new Date(rowDate.replace(/-/g, '/'));
            }

            if (isNaN(parsedBaseDate.getTime())) {
              errors.push(`Row ${i + 1}: Could not parse date format "${rowDate}"`);
              continue;
            }

            const clockIn = parseTime(timeInStr, parsedBaseDate);
            const clockOut = parseTime(timeOutStr, parsedBaseDate);

            if (!clockIn || !clockOut) {
              errors.push(`Row ${i + 1}: Invalid time format "${timeInStr}" or "${timeOutStr}"`);
              continue;
            }

            let finalClockOut = new Date(clockOut);
            if (finalClockOut < clockIn) finalClockOut.setDate(finalClockOut.getDate() + 1);

            const metrics = calculateAttendance(clockIn, finalClockOut);

            await api.createShift({
              user_id: targetUser.uid,
              user_name: targetUser.name,
              clock_in: clockIn.toISOString(),
              clock_out: finalClockOut.toISOString(),
              status: 'completed',
              ...metrics,
              is_overtime: metrics.overtime_hours > 0,
              manual_entry: 1,
              description: 'Bulk Imported',
              source: 'Bulk Entry',
              audit_label: 'Bulk Added by Admin',
              imported_by_id: profile?.uid,
              imported_by_name: profile?.name
            });
            successCount++;
          } catch (err: any) {
            errors.push(`Row ${i + 1}: ${err?.message || 'Error processing record'}`);
          }
        }

        setImportResults({ success: successCount, errors });
        setImporting(false);
        fetchData();
      }
    });
  };

  const downloadSampleCSV = () => {
    const data = [
      { Email: 'ryleesestoso@gmail.com', DATE: '23-Jan-26', IN: '1:01AM', OUT: '6:00AM' },
      { Email: 'ryleesestoso@gmail.com', DATE: '24-Jan-26', IN: '', OUT: 'ABSENT' },
      { Email: 'ryleesestoso@gmail.com', DATE: '26-Jan-26', IN: '9:05PM', OUT: '6:00AM' },
      { Email: 'ryleesestoso@gmail.com', DATE: '2/1/2026', IN: '', OUT: 'RD' }
    ];
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'intern_attendance_sample.csv';
    link.click();
  };

  const filteredLogs = filterIntern === 'all' 
    ? logs 
    : logs.filter(l => l.user_id === filterIntern);

  const filteredShifts = shifts
    .filter(s => {
      const isInternMatch = filterIntern === 'all' || s.user_id === filterIntern;
      if (!isInternMatch) return false;

      const clockIn = s.clock_in ? parseUTCDate(s.clock_in) : null;
      if (!clockIn) return true;

      const monthMatch = filterMonth === 'all' || format(clockIn, 'MM') === filterMonth;
      const yearMatch = filterYear === 'all' || format(clockIn, 'yyyy') === filterYear;
      
      return monthMatch && yearMatch;
    })
    .sort((a, b) => {
      const dateA = a.clock_in ? parseUTCDate(a.clock_in).getTime() : 0;
      const dateB = b.clock_in ? parseUTCDate(b.clock_in).getTime() : 0;
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  const availableYears = Array.from(new Set(shifts.map(s => {
    const d = s.clock_in ? parseUTCDate(s.clock_in) : null;
    return d ? format(d, 'yyyy') : null;
  }).filter(Boolean))).sort((a, b) => ((b as string) || '').localeCompare((a as string) || ''));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance & Logs</h1>
          <p className="text-slate-500">Track and review work sessions and shift attendance.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {(profile?.role === 'admin' || profile?.role === 'manager') && (
            <button 
              onClick={() => setIsBulkImportModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-50 text-indigo-600 border border-indigo-100 px-4 py-2 rounded-xl font-medium hover:bg-indigo-100 transition"
            >
              <Upload size={18} /> Bulk Import
            </button>
          )}
          <div className="relative group">
            <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-medium hover:bg-slate-50 transition">
              <Download size={18} /> Export Report
            </button>
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2 space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">CSV Format</div>
              <button onClick={() => exportCSV('all')} className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors flex items-center gap-2">
                <Table size={14} /> Combined Record
              </button>
              <button onClick={() => exportCSV('tasks')} className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors flex items-center gap-2">
                <CheckSquare size={14} /> Task Work Only
              </button>
              <button onClick={() => exportCSV('shifts')} className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors flex items-center gap-2">
                <Clock size={14} /> Attendance Only
              </button>
              
              <div className="border-t border-slate-50 my-1" />
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">PDF Format</div>
              <button onClick={() => exportPDF('all')} className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors flex items-center gap-2">
                <FileText size={14} /> Combined Record
              </button>
              <button onClick={() => exportPDF('tasks')} className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors flex items-center gap-2">
                <CheckSquare size={14} /> Task Work Only
              </button>
              <button onClick={() => exportPDF('shifts')} className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors flex items-center gap-2">
                <Clock size={14} /> Attendance Only
              </button>
            </div>
          </div>
          {profile?.role === 'intern' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl font-medium hover:bg-indigo-700 transition shadow-sm"
            >
              <Plus size={20} /> Log Hours
            </button>
          )}
        </div>
      </div>

      {profile?.role === 'intern' && (
        <div className="bg-white p-6 rounded-2xl border border-border-theme flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest leading-none mb-1">Total Requirement</p>
              <p className="text-xl font-black text-text-main">{profile.required_hours || 0} <span className="text-xs font-bold text-text-muted">Hours</span></p>
            </div>
          </div>
          
          <div className="h-10 w-px bg-border-theme hidden md:block" />

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <CheckSquare size={24} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest leading-none mb-1">Net Hours Rendered</p>
              <div className="flex flex-col">
                <p className="text-xl font-black text-emerald-600">
                  {(logs.reduce((acc, l) => acc + (l.rendered_hours || 0), 0) + shifts.reduce((acc, s) => acc + (s.net_work_hours || s.total_hours || 0), 0)).toFixed(1)} 
                  <span className="text-xs font-bold text-text-muted"> Hours</span>
                </p>
                {shifts.some(s => s.overtime_hours > 0) && (
                  <p className="text-[10px] font-bold text-indigo-600 tracking-tight">
                    Inc. {shifts.reduce((acc, s) => acc + (s.overtime_hours || 0), 0).toFixed(1)}h Overtime
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="h-10 w-px bg-border-theme hidden md:block" />

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest leading-none mb-1">Hours Remaining</p>
              <p className="text-xl font-black text-orange-600">
                {Math.max((profile.required_hours || 0) - (logs.reduce((acc, l) => acc + (l.rendered_hours || 0), 0) + shifts.reduce((acc, s) => acc + (s.net_work_hours || s.total_hours || 0), 0)), 0).toFixed(1)}
                <span className="text-xs font-bold text-text-muted"> Hours</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Admin/Manager Filter */}
      {profile?.role !== 'intern' && (
        <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-4">
          <label className="text-sm font-medium text-slate-600">Filter by Intern:</label>
          <select
            value={filterIntern}
            onChange={(e) => setFilterIntern(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="all">All Interns</option>
            {interns.map(i => <option key={i.uid} value={i.uid}>{i.name}</option>)}
          </select>
        </div>
      )}

      {/* Logs Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <MessageSquare size={20} className="text-indigo-500" />
          Task Work Logs
        </h3>
        <div className="bg-white rounded-[12px] border border-border-theme overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-[#fdfdfd] border-b border-border-theme">
                <tr>
                  <th className="px-5 py-3 text-[12px] font-semibold text-text-muted">Date</th>
                  <th className="px-5 py-3 text-[12px] font-semibold text-text-muted">Intern</th>
                  <th className="px-5 py-3 text-[12px] font-semibold text-text-muted">Task Description</th>
                  <th className="px-5 py-3 text-[12px] font-semibold text-text-muted">Start / End Time</th>
                  <th className="px-5 py-3 text-[12px] font-semibold text-text-muted text-center">Hours</th>
                  <th className="px-5 py-3 text-[12px] font-semibold text-text-muted">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-theme">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-[13px] text-text-main font-medium">
                        <Calendar size={14} className="text-text-muted" />
                        {log.date}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                       <div className="font-semibold text-text-main">{log.user_name}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-text-main font-medium">{log.task_name}</div>
                      <p className="text-[11px] text-text-muted line-clamp-1 italic">{log.description || 'No notes'}</p>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <Clock size={14} />
                        {log.start_time} - {log.end_time}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <span className="hours-badge">
                        {log.rendered_hours.toFixed(1)}h
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className={`status-pill ${
                            log.status === 'approved' ? 'status-success' :
                            log.status === 'rejected' ? 'status-danger' : 'status-warning'
                          }`}>
                            {log.status || 'pending'}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {(profile?.role === 'admin' || profile?.role === 'manager' || profile?.uid === log.user_id) && log.status !== 'approved' && (
                              <button 
                                onClick={() => handleEditLog(log)}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition"
                                title="Edit log"
                              >
                                <FileText size={12} />
                              </button>
                            )}
                            {(profile?.role === 'admin' || profile?.role === 'manager' || (profile?.uid === log.user_id && log.status === 'pending')) && (
                              <button 
                                onClick={() => handleDeleteLog(log.id)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded transition"
                                title="Delete log"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                        {(profile?.role === 'admin' || profile?.role === 'manager') && log.status !== 'approved' && (
                          <button 
                            onClick={() => { setSelectedLog(log); setIsApprovalModalOpen(true); }}
                            className="p-1 px-2 text-[10px] font-bold bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition"
                          >
                            Review
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-text-muted italic">No task logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Shifts History Table */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Clock size={20} className="text-emerald-500" />
            Shift Attendance History
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
            >
              <option value="all">All Months</option>
              {Array.from({ length: 12 }, (_, i) => {
                const month = (i + 1).toString().padStart(2, '0');
                return <option key={month} value={month}>{format(new Date(2022, i, 1), 'MMMM')}</option>;
              })}
            </select>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
            >
              <option value="all">All Years</option>
              {availableYears.map(year => <option key={year} value={year!}>{year}</option>)}
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition flex items-center gap-2"
            >
              <ArrowUpDown size={14} />
              {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-[12px] border border-border-theme overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-[#fdfdfd] border-b border-border-theme">
                <tr>
                  <th className="px-5 py-3 text-[12px] font-semibold text-text-muted">Date</th>
                  <th className="px-5 py-3 text-[12px] font-semibold text-text-muted">Intern</th>
                  <th className="px-5 py-3 text-[12px] font-semibold text-text-muted">Clock In</th>
                  <th className="px-5 py-3 text-[12px] font-semibold text-text-muted">Clock Out</th>
                  <th className="px-5 py-3 text-[12px] font-semibold text-text-muted text-center">Session Total</th>
                  <th className="px-5 py-3 text-[12px] font-semibold text-text-muted">Status / Metrics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-theme">
                {filteredShifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-slate-50/50 transition-colors group relative">
                    <td className="px-5 py-4 whitespace-nowrap text-[13px] text-text-main font-medium">
                      {shift.clock_in ? format(parseUTCDate(shift.clock_in), 'yyyy-MM-dd') : 'N/A'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-text-main">{shift.user_name}</div>
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {shift.source === 'Bulk Entry' && (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100 italic">
                            Bulk Entry
                          </span>
                        )}
                        {shift.source === 'Manual Entry' && (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 italic">
                            Manual
                          </span>
                        )}
                        {!shift.source && (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded border border-slate-100">
                            Timer
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-text-muted">
                      {shift.clock_in ? format(parseUTCDate(shift.clock_in), 'HH:mm:ss') : '--:--'}
                    </td>
                    <td className="px-5 py-4 text-xs text-text-muted">
                      {shift.clock_out ? format(parseUTCDate(shift.clock_out), 'HH:mm:ss') : (shift.status === 'active' ? 'Active now...' : '--:--')}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${shift.status === 'active' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {(shift.total_hours || 0).toFixed(2)}h
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-1">
                          <span className={`status-pill ${shift.status === 'active' ? 'status-warning' : 'status-success'}`}>
                            {shift.status === 'active' ? 'On Shift' : 'Completed'}
                          </span>
                          <div className="flex gap-1 flex-wrap">
                            {Boolean(shift.is_late) && <span className="text-[9px] font-bold text-red-500 uppercase">Late</span>}
                            {Boolean(shift.is_undertime) && <span className="text-[9px] font-bold text-orange-500 uppercase">Undertime</span>}
                            {shift.overtime_hours > 0 && (
                              <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1 rounded uppercase">
                                OT: {shift.overtime_hours.toFixed(1)}h
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {(profile?.role === 'admin' || profile?.role === 'manager' || profile?.uid === shift.user_id) && shift.status === 'completed' && (
                            <button 
                              onClick={() => handleEditShift(shift)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="Edit record"
                            >
                              <FileText size={14} />
                            </button>
                          )}
                          {(profile?.role === 'admin' || profile?.role === 'manager') && (
                            <button 
                              onClick={() => handleDeleteShift(shift.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete record"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        {(shift.audit_label || shift.imported_by_name) && (
                           <div className="hidden group-hover:block absolute right-4 top-2 bg-slate-800 text-white text-[10px] py-1.5 px-3 rounded-lg shadow-2xl z-50 border border-slate-700 font-medium">
                              <span className="opacity-70 truncate max-w-[150px]">
                                {shift.audit_label} by {shift.imported_by_name || 'Admin'}
                                {shift.edit_history?.length > 0 && ` (${shift.edit_history.length} updates)`}
                              </span>
                           </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {shifts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-text-muted italic">No attendance records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">Record Manual Entry</h2>
                <button 
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingLog(null);
                    setFormData({
                      task_id: '',
                      date: format(new Date(), 'yyyy-MM-dd'),
                      date_out: format(new Date(), 'yyyy-MM-dd'),
                      start_time: '08:00',
                      end_time: '17:00',
                      description: ''
                    });
                  }} 
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X />
                </button>
              </div>

              <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
                <button 
                  onClick={() => setLogType('task')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${logType === 'task' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Work Session
                </button>
                <button 
                  onClick={() => setLogType('attendance')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${logType === 'attendance' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Shift Attendance
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {logType === 'task' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Task Reference</label>
                    <select
                      required
                      value={formData.task_id}
                      onChange={(e) => setFormData({ ...formData, task_id: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                    >
                      <option value="">Select current task</option>
                      {tasks.map(t => <option key={t.id} value={t.id}>{t.title} ({t.status})</option>)}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date In</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value, date_out: formData.date_out === formData.date ? e.target.value : formData.date_out })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Time In</label>
                    <input
                      type="time"
                      required
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date Out</label>
                    <input
                      type="date"
                      required
                      value={formData.date_out}
                      onChange={(e) => setFormData({ ...formData, date_out: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Time Out</label>
                    <input
                      type="time"
                      required
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {logType === 'attendance' && (
                  <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                    <p className="text-[10px] text-emerald-800 leading-relaxed">
                      <span className="font-bold uppercase mr-1 flex items-center gap-1"><Clock size={10} /> Auto-Calculation Rules:</span>
                      1hr lunch deduction if work session is 5+ hours. Overtime automatically calculated after 9 net work hours.
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Work Description</label>
                  <textarea
                    rows={4}
                    placeholder="Briefly describe what was accomplished during this session..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                  />
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition"
                  >
                    Save Log
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
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
      {/* Bulk Import Modal */}
      <AnimatePresence>
        {isBulkImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">Bulk Import Shifts</h2>
                <button onClick={() => { setIsBulkImportModalOpen(false); setImportResults(null); }} className="text-slate-400 hover:text-slate-600"><X /></button>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 text-center">
                  <p className="text-sm text-slate-600 mb-3">Upload a CSV file with intern shift records.</p>
                  <button 
                    onClick={downloadSampleCSV}
                    className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1 mx-auto"
                  >
                    <Download size={12} /> Download Sample CSV
                  </button>
                </div>

                {!importResults ? (
                  <div className="relative group cursor-pointer">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleBulkImport}
                      disabled={importing}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="border-2 border-dashed border-slate-200 group-hover:border-indigo-400 rounded-2xl p-8 text-center transition-colors">
                      {importing ? (
                        <div className="space-y-3">
                          <Clock className="mx-auto text-indigo-500 animate-spin" size={32} />
                          <p className="text-sm font-bold text-slate-700">Processing records...</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Upload className="mx-auto text-slate-400" size={32} />
                          <p className="text-sm font-bold text-slate-700">Click or drag and drop CSV</p>
                          <p className="text-[10px] text-slate-400 font-medium">Headers: Email, Date, TimeIn, TimeOut</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-xl flex items-center gap-3 ${importResults.errors.length === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}`}>
                      {importResults.errors.length === 0 ? <CheckSquare size={20} /> : <AlertCircle size={20} />}
                      <div>
                        <p className="font-bold">Import Complete</p>
                        <p className="text-xs">{importResults.success} records successfully imported.</p>
                      </div>
                    </div>

                    {importResults.errors.length > 0 && (
                      <div className="max-h-32 overflow-y-auto p-3 bg-red-50 rounded-lg border border-red-100 space-y-1">
                        <p className="text-[10px] font-bold text-red-600 uppercase">Errors Found:</p>
                        {importResults.errors.map((err, i) => (
                          <p key={i} className="text-[10px] text-red-500">• {err}</p>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => { setIsBulkImportModalOpen(false); setImportResults(null); }}
                      className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {isApprovalModalOpen && selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">Review Work Log</h2>
                <button onClick={() => setIsApprovalModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex justify-between text-xs font-bold text-slate-400 uppercase mb-2">
                    <span>{selectedLog.user_name}</span>
                    <span>{selectedLog.date}</span>
                  </div>
                  <p className="font-bold text-slate-900">{selectedLog.task_name}</p>
                  <p className="text-sm text-slate-600 mt-1 italic">"{selectedLog.description || 'No description provided.'}"</p>
                  <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-xs text-slate-500">{selectedLog.start_time} - {selectedLog.end_time}</span>
                    <span className="text-xs font-bold text-indigo-600">{selectedLog.rendered_hours.toFixed(1)} Hours</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Feedback / Comments (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Provide feedback for the intern..."
                    value={approvalComments}
                    onChange={(e) => setApprovalComments(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleApproval('approved')}
                  className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleApproval('rejected')}
                  className="flex-1 bg-red-50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-100 transition"
                >
                  Reject
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
