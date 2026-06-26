import { useState, useEffect } from 'react';
import { api } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { calculateAttendance } from '../utils/attendanceUtils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { parseUTCDate, formatDuration } from '../utils/dateUtils';
import {
  Users,
  CheckCircle2,
  Clock,
  ListTodo,
  TriangleAlert,
  Play,
  Square,
  Timer,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, differenceInMinutes } from 'date-fns';

export default function Dashboard() {
  const { profile, refreshProfile } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [activeShift, setActiveShift] = useState<any>(null);
  const [allShifts, setAllShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [now, setNow] = useState(new Date());

  // ======================
  // Manila Time Formatter (Reusable)
  // ======================
  const formatManilaTime = (dateInput: Date | string | null | undefined) => {
    if (!dateInput) return '--:--';

    const date = typeof dateInput === 'string'
      ? parseUTCDate(dateInput)
      : dateInput;

    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  // Unified Real-Time Ticker (Updates once per second)
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    if (!profile) return;
    try {
      const [allTasks, allLogs, users] = await Promise.all([
        api.getTasks(profile.role === 'intern' ? profile.uid : undefined),
        api.getLogs(profile.role === 'intern' ? profile.uid : undefined),
        api.getUsers()
      ]);

      const parsedUsers = users.map((u: any) => ({
        ...u,
        active_task: typeof u.active_task === 'string' ? JSON.parse(u.active_task) : u.active_task
      }));

      setTasks(allTasks);
      setLogs(allLogs);
      setAllUsers(parsedUsers);

      if (profile.role === 'intern') {
        const shifts = await api.getShifts(profile.uid);
        setAllShifts(shifts);
        const active = shifts.find((s: any) => s.status === 'active');
        setActiveShift(active || null);
      } else {
        const shifts = await api.getShifts();
        setAllShifts(shifts);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [profile]);

  // PUT THIS in its place:
  const handleClockIn = async () => {
    if (!profile) return;

    const clockInTime = new Date(); // Capture exact moment

    let isLate = false;
    if (profile.schedule_start) {
      const [schedHours, schedMins] = profile.schedule_start.split(':').map(Number);
      const schedDate = new Date();
      schedDate.setHours(schedHours, schedMins, 0, 0);

      // 5-minute grace period
      if (clockInTime.getTime() > schedDate.getTime() + 5 * 60 * 1000) {
        isLate = true;
      }
    }

    try {
      // Optimistic UI update
      setActiveShift({
        clock_in: clockInTime.toISOString(),
        status: 'active',
        id: null,
      });

      const newShift = await api.createShift({
        user_id: profile.uid,
        user_name: profile.name,
        clock_in: clockInTime.toISOString(),
        status: 'active',
        is_late: isLate,
        total_hours: 0,
        overtime_hours: 0,
      });

      setActiveShift(newShift);
      // Refresh data to sync everything
      fetchData();
    } catch (err) {
      setActiveShift(null);
      console.error('Failed to clock in:', err);
    }
  };

  const handleClockOut = async () => {
    if (!activeShift?.id || !activeShift?.clock_in || !profile) return;

    try {
      const clockOutTime = new Date();
      const clockInTime = parseUTCDate(activeShift.clock_in); // ← Now correctly parsed

      const metrics = calculateAttendance(clockInTime, clockOutTime);

      let isUndertime = false;
      if (profile.schedule_end) {
        const [schedHours, schedMins] = profile.schedule_end.split(':').map(Number);
        const schedTime = new Date();
        schedTime.setHours(schedHours, schedMins, 0, 0);

        if (clockOutTime.getTime() < schedTime.getTime() - 5 * 60 * 1000) {
          isUndertime = true;
        }
      }

      await api.updateShift(activeShift.id, {
        clock_out: clockOutTime.toISOString(),
        status: 'completed',
        ...metrics,
        is_overtime: metrics.overtime_hours > 0,
        is_undertime: isUndertime,
      });

      setActiveShift(null);
      fetchData();
    } catch (err) {
      console.error('Failed to clock out:', err);
    }
  };
  // =============================
  // LIVE CALCULATIONS (On-the-fly)
  // =============================

  // 1. Current PST Time (12-hour format for the new design)
  const pstClock = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(now);

  // 2. Shift Elapsed Time (In Seconds for formatting, in Hours for stats)
  const shiftDiffSeconds = activeShift?.clock_in ? (now.getTime() - parseUTCDate(activeShift.clock_in).getTime()) / 1000 : 0;
  const elapsed = formatDuration(shiftDiffSeconds);
  const liveShiftHours = activeShift?.clock_in && activeShift?.status === 'active'
    ? Math.max(0, shiftDiffSeconds / 3600)
    : 0;

  // 3. Task Elapsed Time
  let taskElapsed = '00:00:00';
  if (profile?.active_task) {
    const activeTask = typeof profile.active_task === 'string'
      ? JSON.parse(profile.active_task)
      : profile.active_task;

    if (activeTask?.start_time) {
      const diff = (now.getTime() - parseUTCDate(activeTask.start_time).getTime()) / 1000;
      taskElapsed = formatDuration(diff);
    }
  }

  // 4. Global Stats
  const totalInterns = allUsers.filter(u => u.role === 'intern').length;
  const activeTasks = tasks.filter(t => t.status !== 'completed').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  const manualHours = logs.reduce((acc, log) => acc + (log.rendered_hours || 0), 0);
  const completedShiftHours = allShifts
    .filter(s =>
      s.status === 'completed' &&      // must be completed
      s.id !== activeShift?.id &&      // must not be the active shift
      s.clock_out !== null             // must have a clock_out
    )
    .reduce((acc, shift) => acc + (shift.total_hours || 0), 0);

  const totalHours = manualHours + completedShiftHours;

  // Internship Progress Calculations
  const requiredHours = profile?.required_hours || 0;
  const hoursRemaining = Math.max(requiredHours - totalHours, 0);
  const internshipProgress = requiredHours > 0 ? Math.min((totalHours / requiredHours) * 100, 100) : 0;

  // Chart Data: Completion Progress
  const statusData = [
    { name: 'Completed', value: completedTasks, color: '#10b981' },
    { name: 'Pending', value: tasks.filter(t => t.status === 'pending').length, color: '#f59e0b' },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in-progress').length, color: '#6366f1' },
  ];

  // Chart Data: Hours per Intern (Admin/Manager View)
  const internHoursData = allUsers
    .filter(u => u.role === 'intern')
    .map(intern => {
      const internLogs = logs.filter(l => l.user_id === intern.uid);
      return {
        name: intern.name,
        hours: internLogs.reduce((acc, l) => acc + (l.rendered_hours || 0), 0)
      };
    })
    .sort((a, b) => b.hours - a.hours);

  const today = format(new Date(), 'yyyy-MM-dd');
  const lateToday = allShifts.filter(s => {
    if (!s.clock_in) return false;
    const d = format(parseUTCDate(s.clock_in), 'yyyy-MM-dd');
    return d === today && s.is_late;
  }).length;

  const otToday = allShifts.filter(s => {
    if (!s.clock_in) return false;
    const d = format(parseUTCDate(s.clock_in), 'yyyy-MM-dd');
    return d === today && s.overtime_hours > 0;
  }).length;

  const stats = profile?.role === 'intern' ? [
    { label: 'Hours Remaining', value: hoursRemaining.toFixed(1), icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Active Tasks', value: activeTasks, icon: ListTodo, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Completed Tasks', value: completedTasks, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Hours', value: totalHours.toFixed(1), icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
  ] : [
    { label: 'Total Interns', value: totalInterns, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Tasks', value: activeTasks, icon: ListTodo, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Late Today', value: lateToday, icon: Clock, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'OT Today', value: otToday, icon: Timer, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Welcome back, {profile?.name}. Here's what's happening today.</p>
      </div>

      {/* Intern Time Logger / active Task Control */}
      {profile?.role === 'intern' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Shift Control */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-border-theme p-8 shadow-sm overflow-hidden relative flex flex-col items-center text-center"
          >
            <div className="space-y-1 mb-2">
              <h2 className="text-xl font-bold text-slate-800">Time Logger</h2>
              <div className="text-[36px] font-medium text-slate-700 tabular-nums">
                {pstClock}
              </div>
              <p className="text-sm text-slate-500 font-medium">
                Schedule Today: <span className="underline decoration-slate-300 underline-offset-4">
                  {profile?.schedule_start || '10PM'} - {profile?.schedule_end || '7AM'}
                </span>
              </p>
            </div>

            <div className="w-full space-y-3 mt-6">
              {/* Time In Button */}
              <button
                onClick={handleClockIn}
                disabled={!!activeShift}
                className={`w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all ${activeShift
                  ? 'bg-slate-400 text-slate-100 cursor-not-allowed opacity-80'
                  : 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99]'
                  }`}
              >
                <Play size={16} className={activeShift ? 'opacity-50' : ''} /> Time In
              </button>

              {/* Time Out Button */}
              <button
                onClick={handleClockOut}
                disabled={!activeShift}
                className={`w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all ${!activeShift
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:scale-[1.01] active:scale-[0.99]'
                  }`}
              >
                <Square size={16} /> Time Out
              </button>

              {/* FIXED Clocked In Display */}
              {activeShift && activeShift.clock_in && (
                <div className="pt-1 flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <Clock size={10} className="text-primary" />
                  Clocked In at {formatManilaTime(activeShift.clock_in)}
                </div>
              )}
            </div>
          </motion.div>

          {/* Active Task Card */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`bg-white rounded-2xl border ${profile?.active_task ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-indigo-50' : 'border-border-theme'} p-6 shadow-sm overflow-hidden relative`}
          >
            <div className="flex flex-col gap-6 relative z-10 h-full">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <ListTodo size={18} />
                  </div>
                  <h2 className="text-lg font-bold text-text-main">Active Task</h2>
                </div>
                <p className="text-xs text-text-muted">Currently tracked work session.</p>
              </div>

              {profile?.active_task ? (
                <div className="flex flex-col flex-1 justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900 line-clamp-1">{profile.active_task.task_title}</h3>
                    <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mt-1">Live Tracking</p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-[32px] font-black text-indigo-600 tabular-nums tracking-tight">
                      {taskElapsed}
                    </div>
                    <button
                      onClick={async () => {
                        const navigate = (window as any).navigation?.navigate || (window as any).location.assign;
                        window.location.href = '/tasks';
                      }}
                      className="w-full py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"
                    >
                      Manage Task
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 gap-3 py-4">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                    <Play size={24} />
                  </div>
                  <p className="text-xs text-slate-400 font-medium">No task running</p>
                  <button
                    onClick={() => window.location.href = '/tasks'}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Go to Tasks
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Progress Card */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-border-theme p-6 shadow-sm overflow-hidden relative h-full flex flex-col"
          >
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 size={18} />
                </div>
                <h2 className="text-lg font-bold text-text-main">Progress</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Rendered</p>
                  <p className="text-xl font-black text-emerald-600">{totalHours.toFixed(1)} <span className="text-[10px] font-bold opacity-60">h</span></p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Remaining</p>
                  <p className="text-xl font-black text-slate-300">
                    {requiredHours > 0 ? hoursRemaining.toFixed(1) : '--'}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-end">
                  <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{requiredHours}h Req.</div>
                  <div className="text-xs font-black text-primary">{Math.round(internshipProgress)}%</div>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${internshipProgress}%` }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[20px]">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-[20px] rounded-[12px] border border-border-theme shadow-sm"
          >
            <div className="text-[12px] text-text-muted uppercase tracking-[0.05em] font-semibold">{stat.label}</div>
            <div className="text-[24px] font-bold text-text-main mt-2 flex items-baseline gap-2">
              {stat.value}
              {stat.label === 'Active Tasks' && <span className="text-[12px] font-medium text-success-theme">+4%</span>}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[24px]">
        {/* Task Grid / Table Area */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-[12px] border border-border-theme flex flex-col">
            <div className="px-5 py-4 border-b border-border-theme flex justify-between items-center">
              <h3 className="text-[16px] font-semibold text-text-main">Priority Task Tracking</h3>
              <button className="text-[12px] bg-transparent border border-border-theme px-3 py-1 rounded-md hover:bg-slate-50 transition-colors">
                Filter Status
              </button>
            </div>
            <div className="overflow-x-auto">
              {/* Existing Table Content */}
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-[#fdfdfd] border-b border-border-theme">
                  <tr>
                    <th className="px-5 py-3 text-[12px] font-semibold text-text-muted">Intern</th>
                    <th className="px-5 py-3 text-[12px] font-semibold text-text-muted">Task Description</th>
                    <th className="px-5 py-3 text-[12px] font-semibold text-text-muted">Est / Rend Hours</th>
                    <th className="px-5 py-3 text-[12px] font-semibold text-text-muted">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-theme">
                  {tasks.slice(0, 5).map(task => {
                    const taskLogs = logs.filter(l => l.task_id === task.id);
                    const logged = taskLogs.reduce((acc, l) => acc + (l.rendered_hours || 0), 0);

                    // Live Calculation for any user
                    const assignee = allUsers.find(u => u.uid === task.assigned_to);
                    const isPlaying = assignee?.active_task?.task_id === task.id;
                    let sessionHours = 0;
                    if (isPlaying) {
                      const startTime = assignee.active_task.start_time;
                      sessionHours = (now.getTime() - parseUTCDate(startTime).getTime()) / (1000 * 3600);
                    }

                    const rendered = logged + sessionHours;

                    const progress = Math.min((rendered / task.estimated_hours) * 100, 100);
                    const isOverworked = rendered > task.estimated_hours;

                    return (
                      <tr key={task.id}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                {task.assigned_to_name?.split(' ').map((n: string) => n[0]).join('')}
                              </div>
                              {isPlaying && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-indigo-500 border-2 border-white rounded-full animate-pulse" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-text-main text-[13px]">{task.assigned_to_name}</div>
                              <div className="text-[10px] text-text-muted flex items-center gap-1">
                                {isPlaying ? (
                                  <span className="text-indigo-600 font-bold flex items-center gap-1">
                                    <Play size={8} fill="currentColor" /> Working Now
                                  </span>
                                ) : 'Away'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-text-main font-medium">{task.title}</div>
                          {isPlaying && (
                            <div className="text-[10px] text-indigo-500 font-bold flex items-center gap-1 mt-0.5">
                              <Timer size={10} /> Active: {Math.floor(sessionHours * 60)}m this session
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`hours-badge ${isPlaying ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : ''}`}>
                              {task.estimated_hours}h / {rendered.toFixed(1)}h
                            </span>
                            {isOverworked && (
                              <div
                                className="text-red-500"
                                title={`Variance Alert: This task is ${(rendered - task.estimated_hours).toFixed(1)} hours over the estimate.`}
                              >
                                <TriangleAlert size={14} />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="w-[100px] h-2 bg-border-theme rounded-full overflow-hidden mb-1">
                            <div
                              className={`h-full transition-all duration-500 ${isOverworked ? 'bg-danger-theme' : (isPlaying ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-primary')}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-text-muted">{Math.round(progress)}% utilized</span>
                        </td>
                      </tr>
                    );
                  })}
                  {tasks.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-slate-400 italic">No tasks assigned yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Shift Attendance Summary (Intern Only) */}
          {profile?.role === 'intern' && (
            <div className="bg-white rounded-[12px] border border-border-theme flex flex-col overflow-hidden">
              <div className="px-5 py-4 border-b border-border-theme flex justify-between items-center bg-slate-50/50">
                <h3 className="text-[16px] font-semibold text-text-main">Recent Attendance</h3>
                <div className="flex gap-2">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> Late
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Undertime
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Overtime
                  </span>
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {allShifts.filter(s => s.status === 'completed').slice(-6).reverse().map((shift, idx) => (
                  <div key={idx} className="p-3 border border-slate-100 rounded-xl bg-white shadow-sm flex flex-col gap-1 relative overflow-hidden">
                    {shift.is_late && <div className="absolute top-0 right-0 w-8 h-8 bg-red-500 transform rotate-45 translate-x-5 -translate-y-5" title="Late" />}

                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      {shift.clock_in ? format(parseUTCDate(shift.clock_in), 'EEE, MMM d') : '...'}
                    </p>

                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs font-semibold text-slate-700">
                          {shift.clock_in ? formatManilaTime(shift.clock_in) : '--:--'} -
                          {shift.clock_out ? formatManilaTime(shift.clock_out) : '--:--'}
                        </p>
                        <p className="text-[10px] text-slate-400">{(shift.total_hours || 0).toFixed(1)} hours rendered</p>
                      </div>
                      <div className="flex gap-1">
                        {shift.is_late && <span className="w-1.5 h-1.5 rounded-full bg-red-500" title="Late" />}
                        {shift.is_undertime && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" title="Undertime" />}
                        {shift.is_overtime && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Overtime" />}
                      </div>
                    </div>
                  </div>
                ))}
                {allShifts.filter(s => s.status === 'completed').length === 0 && (
                  <div className="col-span-full py-4 text-center text-[11px] text-text-muted italic">No completed shifts recorded</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Weekly Logged Hours Chart */}
        <div className="flex flex-col gap-6">
          {/* Live Activity (Admin/Manager) */}
          {(profile?.role === 'admin' || profile?.role === 'manager') && (
            <div className="bg-white rounded-[12px] border border-border-theme flex flex-col">
              <div className="px-5 py-4 border-b border-border-theme flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-text-main flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  Live Activity
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Realtime</span>
              </div>
              <div className="p-4 space-y-3">
                {allUsers.filter(u => u.active_task).length > 0 ? (
                  allUsers.filter(u => u.active_task).map(user => {
                    const start = new Date(user.active_task.start_time);
                    const mins = Math.floor((now.getTime() - start.getTime()) / 60000);
                    return (
                      <div key={user.uid} className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                          {user.name?.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                          <p className="text-[10px] text-indigo-600 font-medium truncate">{user.active_task.task_title}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-indigo-600">{mins}m</p>
                          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Active</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-slate-400 space-y-2">
                    <Clock size={20} className="mx-auto opacity-20" />
                    <p className="text-[11px] font-medium">No interns active right now</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-[12px] border border-border-theme flex flex-col">
            <div className="px-5 py-4 border-b border-border-theme">
              <h3 className="text-[16px] font-semibold text-text-main">Weekly Logged Hours</h3>
            </div>
            <div className="p-5 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={internHoursData.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#64748b' }} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="hours" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="p-5 border-t border-border-theme">
              <div className="text-[12px] text-text-muted uppercase tracking-[0.05em] font-semibold mb-3">Recent Log Approvals</div>
              <div className="flex flex-col gap-2">
                {logs.slice(0, 2).map((log, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[12px]">
                    <span className="text-text-main">{log.user_name} ({log.rendered_hours}h)</span>
                    <span className="status-pill status-success">Approved</span>
                  </div>
                ))}
                {logs.length === 0 && <div className="text-[11px] text-text-muted italic">No recent logs</div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Tasks Section (Warnings) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800">Alerts & Notifications</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {/* Attendance Alerts (Admin/Manager) */}
            {(profile?.role === 'admin' || profile?.role === 'manager') && allShifts.filter(s => s.status === 'completed' && (s.is_late || s.is_undertime)).slice(0, 5).map(shift => (
              <div key={shift.id} className="flex items-center gap-4 p-4 bg-orange-50 text-orange-700 rounded-xl border border-orange-100 italic">
                <Clock className="shrink-0" />
                <div className="flex-1 text-[13px]">
                  <span className="font-bold underline">{shift.user_name}</span> was
                  {shift.is_late && <span className="mx-1 font-black text-red-600">LATE</span>}
                  {shift.is_late && shift.is_undertime && ' and '}
                  {shift.is_undertime && <span className="mx-1 font-black text-orange-600">UNDERTIME</span>}
                  on {shift.clock_in ? formatManilaTime(shift.clock_in) : 'Syncing...'}
                </div>
                <div className="text-[10px] uppercase font-black px-2 py-1 bg-orange-100 rounded tracking-tighter">Attendance</div>
              </div>
            ))}

            {tasks.filter(t => {
              const taskLogs = logs.filter(l => l.task_id === t.id);
              const rendered = taskLogs.reduce((acc, l) => acc + (l.rendered_hours || 0), 0);
              return rendered > t.estimated_hours && t.status !== 'completed';
            }).map(task => {
              const taskLogs = logs.filter(l => l.task_id === task.id);
              const rendered = taskLogs.reduce((acc, l) => acc + (l.rendered_hours || 0), 0);
              const variance = rendered - task.estimated_hours;

              return (
                <div key={task.id} className="flex items-center gap-4 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
                  <TriangleAlert className="shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold">Overwork Alert: {task.title}</p>
                    <p className="text-sm opacity-90">
                      Rendered hours ({rendered.toFixed(1)}h) have exceeded the estimated {task.estimated_hours}h for this task.
                      <span className="ml-1 font-bold">(+{variance.toFixed(1)}h variance)</span>
                    </p>
                  </div>
                  <div className="text-xs uppercase font-bold px-2 py-1 bg-red-100 rounded">Critical</div>
                </div>
              );
            })}

            {tasks.filter(t => {
              const deadline = new Date(t.end_date);
              const now = new Date();
              const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              return diffDays <= 3 && diffDays > 0 && t.status !== 'completed';
            }).map(task => (
              <div key={task.id} className="flex items-center gap-4 p-4 bg-orange-50 text-orange-700 rounded-xl border border-orange-100">
                <Clock className="shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold">Deadline Approaching: {task.title}</p>
                  <p className="text-sm opacity-90">Due on {task.end_date}. Please ensure progress is on track.</p>
                </div>
                <div className="text-xs uppercase font-bold px-2 py-1 bg-orange-100 rounded">Warning</div>
              </div>
            ))}

            {tasks.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                No active alerts at this time.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

