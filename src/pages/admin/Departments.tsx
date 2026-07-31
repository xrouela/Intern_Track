import { useEffect, useState } from 'react';
import { Building2, Edit2, Plus, Trash2, X } from 'lucide-react';
import { api } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';

export default function Departments() {
  const { profile } = useAuth();
  const [departments, setDepartments] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const load = () => api.getDepartments().then(setDepartments).catch(() => setError('Could not load departments.'));
  useEffect(() => { load(); }, []);
  const open = (department?: any) => { setEditing(department || {}); setName(department?.name || ''); setDescription(department?.description || ''); setError(''); };
  const save = async (e: React.FormEvent) => { e.preventDefault(); if (!profile) return; try { await api.saveDepartment({ ...editing, name, description }, profile.uid); setEditing(null); load(); } catch (err: any) { setError(err.message); } };
  const remove = async (department: any) => { if (!profile || !confirm(`Delete ${department.name}? This is only possible after every user has been reassigned.`)) return; try { await api.deleteDepartment(department.id, profile.uid); load(); } catch (err: any) { alert(err.message); } };
  return <div className="space-y-6">
    <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-slate-900">Departments</h1><p className="text-sm text-slate-500">Organize members into managed departments.</p></div><button onClick={() => open()} className="flex gap-2 items-center bg-primary text-white px-4 py-2.5 rounded-xl font-bold"><Plus size={18}/> Add Department</button></div>
    <div className="bg-white rounded-2xl border border-slate-100 divide-y">{departments.map(d => <div key={d.id} className="p-5 flex items-center gap-4"><div className="p-3 bg-indigo-50 rounded-xl text-primary"><Building2 size={20}/></div><div className="flex-1"><p className="font-bold text-slate-800">{d.name}</p><p className="text-sm text-slate-500">{d.description || 'No description'}</p></div><span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">{d.user_count} assigned</span><button onClick={() => open(d)} className="p-2 text-slate-400 hover:text-primary"><Edit2 size={17}/></button><button onClick={() => remove(d)} disabled={d.user_count > 0} title={d.user_count > 0 ? 'Reassign users before deleting' : 'Delete department'} className="p-2 text-slate-400 hover:text-red-600 disabled:opacity-30"><Trash2 size={17}/></button></div>)}{!departments.length && <p className="p-10 text-center text-slate-400">No departments yet.</p>}</div>
    {editing && <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-slate-900/40"><form onSubmit={save} className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 shadow-xl"><div className="flex justify-between"><h2 className="font-bold text-lg">{editing.id ? 'Edit Department' : 'New Department'}</h2><button type="button" onClick={() => setEditing(null)}><X/></button></div>{error && <p className="text-sm text-red-600">{error}</p>}<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Department name" className="w-full p-3 border rounded-xl"/><textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description (optional)" className="w-full p-3 border rounded-xl"/><button className="w-full bg-primary text-white p-3 rounded-xl font-bold">Save Department</button></form></div>}
  </div>;
}
