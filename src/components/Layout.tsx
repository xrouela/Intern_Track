import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Clock, 
  Users, 
  LogOut, 
  Menu, 
  X,
  UserCircle,
  BarChart3,
  Bell,
  ListTodo,
  FileText,
  Inbox,
  CalendarDays,
  AlertTriangle,
  LogIn,

  ChevronRight
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

import { useAuth } from '../context/AuthContext';
import { api } from '../services/apiService';
import { motion, AnimatePresence } from 'motion/react';
import { format, formatDistanceToNow, isToday } from 'date-fns';

type HeaderNotification = {
  id: string;
  type: 'alert' | 'schedule' | 'leave' | 'login' | 'time';
  title: string;
  detail: string;
  time: Date;
  path: string;
  tone: 'red' | 'amber' | 'indigo' | 'emerald' | 'slate';
};

const getReadNotificationKey = (uid?: string) => `read_notifications_${uid || 'guest'}`;

const getReadNotificationIds = (uid?: string) => {
  try {
    return new Set(JSON.parse(localStorage.getItem(getReadNotificationKey(uid)) || '[]') as string[]);
  } catch {
    return new Set<string>();
  }
};

const saveReadNotificationId = (uid: string | undefined, id: string) => {
  const readIds = getReadNotificationIds(uid);
  readIds.add(id);
  localStorage.setItem(getReadNotificationKey(uid), JSON.stringify(Array.from(readIds).slice(-200)));
};

const toDate = (value?: string | Date | null) => {
  if (!value) return new Date(0);
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
};

const formatTimeAgo = (date: Date) => {
  if (date.getTime() === 0) return 'Recently';
  return `${formatDistanceToNow(date, { addSuffix: true })}`;
};

const notificationStyles = {
  red: 'bg-red-50 text-red-600',
  amber: 'bg-amber-50 text-amber-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  slate: 'bg-slate-100 text-slate-600',
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!profile) return;
    const isReviewer = profile.role === 'admin' || profile.role === 'manager';
    const readIds = getReadNotificationIds(profile.uid);
    try {
      const [countData, scheduleRequests, leaveRequests, completedShifts, activeShifts, auditLogs] = await Promise.all([
        isReviewer ? api.getPendingRequestCount() : Promise.resolve({ count: 0 }),
        api.getScheduleRequests(isReviewer ? undefined : profile.uid),
        api.getLeaveRequests(isReviewer ? undefined : profile.uid),
        isReviewer ? api.getShifts(undefined, 'completed') : Promise.resolve([]),
        isReviewer ? api.getShifts(undefined, 'active') : Promise.resolve([]),
        isReviewer ? api.getAuditLogs() : Promise.resolve([]),
      ]);

      setPendingCount(countData.count || 0);

      const requestItems: HeaderNotification[] = [
        ...scheduleRequests
          .filter((request: any) => isReviewer ? request.status === 'pending' : request.status === 'approved')
          .map((request: any) => ({
            id: `schedule-${request.id}`,
            type: 'schedule' as const,
            title: isReviewer ? 'Schedule request' : 'Schedule approved',
            detail: isReviewer
              ? `${request.user_name || 'Intern'} requested ${request.requested_time_in || '--'} - ${request.requested_time_out || '--'}`
              : `Your schedule request was approved`,
            time: toDate(request.reviewed_at || request.updated_at || request.created_at || request.request_date),
            path: isReviewer ? '/admin-requests' : '/requests',
            tone: 'indigo' as const,
          })),
        ...leaveRequests
          .filter((request: any) => isReviewer ? request.status === 'pending' : request.status === 'approved')
          .map((request: any) => ({
            id: `leave-${request.id}`,
            type: 'leave' as const,
            title: isReviewer ? 'Leave request' : 'Leave approved',
            detail: isReviewer
              ? `${request.user_name || 'Intern'} requested ${request.leave_type || 'leave'}`
              : `Your ${request.leave_type || 'leave'} request was approved`,
            time: toDate(request.reviewed_at || request.updated_at || request.created_at || request.request_date),
            path: isReviewer ? '/admin-requests' : '/requests',
            tone: 'amber' as const,
          })),
      ];

      const alertItems: HeaderNotification[] = completedShifts
        .filter((shift: any) => shift.is_late || shift.is_undertime || shift.is_incomplete || Number(shift.overtime_hours || 0) > 0)
        .map((shift: any) => {
          const overtimeHours = Number(shift.overtime_hours || 0);
          const label = shift.is_late
            ? 'Late clock-in'
            : shift.is_undertime
              ? 'Undertime alert'
              : overtimeHours > 0
                ? 'Overtime alert'
                : 'Attendance alert';

          return {
            id: `alert-${shift.id}`,
            type: 'alert' as const,
            title: label,
            detail: isReviewer
              ? `${shift.user_name || 'Intern'} needs attendance review`
              : 'Your attendance has an item to review',
            time: toDate(shift.clock_out || shift.clock_in || shift.updated_at || shift.created_at),
            path: isReviewer ? '/alerts' : '/',
            tone: (shift.is_late || overtimeHours > 2 ? 'red' : 'amber') as HeaderNotification['tone'],
          };
        });

      const timeItems: HeaderNotification[] = [
        ...activeShifts.map((shift: any) => ({
          id: `time-in-${shift.id}`,
          type: 'time' as const,
          title: isReviewer ? 'User timed in' : 'You timed in',
          detail: `${isReviewer ? shift.user_name || 'Intern' : 'Clocked in'} at ${shift.clock_in ? format(toDate(shift.clock_in), 'h:mm a') : '--'}`,
          time: toDate(shift.clock_in || shift.created_at),
          path: isReviewer ? '/logs' : '/',
          tone: 'emerald' as const,
        })),
        ...completedShifts
          .filter((shift: any) => shift.clock_out && isToday(toDate(shift.clock_out)))
          .map((shift: any) => ({
            id: `time-out-${shift.id}`,
            type: 'time' as const,
            title: isReviewer ? 'User timed out' : 'You timed out',
            detail: `${isReviewer ? shift.user_name || 'Intern' : 'Clocked out'} at ${format(toDate(shift.clock_out), 'h:mm a')}`,
            time: toDate(shift.clock_out),
            path: isReviewer ? '/logs' : '/',
            tone: 'slate' as const,
          })),
      ];

      const loginItems: HeaderNotification[] = auditLogs
        .filter((log: any) => log.action === 'USER_LOGIN')
        .map((log: any) => ({
          id: `login-${log.id}`,
          type: 'login' as const,
          title: 'User login',
          detail: `${log.performed_by_name || 'User'} signed in`,
          time: toDate(log.created_at),
          path: '/admin',
          tone: 'slate' as const,
        }));

      setNotifications([...requestItems, ...alertItems, ...timeItems, ...loginItems]
        .filter((notification) => !readIds.has(notification.id))
        .sort((a, b) => b.time.getTime() - a.time.getTime())
        .slice(0, 12));
    } catch {
      setNotifications([]);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [profile?.uid, profile?.role]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!notificationsRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    logoutUser();
    navigate('/login');
  };

  const isAdmin = profile?.role === 'admin';
  const isManager = profile?.role === 'manager';
  const isAlt = isAdmin || isManager;
  const notificationCount = notifications.length;

  const renderNotificationIcon = (notification: HeaderNotification) => {
    if (notification.type === 'alert') return <AlertTriangle size={16} />;
    if (notification.type === 'schedule') return <Clock size={16} />;
    if (notification.type === 'leave') return <CalendarDays size={16} />;
    if (notification.type === 'login') return <LogIn size={16} />;
    return <Clock size={16} />;
  };

  const openNotification = (notification: HeaderNotification) => {
    saveReadNotificationId(profile?.uid, notification.id);
    setNotifications((current) => current.filter((item) => item.id !== notification.id));
    setNotificationsOpen(false);
    navigate(notification.path);
  };

  const menuGroups = [
    {
      label: 'Main',
      items: [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'intern'] },
        { name: 'Tasks', path: '/tasks', icon: CheckSquare, roles: ['admin', 'manager', 'intern'] },
        { name: 'DTR Generator', path: '/dtr-generator', icon: FileText, roles: ['intern'] },
        { name: 'My Requests', path: '/requests', icon: Inbox, roles: ['intern'] },
        { name: 'Profile', path: '/profile', icon: UserCircle, roles: ['admin', 'manager', 'intern'] },
      ]
    },
    {
      label: 'Management',
      roles: ['admin', 'manager'],
      items: [
        { name: 'User Management', path: '/users', icon: Users, roles: ['admin'] },
        { name: 'Time Logs', path: '/logs', icon: ListTodo, roles: ['admin', 'manager'] },
        { name: 'Requests Review', path: '/admin-requests', icon: Inbox, roles: ['admin', 'manager'] },
      ]
    },
    {
      label: 'Reports & Alerts',
      roles: ['admin', 'manager'],
      items: [
        { name: 'Quick Alerts', path: '/alerts', icon: Bell, roles: ['admin', 'manager'] },
        { name: 'Shift Reports', path: '/reports', icon: BarChart3, roles: ['admin', 'manager'] },
      ]
    }
  ];

  const flattenedItems = menuGroups.flatMap(g => g.items);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-white rounded-lg shadow-md text-slate-600"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[240px] bg-sidebar border-r border-border-theme flex flex-col transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
            <div className="p-6 h-16 flex items-center">
              <h1 className="text-xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
                <img src="/logo.png" alt="NexTrack Logo" className="w-8 h-8 rounded shadow-sm object-contain" />
                NexTrack
              </h1>
            </div>

            <nav className="flex-grow p-3 space-y-6 overflow-y-auto custom-scrollbar">
              {menuGroups.map((group, idx) => {
                if (group.roles && (!profile || (!group.roles.includes(profile.role) && !(profile.role === 'admin' && group.roles.includes('manager'))))) return null;
                const visibleItems = group.items.filter(item => !item.roles || (profile && (item.roles.includes(profile.role) || (profile.role === 'admin' && item.roles.includes('manager')))));
                if (visibleItems.length === 0) return null;

                return (
                  <div key={idx} className="space-y-1">
                    <div className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      {group.label}
                    </div>
                    {visibleItems.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                            isActive
                              ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-primary'
                          }`
                        }
                        onClick={() => setSidebarOpen(false)}
                      >
                        {({ isActive }) => (
                          <>
                            <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                            {item.name}
                            {item.name === 'Requests Review' && pendingCount > 0 && (
                              <span className="ml-auto bg-amber-400 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                                {pendingCount}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                );
              })}

            </nav>

            <div className="p-6 border-t border-border-theme text-[11px] text-text-muted">
              System v2.4.0 (Node/Firebase)
            </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-bottom border-border-theme flex items-center justify-between pl-16 pr-8 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <div className="text-sm font-semibold text-text-main">
              {flattenedItems.find(item => item.path === window.location.pathname)?.name || 'Admin Overview'}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {profile && (
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setNotificationsOpen((open) => !open)}
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                  title="Notifications"
                >
                  <Bell size={18} />
                  {notificationCount > 0 && (
                    <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-black leading-none text-white shadow-sm">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 z-50 w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <div>
                          <p className="text-sm font-black text-slate-900">Notifications</p>
                          <p className="text-[11px] font-medium text-slate-400">Alerts, requests, login, and time logs</p>
                        </div>
                        {notificationCount > 0 && (
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500">
                            {notificationCount}
                          </span>
                        )}
                      </div>

                      <div className="max-h-[420px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-5 py-10 text-center">
                            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                              <Bell size={18} />
                            </div>
                            <p className="text-sm font-bold text-slate-700">No new notifications</p>
                            <p className="mt-1 text-xs text-slate-400">Everything is quiet right now.</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <button
                              key={notification.id}
                              onClick={() => openNotification(notification)}
                              className="flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50"
                            >
                              <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${notificationStyles[notification.tone]}`}>
                                {renderNotificationIcon(notification)}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-bold text-slate-800">{notification.title}</span>
                                <span className="mt-0.5 block truncate text-xs font-medium text-slate-500">{notification.detail}</span>
                                <span className="mt-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                  {formatTimeAgo(notification.time)}
                                </span>
                              </span>
                              <ChevronRight className="mt-2 text-slate-300" size={15} />
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            <div className="text-right">
              <div className="text-sm font-semibold text-text-main leading-tight">{profile?.name}</div>
              <div className="text-[11px] text-text-muted capitalize">{profile?.role}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center font-bold text-xs">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
              )}
            </div>
            <button
                onClick={handleLogout}
                className="p-2 text-text-muted hover:text-danger-theme transition-colors ml-2"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="p-8 max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
