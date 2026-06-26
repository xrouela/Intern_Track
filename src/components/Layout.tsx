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
  Play,
  Square,
  ShieldAlert,
  BarChart3,
  Bell,
  Settings,
  Shield,
  ListTodo,
  FileText,
  Inbox
} from 'lucide-react';
import { useState, useEffect } from 'react';

import { useAuth } from '../context/AuthContext';
import { api } from '../services/apiService';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  // Poll pending request count for admins/managers
  const fetchCount = async () => {
    const isAlt = profile?.role === 'admin' || profile?.role === 'superadmin' || profile?.role === 'manager';
    if (!isAlt) return;
    try {
      const { api } = await import('../services/apiService');
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

  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';
  const isManager = profile?.role === 'manager';
  const isAlt = isAdmin || isManager;

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
    },
    {
      label: 'System',
      roles: ['admin', 'manager'],
      items: [
        { name: 'Admin Overview', path: '/admin', icon: Shield, roles: ['admin', 'manager'] },
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
                if (group.roles && (!profile || (!group.roles.includes(profile.role) && !(profile.role === 'superadmin' && group.roles.includes('admin'))))) return null;
                const visibleItems = group.items.filter(item => !item.roles || (profile && (item.roles.includes(profile.role) || (profile.role === 'superadmin' && item.roles.includes('admin')))));
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

