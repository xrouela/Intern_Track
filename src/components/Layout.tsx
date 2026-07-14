import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  LogOut, 
  Menu, 
  X,
  UserCircle,
  BarChart3,
  Bell,
  Shield,
  ListTodo,
  FileText,
  Inbox,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  CheckCheck
} from 'lucide-react';
import { useState, useEffect } from 'react';

import { useAuth } from '../context/AuthContext';
import { api } from '../services/apiService';


export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const unreadCount = notifications.length;

  const fetchNotifications = async () => {
    if (!profile?.uid) return;
    try {
      setNotifications(await api.getNotifications(profile.uid));
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [profile?.uid]);

  const markAllAsRead = async () => {
    if (!profile?.uid || notifications.length === 0) return;
    try {
      await api.markAllNotificationsRead(profile.uid);
      setNotifications([]);
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
    }
  };

  const markAsRead = async (id: number) => {
    if (!profile?.uid) return;
    try {
      await api.markNotificationRead(id, profile.uid);
      setNotifications((current) => current.filter((notification) => notification.id !== id));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const toggleNotifications = () => {
    if (!showNotifications) fetchNotifications();
    setShowNotifications((open) => !open);
  };

  const isReportPath = location.pathname === '/attendance-report' || location.pathname === '/task-report';
  const [reportsOpen, setReportsOpen] = useState(isReportPath);

  useEffect(() => {
    if (isReportPath) {
      setReportsOpen(true);
    }
  }, [location.pathname]);

  // Poll pending request count for admins/managers
  const fetchCount = async () => {
    const isAlt = profile?.role === 'admin' || profile?.role === 'manager';
    if (!isAlt) return;
    try {
      const data = await api.getPendingRequestCount();
      setPendingCount(data.count || 0);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [profile]);

  const handleLogout = async () => {
    logoutUser();
    navigate('/login');
  };

  const isAdmin = profile?.role === 'admin';
  const isManager = profile?.role === 'manager';
  const isAlt = isAdmin || isManager;

  const menuGroups = [
    {
      label: 'Main',
      items: [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'intern'] },
        { name: 'Tasks', path: '/tasks', icon: CheckSquare, roles: ['admin', 'manager', 'intern'] },
        { 
          name: 'Reports', 
          icon: BarChart3, 
          roles: ['intern'],
          children: [
            { name: 'Attendance Report', path: '/attendance-report' },
            { name: 'Task Report', path: '/task-report' }
          ]
        },
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
    },
    {
      label: 'System',
      roles: ['admin', 'manager'],
      items: [
        { name: 'Admin Overview', path: '/admin', icon: Shield, roles: ['admin', 'manager'] },
      ]
    }
  ];

  const flattenedItems = menuGroups.flatMap(g => 
    g.items.flatMap(item => {
      if (item.children) {
        return [{ name: item.name, path: item.children[0].path }, ...item.children];
      }
      return [item];
    })
  );

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
                    {visibleItems.map((item, iIdx) => {
                      if (item.children) {
                        return (
                          <div key={iIdx} className="space-y-1">
                            <button
                              onClick={() => setReportsOpen(!reportsOpen)}
                              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                                isReportPath
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-primary'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <item.icon size={18} strokeWidth={isReportPath ? 2.5 : 2} />
                                {item.name}
                              </div>
                              <ChevronDown 
                                size={16} 
                                className={`transition-transform duration-300 ${reportsOpen ? 'rotate-180' : ''}`} 
                              />
                            </button>
                            <div 
                              className={`overflow-hidden transition-all duration-300 ease-in-out ${reportsOpen ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}
                            >
                              <div className="pl-4 pr-2 py-1 space-y-1 border-l-2 border-slate-100 ml-6">
                                {item.children.map((child) => (
                                  <NavLink
                                    key={child.path}
                                    to={child.path}
                                    className={({ isActive }) =>
                                      `block px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                        isActive
                                          ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
                                          : 'text-slate-500 hover:bg-slate-50 hover:text-primary'
                                      }`
                                    }
                                    onClick={() => setSidebarOpen(false)}
                                  >
                                    {child.name}
                                  </NavLink>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
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
                      );
                    })}
                  </div>
                );
              })}

            </nav>

            <div className="mt-auto p-4 border-t border-border-theme space-y-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 hover:border-red-100 hover:shadow-sm transition-all"
              >
                <LogOut size={18} />
                Sign Out
              </button>

              <button
                className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-primary overflow-hidden flex items-center justify-center font-bold text-sm">
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-slate-800 leading-tight">{profile?.name}</div>
                    <div className="text-xs font-semibold text-slate-500 capitalize">{profile?.role}</div>
                  </div>
                </div>
                <ChevronDown size={16} className="text-slate-400" />
              </button>

              <button className="w-full flex items-center justify-between p-3 text-slate-600 hover:text-primary hover:bg-slate-50 rounded-xl transition-all">
                <div className="flex items-center gap-3 font-semibold text-sm">
                  <HelpCircle size={20} className="text-slate-400" />
                  Help & Support
                </div>
                <ChevronUp size={16} className="text-slate-400" />
              </button>
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
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={toggleNotifications}
                className="p-2 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-full transition-colors relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 flex flex-col max-h-[400px]">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                    <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">{unreadCount} New</span>
                        <button 
                          onClick={markAllAsRead}
                          className="text-[11px] font-bold text-slate-500 hover:text-primary flex items-center gap-1 transition-colors"
                        >
                          <CheckCheck size={14} /> Mark all read
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="overflow-y-auto custom-scrollbar flex-1">
                    {notifications.length > 0 ? (
                      notifications.map(notification => (
                        <div 
                          key={notification.id}
                          onClick={() => markAsRead(notification.id)}
                          className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer bg-primary/[0.02]"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <div className="text-sm font-semibold text-slate-800">
                              {notification.title}
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>
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

