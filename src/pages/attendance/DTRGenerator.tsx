import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Upload, FileText, Settings, Trash2, CheckCircle, AlertCircle, Plus, Coffee, Moon, Save, RotateCcw } from 'lucide-react';
import Papa from 'papaparse';
import { api } from '../../services/apiService';
import { parseUTCDate } from '../../utils/dateUtils';

type RowStatus = 'valid' | 'absent' | 'restday' | 'error';

interface DTRRow {
  id: string;
  date: string;
  timeIn: string;
  timeOut: string;
  hours: string;
  signature: string;
  status: RowStatus;
  errorMsg?: string;
}

interface SavedFormat {
  schoolName: string;
  schoolAddress: string;
  courseName: string;
  schoolYear: string;
  courseAndYear: string;
  company: string;
  deductLunch: boolean;
  roundHours: boolean;
}

// ── Normalization Layer ──────────────────────────────────────────────

const REST_KEYWORDS = ['rd', 'rest day', 'restday', 'off', 'day off', 'rdo'];
const ABSENT_KEYWORDS = ['absent', 'absnt', 'abs', 'absnt'];

/** Normalize any time string into 'HH:mm' (24h), 'REST_DAY', 'ABSENT', or null on failure */
function normalizeTime(value: string): string | null {
  if (!value) return null;
  // Trim Excel whitespace artifacts
  let v = value.replace(/\s+/g, ' ').trim().toLowerCase();

  if (REST_KEYWORDS.includes(v)) return 'REST_DAY';
  if (ABSENT_KEYWORDS.includes(v)) return 'ABSENT';

  // Expand shorthand digits: 800 → 8:00, 1700 → 17:00
  if (/^\d{3,4}$/.test(v)) {
    const padded = v.padStart(4, '0');
    v = `${padded.slice(0, 2)}:${padded.slice(2)}`;
  }

  // Fix missing space before am/pm (8:00AM → 8:00 AM)
  v = v.replace(/(\d)(am|pm)/, '$1 $2');

  // Try native Date parse (handles most 12h / 24h variants)
  const parsed = new Date(`1970-01-01 ${v}`);
  if (!isNaN(parsed.getTime())) {
    const hh = parsed.getHours().toString().padStart(2, '0');
    const mm = parsed.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
  }

  return null; // unparseable
}

/** Compute hours between two HH:mm strings with overnight support */
function computeHours(timeIn: string, timeOut: string, deduct: boolean, round: boolean): number {
  const [h1, m1] = timeIn.split(':').map(Number);
  const [h2, m2] = timeOut.split(':').map(Number);
  let start = h1 * 60 + m1;
  let end = h2 * 60 + m2;
  if (end <= start) end += 24 * 60; // overnight shift fix
  let hrs = (end - start) / 60;
  if (deduct && hrs > 5) hrs -= 1;
  if (round) {
    // Precise rounding: 0.00–0.24→floor, 0.25–0.74→0.5, 0.75–0.99→ceil
    const frac = hrs % 1;
    const whole = Math.floor(hrs);
    if (frac < 0.25) hrs = whole;
    else if (frac < 0.75) hrs = whole + 0.5;
    else hrs = whole + 1;
  }
  return Math.max(0, parseFloat(hrs.toFixed(2)));
}

/** Main row calculator */
function calcHours(inRaw: string, outRaw: string, deduct: boolean, round: boolean): { hours: string; status: RowStatus; errorMsg?: string } {
  if (!inRaw.trim() && !outRaw.trim()) return { hours: '0.00', status: 'error', errorMsg: 'Empty times' };
  if (!inRaw.trim()) return { hours: '0.00', status: 'error', errorMsg: 'Missing Time In' };
  if (!outRaw.trim()) return { hours: '0.00', status: 'error', errorMsg: 'Missing Time Out' };

  const tIn = normalizeTime(inRaw);
  const tOut = normalizeTime(outRaw);

  if (tIn === 'REST_DAY' || tOut === 'REST_DAY') return { hours: '0.00', status: 'restday' };
  if (tIn === 'ABSENT' || tOut === 'ABSENT') return { hours: '0.00', status: 'absent' };
  if (!tIn) return { hours: '0.00', status: 'error', errorMsg: `Cannot parse Time In: "${inRaw}" — try 8:00AM or 17:00` };
  if (!tOut) return { hours: '0.00', status: 'error', errorMsg: `Cannot parse Time Out: "${outRaw}" — try 5:00PM or 17:00` };

  const hrs = computeHours(tIn, tOut, deduct, round);
  if (hrs <= 0) return { hours: '0.00', status: 'error', errorMsg: 'Computed hours ≤ 0 — check times' };
  return { hours: hrs.toFixed(2), status: 'valid' };
}


function makeRow(date: string, timeIn: string, timeOut: string, deduct: boolean, round: boolean): DTRRow {
  const calc = calcHours(timeIn, timeOut, deduct, round);
  return {
    id: Math.random().toString(36).substr(2, 9),
    date,
    timeIn,
    timeOut,
    hours: calc.hours,
    signature: '',
    status: calc.status,
    errorMsg: calc.errorMsg,
  };
}

const STORAGE_KEY = 'nextrack_dtr_format';

const defaultHeader: SavedFormat = {
  schoolName: '',
  schoolAddress: '',
  courseName: '',
  schoolYear: '',
  courseAndYear: '',
  company: '',
  deductLunch: true,
  roundHours: false,
};

function loadSaved(): SavedFormat | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function DTRGenerator() {
  const { profile } = useAuth();
  const saved = loadSaved();

  const [header, setHeader] = useState<SavedFormat>(saved || defaultHeader);
  const [deductLunch, setDeductLunch] = useState(saved?.deductLunch ?? true);
  const [roundHours, setRoundHours] = useState(saved?.roundHours ?? false);
  const [rows, setRows] = useState<DTRRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [generated, setGenerated] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logsError, setLogsError] = useState('');

  // Load the signed-in intern's recorded attendance sessions into the DTR.
  useEffect(() => {
    if (!profile?.uid) {
      setLoadingLogs(false);
      return;
    }

    let cancelled = false;
    const loadTimeLogs = async () => {
      setLoadingLogs(true);
      setLogsError('');
      try {
        const shifts = await api.getShifts(profile.uid);
        if (cancelled) return;

        const importedRows = shifts
          .filter((shift: any) => shift.clock_in)
          .sort((a: any, b: any) => parseUTCDate(a.clock_in).getTime() - parseUTCDate(b.clock_in).getTime())
          .map((shift: any) => {
            const clockIn = parseUTCDate(shift.clock_in);
            const clockOut = shift.clock_out ? parseUTCDate(shift.clock_out) : null;
            return makeRow(
              clockIn.toISOString().slice(0, 10),
              clockIn.toISOString().slice(11, 16),
              clockOut ? clockOut.toISOString().slice(11, 16) : '',
              deductLunch,
              roundHours,
            );
          });
        setRows(importedRows);
      } catch (error) {
        console.error('Failed to load attendance time logs:', error);
        if (!cancelled) setLogsError('Unable to load your time logs. You can still upload a CSV file.');
      } finally {
        if (!cancelled) setLoadingLogs(false);
      }
    };

    loadTimeLogs();
    return () => { cancelled = true; };
  }, [profile?.uid]);

  // Recalculate all entries when the hour-calculation options change.
  useEffect(() => {
    setRows(prev => prev.map(r => {
      const calc = calcHours(r.timeIn, r.timeOut, deductLunch, roundHours);
      return { ...r, hours: calc.hours, status: calc.status, errorMsg: calc.errorMsg };
    }));
  }, [deductLunch, roundHours]);

  const totalHours = rows.reduce((acc, r) => {
    return acc + (r.status === 'valid' ? parseFloat(r.hours) : 0);
  }, 0).toFixed(2);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<Record<string, unknown>>) => {
        const parsed: DTRRow[] = (results.data as Array<Record<string, unknown>>).map((row) => {
          // Flexible column detection — supports: Date, TIME IN, Time In, etc.
          const get = (variants: string[]) => {
            for (const v of variants) {
              const key = Object.keys(row).find(k => k.trim().toLowerCase() === v.toLowerCase());
              if (key) return (row[key] || '').toString().trim();
            }
            // fallback: partial match
            const key = Object.keys(row).find(k => variants.some(v => k.toLowerCase().includes(v.toLowerCase())));
            return key ? (row[key] || '').toString().trim() : '';
          };

          const date = get(['date', 'Date', 'DATE']);
          const timeIn = get(['in', 'time in', 'timein', 'TIME IN', 'Time In', 'clock in']);
          const timeOut = get(['out', 'time out', 'timeout', 'TIME OUT', 'Time Out', 'clock out']);

          if (!date && !timeIn && !timeOut) return null;
          return makeRow(date, timeIn, timeOut, deductLunch, roundHours);
        }).filter(Boolean) as DTRRow[];
        setRows(parsed);
        setImporting(false);
        e.target.value = '';
      }
    });
  };

  const updateRow = (id: string, field: keyof DTRRow, value: string) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      if (field === 'timeIn' || field === 'timeOut') {
        const calc = calcHours(updated.timeIn, updated.timeOut, deductLunch, roundHours);
        updated.hours = calc.hours;
        updated.status = calc.status;
        updated.errorMsg = calc.errorMsg;
      }
      return updated;
    }));
  };

  const removeRow = (id: string) => setRows(prev => prev.filter(r => r.id !== id));

  const addEmptyRow = () => {
    setRows(prev => [...prev, makeRow('', '', '', deductLunch, roundHours)]);
  };

  const saveFormat = () => {
    const existing = loadSaved();
    if (existing && !window.confirm('Replace existing saved format?')) return;
    const toSave: SavedFormat = { ...header, deductLunch, roundHours };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    setSaveMsg('Format saved!');
    setTimeout(() => setSaveMsg(''), 2500);
  };

  const resetToDefault = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHeader(defaultHeader);
    setDeductLunch(true);
    setRoundHours(false);
    setSaveMsg('Reset to defaults.');
    setTimeout(() => setSaveMsg(''), 2500);
  };

  const exportCSV = () => {
    const csvData: any[][] = [
      [header.schoolName],
      [header.schoolAddress],
      [header.courseName],
      [`S.Y : ${header.schoolYear}`],
      [],
      ['', '', 'On - The - Job Attendance Sheet'],
      [],
      [`NAME: ${profile?.name.toUpperCase() || 'STUDENT'}`, '', '', '', '', `COURSE & YEAR: ${header.courseAndYear}`],
      [`TRAINING COMPANY: ${header.company}`],
      ['ADDRESS:'],
      ['MANAGER :', '', '', '', '', 'POSITION: IT Intern'],
      [],
      ['DATE', 'IN', 'OUT', 'NO. OF HOURS', 'SIGNATURE:', 'TOTAL OF HOURS']
    ];
    rows.forEach((r, idx) => {
      const s = r.status;
      const displayIn = s === 'restday' ? 'REST DAY' : s === 'absent' ? 'ABSENT' : r.timeIn;
      const displayOut = s === 'restday' ? 'REST DAY' : s === 'absent' ? 'ABSENT' : r.timeOut;
      csvData.push([r.date, displayIn, displayOut, s === 'valid' ? r.hours : '0.00', r.signature, idx === 0 ? totalHours : '']);
    });
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `DTR_${(profile?.name || 'Student').replace(/\s+/g, '_')}.csv`;
    link.click();
    setGenerated(true);
    if (saveAsDefault) saveFormat();
  };

  const statusBadge = (r: DTRRow) => {
    if (r.status === 'valid') return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full"><CheckCircle size={10}/> VALID</span>;
    if (r.status === 'absent') return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full"><Coffee size={10}/> ABSENT</span>;
    if (r.status === 'restday') return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full"><Moon size={10}/> REST DAY</span>;
    return (
      <div className="group relative inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-1 rounded-full cursor-help">
        <AlertCircle size={10}/> ERROR
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 bg-slate-900 text-white text-[10px] p-2 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 whitespace-normal">
          {r.errorMsg}
        </div>
      </div>
    );
  };

  const rowBg = (r: DTRRow) => {
    const s = r.status;
    if (s === 'valid') return 'bg-emerald-50/30';
    if (s === 'absent') return 'bg-amber-50/40';
    if (s === 'restday') return 'bg-blue-50/40';
    return 'bg-red-50/40';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance Report</h1>
          <p className="text-slate-500 text-sm">Your recorded attendance time logs are automatically prepared for your Daily Time Record.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportCSV} disabled={rows.length === 0} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm text-sm">
            <FileText size={16}/> Generate Final Sheet
          </button>
        </div>
      </div>

      {generated && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-5 py-3 text-sm font-medium flex items-center gap-2">
          <CheckCircle size={16}/> Your attendance sheet has been successfully generated. Please review all entries before final submission.
          <button onClick={() => setGenerated(false)} className="ml-auto text-emerald-600 hover:text-emerald-800">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel */}
        <div className="lg:col-span-1 space-y-5">
          {/* School Info */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2"><Settings size={16}/> Header Information</h2>
            <div className="space-y-3">
              {[
                { label: 'School Name', key: 'schoolName', placeholder: 'e.g., Cebu Technological University - Daanbantayan Campus' },
                { label: 'School Address', key: 'schoolAddress', placeholder: 'e.g., Agujo Daanbantayan Cebu' },
                { label: 'Course Full Name', key: 'courseName', placeholder: 'e.g., Bachelor of Science in Information Technology' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</label>
                  <input type="text" value={(header as any)[key]} onChange={e => setHeader({ ...header, [key]: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 text-sm" placeholder={placeholder} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">School Year</label>
                  <input type="text" value={header.schoolYear} onChange={e => setHeader({ ...header, schoolYear: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 text-sm" placeholder="2025 - 2026" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Course & Year</label>
                  <input type="text" value={header.courseAndYear} onChange={e => setHeader({ ...header, courseAndYear: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 text-sm" placeholder="BSIT - 4" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Training Company</label>
                <input type="text" value={header.company} onChange={e => setHeader({ ...header, company: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 text-sm" placeholder="Enter company name" />
              </div>
            </div>
          </div>

          {/* Import */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2"><Upload size={16}/> Add Data</h2>
            <p className="text-xs text-slate-500 mb-3">
              {loadingLogs ? 'Loading your recorded time logs...' : `${rows.length} recorded time log${rows.length === 1 ? '' : 's'} loaded automatically.`}
            </p>
            {logsError && <p className="text-xs text-red-500 mb-3">{logsError}</p>}
            <div className="relative group cursor-pointer">
              <input type="file" accept=".csv" onChange={handleFileUpload} disabled={importing}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
              <div className="border-2 border-dashed border-slate-200 group-hover:border-indigo-400 rounded-xl p-5 text-center transition-colors">
                <Upload className="mx-auto text-slate-400 mb-2" size={22} />
                <p className="text-sm font-bold text-slate-700">{importing ? 'Processing...' : 'Replace with CSV File'}</p>
                <p className="text-[10px] text-slate-400 mt-1">Optional — headers: Date, In, Out</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-3 mt-3 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Calculation Options</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={deductLunch} onChange={e => setDeductLunch(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                <span className="text-sm text-slate-700">Deduct 1-hour lunch (if &gt;5 hrs)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={roundHours} onChange={e => setRoundHours(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                <span className="text-sm text-slate-700">Round hours (0.25→0.5, 0.75→1.0)</span>
              </label>
            </div>
          </div>

          {/* Save Format */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2"><Save size={16}/> Save Format</h2>
            <div className="space-y-2.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={saveAsDefault} onChange={e => setSaveAsDefault(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                <span className="text-sm text-slate-700">Auto-save when exporting</span>
              </label>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={saveFormat}
                className="flex-1 flex items-center justify-center gap-1 bg-indigo-50 text-indigo-700 font-bold text-xs px-3 py-2 rounded-lg hover:bg-indigo-100 transition">
                <Save size={13}/> Save Now
              </button>
              <button onClick={resetToDefault}
                className="flex-1 flex items-center justify-center gap-1 bg-slate-100 text-slate-600 font-bold text-xs px-3 py-2 rounded-lg hover:bg-slate-200 transition">
                <RotateCcw size={13}/> Reset
              </button>
            </div>
            {saveMsg && <p className="text-xs text-emerald-600 font-medium mt-2 text-center">{saveMsg}</p>}
          </div>

          {/* Legend */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Status Legend</p>
            <div className="space-y-2">
              {[
                { color: 'bg-emerald-100 text-emerald-700', label: 'VALID', desc: 'Counted in total hours' },
                { color: 'bg-amber-100 text-amber-700', label: 'ABSENT', desc: 'ABSENT / ABSNT / ABS' },
                { color: 'bg-blue-100 text-blue-700', label: 'REST DAY', desc: 'RD / OFF / RDO / DAY OFF' },
                { color: 'bg-red-100 text-red-700', label: 'ERROR', desc: 'Invalid or missing data' },
              ].map(({ color, label, desc }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`${color} text-[10px] font-bold px-2 py-0.5 rounded-full`}>{label}</span>
                  <span className="text-[11px] text-slate-500">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col" style={{ minHeight: '600px', maxHeight: '85vh' }}>
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl shrink-0">
            <h2 className="text-base font-bold text-slate-800">Attendance Data <span className="text-slate-400 font-normal text-sm">({rows.length} rows)</span></h2>
            <div className="bg-white px-4 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Valid Hours</span>
              <span className="text-lg font-black text-indigo-600">{totalHours}</span>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-3 py-3 font-bold text-slate-600 text-xs">Date</th>
                  <th className="px-3 py-3 font-bold text-slate-600 text-xs">Time In</th>
                  <th className="px-3 py-3 font-bold text-slate-600 text-xs">Time Out</th>
                  <th className="px-3 py-3 font-bold text-slate-600 text-xs">Hours</th>
                  <th className="px-3 py-3 font-bold text-slate-600 text-xs">Status</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(row => (
                  <tr key={row.id} className={`${rowBg(row)} hover:brightness-95 transition-all`}>
                    <td className="px-2 py-1.5">
                      <input type="text" value={row.date} onChange={e => updateRow(row.id, 'date', e.target.value)}
                        className="w-28 px-2 py-1 border border-transparent hover:border-slate-300 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 rounded bg-transparent outline-none text-xs"
                        placeholder="DD-MMM-YY" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="text" value={row.timeIn} onChange={e => updateRow(row.id, 'timeIn', e.target.value)}
                        className="w-24 px-2 py-1 border border-transparent hover:border-slate-300 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 rounded bg-transparent outline-none text-xs"
                        placeholder="8:00AM" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="text" value={row.timeOut} onChange={e => updateRow(row.id, 'timeOut', e.target.value)}
                        className="w-24 px-2 py-1 border border-transparent hover:border-slate-300 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 rounded bg-transparent outline-none text-xs"
                        placeholder="5:00PM" />
                    </td>
                    <td className="px-3 py-1.5 font-semibold text-slate-700 text-xs tabular-nums">{row.hours}</td>
                    <td className="px-3 py-1.5">{statusBadge(row)}</td>
                    {/*
                    <td className="px-1.5 py-1.5">
                      <select value={row.override || ''} onChange={e => updateRow(row.id, 'override', e.target.value)}
                        className="text-[10px] border border-slate-200 rounded-lg px-1.5 py-1 outline-none bg-white focus:ring-1 focus:ring-indigo-200 cursor-pointer">
                        <option value="">Auto</option>
                        <option value="valid">✅ VALID</option>
                        <option value="absent">🟡 ABSENT</option>
                        <option value="restday">⚪ REST DAY</option>
                      </select>
                    </td>
                    */}
                    <td className="px-2 py-1.5">
                      <button onClick={() => removeRow(row.id)} className="text-slate-300 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition">
                        <Trash2 size={14}/>
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-slate-400 text-sm">
                      <Upload className="mx-auto mb-3 text-slate-300" size={32}/>
                      No recorded time logs yet. You can upload a CSV or add a row manually.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50 rounded-b-2xl shrink-0">
            <button onClick={addEmptyRow}
              className="flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition mx-auto">
              <Plus size={15}/> Add Manual Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
