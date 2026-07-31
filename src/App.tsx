import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import TimeLogs from './pages/attendance/TimeLogs';
import Admin from './pages/admin/Admin';
import UserManagement from './pages/admin/UserManagement';
import QuickAlerts from './pages/admin/QuickAlerts';
import Reports from './pages/admin/Reports';
import AttendanceLogs from './pages/attendance/AttendanceLogs';
import Login from './pages/auth/Login';
import Profile from './pages/auth/Profile';
import { useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

import DTRGenerator from './pages/attendance/DTRGenerator';
import Requests from './pages/Requests';
import AdminRequests from './pages/admin/AdminRequests';
import AttendanceReport from './pages/reports/AttendanceReport';
import TaskReport from './pages/reports/TaskReport';
import Departments from './pages/admin/Departments';
import ArchivedInterns from './pages/admin/ArchivedInterns';
import About from './pages/About';
import PrivacyNotice from './pages/PrivacyNotice';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, profile, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  
  if (roles && profile) {
    const hasAccess = roles.includes(profile.role) || (profile.role === 'admin' && roles.includes('manager'));
    if (!hasAccess) return <Navigate to="/" />;
  }

  return <ErrorBoundary>{children}</ErrorBoundary>;
}

function Home() {
  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Home />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="attendance-logs" element={<AttendanceLogs />} />
              <Route path="logs" element={<TimeLogs />} />
              <Route path="dtr-generator" element={<DTRGenerator />} />
              <Route path="attendance-report" element={<AttendanceReport />} />
              <Route path="task-report" element={<TaskReport />} />
              <Route path="requests" element={<Requests />} />
              <Route path="profile" element={<Profile />} />
              <Route path="about" element={<About />} />
              <Route path="privacy" element={<PrivacyNotice />} />
              <Route path="admin" element={<Navigate to="/" replace />} />
              <Route
                path="users"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route path="departments" element={<ProtectedRoute roles={['admin']}><Departments /></ProtectedRoute>} />
              <Route path="archived-interns" element={<ProtectedRoute roles={['admin']}><ArchivedInterns /></ProtectedRoute>} />
              <Route
                path="alerts"
                element={
                  <ProtectedRoute roles={['admin', 'manager']}>
                    <QuickAlerts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin-requests"
                element={
                  <ProtectedRoute roles={['admin', 'manager']}>
                    <AdminRequests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="task-work-logs"
                element={
                  <ProtectedRoute roles={['admin', 'manager']}>
                    <TimeLogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reports"
                element={
                  <ProtectedRoute roles={['admin', 'manager']}>
                    <Reports />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </AuthProvider>
  );
}
