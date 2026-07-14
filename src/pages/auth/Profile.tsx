import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  User, CheckSquare, Clock, Edit2, X, Save, Lock, Eye, EyeOff, 
  CheckCircle2, AlertCircle, MonitorSmartphone, 
  FileText, CheckCircle, Smartphone, MapPin, 
  FileCheck2, Check, UserCircle, Settings, Mail, Calendar, KeyRound, Clock4, Award, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../services/apiService';
import { format } from 'date-fns';

export default function Profile() {
  const { profile, refreshProfile } = useAuth();
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0 });
  const [totalHours, setTotalHours] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  
  // Edited values
  const [editedName, setEditedName] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [editedSchool, setEditedSchool] = useState('');
  const [editedProgram, setEditedProgram] = useState('');
  const [editedYear, setEditedYear] = useState('');
  const [editedEmName, setEditedEmName] = useState('');
  const [editedEmRelation, setEditedEmRelation] = useState('');
  const [editedEmPhone, setEditedEmPhone] = useState('');
  const [editedEmEmail, setEditedEmEmail] = useState('');
  const [editedEmLocation, setEditedEmLocation] = useState('');
  const [editedSkills, setEditedSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  // Change password state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        await api.saveUser({
          ...profile,
          photoURL: base64String
        });
        await refreshProfile();
      } catch (err) {
        console.error('Failed to upload image:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (profile) {
      setEditedName(profile.name || '');
      setEditedSchool(profile.school || '');
      setEditedProgram(profile.program || '');
      setEditedYear(profile.year_level || '');
      setEditedEmName(profile.emergency_contact_name || '');
      setEditedEmRelation(profile.emergency_contact_relation || '');
      setEditedEmPhone(profile.emergency_contact_phone || '');
      setEditedEmEmail(profile.emergency_contact_email || '');
      setEditedEmLocation(profile.emergency_contact_location || '');
      try {
        setEditedSkills(typeof profile.skills === 'string' ? JSON.parse(profile.skills) : (profile.skills || ['HTML', 'CSS', 'JavaScript']));
      } catch (e) {
        setEditedSkills(['HTML', 'CSS', 'JavaScript']);
      }
    }
  }, [profile]);

  const handleUpdateProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!profile) return;
    try {
      await api.saveUser({
        ...profile,
        name: editedName,
        school: editedSchool,
        program: editedProgram,
        year_level: editedYear,
        emergency_contact_name: editedEmName,
        emergency_contact_relation: editedEmRelation,
        emergency_contact_phone: editedEmPhone,
        emergency_contact_email: editedEmEmail,
        emergency_contact_location: editedEmLocation,
        skills: editedSkills
      });
      await refreshProfile();
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    if (newPw.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('New passwords do not match.');
      return;
    }
    if (!profile) return;

    setPwLoading(true);
    try {
      await api.changePassword(profile.uid, currentPw, newPw);
      setPwSuccess(true);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setTimeout(() => {
        setIsChangingPassword(false);
        setPwSuccess(false);
      }, 2000);
      await refreshProfile();
    } catch (err: any) {
      setPwError(err.message || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  const fetchData = async () => {
    if (!profile) return;
    try {
      const [tasks, logs, shifts] = await Promise.all([
        api.getTasks(profile.uid),
        api.getLogs(profile.uid),
        api.getShifts(profile.uid)
      ]);

      setTaskStats({
        total: tasks.length,
        completed: tasks.filter((t: any) => t.status === 'completed').length
      });

      const taskHours = logs.reduce((acc: number, log: any) => acc + (log.rendered_hours || 0), 0);
      const shiftHours = shifts.reduce((acc: number, shift: any) => acc + (shift.total_hours || 0), 0);
      setTotalHours(taskHours + shiftHours);
    } catch (err) {
      console.error('Failed to fetch profile stats:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [profile]);

  const reqHours = profile?.required_hours || 0;
  const remHours = Math.max(reqHours - totalHours, 0);
  const progressPercent = reqHours > 0 ? Math.min(Math.round((totalHours / reqHours) * 100), 100) : 100;
  
  const mockDocs: any[] = [];

  const getDocStatusColor = (status: string) => status === 'Verified' ? 'text-emerald-500 bg-emerald-50' : 'text-blue-500 bg-blue-50';

  return (
    <div className="w-full h-full p-4 lg:p-8 overflow-y-auto">
      {/* Top Actions */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-slate-800 invisible">Profile</h1> {/* For alignment */}
        <div className="ml-auto flex gap-3">
          <button 
            onClick={() => setIsChangingPassword(true)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-primary font-bold rounded-xl bg-white hover:bg-slate-50 transition shadow-sm text-sm"
          >
            <Lock size={16} /> Change Password
          </button>
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl bg-white hover:bg-slate-50 transition shadow-sm text-sm"
          >
            <Edit2 size={16} /> Edit Profile
          </button>
          <button 
            onClick={() => handleUpdateProfile()}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-sm text-sm shadow-primary/20"
          >
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>

      {/* Main Profile Banner */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 flex items-center shadow-sm border border-slate-100 mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
        <div className="flex items-center gap-6 relative z-10 w-full">
          <div className="relative w-28 h-28 shrink-0">
            <div className="w-full h-full rounded-full overflow-hidden bg-primary/10 border-4 border-white shadow-md">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                   <User size={48} className="text-primary" />
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm text-primary hover:bg-slate-50 transition"
              title="Change Profile Picture"
            >
              <Edit2 size={14} />
            </button>
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">{profile?.name}</h2>
            <p className="text-slate-500 font-medium mb-3">{profile?.email}</p>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold border border-indigo-100">
                <MonitorSmartphone size={14} />
                {profile?.department || 'Information Technology'}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100">
                <CheckCircle size={14} />
                Active {profile?.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Task Stats */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-primary flex items-center justify-center">
              <CheckSquare size={24} />
            </div>
            <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-md">
              <span className="text-[10px]">↗</span> 12%
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-slate-800 mb-1">Tasks Completed</p>
            <h3 className="text-3xl font-black text-slate-900">{taskStats.completed}</h3>
            <p className="text-[10px] text-slate-500">Completed Assignments</p>
          </div>
          <div className="absolute -bottom-4 -right-4 w-32 h-16 opacity-10 bg-primary rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* Hours Logged */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-md">
              <span className="text-[10px]">↗</span> 8%
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-slate-800 mb-1">Hours Logged</p>
            <h3 className="text-3xl font-black text-slate-900">{Math.floor(totalHours)} hrs</h3>
            <p className="text-[10px] text-slate-500">Hours Rendered</p>
          </div>
          <div className="absolute -bottom-4 -right-4 w-32 h-16 opacity-10 bg-blue-500 rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* Required Hours */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center">
              <FileText size={24} />
            </div>
            <div className="flex items-center gap-1 text-slate-400 text-xs font-bold bg-slate-50 px-2 py-1 rounded-md">
              <span className="text-[10px]">—</span> 0%
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-slate-800 mb-1">Required Hours</p>
            <h3 className="text-3xl font-black text-slate-900">{reqHours} hrs</h3>
            <p className="text-[10px] text-slate-500">Program Requirement</p>
          </div>
          <div className="absolute -bottom-4 -right-4 w-32 h-16 opacity-10 bg-purple-500 rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* Hours Left */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-2">
              <Clock4 size={24} />
            </div>
            <p className="text-xs font-bold text-slate-800 mb-1">Hours Left</p>
            <h3 className="text-3xl font-black text-slate-900">{Math.floor(remHours)} hrs</h3>
            <p className="text-[10px] text-slate-500">Remaining Hours</p>
          </div>
          <div className="relative w-20 h-20 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <path
                className="text-slate-100"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-primary"
                strokeWidth="3"
                strokeDasharray={`${progressPercent}, 100`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-black text-slate-700">{progressPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Personal Information */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <UserCircle size={20} className="text-slate-400" />
              Personal Information
            </h3>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-slate-50 border-dashed">
                <span className="flex items-center gap-2 text-slate-500"><User size={16} /> Full Name</span>
                <span className="font-bold text-slate-800 text-right">{profile?.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50 border-dashed">
                <span className="flex items-center gap-2 text-slate-500"><Mail size={16} /> Email</span>
                <span className="font-bold text-slate-800 text-right">{profile?.email}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50 border-dashed">
                <span className="flex items-center gap-2 text-slate-500"><UserCircle size={16} /> Username</span>
                <span className="font-bold text-slate-800 text-right">{profile?.username || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50 border-dashed">
                <span className="flex items-center gap-2 text-slate-500"><MonitorSmartphone size={16} /> Department</span>
                <span className="font-bold text-slate-800 text-right">{profile?.department || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50 border-dashed">
                <span className="flex items-center gap-2 text-slate-500"><CheckCircle size={16} /> School</span>
                <span className="font-bold text-slate-800 text-right">{profile?.school || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50 border-dashed">
                <span className="flex items-center gap-2 text-slate-500"><FileText size={16} /> Program</span>
                <span className="font-bold text-slate-800 text-right max-w-[200px] truncate">{profile?.program || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50 border-dashed">
                <span className="flex items-center gap-2 text-slate-500"><Calendar size={16} /> Year Level</span>
                <span className="font-bold text-slate-800 text-right">{profile?.year_level || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="flex items-center gap-2 text-slate-500"><FileText size={16} /> Student ID</span>
                <span className="font-bold text-slate-800 text-right">{profile?.employee_id || 'N/A'}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 border border-primary/20 text-primary font-bold rounded-xl hover:bg-indigo-50 transition text-sm"
              >
                <Edit2 size={14} /> Edit Information
              </button>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <FileCheck2 size={20} className="text-slate-400" /> Documents
              </h3>
              <button className="text-xs font-bold text-primary hover:underline">View All</button>
            </div>
            
            <div className="space-y-4">
              {mockDocs.map((doc, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <FileText size={32} className="text-red-400" strokeWidth={1.5} />
                    <div>
                      <p className="text-xs font-bold text-slate-800">{doc.name}</p>
                      <p className="text-[10px] text-slate-400">Uploaded on {doc.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${getDocStatusColor(doc.status)}`}>
                      {doc.status}
                    </span>
                    <button className="text-slate-400 hover:text-slate-600">
                      <span className="flex flex-col gap-0.5">
                        <span className="w-1 h-1 bg-current rounded-full"></span>
                        <span className="w-1 h-1 bg-current rounded-full"></span>
                        <span className="w-1 h-1 bg-current rounded-full"></span>
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Account Security */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <Shield size={20} className="text-slate-400" /> Account Security
            </h3>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-slate-50 border-dashed">
                <span className="flex items-center gap-2 text-slate-500"><KeyRound size={16} /> Password Status</span>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                  Strong Password
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50 border-dashed">
                <span className="flex items-center gap-2 text-slate-500"><Clock size={16} /> Last Password Change</span>
                <span className="font-bold text-slate-800">N/A</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50 border-dashed">
                <span className="flex items-center gap-2 text-slate-500"><Shield size={16} /> Two-Factor Authentication</span>
                <div className="w-10 h-5 bg-primary rounded-full relative cursor-pointer shadow-inner">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50 border-dashed">
                <span className="flex items-center gap-2 text-slate-500"><Clock4 size={16} /> Last Login</span>
                <span className="font-bold text-slate-800">N/A</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50 border-dashed">
                <span className="flex items-center gap-2 text-slate-500"><User size={16} /> Account Status</span>
                <span className="flex items-center gap-1.5 font-bold text-slate-800">
                   <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="flex items-center gap-2 text-slate-500"><CheckCircle2 size={16} /> Role Permissions</span>
                <span className="font-bold text-slate-800 capitalize">{profile?.role}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setIsChangingPassword(true)}
                className="flex items-center gap-2 px-4 py-2 border border-primary/20 text-primary font-bold rounded-xl hover:bg-indigo-50 transition text-sm"
              >
                <Shield size={14} /> Manage Security
              </button>
            </div>
          </div>

          {/* Internship Timeline */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <Calendar size={20} className="text-slate-400" /> Internship Timeline
            </h3>
            
            <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm mb-8">
               <div className="flex justify-between items-center py-2 border-b border-slate-50 border-dashed">
                 <span className="flex items-center gap-2 text-slate-500"><Calendar size={14} /> Start Date</span>
                 <span className="font-bold text-slate-800">{profile?.start_date || 'N/A'}</span>
               </div>
               <div className="flex justify-between items-center py-2 border-b border-slate-50 border-dashed">
                 <span className="flex items-center gap-2 text-slate-500"><Clock size={14} /> Required Hours</span>
                 <span className="font-bold text-slate-800">{reqHours} hrs</span>
               </div>
               <div className="flex justify-between items-center py-2 border-b border-slate-50 border-dashed">
                 <span className="flex items-center gap-2 text-slate-500"><Calendar size={14} /> End Date</span>
                 <span className="font-bold text-slate-800">{profile?.end_date || 'N/A'}</span>
               </div>
               <div className="flex justify-between items-center py-2 border-b border-slate-50 border-dashed">
                 <span className="flex items-center gap-2 text-slate-500"><CheckSquare size={14} /> Completed Hours</span>
                 <span className="font-bold text-slate-800">{Math.floor(totalHours)} hrs</span>
               </div>
               <div className="flex justify-between items-start py-2 border-b border-slate-50 border-dashed">
                 <span className="flex items-center gap-2 text-slate-500"><Clock4 size={14} /> Working Schedule</span>
                 <div className="text-right">
                   <span className="font-bold text-slate-800 block">N/A</span>
                   <span className="text-[10px] text-slate-500 font-bold">{profile?.schedule_start || 'N/A'} - {profile?.schedule_end || 'N/A'}</span>
                 </div>
               </div>
               <div className="flex justify-between items-center py-2 border-b border-slate-50 border-dashed">
                 <span className="flex items-center gap-2 text-slate-500"><Clock4 size={14} /> Remaining Hours</span>
                 <span className="font-bold text-slate-800">{Math.floor(remHours)} hrs</span>
               </div>
               <div className="flex justify-between items-center py-2 col-start-2">
                 <span className="flex items-center gap-2 text-slate-500"><Award size={14} /> Internship Rank</span>
                 <span className="font-bold text-slate-800">N/A</span>
               </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                 <span className="text-xs font-bold text-slate-800">Overall Progress</span>
                 <span className="text-xs font-bold text-slate-800">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full mb-6 overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
              </div>
              
              <div className="flex justify-between relative text-[10px] text-slate-500 text-center px-2">
                <div className="absolute top-2 left-4 right-4 h-0.5 bg-slate-100 -z-10"></div>
                <div className="flex flex-col items-center gap-2 bg-white px-2">
                  <div className="w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center shadow-sm shadow-primary/20"><Check size={10} /></div>
                  <div><p className="font-bold text-slate-800">Orientation</p></div>
                </div>
                <div className="flex flex-col items-center gap-2 bg-white px-2">
                  <div className="w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center shadow-sm shadow-primary/20"><Check size={10} /></div>
                  <div><p className="font-bold text-slate-800">Onboarding</p></div>
                </div>
                <div className="flex flex-col items-center gap-2 bg-white px-2">
                  <div className="w-4 h-4 bg-white border-2 border-primary rounded-full shadow-sm"></div>
                  <div><p className="font-bold text-slate-800">In Progress</p></div>
                </div>
                <div className="flex flex-col items-center gap-2 bg-white px-2">
                  <div className="w-4 h-4 bg-white border-2 border-slate-200 rounded-full"></div>
                  <div><p className="font-bold text-slate-400">Completion</p></div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Emergency Contact */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 h-full relative">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <MapPin size={20} className="text-slate-400" /> Emergency Contact
                </h3>
                <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-primary hover:underline">Edit</button>
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 overflow-hidden shrink-0 flex items-center justify-center">
                   <UserCircle size={40} className="text-primary/50" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {profile?.emergency_contact_name || 'N/A'} 
                    <span className="text-[9px] uppercase tracking-wider bg-indigo-50 text-primary px-1.5 py-0.5 rounded-md font-bold">{profile?.emergency_contact_relation || 'N/A'}</span>
                  </h4>
                  <div className="mt-2 space-y-1 text-xs text-slate-500">
                    <p className="flex items-center gap-2"><Smartphone size={12} /> {profile?.emergency_contact_phone || 'N/A'}</p>
                    <p className="flex items-center gap-2"><Mail size={12} /> {profile?.emergency_contact_email || 'N/A'}</p>
                    <p className="flex items-center gap-2"><MapPin size={12} /> {profile?.emergency_contact_location || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 h-full relative">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <CheckCircle size={20} className="text-slate-400" /> Skills
                </h3>
                <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-primary hover:underline">Edit</button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {editedSkills.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-slate-50 text-primary text-[11px] font-bold rounded-lg border border-slate-100">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-lg h-full shadow-2xl p-8 relative flex flex-col overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100 shrink-0">
                <h2 className="text-2xl font-black text-slate-900">Edit Information</h2>
                <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full"><X size={20} /></button>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-8 flex-1 flex flex-col">
                
                <div className="flex-1 space-y-8">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider text-primary">Personal Details</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Full Name</label>
                        <input
                          required
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition text-sm font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">School</label>
                        <input
                          type="text"
                          value={editedSchool}
                          onChange={(e) => setEditedSchool(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition text-sm font-semibold"
                          placeholder="e.g. City Polytechnic University"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Program / Degree</label>
                        <input
                          type="text"
                          value={editedProgram}
                          onChange={(e) => setEditedProgram(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition text-sm font-semibold"
                          placeholder="BS Information Technology"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Year Level</label>
                        <input
                          type="text"
                          value={editedYear}
                          onChange={(e) => setEditedYear(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition text-sm font-semibold"
                          placeholder="3rd Year"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider text-primary">Emergency Contact</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5">Name</label>
                            <input
                              type="text"
                              value={editedEmName}
                              onChange={(e) => setEditedEmName(e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition text-sm font-semibold"
                              placeholder="Jane Doe"
                            />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5">Relation</label>
                            <input
                              type="text"
                              value={editedEmRelation}
                              onChange={(e) => setEditedEmRelation(e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition text-sm font-semibold"
                              placeholder="Mother"
                            />
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5">Phone</label>
                            <input
                              type="text"
                              value={editedEmPhone}
                              onChange={(e) => setEditedEmPhone(e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition text-sm font-semibold"
                              placeholder="+63..."
                            />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5">Email</label>
                            <input
                              type="email"
                              value={editedEmEmail}
                              onChange={(e) => setEditedEmEmail(e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition text-sm font-semibold"
                              placeholder="jane@email.com"
                            />
                         </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Location</label>
                        <input
                          type="text"
                          value={editedEmLocation}
                          onChange={(e) => setEditedEmLocation(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition text-sm font-semibold"
                          placeholder="City, Country"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                   <h4 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider text-primary">Skills</h4>
                   <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && skillInput.trim()) {
                            e.preventDefault();
                            if (editedSkills.length >= 10) return;
                            if (!editedSkills.includes(skillInput.trim())) {
                              setEditedSkills([...editedSkills, skillInput.trim()]);
                            }
                            setSkillInput('');
                          }
                        }}
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition text-sm font-semibold"
                        placeholder={editedSkills.length >= 10 ? 'Maximum 10 skills reached' : 'Type a skill and press Enter...'}
                      />
                      <button 
                        type="button"
                        onClick={() => {
                           if (editedSkills.length >= 10) return;
                           if (skillInput.trim() && !editedSkills.includes(skillInput.trim())) {
                              setEditedSkills([...editedSkills, skillInput.trim()]);
                              setSkillInput('');
                           }
                        }}
                        disabled={editedSkills.length >= 10}
                        className={`px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm ${editedSkills.length >= 10 ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-primary text-white'}`}
                      >
                         Add
                      </button>
                   </div>
                   <div className="flex flex-wrap gap-2">
                     {editedSkills.map((skill, idx) => (
                       <span key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200">
                         {skill}
                         <button type="button" onClick={() => setEditedSkills(editedSkills.filter(s => s !== skill))} className="text-slate-400 hover:text-red-500">
                            <X size={12} />
                         </button>
                       </span>
                     ))}
                     {editedSkills.length === 0 && <span className="text-xs text-slate-400 italic">No skills added yet.</span>}
                   </div>
                   <p className="text-[11px] text-slate-400 mt-3">You can store up to 10 skills.</p>
                </div>

                <div className="pt-6 mt-auto shrink-0 border-t border-slate-100 flex gap-4">
                   <button
                    type="submit"
                    className="flex-1 bg-primary text-white font-black text-sm py-4 rounded-xl hover:bg-blue-700 transition shadow-md shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    <Save size={18} /> Save Changes
                  </button>
                   <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-slate-50 border border-slate-200 text-slate-600 font-black text-sm py-4 rounded-xl hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {isChangingPassword && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-md h-full shadow-2xl p-8 relative flex flex-col overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100 shrink-0">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><Lock size={20} className="text-primary"/> Security</h2>
                <button onClick={() => setIsChangingPassword(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full"><X size={16} /></button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-6 flex-1 flex flex-col">
                <div className="flex-1 space-y-6">
                 <AnimatePresence>
                  {pwError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-600 text-sm overflow-hidden"
                    >
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <p className="text-xs font-bold">{pwError}</p>
                    </motion.div>
                  )}
                  {pwSuccess && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2 text-emerald-600 text-sm overflow-hidden"
                    >
                      <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                      <p className="text-xs font-bold">Password updated successfully!</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPw ? 'text' : 'password'}
                      value={currentPw}
                      onChange={(e) => { setCurrentPw(e.target.value); setPwError(null); setPwSuccess(false); }}
                      required
                      disabled={pwLoading}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none pr-10 text-sm font-semibold transition"
                      placeholder="Enter current password"
                    />
                    <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600">
                      {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPw}
                      onChange={(e) => { setNewPw(e.target.value); setPwError(null); setPwSuccess(false); }}
                      required
                      minLength={8}
                      disabled={pwLoading}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none pr-10 text-sm font-semibold transition"
                      placeholder="Minimum 8 characters"
                    />
                    <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600">
                      {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPw}
                    onChange={(e) => { setConfirmPw(e.target.value); setPwError(null); }}
                    required
                    minLength={8}
                    disabled={pwLoading}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none text-sm font-semibold transition"
                    placeholder="Re-enter new password"
                  />
                </div>

                </div>

                <div className="pt-6 mt-auto shrink-0 border-t border-slate-100 flex gap-4">
                  <button
                    type="submit"
                    disabled={pwLoading || newPw.length < 8 || newPw !== confirmPw}
                    className={`flex-1 flex items-center justify-center gap-2 font-black py-4 text-sm rounded-xl transition shadow-md shadow-primary/20 ${pwLoading || newPw.length < 8 || newPw !== confirmPw ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-primary text-white hover:bg-blue-700'}`}
                  >
                    {pwLoading ? 'Updating...' : 'Update Password'}
                  </button>
                   <button
                    type="button"
                    onClick={() => setIsChangingPassword(false)}
                    className="flex-1 bg-slate-50 border border-slate-200 text-slate-600 font-black text-sm py-4 rounded-xl hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
