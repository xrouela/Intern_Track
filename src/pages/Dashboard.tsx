import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/apiService';
import { useAuth } from '../context/AuthContext';


import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { parseUTCDate, formatDuration, getDurationInHours } from '../utils/dateUtils';
import { calculateAttendance, getTrackedHours, getDTRTotalHours } from '../utils/attendanceUtils';
import {
  Users,
  CheckCircle2,
  Clock,
  ListTodo,
  TriangleAlert,
  Play,
  Square,
  Timer,
  Search,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Bell,
  Check,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

export default function Dashboard() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [activeShift, setActiveShift] = useState<any>(null);
  const [allShifts, setAllShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [now, setNow] = useState(new Date());

  const formatScheduleTime = (time?: string | null) => {
    if (!time) return '--:--';
    const [hours = 0, minutes = 0] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  // ======================
  // Shift Timestamp Normalization
  // ======================
  const normalizeShiftTime = (dateInput: Date | string | null | undefined) => {
    if (!dateInput) return null;

    return typeof dateInput === 'string'
      ? parseUTCDate(dateInput)
      : new Date(dateInput);
  };

  // ======================
  // Manila Time Formatter (Reusable)
  // ======================
  const formatManilaTime = (dateInput: Date | string | null | undefined) => {
    const date = normalizeShiftTime(dateInput);
    if (!date) return '--:--';

    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(date);
  };

  const getScheduleBounds = () => {
    if (!profile?.schedule_start || !profile?.schedule_end) return null;
    const [startHours = 0, startMins = 0] = profile.schedule_start.split(':').map(Number);
    const [endHours = 0, endMins = 0] = profile.schedule_end.split(':').map(Number);
    const start = new Date();
    start.setHours(startHours, startMins, 0, 0);
    const end = new Date();
    end.setHours(endHours, endMins, 0, 0);
    return {
      start,
      end,
      durationHours: Math.max(0, (end.getTime() - start.getTime()) / 3600000),
    };
  };

  const getShiftStatus = (shift: any) => {
    const clockIn = normalizeShiftTime(shift.clock_in);
    const clockOut = shift.clock_out ? normalizeShiftTime(shift.clock_out) : null;
    const bounds = getScheduleBounds();
    const defaultStatus = { label: 'On time', classes: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    if (!bounds || !clockIn) return defaultStatus;

    const startedLate = clockIn.getTime() > bounds.start.getTime();
    const endedEarly = clockOut ? clockOut.getTime() < bounds.end.getTime() : false;
    const totalHours = clockOut ? (clockOut.getTime() - clockIn.getTime()) / 3600000 : 0;
    const exceeded = clockOut ? totalHours > bounds.durationHours : false;

    if (exceeded) return { label: 'Overtime', classes: 'bg-blue-50 text-blue-700 border-blue-100' };
    if (endedEarly) return { label: 'Undertime', classes: 'bg-orange-50 text-orange-700 border-orange-100' };
    if (startedLate) return { label: 'Late', classes: 'bg-red-50 text-red-700 border-red-100' };
    return defaultStatus;
  };

  const formatLateDuration = (shift: any) => {
    const clockIn = normalizeShiftTime(shift.clock_in);
    const bounds = getScheduleBounds();
    if (!bounds || !clockIn) return '0 min';

    const lateMinutes = Math.max(0, Math.round((clockIn.getTime() - bounds.start.getTime()) / 60000));
    if (lateMinutes === 0) return '0 min';
    if (lateMinutes < 60) return `${lateMinutes} min`;
    return `${(lateMinutes / 60).toFixed(1)} hrs`;
  };

  const formatShiftDuration = (shift: any) => {
    if (!shift.clock_in || !shift.clock_out) return '0.0 hrs';

    const clockIn = normalizeShiftTime(shift.clock_in);
    const clockOut = normalizeShiftTime(shift.clock_out);
    if (!clockIn || !clockOut) return '0.0 hrs';

    let seconds = Math.max(0, Math.round((clockOut.getTime() - clockIn.getTime()) / 1000));

    // Deduct 1 hour for lunch if shift is longer than 5 hours to match DTR
    if (seconds > 5 * 3600) {
      seconds -= 3600;
    }

    if (seconds < 60) {
      return `${seconds} sec`;
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }

    return `${(seconds / 3600).toFixed(1)} hrs`;
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

      // Any time after scheduled start is considered late
      if (clockInTime.getTime() > schedDate.getTime()) {
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

      calculateAttendance(clockInTime, clockOutTime);

      let isUndertime = false;
      let scheduledDuration = 8;
      if (profile.schedule_start && profile.schedule_end) {
        const [startHours, startMins] = profile.schedule_start.split(':').map(Number);
        const [endHours, endMins] = profile.schedule_end.split(':').map(Number);
        const scheduledStart = new Date();
        const scheduledEnd = new Date();
        scheduledStart.setHours(startHours, startMins, 0, 0);
        scheduledEnd.setHours(endHours, endMins, 0, 0);
        scheduledDuration = Math.max(0, (scheduledEnd.getTime() - scheduledStart.getTime()) / 3600000);

        if (clockOutTime.getTime() < scheduledEnd.getTime()) {
          isUndertime = true;
        }
      }

      const recalculatedHours = Number(
        (
          (clockOutTime.getTime() - clockInTime.getTime()) /
          3600000
        ).toFixed(2)
      );

      await api.updateShift(activeShift.id, {
        clock_out: clockOutTime.toISOString(),
        status: 'completed',
        total_hours: recalculatedHours,
        overtime_hours: Math.max(recalculatedHours - scheduledDuration, 0),
        is_overtime: recalculatedHours > scheduledDuration,
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

  const getActualClockIn = () => {
    if (!activeShift?.clock_in) return null;
    return normalizeShiftTime(activeShift.clock_in);
  };

  const actualClockIn = getActualClockIn();
  const activeShiftStatus = activeShift ? getShiftStatus(activeShift) : null;
  const scheduleStartLabel = formatScheduleTime(profile?.schedule_start || '09:00');
  const scheduleEndLabel = formatScheduleTime(
    profile?.schedule_start === '09:00' && profile?.schedule_end === '18:00'
      ? '17:00'
      : profile?.schedule_end || '17:00'
  );
  const clockInStatus = (() => {
    if (!actualClockIn || !profile?.schedule_start) return null;
    const [schedHours = 0, schedMins = 0] = profile.schedule_start.split(':').map(Number);
    const scheduledClockIn = new Date(actualClockIn);
    scheduledClockIn.setHours(schedHours, schedMins, 0, 0);
    const lateMinutes = Math.max(0, Math.floor((actualClockIn.getTime() - scheduledClockIn.getTime()) / 60000));

    return lateMinutes > 0
      ? `Late by ${lateMinutes} minute${lateMinutes === 1 ? '' : 's'}`
      : 'On time';
  })();

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

  // Mirror the Attendance Report totals (DTR rules: deduct lunch by default)
  const totalHours = getDTRTotalHours(logs, allShifts, true, false);

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
      const internShifts = allShifts.filter(s => s.user_id === intern.uid && s.status === 'completed' && s.clock_out);
      const shiftHrs = internShifts.reduce((acc, s) => acc + getDurationInHours(s.clock_in, s.clock_out), 0);
      return {
        name: intern.name,
        hours: internLogs.reduce((acc, l) => acc + (l.rendered_hours || 0), 0) + shiftHrs
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

  // ==========================================
  // ADMIN/MANAGER DASHBOARD STATES & SERVICES
  // ==========================================
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedTimeframe, setSelectedTimeframe] = useState('This Week');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [dashboardNotificationsOpen, setDashboardNotificationsOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState('This Week');

  const fetchDashboardNotifications = async () => {
    if (!profile?.uid) return;
    try {
      if (profile.role === 'admin' || profile.role === 'manager') {
        const allShifts = await api.getShifts(undefined, 'completed');
        const exceptions = allShifts.filter((s: any) =>
          (s.is_late || s.is_undertime || s.overtime_hours > 0 || s.is_incomplete) && 
          s.alert_status !== 'resolved'
        ).map((s: any) => {
          let alertTitle = 'Alert';
          let message = '';
          if (s.overtime_hours > 2) {
            alertTitle = 'Critical Overtime';
            message = `${s.user_name} worked ${(s.net_work_hours || 0).toFixed(1)}h (↑ ${(s.overtime_hours).toFixed(1)}h over limit)`;
          } else if (s.overtime_hours > 0) {
            alertTitle = 'Moderate Overtime';
            message = `${s.user_name} exceeded daily limit by ${(s.overtime_hours).toFixed(1)}h`;
          } else if (s.is_late) {
            alertTitle = s.late_minutes > 30 ? 'Significant Latency' : 'Late Clock-in';
            message = `${s.user_name} clocked in ${s.late_minutes || 0}m past schedule`;
          } else if (s.is_undertime) {
            alertTitle = 'Undertime Alert';
            message = `${s.user_name} finished ${(s.regular_hours || 0).toFixed(1)}h short of goal`;
          }
          return {
            id: s.id,
            title: alertTitle,
            message: message,
            is_read: s.alert_status === 'flagged',
            is_alert: true
          };
        });
        setNotificationsList(exceptions);
        setUnreadNotificationsCount(exceptions.filter((n: any) => !n.is_read).length);
      } else {
        const data = await api.getNotifications(profile.uid);
        setNotificationsList(data);
        setUnreadNotificationsCount(data.filter((n: any) => !n.is_read).length || data.length);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard notifications', err);
    }
  };

  useEffect(() => {
    if (profile && (profile.role === 'admin' || profile.role === 'manager')) {
      fetchDashboardNotifications();
      const interval = setInterval(fetchDashboardNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [profile]);

  const markDashboardNotificationRead = async (notification: any) => {
    if (!profile?.uid) return;
    try {
      if (notification.is_alert) {
        await api.updateShift(notification.id, {
          alert_status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: profile?.uid
        });
      } else {
        await api.markNotificationRead(notification.id, profile.uid);
      }
      fetchDashboardNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllDashboardNotificationsRead = async () => {
    if (!profile?.uid) return;
    try {
      if (profile.role === 'admin' || profile.role === 'manager') {
        for (const notification of notificationsList) {
          if (notification.is_alert && !notification.is_read) {
            await api.updateShift(notification.id, {
              alert_status: 'resolved',
              resolved_at: new Date().toISOString(),
              resolved_by: profile?.uid
            });
          }
        }
      } else {
        await api.markAllNotificationsRead(profile.uid);
      }
      fetchDashboardNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  if (profile && (profile.role === 'admin' || profile.role === 'manager')) {
    // 1. KPI Summary calculations
    const totalInternsCount = allUsers.filter(u => u.role === 'intern').length;
    const activeTodayCount = allUsers.filter(u => {
      if (u.role !== 'intern') return false;
      const userShifts = allShifts.filter(s => s.user_id === u.uid);
      return userShifts.some(s => {
        if (s.status === 'active') return true;
        if (!s.clock_in) return false;
        return format(parseUTCDate(s.clock_in), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
      });
    }).length;

    const presentTodayCount = allUsers.filter(u => {
      if (u.role !== 'intern') return false;
      const userShifts = allShifts.filter(s => s.user_id === u.uid);
      return userShifts.some(s => {
        if (!s.clock_in) return false;
        return format(parseUTCDate(s.clock_in), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
      });
    }).length;
    const attendanceRate = totalInternsCount > 0 ? Math.round((presentTodayCount / totalInternsCount) * 100) : 0;

    const lateTodayCount = allUsers.filter(u => {
      if (u.role !== 'intern') return false;
      const userShifts = allShifts.filter(s => s.user_id === u.uid && s.is_late);
      return userShifts.some(s => {
        if (!s.clock_in) return false;
        return format(parseUTCDate(s.clock_in), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
      });
    }).length;
    const lateRate = presentTodayCount > 0 ? Math.round((lateTodayCount / presentTodayCount) * 100) : 0;

    const completedShifts = allShifts.filter(s => s.status === 'completed' || s.clock_in);
    const onTimeShiftsCount = completedShifts.filter(s => !s.is_late).length;
    const punctualityRate = completedShifts.length > 0 ? Math.round((onTimeShiftsCount / completedShifts.length) * 100) : 0;

    // 2. Performance Card metrics
    const completionList = allUsers.filter(u => u.role === 'intern').map(u => {
      const userLogs = logs.filter(l => l.user_id === u.uid);
      const userShifts = allShifts.filter(s => s.user_id === u.uid && s.status === 'completed' && s.clock_out);
      const shiftHrs = userShifts.reduce((sum, s) => sum + getDurationInHours(s.clock_in, s.clock_out), 0);
      const rendered = userLogs.reduce((sum, l) => sum + (l.rendered_hours || 0), 0) + shiftHrs;
      const req = u.required_hours || 100;
      return Math.min(Math.round((rendered / req) * 100), 100);
    });
    const avgInternCompletion = completionList.length > 0 ? Math.round(completionList.reduce((a, b) => a + b, 0) / completionList.length) : 0;

    const totalShiftHrs = allShifts.filter(s => s.status === 'completed' && s.clock_out).reduce((sum, s) => sum + getDurationInHours(s.clock_in, s.clock_out), 0);
    const totalHoursRendered = logs.reduce((sum, l) => sum + (l.rendered_hours || 0), 0) + totalShiftHrs;
    const totalHoursRequired = allUsers.filter(u => u.role === 'intern').reduce((sum, u) => sum + (u.required_hours || 100), 0);
    const overallHoursPct = totalHoursRequired > 0 ? Math.min(Math.round((totalHoursRendered / totalHoursRequired) * 100), 100) : 0;

    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.length;
    const overallTasksPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 3. Attendance Doughnut Chart
    const presentOnTime = Math.max(0, presentTodayCount - lateTodayCount);
    const doughnutData = [
      { name: 'Present', value: presentOnTime, color: '#10B981' },
      { name: 'Late', value: lateTodayCount, color: '#F59E0B' },
      { name: 'Absent', value: Math.max(0, totalInternsCount - presentTodayCount), color: '#EF4444' },
      { name: 'Leave', value: 0, color: '#6C4DFF' },
      { name: 'On Duty', value: activeTodayCount, color: '#3B82F6' }
    ];
    const totalDoughnutCount = doughnutData.reduce((sum, item) => sum + item.value, 0);

    // 4. Task Report by Intern
    const tableData = allUsers.filter(u => u.role === 'intern').map(u => {
      const internTasks = tasks.filter(t => t.assigned_to === u.uid);
      const assigned = internTasks.length;
      const completed = internTasks.filter(t => t.status === 'completed').length;
      const pending = internTasks.filter(t => t.status === 'pending' || t.status === 'in-progress').length;
      const overdue = internTasks.filter(t => {
        const isNotComp = t.status !== 'completed';
        const isPast = t.end_date && new Date(t.end_date) < new Date();
        return isNotComp && isPast;
      }).length;
      const completionPct = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;

      let status = 'Good';
      if (overdue > 1 || completionPct < 50) {
        status = 'Critical';
      } else if (overdue > 0 || completionPct < 80) {
        status = 'Needs Attention';
      }

      return {
        uid: u.uid,
        name: u.name,
        photoURL: u.photoURL,
        department: u.department || 'BSCS',
        assigned,
        completed,
        pending,
        overdue,
        completionPct,
        status
      };
    });

    const filteredTableData = tableData.filter(item => {
      const matchesDept = selectedDept === 'All Departments' || item.department.toLowerCase() === selectedDept.toLowerCase();
      const matchesStatus = selectedStatus === 'All Status' || item.status.toLowerCase() === selectedStatus.toLowerCase();
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDept && matchesStatus && matchesSearch;
    });

    const totalTablePages = Math.max(1, Math.ceil(filteredTableData.length / itemsPerPage));
    const currentTableData = filteredTableData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // 5. Department Summary
    const deptList = Array.from(new Set(allUsers.filter(u => u.role === 'intern').map(u => u.department).filter(Boolean)));
    const totalDepts = deptList.length;
    const deptData = deptList.map(dept => {
      const deptUsers = allUsers.filter(u => u.role === 'intern' && u.department === dept);
      const deptUserIds = deptUsers.map(u => u.uid);
      const deptTasks = tasks.filter(t => deptUserIds.includes(t.assigned_to));
      const completedDeptTasks = deptTasks.filter(t => t.status === 'completed').length;
      const totalDeptTasks = deptTasks.length;
      const completionPct = totalDeptTasks > 0 ? Math.round((completedDeptTasks / totalDeptTasks) * 100) : 90;
      return {
        name: dept,
        interns: deptUsers.length,
        completionPct
      };
    });

    const finalDeptData = deptData;

    // 6. Intern Completion Overview
    const internCompletionOverview = allUsers
      .filter(u => u.role === 'intern')
      .map(u => {
        const internTasks = tasks.filter(t => t.assigned_to === u.uid);
        const assigned = internTasks.length;
        const completed = internTasks.filter(t => t.status === 'completed').length;
        const completionPct = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
        return {
          uid: u.uid,
          name: u.name,
          photoURL: u.photoURL,
          department: u.department || 'Intern',
          completionPct
        };
      })
      .sort((a, b) => b.completionPct - a.completionPct)
      .slice(0, 5);

    return (
      <div className="space-y-8 bg-slate-50/50 p-6 min-h-screen">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
            <p className="text-slate-500 text-sm mt-1">Monitor attendance, intern productivity, and task completion in real time.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto self-stretch md:self-auto justify-end">
            {/* Date Range Picker */}
            <div className="relative">
              <button 
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm font-semibold hover:border-indigo-300 hover:bg-slate-50/50 transition-all shadow-sm"
              >
                <Calendar size={16} className="text-indigo-500" />
                <span>{dateRange}</span>
              </button>
              {showDatePicker && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 w-56 flex flex-col gap-1">
                  {[
                    'Today',
                    'This Week',
                    'This Month',
                    `${format(new Date(new Date().setDate(new Date().getDate() - 7)), 'MMM dd')} – ${format(new Date(), 'MMM dd, yyyy')}`,
                    `${format(new Date(new Date().setDate(new Date().getDate() - 30)), 'MMM dd')} – ${format(new Date(), 'MMM dd, yyyy')}`
                  ].map((rangeOption) => (
                    <button
                      key={rangeOption}
                      onClick={() => {
                        setDateRange(rangeOption);
                        setShowDatePicker(false);
                      }}
                      className="text-left px-3 py-2 hover:bg-indigo-50 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
                    >
                      {rangeOption}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setDashboardNotificationsOpen(!dashboardNotificationsOpen)}
                className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl border border-slate-200 bg-white transition-all shadow-sm relative"
              >
                <Bell size={18} />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full border-2 border-white flex items-center justify-center">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
              {dashboardNotificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 flex flex-col max-h-[400px]">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                    <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                    {unreadNotificationsCount > 0 && (
                      <button 
                        onClick={markAllDashboardNotificationsRead}
                        className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="overflow-y-auto custom-scrollbar flex-1 max-h-[300px]">
                    {notificationsList.length > 0 ? (
                      notificationsList.map(notification => (
                        <div 
                          key={notification.id}
                          onClick={() => markDashboardNotificationRead(notification)}
                          className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer bg-indigo-50/[0.02]"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <div className="text-sm font-semibold text-slate-800">
                              {notification.title}
                            </div>
                            {!notification.is_read && (
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0"></div>
                            )}
                          </div>
                          <div className="text-xs text-slate-500">
                            {notification.message}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-sm font-medium text-slate-500">
                        No notifications.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* First Row – KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Members */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Members</span>
              <h3 className="text-3xl font-black text-slate-900">{totalInternsCount}</h3>
              <p className="text-xs font-bold text-indigo-600 bg-indigo-50/50 px-2.5 py-0.5 rounded-full inline-block">Active Today: {activeTodayCount}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform shadow-inner">
              <Users size={20} />
            </div>
          </div>

          {/* Present Today */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Present Today</span>
              <h3 className="text-3xl font-black text-slate-900">{presentTodayCount}</h3>
              <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">{attendanceRate}% of members</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform shadow-inner">
              <CheckCircle2 size={20} />
            </div>
          </div>

          {/* Late Today */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Late Today</span>
              <h3 className="text-3xl font-black text-slate-900">{lateTodayCount}</h3>
              <p className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full inline-block">{lateRate}% of present</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform shadow-inner">
              <Clock size={20} />
            </div>
          </div>

          {/* Punctuality Rate */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Punctuality Rate</span>
              <h3 className="text-3xl font-black text-slate-900">{punctualityRate}%</h3>
              <p className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block">On time / Present</p>
            </div>
            {/* Circular Progress Indicator */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="24" cy="24" r="18" stroke="#f1f5f9" strokeWidth="3" fill="transparent" />
                <circle 
                  cx="24" 
                  cy="24" 
                  r="18" 
                  stroke="#3B82F6" 
                  strokeWidth="3" 
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 18}
                  strokeDashoffset={2 * Math.PI * 18 * (1 - punctualityRate / 100)}
                  strokeLinecap="round" 
                  className="transition-all duration-500" 
                />
              </svg>
              <div className="absolute text-[10px] font-bold text-blue-600">
                <Clock size={14} />
              </div>
            </div>
          </div>
        </div>

        {/* Second Row – Performance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Intern Completion (Average) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-all">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-600">Intern Completion (Average)</span>
              <span className="text-lg font-black text-indigo-600">{avgInternCompletion}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-1000" 
                style={{ width: `${avgInternCompletion}%` }}
              />
            </div>
          </div>

          {/* Intern Overall Progress (Hours) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-all">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-600">Intern Overall Progress (Hours)</span>
              <span className="text-lg font-black text-emerald-600">{overallHoursPct}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                style={{ width: `${overallHoursPct}%` }}
              />
            </div>
          </div>

          {/* Tasks Completion (Overall) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-all">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-600">Tasks Completion (Overall)</span>
              <span className="text-lg font-black text-blue-600">{overallTasksPct}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-1000" 
                style={{ width: `${overallTasksPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Third Row – Attendance & Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Attendance Overview Doughnut Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all lg:col-span-1">
            <h3 className="text-base font-bold text-slate-800 mb-4">Attendance Overview</h3>
            
            <div className="relative h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={doughnutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {doughnutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Interns`]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-800">{totalDoughnutCount}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-semibold text-slate-600">
              {doughnutData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.name}</span>
                  <span className="text-slate-400 font-bold ml-auto">{item.value} ({Math.round(item.value / totalDoughnutCount * 100)}%)</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => navigate('/logs')}
              className="mt-6 w-full py-3 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 group"
            >
              <span>View Full Attendance</span>
              <span className="transform group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>

          {/* Task Report by Intern Data Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all lg:col-span-2 overflow-hidden">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-slate-800">Task Report by Intern</h3>
              </div>

              {/* Top Controls/Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-4">
                {/* Department Filter */}
                <select
                  value={selectedDept}
                  onChange={(e) => { setSelectedDept(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-400"
                >
                  <option value="All Departments">All Departments</option>
                  <option value="BSCS">BSCS</option>
                  <option value="BSIT">BSIT</option>
                  <option value="Engineering">Engineering</option>
                </select>

                {/* Status Filter */}
                <select
                  value={selectedStatus}
                  onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-400"
                >
                  <option value="All Status">All Status</option>
                  <option value="Good">Good</option>
                  <option value="Needs Attention">Needs Attention</option>
                  <option value="Critical">Critical</option>
                </select>

                {/* Date Filter */}
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-400"
                >
                  <option value="This Week">This Week</option>
                  <option value="This Month">This Month</option>
                  <option value="All Time">All Time</option>
                </select>

                {/* Search Field */}
                <div className="relative sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Search intern..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-400 placeholder-slate-400"
                  />
                  <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                </div>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto min-h-[280px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 bg-white z-10">
                      <th className="pb-3 pr-2">Intern</th>
                      <th className="pb-3 px-2 text-center">Assigned</th>
                      <th className="pb-3 px-2 text-center">Completed</th>
                      <th className="pb-3 px-2 text-center">Pending</th>
                      <th className="pb-3 px-2 text-center">Overdue</th>
                      <th className="pb-3 px-2">Completion %</th>
                      <th className="pb-3 pl-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                    {currentTableData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 pr-2 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold overflow-hidden flex items-center justify-center shrink-0 border border-slate-100">
                            {row.photoURL ? (
                              <img src={row.photoURL} alt={row.name} className="w-full h-full object-cover" />
                            ) : (
                              row.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">{row.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{row.department}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-2 text-center font-bold text-slate-500">{row.assigned}</td>
                        <td className="py-3.5 px-2 text-center font-bold text-emerald-600">{row.completed}</td>
                        <td className="py-3.5 px-2 text-center font-bold text-amber-500">{row.pending}</td>
                        <td className="py-3.5 px-2 text-center font-bold text-red-500">{row.overdue}</td>
                        <td className="py-3.5 px-2 min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <span className="w-8 text-right font-black">{row.completionPct}%</span>
                            <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-indigo-600 h-full rounded-full transition-all"
                                style={{ width: `${row.completionPct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 pl-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-tight ${
                            row.status === 'Good' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : row.status === 'Needs Attention' 
                                ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                                : 'bg-red-50 text-red-700 border border-red-100'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {currentTableData.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                          No intern data matches the current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-xs font-semibold text-slate-500">
              <span>Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTableData.length)} of {filteredTableData.length} entries</span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50/50 disabled:opacity-50 disabled:pointer-events-none transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalTablePages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center border transition-all ${
                      currentPage === i + 1
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-slate-200 hover:bg-slate-50/50 text-slate-600'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalTablePages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50/50 disabled:opacity-50 disabled:pointer-events-none transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Fourth Row – Department Summary, Weekly Trend & Monthly area charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Summary Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-bold text-slate-800">Department Summary</h3>
                <button 
                  onClick={() => navigate('/users')}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {finalDeptData.map((dept, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <div>
                        <span className="font-bold text-slate-800">{dept.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase ml-2">{dept.interns} Interns</span>
                      </div>
                      <span className="font-black text-indigo-600">{dept.completionPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          idx === 0 
                            ? 'bg-emerald-500' 
                            : idx === 1 
                              ? 'bg-blue-500' 
                              : 'bg-indigo-600'
                        }`}
                        style={{ width: `${dept.completionPct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-6 border-t border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Total Departments: {totalDepts}
            </div>
          </div>

          {/* Intern Completion Overview */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-800">Intern Completion Overview</h3>
                <p className="text-sm text-slate-500">Top interns by task completion progress.</p>
              </div>
              <button
                onClick={() => navigate('/users')}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                View All
              </button>
            </div>
            <div className="space-y-5">
              {internCompletionOverview.length > 0 ? (
                internCompletionOverview.map(intern => (
                  <div key={intern.uid} className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center text-slate-400 text-sm font-bold">
                          {intern.photoURL ? (
                            <img src={intern.photoURL} alt={intern.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{intern.name.split(' ').map((n: string) => n[0]).join('').slice(0,2)}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{intern.name}</p>
                          <p className="text-xs text-slate-500">{intern.department}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-indigo-600">{intern.completionPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all duration-1000"
                        style={{ width: `${intern.completionPct}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">No intern completion data available.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                  {scheduleStartLabel} - {scheduleEndLabel}
                </span>
              </p>
              {activeShiftStatus && (
                <div className={`mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${activeShiftStatus.classes}`}>
                  Status: {activeShiftStatus.label}
                </div>
              )}
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
                  Clocked In at {actualClockIn ? formatManilaTime(actualClockIn) : '--:--'}
                  {clockInStatus && <span className={clockInStatus === 'On time' ? 'text-emerald-500' : 'text-red-500'}>- {clockInStatus}</span>}
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
              <div className="px-5 py-4 border-b border-border-theme flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 bg-slate-50/50">
                <h3 className="text-[16px] font-semibold text-text-main">Recent Attendance</h3>
                <p className="text-[11px] text-slate-500 font-medium">Your latest completed clock-in records</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-[#fdfdfd] border-b border-border-theme">
                    <tr>
                      <th className="px-5 py-3 text-[12px] font-semibold text-text-muted">Date</th>
                      <th className="px-5 py-3 text-[12px] font-semibold text-text-muted">Time In</th>
                      <th className="px-5 py-3 text-[12px] font-semibold text-text-muted">Time Out</th>
                      <th className="px-5 py-3 text-[12px] font-semibold text-text-muted">Total Hours</th>
                      <th className="px-5 py-3 text-[12px] font-semibold text-text-muted">Total Late Time</th>
                      <th className="px-5 py-3 text-[12px] font-semibold text-text-muted">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-theme">
                    {allShifts.filter(s => s.status === 'completed').slice(-6).reverse().map((shift, idx) => {
                      const primaryStatus = getShiftStatus(shift);

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <span className="text-[13px] font-bold text-slate-800">
                              {shift.clock_in ? format(parseUTCDate(shift.clock_in), 'EEE, MMM d') : 'No date'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-[13px] font-semibold text-slate-700">
                              {shift.clock_in ? formatManilaTime(shift.clock_in) : '--:--'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-[13px] font-semibold text-slate-700">
                              {shift.clock_out ? formatManilaTime(shift.clock_out) : '--:--'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-[13px] font-black text-slate-800">
                              {formatShiftDuration(shift)}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-[13px] font-bold text-slate-700">
                              {formatLateDuration(shift)}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={"shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide inline-block " + primaryStatus.classes}>
                              {primaryStatus.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {allShifts.filter(s => s.status === 'completed').length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-slate-400 italic">No completed shifts recorded</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          {/* Live Activity (Co-Interns & Admin/Manager) */}
          <div className="bg-white rounded-[12px] border border-border-theme flex flex-col h-full max-h-[600px]">
            <div className="px-5 py-4 border-b border-border-theme flex items-center justify-between bg-slate-50/50">
              <h3 className="text-[14px] font-bold text-text-main flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                Live Activity
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Realtime</span>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar flex-1">
              {allUsers.filter(u => u.active_task && u.uid !== profile?.uid).length > 0 ? (
                allUsers.filter(u => u.active_task && u.uid !== profile?.uid).map(user => {
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
                  <p className="text-[11px] font-medium">No co-interns active right now</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Critical Tasks Section (Warnings) */}
      {profile?.role !== 'intern' && (
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
                    {Boolean(shift.is_late) && <span className="mx-1 font-black text-red-600">LATE</span>}
                    {Boolean(shift.is_late) && Boolean(shift.is_undertime) && ' and '}
                    {Boolean(shift.is_undertime) && <span className="mx-1 font-black text-orange-600">UNDERTIME</span>}
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
      )}
    </div>
  );
}
