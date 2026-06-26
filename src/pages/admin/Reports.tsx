import React, { useState, useEffect } from 'react';
import { api } from '../../services/apiService';
import { BarChart3, FileDown, Search, Filter, ArrowUpDown, ChevronUp, ChevronDown, Clock, Calendar, Upload, Table as TableIcon, X, AlertCircle, CheckSquare } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import Papa from 'papaparse';
import { calculateAttendance } from '../../utils/attendanceUtils';
import ExportReportButton from '../../components/ExportReportButton';
import { parseUTCDate } from '../../utils/dateUtils';

export default function Reports() {
  const { profile } = useAuth();
  const [shifts, setShifts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Bulk Import State
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{success: number, errors: string[]} | null>(null);

  // Filters
  const [filterIntern, setFilterIntern] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchData = async () => {
    if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin' && profile.role !== 'manager')) return;
    try {
      const [allUsers, allShifts] = await Promise.all([
        api.getUsers(),
        api.getShifts()
      ]);
      setUsers(allUsers);
      setShifts(allShifts.filter((s: any) => s.status === 'completed'));
    } catch (err) {
      console.error('Failed to fetch report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [profile]);

  const filteredShifts = shifts
    .filter(s => {
      if (filterIntern !== 'all' && s.user_id !== filterIntern) return false;
      
      const user = users.find(u => (u.uid || u.id) === s.user_id);
      if (filterDepartment !== 'all' && user?.department !== filterDepartment) return false;

      if (filterType === 'overtime' && !(s.overtime_hours > 0)) return false;
      if (filterType === 'undertime' && !s.is_undertime) return false;
      if (filterType === 'late' && !s.is_late) return false;
      
      if (startDate && s.clock_in) {
        const d = parseUTCDate(s.clock_in);
        if (d < new Date(startDate)) return false;
      }
      if (endDate && s.clock_in) {
        const d = parseUTCDate(s.clock_in);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }
      
      if (searchTerm && !s.user_name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        const timeA = a.clock_in ? parseUTCDate(a.clock_in).getTime() : 0;
        const timeB = b.clock_in ? parseUTCDate(b.clock_in).getTime() : 0;
        comparison = timeA - timeB;
      } else if (sortField === 'name') {
        comparison = (a.user_name || '').localeCompare(b.user_name || '');
      } else if (sortField === 'hours') {
        comparison = (a.net_work_hours || a.total_hours || 0) - (b.net_work_hours || b.total_hours || 0);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

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
      transformHeader: (h) => h.trim().toUpperCase(),
      complete: async (results) => {
        const data = results.data as any[];
        const interns = users.filter(u => u.role === 'intern');
        
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
              user_id: targetUser.uid || targetUser.id,
              user_name: targetUser.name,
              clock_in: clockIn.toISOString(),
              clock_out: finalClockOut.toISOString(),
              status: 'completed',
              ...metrics,
              is_overtime: metrics.overtime_hours > 0,
              manual_entry: 1,
              source: 'Bulk Entry'
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
      { Email: 'intern@example.com', DATE: '2026-01-23', IN: '08:00', OUT: '17:00' },
      { Email: 'intern@example.com', DATE: '2026-01-24', IN: '9:05 PM', OUT: '6:00 AM' }
    ];
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'attendance_import_sample.csv';
    link.click();
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="opacity-20" />;
    return sortOrder === 'desc' ? <ChevronDown size={14} className="text-primary" /> : <ChevronUp size={14} className="text-primary" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Shift Reports</h1>
          <p className="text-slate-500 text-sm">Comprehensive attendance analysis and exportable documentation.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsBulkImportModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-600 border border-indigo-100 px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-100 transition"
          >
            <Upload size={20} /> Bulk Import
          </button>
          <ExportReportButton 
            filters={{
              month: 'all', // We can derive from current state if needed
              year: 'all',
              startDate: startDate,
              endDate: endDate,
              userId: filterIntern,
              department: filterDepartment
            }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Intern</label>
            <select 
              value={filterIntern}
              onChange={(e) => setFilterIntern(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/10"
            >
              <option value="all">All Interns</option>
              {users.filter(u => u.role === 'intern').map(u => (
                <option key={u.uid} value={u.uid}>{u.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Department</label>
            <select 
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/10"
            >
              <option value="all">All Departments</option>
              {Array.from(new Set(users.map(u => u.department).filter(Boolean))).sort().map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Type</label>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/10"
            >
              <option value="all">All Shifts</option>
              <option value="late">Late</option>
              <option value="overtime">Overtime</option>
              <option value="undertime">Undertime</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">From</label>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">To</label>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
              <input 
                type="text"
                placeholder="Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/10"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer" onClick={() => { setSortField('date'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}>
                  <div className="flex items-center gap-1">Date <SortIcon field="date" /></div>
                </th>
                <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer" onClick={() => { setSortField('name'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}>
                  <div className="flex items-center gap-1">Intern <SortIcon field="name" /></div>
                </th>
                <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Times</th>
                <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer" onClick={() => { setSortField('hours'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}>
                   <div className="flex items-center gap-1">Net Hours <SortIcon field="hours" /></div>
                </th>
                <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredShifts.map((shift, i) => (
                <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">
                    {shift.clock_in ? format(parseUTCDate(shift.clock_in), 'PPP') : 'N/A'}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-900">{shift.user_name}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                       <span className="text-emerald-600">{shift.clock_in ? format(parseUTCDate(shift.clock_in), 'HH:mm') : '--:--'}</span>
                       <span>→</span>
                       <span className="text-slate-600">{shift.clock_out ? format(parseUTCDate(shift.clock_out), 'HH:mm') : '--:--'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                     <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-black">
                        {(shift.net_work_hours || shift.total_hours || 0).toFixed(1)}h
                     </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex gap-1.5">
                       {shift.is_late && <span className="text-[9px] font-black text-red-600 uppercase">Late</span>}
                       {shift.is_undertime && <span className="text-[9px] font-black text-orange-600 uppercase">Undertime</span>}
                       {shift.overtime_hours > 0 && <span className="text-[9px] font-black text-indigo-600 uppercase">OT: {shift.overtime_hours.toFixed(1)}h</span>}
                       {!shift.is_late && !shift.is_undertime && shift.overtime_hours === 0 && <span className="text-[9px] font-black text-emerald-600 uppercase">Normal</span>}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredShifts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-20 text-center text-slate-400 text-sm italic">No records found matching filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isBulkImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBulkImportModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Upload size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Bulk Import Shifts</h3>
                    <p className="text-xs text-slate-500">Upload CSV to bulk populate attendance records.</p>
                  </div>
                </div>
                <button onClick={() => setIsBulkImportModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8">
                {importResults ? (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-2xl flex items-center gap-3 ${importResults.errors.length === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
                      {importResults.errors.length === 0 ? <CheckSquare size={20} /> : <AlertCircle size={20} />}
                      <div>
                        <p className="font-bold">Import Summary</p>
                        <p className="text-sm">Successfully imported {importResults.success} records.</p>
                      </div>
                    </div>
                    {importResults.errors.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Issues Encountered</p>
                        <div className="max-h-48 overflow-y-auto bg-slate-50 rounded-xl p-3 border border-slate-100 italic space-y-1">
                          {importResults.errors.map((err, i) => (
                            <p key={i} className="text-[10px] text-red-600 flex gap-2">
                              <span>•</span> {err}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    <button 
                      onClick={() => { setImportResults(null); setIsBulkImportModalOpen(false); }}
                      className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-900/10"
                    >
                      Close Summary
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-10 hover:border-indigo-300 transition-colors group relative cursor-pointer">
                      <input 
                        type="file" 
                        accept=".csv"
                        onChange={handleBulkImport}
                        disabled={importing}
                        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                        <TableIcon size={32} />
                      </div>
                      <p className="text-sm font-bold text-slate-700 mb-1">
                        {importing ? 'Processing Data...' : 'Drop your CSV here'}
                      </p>
                      <p className="text-xs text-slate-500">or click to browse files</p>
                    </div>

                    <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 flex items-start gap-3">
                      <AlertCircle className="text-indigo-600 shrink-0" size={18} />
                      <div className="space-y-2">
                        <p className="text-[11px] font-bold text-indigo-900 leading-tight">Requirement: CSV must have Email, Date, In, and Out columns.</p>
                        <button 
                          onClick={downloadSampleCSV}
                          className="flex items-center gap-1 text-[10px] font-black text-indigo-600 uppercase hover:underline"
                        >
                          Download Sample Format
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

