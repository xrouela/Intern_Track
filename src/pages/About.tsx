import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

export default function About() {
  const { profile } = useAuth();
  const [category, setCategory] = useState<'bug' | 'feature' | null>(null);
  const [contact, setContact] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState<any[]>([]);

  const loadFeedback = () => {
    if (profile?.role === 'admin') api.getFeedback(profile.uid).then(setFeedback).catch(() => undefined);
  };
  useEffect(() => { loadFeedback(); }, [profile?.uid, profile?.role]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!category) return;
    try {
      await api.submitFeedback({ category, reporter_uid: profile?.uid, contact_details: contact, description });
      setContact(''); setDescription(''); setCategory(null);
      setMessage('Thank you. Your feedback was sent to the administrators.');
      loadFeedback();
    } catch (error: any) { setMessage(error.message); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <section className="min-h-[430px] bg-white rounded-2xl border border-slate-100 px-8 py-12 flex flex-col items-center text-center">
        <img src="/logo.png" alt="NexTrack logo" className="w-28 h-28 object-contain mb-8" />
        <h1 className="text-2xl font-semibold text-slate-800">NexTrack</h1>
        <p className="text-sm text-slate-500 mt-1">IT Intern Monitoring System</p>
        <div className="mt-9 space-y-2 text-sm text-slate-600">
          <p>Application developed by</p>
          <p className="font-medium text-slate-800">Maria Rouela Sestoso</p>
          <p className="pt-3">Copyright © 2026. All rights reserved.</p>
          <p className="italic">Version: 1.0.0</p>
        </div>
        <div className="mt-9 w-full max-w-lg grid grid-cols-3 gap-3 text-sm font-semibold text-slate-800">
          <button onClick={() => { setCategory('bug'); setMessage(''); }} className="py-2 hover:text-primary transition-colors">Report Bug</button>
          <button onClick={() => { setCategory('feature'); setMessage(''); }} className="py-2 hover:text-primary transition-colors">Suggest Feature</button>
          <Link to="/privacy" className="py-2 hover:text-primary transition-colors">Privacy Notice</Link>
        </div>
        {message && <p className="mt-4 text-sm text-emerald-600">{message}</p>}
      </section>

      {category && <section className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="font-semibold text-slate-800">{category === 'bug' ? 'Report a Bug' : 'Suggest a Feature'}</h2>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <input value={contact} onChange={(event) => setContact(event.target.value)} placeholder="Contact details (optional)" className="w-full p-3 border border-slate-200 rounded-lg" />
          <textarea required value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" className="w-full min-h-28 p-3 border border-slate-200 rounded-lg" />
          <div className="flex gap-3"><button className="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold">Submit</button><button type="button" onClick={() => setCategory(null)} className="px-5 py-2.5 text-slate-600">Cancel</button></div>
        </form>
      </section>}

      {profile?.role === 'admin' && <section className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="font-semibold text-slate-800 mb-4">Submitted feedback</h2>
        <div className="space-y-3">{feedback.map(item => <div key={item.id} className="border rounded-lg p-4 text-sm"><div className="flex justify-between"><span className="font-semibold capitalize">{item.category}</span><span className="text-slate-400">{new Date(item.created_at).toLocaleDateString()}</span></div><p className="mt-2">{item.description}</p><p className="mt-2 text-xs text-slate-500">{item.reporter_name || 'Anonymous'} · {item.reporter_role || 'Unknown role'}{item.contact_details ? ` · ${item.contact_details}` : ''}</p></div>)}{!feedback.length && <p className="text-sm text-slate-400">No feedback submitted.</p>}</div>
      </section>}
    </div>
  );
}
