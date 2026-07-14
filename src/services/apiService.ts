/**
 * API Service for interacting with the backend SQL database.
 */

export const api = {
  // Auth
  login: async (email: string, password?: string) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Login failed');
    }
    return res.json();
  },

  // Password Management
  resetPassword: async (uid: string, performedBy: string) => {
    const res = await fetch(`/api/users/${uid}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ performed_by: performedBy }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to reset password');
    }
    return res.json();
  },

  changePassword: async (uid: string, currentPassword: string, newPassword: string) => {
    const res = await fetch(`/api/users/${uid}/change-password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to change password');
    }
    return res.json();
  },

  getAuditLogs: async () => {
    const res = await fetch('/api/audit-logs');
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },
  recordActivity: async (activity: {
    action: string;
    performed_by: string;
    performed_by_name?: string;
    target_user?: string;
    target_user_name?: string;
    details?: string;
  }) => {
    const res = await fetch('/api/audit-logs/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activity),
    });
    if (!res.ok) throw new Error('Failed to record activity');
    return res.json();
  },

  // Notifications
  getNotifications: async (userId: string) => {
    const res = await fetch(`/api/notifications?user_id=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },
  markNotificationRead: async (id: number | string, userId: string) => {
    const res = await fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    if (!res.ok) throw new Error('Failed to mark notification as read');
    return res.json();
  },
  markAllNotificationsRead: async (userId: string) => {
    const res = await fetch('/api/notifications/read-all', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    if (!res.ok) throw new Error('Failed to mark notifications as read');
    return res.json();
  },
  broadcastNotification: async (data: { type: 'announcement' | 'system_alert'; title: string; message: string; roles?: string[] }) => {
    const res = await fetch('/api/notifications/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to send notification');
    return res.json();
  },

  // Users
  getUsers: async () => {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },
  getUser: async (uid: string) => {
    const res = await fetch(`/api/users/${uid}`);
    if (!res.ok) throw new Error('User not found');
    return res.json();
  },
  saveUser: async (user: any) => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to save user');
    }
    return res.json();
  },
  deleteUser: async (uid: string, performedBy: string) => {
    const res = await fetch(`/api/users/${uid}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ performed_by: performedBy })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to delete user');
    }
    return res.json();
  },

  // Tasks
  getTasks: async (assignedTo?: string) => {
    const url = assignedTo ? `/api/tasks?assigned_to=${assignedTo}` : '/api/tasks';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },
  createTask: async (task: any) => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to create task');
    }
    return res.json();
  },
  updateTask: async (id: number | string, task: any) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },

  // Shifts
  getShifts: async (userId?: string, status?: string) => {
    let url = '/api/shifts';
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId);
    if (status) params.append('status', status);
    if (params.toString()) url += `?${params.toString()}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch shifts');
    return res.json();
  },
  createShift: async (shift: any) => {
    const res = await fetch('/api/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shift),
    });
    if (!res.ok) throw new Error('Failed to create shift');
    return res.json();
  },
  updateShift: async (id: number | string, shift: any) => {
    const res = await fetch(`/api/shifts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shift),
    });
    if (!res.ok) throw new Error('Failed to update shift');
    return res.json();
  },

  // Logs
  getLogs: async (userId?: string, taskId?: string) => {
    let url = '/api/logs';
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId);
    if (taskId) params.append('task_id', taskId);
    if (params.toString()) url += `?${params.toString()}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch logs');
    return res.json();
  },
  createLog: async (log: any) => {
    const res = await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
    if (!res.ok) throw new Error('Failed to create log');
    return res.json();
  },
  updateLog: async (id: number | string, log: any) => {
    const res = await fetch(`/api/logs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
    if (!res.ok) throw new Error('Failed to update log');
    return res.json();
  },
  deleteLog: async (id: number | string) => {
    const res = await fetch(`/api/logs/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete log');
    return res.json();
  },

  deleteShift: async (id: number | string) => {
    const res = await fetch(`/api/shifts/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete shift');
    return res.json();
  },

  deleteTask: async (id: number | string) => {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete task');
    return res.json();
  },

  // Approvals
  getApprovals: async (logId?: string) => {
    const url = logId ? `/api/approvals?log_id=${logId}` : '/api/approvals';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch approvals');
    return res.json();
  },
  createApproval: async (approval: any) => {
    const res = await fetch('/api/approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(approval),
    });
    if (!res.ok) throw new Error('Failed to create approval');
    return res.json();
  },

  // Schedule Change Requests
  getScheduleRequests: async (userId?: string) => {
    const url = userId ? `/api/schedule-requests?user_id=${userId}` : '/api/schedule-requests';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch schedule requests');
    return res.json();
  },
  createScheduleRequest: async (data: any) => {
    const res = await fetch('/api/schedule-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create schedule request');
    return res.json();
  },
  updateScheduleRequest: async (id: number | string, data: any) => {
    const res = await fetch(`/api/schedule-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update schedule request');
    return res.json();
  },

  // Leave Requests
  getLeaveRequests: async (userId?: string) => {
    const url = userId ? `/api/leave-requests?user_id=${userId}` : '/api/leave-requests';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch leave requests');
    return res.json();
  },
  createLeaveRequest: async (data: any) => {
    const res = await fetch('/api/leave-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create leave request');
    return res.json();
  },
  updateLeaveRequest: async (id: number | string, data: any) => {
    const res = await fetch(`/api/leave-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update leave request');
    return res.json();
  },

  // Notification count (pending requests for admin)
  getPendingRequestCount: async () => {
    const res = await fetch('/api/pending-request-count');
    if (!res.ok) return { count: 0 };
    return res.json();
  },
};
