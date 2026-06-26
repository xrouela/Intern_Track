import React, { useState, useEffect } from 'react';
import { api } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Filter, AlertCircle, Edit2, Trash2, CheckCircle, Clock, Calendar, Users, X as XIcon, TriangleAlert, Play, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, differenceInSeconds } from 'date-fns';
import { parseUTCDate, formatDuration } from '../utils/dateUtils';
import { Link } from 'react-router-dom';
import ExportReportButton from '../components/ExportReportButton';

export default function Tasks() {
  const { profile, refreshProfile } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [interns, setInterns] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Active Timer State
  const [timerDisplay, setTimerDisplay] = useState('00:00:00');
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [now, setNow] = useState(new Date());

  // Global Time Ticker for live calculations
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Filter & Sort State
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [filterDueDate, setFilterDueDate] = useState('all');
  const [sortBy, setSortBy] = useState('due-date');
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    assigned_to_name: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    estimated_hours: 0,
    priority: 'medium',
    status: 'pending'
  });

  const fetchData = async () => {
    if (!profile) return;
    try {
      const [allTasks, allLogs, allUsers] = await Promise.all([
        api.getTasks(profile.role === 'intern' ? profile.uid : undefined),
        api.getLogs(profile.role === 'intern' ? profile.uid : undefined),
        profile.role !== 'intern' ? api.getUsers() : Promise.resolve([profile])
      ]);
      setTasks(allTasks);
      setLogs(allLogs);
      setInterns(allUsers.filter((u: any) => u.role === 'intern'));
    } catch (err) {
      console.error('Failed to fetch task data:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [profile]);

  // Timer Effect
  useEffect(() => {
    if (!profile?.active_task) {
      setTimerDisplay('00:00:00');
      setSessionSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      const startTime = profile.active_task?.start_time;
      if (!startTime) return;

      const startDate = parseUTCDate(startTime);
      const diffSeconds = differenceInSeconds(new Date(), startDate);
      setSessionSeconds(diffSeconds);
      
      setTimerDisplay(formatDuration(diffSeconds));
    }, 1000);

    return () => clearInterval(interval);
  }, [profile?.active_task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const assignedUser = interns.find(i => (i.uid || i.id) === formData.assigned_to);
    const data = {
      ...formData,
      assigned_to_name: assignedUser?.name || 'Unknown',
    };

    try {
      if (editingTask) {
        await api.updateTask(editingTask.id, data);
      } else {
        await api.createTask(data);
      }
      setIsModalOpen(false);
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        assigned_to: '',
        assigned_to_name: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(new Date(), 'yyyy-MM-dd'),
        estimated_hours: 0,
        priority: 'medium',
        status: 'pending'
      });
      fetchData();
    } catch (err) {
      console.error('Failed to submit task:', err);
    }
  };

  const handleUpdateStatus = async (taskId: string | number, newStatus: string) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      fetchData();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handlePlayTask = async (task: any) => {
    if (!profile) return;
    if (profile.active_task) {
      alert(`You are already working on: ${profile.active_task.task_title}`);
      return;
    }

    try {
      const activeTaskData = {
        task_id: task.id,
        task_title: task.title,
        start_time: new Date().toISOString()
      };
      
      await api.saveUser({ 
        ...profile, 
        active_task: JSON.stringify(activeTaskData) 
      });

      if (task.status === 'pending') {
        await api.updateTask(task.id, { status: 'in-progress' });
      }
      
      await refreshProfile();
      fetchData();
    } catch (err) {
      console.error('Failed to play task:', err);
    }
  };

  const handleStopTask = async () => {
    if (!profile?.active_task) return;
    
    // Parse if it's a string from SQL
    const activeTask = typeof profile.active_task === 'string' 
      ? JSON.parse(profile.active_task) 
      : profile.active_task;

    const { task_id, task_title, start_time } = activeTask;
    const startTimeDate = parseUTCDate(start_time);
    const endTime = new Date();
    
    const diffSeconds = differenceInSeconds(endTime, startTimeDate);
    const renderedHours = diffSeconds / 3600;

    if (diffSeconds < 60) {
      if (!confirm('This session was less than a minute. Log it anyway?')) {
        await api.saveUser({ ...profile, active_task: null });
        await refreshProfile();
        return;
      }
    }

    try {
      // 1. Create time log
      await api.createLog({
        user_id: profile.uid,
        user_name: profile.name,
        task_id: task_id,
        task_name: task_title,
        date: format(startTimeDate, 'yyyy-MM-dd'),
        start_time: format(startTimeDate, 'HH:mm'),
        end_time: format(endTime, 'HH:mm'),
        rendered_hours: parseFloat(renderedHours.toFixed(2)),
        status: 'pending',
        description: 'Auto-logged session'
      });

      // 2. Clear active task & mark completed
      await api.saveUser({ ...profile, active_task: null });
      await api.updateTask(task_id, { status: 'completed' });
      
      await refreshProfile();
      fetchData();
    } catch (err) {
      console.error('Failed to stop task:', err);
    }
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;
    // API lacks delete for tasks yet, normally we'd delete.
    // Let's assume user wants it "completed" or something if delete is missing,
    // or I should add a delete route.
    setIsDeleteModalOpen(false);
  };

  const getTaskHours = (taskId: string) => {
    return logs.filter(l => l.task_id === taskId).reduce((acc, l) => acc + (l.rendered_hours || 0), 0);
  };

  const priorityMap: Record<string, number> = { high: 3, medium: 2, low: 1 };

  const filteredTasks = tasks
    .filter(t => {
      // Search
      const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status
      const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
      
      // User
      const matchesUser = filterUser === 'all' || t.assigned_to === filterUser;
      
      // Due Date
      const today = format(new Date(), 'yyyy-MM-dd');
      let matchesDate = true;
      if (filterDueDate === 'today') matchesDate = t.end_date === today;
      if (filterDueDate === 'overdue') matchesDate = t.end_date < today && t.status !== 'completed';
      
      return matchesSearch && matchesStatus && matchesUser && matchesDate;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        return (priorityMap[b.priority] || 0) - (priorityMap[a.priority] || 0);
      }
      if (sortBy === 'due-date') {
        return a.end_date.localeCompare(b.end_date);
      }
      return 0;
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Task Management</h1>
          <p className="text-slate-500">Assign, track and manage internship tasks.</p>
        </div>
        <div className="flex gap-2">
          {profile?.active_task && (
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl text-indigo-700 shadow-sm"
            >
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-wider leading-none opacity-70">Active Task</span>
                <span className="text-sm font-bold flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
                  {timerDisplay}
                </span>
              </div>
              <button 
                onClick={handleStopTask}
                className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition"
                title="Stop Task"
              >
                <Square size={16} fill="white" />
              </button>
            </motion.div>
          )}
          <button
            onClick={() => { 
              setEditingTask(null); 
              setFormData({
                title: '',
                description: '',
                assigned_to: profile?.role === 'intern' ? profile.uid : '',
                assigned_to_name: profile?.role === 'intern' ? profile.name : '',
                start_date: format(new Date(), 'yyyy-MM-dd'),
                end_date: format(new Date(), 'yyyy-MM-dd'),
                estimated_hours: 0,
                priority: 'medium',
                status: 'pending'
              });
              setIsModalOpen(true); 
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition shadow-sm"
          >
            <Plus size={20} /> New Task
          </button>
          <ExportReportButton 
            filters={{
              month: 'all',
              year: 'all',
              userId: filterUser !== 'all' ? filterUser : undefined
            }}
          />
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition shadow-sm"
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded-xl shadow-sm">
            <Filter size={16} className="text-slate-400" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm font-medium text-slate-600 bg-transparent outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {(profile?.role === 'admin' || profile?.role === 'manager') && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded-xl shadow-sm">
              <Users size={16} className="text-slate-400" />
              <select 
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="text-sm font-medium text-slate-600 bg-transparent outline-none cursor-pointer"
              >
                <option value="all">All Interns</option>
                {interns.map(i => <option key={i.uid} value={i.uid}>{i.name}</option>)}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded-xl shadow-sm">
            <Calendar size={16} className="text-slate-400" />
            <select 
              value={filterDueDate}
              onChange={(e) => setFilterDueDate(e.target.value)}
              className="text-sm font-medium text-slate-600 bg-transparent outline-none cursor-pointer"
            >
              <option value="all">Any Date</option>
              <option value="today">Due Today</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-200 rounded-xl shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Sort:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm font-medium text-slate-600 bg-transparent outline-none cursor-pointer"
            >
              <option value="due-date">Due Date</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map((task) => {
          const loggedHours = getTaskHours(task.id);
          
          // Check if the actual assignee is playing this task
          const assignee = interns.find(i => i.uid === task.assigned_to);
          const isAssigneePlaying = assignee?.active_task?.task_id === task.id;
          
          let currentSessionHours = 0;
          if (isAssigneePlaying) {
             const startTime = assignee.active_task.start_time;
             const startDate = parseUTCDate(startTime);
             currentSessionHours = (now.getTime() - startDate.getTime()) / (1000 * 3600);
          }

          const renderedHours = loggedHours + currentSessionHours;
          const isPlaying = profile?.active_task?.task_id === task.id;
          
          const progress = Math.min((renderedHours / task.estimated_hours) * 100, 100);
          const isOverworked = renderedHours > task.estimated_hours;

          return (
            <motion.div
              layout
              key={task.id}
              className={`bg-white rounded-2xl border ${isAssigneePlaying ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-indigo-100' : 'border-slate-100 shadow-sm'} p-6 flex flex-col gap-4 hover:shadow-md transition-all relative overflow-hidden`}
            >
              {isOverworked && <div className="absolute top-0 right-0 w-16 h-16 bg-red-500 transform rotate-45 translate-x-10 -translate-y-10" />}

              <div className="flex justify-between items-start">
                <div className="flex gap-2 items-center">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    task.priority === 'high' ? 'bg-red-100 text-red-600' : 
                    task.priority === 'medium' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {task.priority}
                  </span>
                  {isOverworked && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-red-500"
                      title={`Warning: Rendered hours (${renderedHours.toFixed(1)}h) exceed estimate (${task.estimated_hours}h) by ${(renderedHours - task.estimated_hours).toFixed(1)}h`}
                    >
                      <TriangleAlert size={14} />
                    </motion.div>
                  )}
                  {isAssigneePlaying && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-600 rounded text-[10px] font-bold animate-pulse">
                      <Play size={8} fill="currentColor" /> LIVE
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                    {profile?.role === 'intern' && task.status !== 'completed' && (
                       <button 
                        onClick={() => isPlaying ? handleStopTask() : handlePlayTask(task)}
                        className={`p-2 rounded-xl transition-all ${
                          isPlaying 
                            ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                        }`}
                        title={isPlaying ? 'Stop Timer' : 'Play Task'}
                      >
                        {isPlaying ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                      </button>
                    )}
                    {(profile?.role === 'admin' || profile?.role === 'manager' || profile?.uid === task.assigned_to) && task.status !== 'completed' && (
                      <>
                        <button onClick={() => { setEditingTask(task); setFormData(task); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600"><Edit2 size={16}/></button>
                        <button onClick={() => { setTaskToDelete(task); setIsDeleteModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
                      </>
                    )}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 line-clamp-1">{task.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mt-1">{task.description}</p>
              </div>

              <div className="space-y-3 mt-2">
                <div className="flex justify-between text-xs font-medium text-slate-500">
                  <span>Progress ({renderedHours.toFixed(1)} / {task.estimated_hours}h)</span>
                  <span className={isOverworked ? 'text-red-600 font-bold' : ''}>{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className={`h-full ${isOverworked ? 'bg-red-500' : 'bg-indigo-600'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mt-2">
                <div className="flex items-center gap-1.5">
                  <Users size={14} /> {task.assigned_to_name}
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} /> Due {task.end_date}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 mt-auto flex justify-between items-center gap-2">
                <select 
                  value={task.status}
                  onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                  disabled={profile?.role === 'intern' && isPlaying}
                  className={`text-xs font-bold py-1.5 px-3 rounded-lg border-none focus:ring-2 focus:ring-offset-1 outline-none appearance-none cursor-pointer ${
                    task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    task.status === 'in-progress' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                  } ${profile?.role === 'intern' && isPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                
                {task.status === 'completed' && <CheckCircle size={18} className="text-emerald-500" />}
                {task.status === 'in-progress' && <Clock size={18} className={`${isAssigneePlaying ? 'text-indigo-600 animate-spin' : 'text-indigo-500 animate-pulse'}`} />}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-xl rounded-2xl shadow-xl p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><XIcon size={24} /></button>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assigned To</label>
                  {profile?.role === 'intern' ? (
                    <div className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium">
                      {profile.name}
                    </div>
                  ) : (
                    <select
                      required
                      value={formData.assigned_to}
                      onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                    >
                      <option value="">Select Intern</option>
                      {interns.map(i => <option key={i.uid} value={i.uid}>{i.name}</option>)}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.5"
                    value={formData.estimated_hours}
                    onChange={(e) => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="md:col-span-2 mt-4 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition"
                  >
                    {editingTask ? 'Save Changes' : 'Create Task'}
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
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && taskToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-8"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Delete Task?</h2>
                <p className="text-slate-500 text-sm mb-6">
                  Are you sure you want to delete <span className="font-bold text-slate-700">"{taskToDelete.title}"</span>? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDelete}
                    className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => { setIsDeleteModalOpen(false); setTaskToDelete(null); }}
                    className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


