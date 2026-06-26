import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/apiService';
import { CheckCircle, XCircle, Clock, CalendarDays, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const statusBadge = (status: string) => {
  if (status === 'approved') return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">✅ APPROVED</span>;
  if (status === 'rejected') return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-1 rounded-full">❌ REJECTED</span>;
  return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">🟡 PENDING</span>;
};

export default function AdminRequests() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<'schedule' | 'leave'>('schedule');
  const [scRequests, setScRequests] = useState<any[]>([]);
  const [loaRequests, setLoaRequests] = useState<any[]>([]);
  const [reviewId, setReviewId] = useState<number | null>(null);
  const [reviewType, setReviewType] = useState<'schedule' | 'leave'>('schedule');
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchData = async () => {
    const [sc, loa] = await Promise.all([
      api.getScheduleRequests(),
      api.getLeaveRequests(),
    ]);
    setScRequests(sc);
    setLoaRequests(loa);
  };

  useEffect(() => { fetchData(); }, []);

  const openReview = (id: number, type: 'schedule' | 'leave', action: 'approved' | 'rejected') => {
    setReviewId(id);
    setReviewType(type);
    setReviewAction(action);
    setReviewNotes('');
  };

  const submitReview = async () => {
    if (!reviewId) return;
    setSubmitting(true);
    const payload = {
      status: reviewAction,
      reviewed_by: profile?.uid,
      reviewed_by_name: profile?.name,
      review_notes: reviewNotes,
    };
    try {
      if (reviewType === 'schedule') {
        await api.updateScheduleRequest(reviewId, payload);
      } else {
        await api.updateLeaveRequest(reviewId, payload);
      }
      setReviewId(null);
      fetchData();
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = (list: any[]) => filterStatus === 'all' ? list : list.filter(r => r.status === filterStatus);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Requests Review</h1>
          <p className="text-slate-500 text-sm">Review and approve intern schedule or leave requests.</p>
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-4 py-2 outline-none bg-white focus:ring-2 focus:ring-indigo-100 w-fit">
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <button onClick={() => setTab('schedule')}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition ${tab === 'schedule' ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
          <span className="flex items-center gap-2">
            <Clock size={15}/> Schedule Requests
            {scRequests.filter(r => r.status === 'pending').length > 0 && (
              <span className="bg-amber-400 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {scRequests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </span>
        </button>
        <button onClick={() => setTab('leave')}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition ${tab === 'leave' ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
          <span className="flex items-center gap-2">
            <CalendarDays size={15}/> Leave Requests
            {loaRequests.filter(r => r.status === 'pending').length > 0 && (
              <span className="bg-amber-400 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {loaRequests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {tab === 'schedule' ? (
          <motion.div key="schedule" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {filtered(scRequests).length === 0 ? (
                <p className="text-center text-slate-400 py-16">No schedule change requests found.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3 text-left font-bold text-slate-500 text-xs uppercase">Intern</th>
                      <th className="px-5 py-3 text-left font-bold text-slate-500 text-xs uppercase">Affected Date</th>
                      <th className="px-5 py-3 text-left font-bold text-slate-500 text-xs uppercase">Current → Requested</th>
                      <th className="px-5 py-3 text-left font-bold text-slate-500 text-xs uppercase">Reason</th>
                      <th className="px-5 py-3 text-left font-bold text-slate-500 text-xs uppercase">Status</th>
                      <th className="px-5 py-3 text-left font-bold text-slate-500 text-xs uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered(scRequests).map(r => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-semibold text-slate-800">{r.user_name}</p>
                          <p className="text-xs text-slate-400">{r.request_date}</p>
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-700">{r.affected_date}</td>
                        <td className="px-5 py-3 text-xs">
                          <p className="text-slate-500">{r.current_time_in} – {r.current_time_out}</p>
                          <p className="text-indigo-600 font-bold">→ {r.requested_time_in} – {r.requested_time_out}</p>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-500 max-w-[160px] truncate" title={r.reason}>{r.reason}</td>
                        <td className="px-5 py-3">{statusBadge(r.status)}</td>
                        <td className="px-5 py-3">
                          {r.status === 'pending' ? (
                            <div className="flex gap-2">
                              <button onClick={() => openReview(r.id, 'schedule', 'approved')}
                                className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition">
                                <CheckCircle size={13}/> Approve
                              </button>
                              <button onClick={() => openReview(r.id, 'schedule', 'rejected')}
                                className="flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition">
                                <XCircle size={13}/> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Reviewed by {r.reviewed_by_name || '—'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key="leave" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {filtered(loaRequests).length === 0 ? (
                <p className="text-center text-slate-400 py-16">No leave requests found.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3 text-left font-bold text-slate-500 text-xs uppercase">Intern</th>
                      <th className="px-5 py-3 text-left font-bold text-slate-500 text-xs uppercase">Leave Type</th>
                      <th className="px-5 py-3 text-left font-bold text-slate-500 text-xs uppercase">Dates</th>
                      <th className="px-5 py-3 text-left font-bold text-slate-500 text-xs uppercase">Reason</th>
                      <th className="px-5 py-3 text-left font-bold text-slate-500 text-xs uppercase">Status</th>
                      <th className="px-5 py-3 text-left font-bold text-slate-500 text-xs uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered(loaRequests).map(r => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-semibold text-slate-800">{r.user_name}</p>
                          <p className="text-xs text-slate-400">{r.request_date}</p>
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-700">{r.leave_type}</td>
                        <td className="px-5 py-3 text-xs text-slate-600">{r.start_date} → {r.end_date}</td>
                        <td className="px-5 py-3 text-xs text-slate-500 max-w-[160px] truncate" title={r.reason}>{r.reason}</td>
                        <td className="px-5 py-3">{statusBadge(r.status)}</td>
                        <td className="px-5 py-3">
                          {r.status === 'pending' ? (
                            <div className="flex gap-2">
                              <button onClick={() => openReview(r.id, 'leave', 'approved')}
                                className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition">
                                <CheckCircle size={13}/> Approve
                              </button>
                              <button onClick={() => openReview(r.id, 'leave', 'rejected')}
                                className="flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition">
                                <XCircle size={13}/> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Reviewed by {r.reviewed_by_name || '—'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">
                  {reviewAction === 'approved' ? '✅ Approve Request' : '❌ Reject Request'}
                </h3>
                <button onClick={() => setReviewId(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Review Notes (optional)</label>
                <textarea rows={3} value={reviewNotes} onChange={e => setReviewNotes(e.target.value)}
                  placeholder="Add notes or reason for this decision..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 text-sm" />
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={submitReview} disabled={submitting}
                  className={`flex-1 font-bold py-2.5 rounded-xl text-white transition disabled:opacity-50 ${reviewAction === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-500 hover:bg-red-600'}`}>
                  {submitting ? 'Saving...' : (reviewAction === 'approved' ? 'Confirm Approval' : 'Confirm Rejection')}
                </button>
                <button onClick={() => setReviewId(null)}
                  className="flex-1 bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl hover:bg-slate-200 transition">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

