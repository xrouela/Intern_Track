import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/apiService';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarDays, Clock, FileText, Send, X, ChevronDown, Paperclip } from 'lucide-react';

const LEAVE_TYPES = ['Sick Leave', 'Emergency Leave', 'Personal Leave', 'Vacation Leave', 'Others'];

const statusBadge = (status: string) => {
  if (status === 'approved') return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">✅ APPROVED</span>;
  if (status === 'rejected') return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-1 rounded-full">❌ REJECTED</span>;
  return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">🟡 PENDING</span>;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Requests() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<'schedule' | 'leave'>('schedule');

  // Schedule Change State
  const [scForm, setScForm] = useState({
    affected_date: '',
    current_time_in: '',
    current_time_out: '',
    requested_time_in: '',
    requested_time_out: '',
    reason: '',
  });
  const [scAttachment, setScAttachment] = useState<{ base64: string; name: string } | null>(null);
  const [scRequests, setScRequests] = useState<any[]>([]);
  const [scLoading, setScLoading] = useState(false);
  const [scError, setScError] = useState('');
  const [scSuccess, setScSuccess] = useState('');

  // Leave Request State
  const [loaForm, setLoaForm] = useState({
    leave_type: 'Personal Leave',
    start_date: '',
    end_date: '',
    reason: '',
  });
  const [loaAttachment, setLoaAttachment] = useState<{ base64: string; name: string } | null>(null);
  const [loaRequests, setLoaRequests] = useState<any[]>([]);
  const [loaLoading, setLoaLoading] = useState(false);
  const [loaError, setLoaError] = useState('');
  const [loaSuccess, setLoaSuccess] = useState('');

  const today = format(new Date(), 'yyyy-MM-dd');

  const fetchData = async () => {
    if (!profile) return;
    const [sc, loa] = await Promise.all([
      api.getScheduleRequests(profile.uid),
      api.getLeaveRequests(profile.uid),
    ]);
    setScRequests(sc);
    setLoaRequests(loa);
  };

  useEffect(() => { fetchData(); }, [profile]);

  const handleScFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    setScAttachment({ base64, name: file.name });
  };

  const handleLoaFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    setLoaAttachment({ base64, name: file.name });
  };

  const submitScheduleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setScError('');
    if (!scForm.affected_date) return setScError('Affected date is required.');
    if (!scForm.requested_time_in || !scForm.requested_time_out) return setScError('New schedule times are required.');
    if (scForm.requested_time_in === scForm.current_time_in && scForm.requested_time_out === scForm.current_time_out)
      return setScError('Requested schedule is identical to current schedule.');
    if (!scForm.reason.trim()) return setScError('Reason is required.');

    setScLoading(true);
    try {
      await api.createScheduleRequest({
        user_id: profile?.uid,
        user_name: profile?.name,
        request_date: today,
        ...scForm,
        attachment_base64: scAttachment?.base64 || null,
        attachment_name: scAttachment?.name || null,
        status: 'pending',
      });
      setScSuccess('Your schedule change request has been submitted for review.');
      setScForm({ affected_date: '', current_time_in: '', current_time_out: '', requested_time_in: '', requested_time_out: '', reason: '' });
      setScAttachment(null);
      fetchData();
    } catch (err: any) {
      setScError(err.message || 'Submission failed.');
    } finally {
      setScLoading(false);
    }
  };

  const submitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoaError('');
    if (!loaForm.start_date || !loaForm.end_date) return setLoaError('Start and end dates are required.');
    if (loaForm.end_date < loaForm.start_date) return setLoaError('End date must be on or after start date.');
    if (!loaForm.reason.trim()) return setLoaError('Reason is required.');

    // Check overlap with approved leaves
    const overlap = loaRequests.filter(r =>
      r.status === 'approved' &&
      !(loaForm.end_date < r.start_date || loaForm.start_date > r.end_date)
    );
    if (overlap.length > 0) return setLoaError('Your dates overlap with an existing approved leave.');

    setLoaLoading(true);
    try {
      await api.createLeaveRequest({
        user_id: profile?.uid,
        user_name: profile?.name,
        request_date: today,
        ...loaForm,
        attachment_base64: loaAttachment?.base64 || null,
        attachment_name: loaAttachment?.name || null,
        status: 'pending',
      });
      setLoaSuccess('Your leave request has been submitted successfully.');
      setLoaForm({ leave_type: 'Personal Leave', start_date: '', end_date: '', reason: '' });
      setLoaAttachment(null);
      fetchData();
    } catch (err: any) {
      setLoaError(err.message || 'Submission failed.');
    } finally {
      setLoaLoading(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 text-sm transition';
  const labelCls = 'block text-xs font-bold text-slate-500 uppercase mb-1';

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Requests</h1>
        <p className="text-slate-500 text-sm">Submit schedule change or leave of absence requests.</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <button onClick={() => setTab('schedule')}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition ${tab === 'schedule' ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
          <span className="flex items-center gap-2"><Clock size={15}/> Schedule Change</span>
        </button>
        <button onClick={() => setTab('leave')}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition ${tab === 'leave' ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
          <span className="flex items-center gap-2"><CalendarDays size={15}/> Leave of Absence</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {tab === 'schedule' ? (
          <motion.div key="schedule" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2"><Clock size={16}/> Change Schedule Request</h2>
              <form onSubmit={submitScheduleChange} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Employee Name</label>
                    <input type="text" value={profile?.name || ''} readOnly className={`${inputCls} bg-slate-50`} />
                  </div>
                  <div>
                    <label className={labelCls}>Date of Request</label>
                    <input type="text" value={today} readOnly className={`${inputCls} bg-slate-50`} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Affected Date</label>
                  <input type="date" value={scForm.affected_date} onChange={e => setScForm({...scForm, affected_date: e.target.value})} className={inputCls} required />
                </div>
                <div className="p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase">Current Schedule</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Time In</label>
                      <input type="time" value={scForm.current_time_in} onChange={e => setScForm({...scForm, current_time_in: e.target.value})} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Time Out</label>
                      <input type="time" value={scForm.current_time_out} onChange={e => setScForm({...scForm, current_time_out: e.target.value})} className={inputCls} />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-indigo-50 rounded-xl space-y-3 border border-indigo-100">
                  <p className="text-xs font-bold text-indigo-600 uppercase">Requested New Schedule</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Time In</label>
                      <input type="time" value={scForm.requested_time_in} onChange={e => setScForm({...scForm, requested_time_in: e.target.value})} className={inputCls} required />
                    </div>
                    <div>
                      <label className={labelCls}>Time Out</label>
                      <input type="time" value={scForm.requested_time_out} onChange={e => setScForm({...scForm, requested_time_out: e.target.value})} className={inputCls} required />
                    </div>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Reason for Change <span className="text-red-400">*</span></label>
                  <textarea rows={3} value={scForm.reason} onChange={e => setScForm({...scForm, reason: e.target.value})}
                    placeholder="Provide a clear reason (e.g., class conflict, personal matter, approved shift swap)."
                    className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Supporting Attachment (optional)</label>
                  <label className="flex items-center gap-2 cursor-pointer px-3 py-2 border border-dashed border-slate-300 rounded-xl hover:border-indigo-400 transition text-sm text-slate-500">
                    <Paperclip size={14}/>
                    {scAttachment ? <span className="text-indigo-600 font-medium">{scAttachment.name}</span> : 'Attach PDF or image'}
                    <input type="file" accept="application/pdf,image/*" onChange={handleScFile} className="hidden" />
                    {scAttachment && <button type="button" onClick={() => setScAttachment(null)} className="ml-auto text-red-400"><X size={12}/></button>}
                  </label>
                </div>
                {scError && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{scError}</p>}
                {scSuccess && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">{scSuccess}</p>}
                <button type="submit" disabled={scLoading}
                  className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
                  <Send size={15}/> {scLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            </div>

            {/* History */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-bold text-slate-800 mb-4">Request History</h2>
              {scRequests.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-12">No schedule change requests yet.</p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {scRequests.map(r => (
                    <div key={r.id} className="border border-slate-100 rounded-xl p-4 text-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-slate-800">{r.affected_date}</p>
                          <p className="text-xs text-slate-500">Requested {r.request_date}</p>
                        </div>
                        {statusBadge(r.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-2">
                        <div className="bg-slate-50 p-2 rounded-lg"><p className="font-bold text-slate-400 uppercase text-[10px] mb-1">Current</p>{r.current_time_in} – {r.current_time_out}</div>
                        <div className="bg-indigo-50 p-2 rounded-lg"><p className="font-bold text-indigo-400 uppercase text-[10px] mb-1">Requested</p>{r.requested_time_in} – {r.requested_time_out}</div>
                      </div>
                      <p className="text-xs italic text-slate-500">"{r.reason}"</p>
                      {r.review_notes && <p className="text-xs mt-1 text-slate-600 bg-slate-50 rounded-lg p-2"><span className="font-bold">Review note:</span> {r.review_notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key="leave" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2"><CalendarDays size={16}/> Leave of Absence Request</h2>
              <form onSubmit={submitLeave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Employee Name</label>
                    <input type="text" value={profile?.name || ''} readOnly className={`${inputCls} bg-slate-50`} />
                  </div>
                  <div>
                    <label className={labelCls}>Date of Request</label>
                    <input type="text" value={today} readOnly className={`${inputCls} bg-slate-50`} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Leave Type</label>
                  <select value={loaForm.leave_type} onChange={e => setLoaForm({...loaForm, leave_type: e.target.value})} className={inputCls}>
                    {LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Start Date <span className="text-red-400">*</span></label>
                    <input type="date" value={loaForm.start_date} onChange={e => setLoaForm({...loaForm, start_date: e.target.value})} className={inputCls} required />
                  </div>
                  <div>
                    <label className={labelCls}>End Date <span className="text-red-400">*</span></label>
                    <input type="date" value={loaForm.end_date} onChange={e => setLoaForm({...loaForm, end_date: e.target.value})} className={inputCls} required />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Reason <span className="text-red-400">*</span></label>
                  <textarea rows={3} value={loaForm.reason} onChange={e => setLoaForm({...loaForm, reason: e.target.value})}
                    placeholder="Briefly explain the reason for your leave."
                    className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Attachment {loaForm.leave_type === 'Sick Leave' && <span className="text-amber-500">(recommended for Sick Leave)</span>}</label>
                  <label className="flex items-center gap-2 cursor-pointer px-3 py-2 border border-dashed border-slate-300 rounded-xl hover:border-indigo-400 transition text-sm text-slate-500">
                    <Paperclip size={14}/>
                    {loaAttachment ? <span className="text-indigo-600 font-medium">{loaAttachment.name}</span> : 'Attach medical cert or proof'}
                    <input type="file" accept="application/pdf,image/*" onChange={handleLoaFile} className="hidden" />
                    {loaAttachment && <button type="button" onClick={() => setLoaAttachment(null)} className="ml-auto text-red-400"><X size={12}/></button>}
                  </label>
                </div>
                {loaError && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{loaError}</p>}
                {loaSuccess && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">{loaSuccess}</p>}
                <button type="submit" disabled={loaLoading}
                  className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
                  <Send size={15}/> {loaLoading ? 'Submitting...' : 'Submit Leave Request'}
                </button>
              </form>
            </div>

            {/* History */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-bold text-slate-800 mb-4">Leave History</h2>
              {loaRequests.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-12">No leave requests yet.</p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {loaRequests.map(r => (
                    <div key={r.id} className="border border-slate-100 rounded-xl p-4 text-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-slate-800">{r.leave_type}</p>
                          <p className="text-xs text-slate-500">{r.start_date} → {r.end_date}</p>
                        </div>
                        {statusBadge(r.status)}
                      </div>
                      <p className="text-xs italic text-slate-500">"{r.reason}"</p>
                      {r.review_notes && <p className="text-xs mt-1 text-slate-600 bg-slate-50 rounded-lg p-2"><span className="font-bold">Review note:</span> {r.review_notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

