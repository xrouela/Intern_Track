import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { initDb } from '../src/services/db.ts';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Initialize database
  await initDb();

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Helper: strip password from user object
  const stripPassword = (user: any) => {
    if (!user) return user;
    const { password, ...safe } = user;
    return safe;
  };

  // Helper: generate username from full name
  const generateUsername = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const APP_TIME_ZONE = 'Asia/Manila';
  const MANILA_OFFSET_HOURS = 8;
  const localDateTimePattern = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/;

  const parseShiftDate = (value: any) => {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

    const str = String(value).trim();
    const localMatch = str.match(localDateTimePattern);
    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2}|GMT)$/i.test(str);

    if (localMatch && !hasTimezone) {
      const [, year, month, day, hour, minute, second] = localMatch.map(Number);
      return new Date(Date.UTC(year, month - 1, day, hour - MANILA_OFFSET_HOURS, minute, second));
    }

    const parsed = new Date(str);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatManilaDateTime = (date: Date) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: APP_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(date);

    const get = (type: string) => parts.find((part) => part.type === type)?.value || '00';
    return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
  };

  const getScheduledDuration = async (userId?: string) => {
    if (!userId) return 8;

    const user = await db('users')
      .select('schedule_start', 'schedule_end')
      .where({ uid: userId })
      .first();

    if (!user?.schedule_start || !user?.schedule_end) return 8;

    const [startHours = 0, startMins = 0] = String(user.schedule_start).split(':').map(Number);
    const [endHours = 0, endMins = 0] = String(user.schedule_end).split(':').map(Number);
    const startMinutes = startHours * 60 + startMins;
    let endMinutes = endHours * 60 + endMins;
    if (endMinutes <= startMinutes) endMinutes += 24 * 60;

    return Math.max(0, (endMinutes - startMinutes) / 60);
  };

  const normalizeShiftPayload = async (payload: any, existingShift?: any) => {
    const normalized = { ...payload };
    const clockIn = parseShiftDate(normalized.clock_in ?? existingShift?.clock_in);
    const clockOut = parseShiftDate(normalized.clock_out ?? existingShift?.clock_out);

    if ('clock_in' in normalized && clockIn) {
      normalized.clock_in = formatManilaDateTime(clockIn);
    }

    if ('clock_out' in normalized && clockOut) {
      normalized.clock_out = formatManilaDateTime(clockOut);
    }

    if (clockIn && clockOut) {
      if (clockOut <= clockIn) {
        throw new Error('Clock-out time must be after clock-in time.');
      }

      const totalHours = Number(((clockOut.getTime() - clockIn.getTime()) / 3600000).toFixed(2));
      const scheduledDuration = await getScheduledDuration(normalized.user_id ?? existingShift?.user_id);

      normalized.total_hours = totalHours;
      normalized.overtime_hours = Number(Math.max(totalHours - scheduledDuration, 0).toFixed(2));
      normalized.is_overtime = totalHours > scheduledDuration;
    }

    return normalized;
  };

  // USERS
  app.get('/api/users', async (req, res) => {
    try {
      const users = await db('users').select('*');
      res.json(users.map(stripPassword));
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.get('/api/users/:uid', async (req, res) => {
    try {
      const user = await db('users').where({ uid: req.params.uid }).first();
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(stripPassword(user));
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  app.post('/api/users', async (req, res) => {
    try {
      const userData = { ...req.body };

      const existing = await db('users').where({ uid: userData.uid }).first();

      if (existing) {
        // UPDATE existing user
        // Hash password only if explicitly provided (admin set a new one)
        if (userData.password) {
          userData.password = await bcrypt.hash(userData.password, 10);
          userData.is_default_password = false;
        } else {
          delete userData.password;
        }
        await db('users').where({ uid: userData.uid }).update(userData);
        return res.json({ success: true, updated: true });
      }

      // CREATE new user
      // Auto-generate username from name if not provided
      if (!userData.username && userData.name) {
        userData.username = generateUsername(userData.name);
      }

      // Generate default password: username@employee_id
      let defaultPassword = '';
      if (userData.username && userData.employee_id) {
        defaultPassword = `${userData.username}@${userData.employee_id}`;
        userData.password = await bcrypt.hash(defaultPassword, 10);
        userData.is_default_password = true;
      } else if (userData.password) {
        // Fallback: if password is provided directly (legacy)
        defaultPassword = userData.password;
        userData.password = await bcrypt.hash(userData.password, 10);
        userData.is_default_password = false;
      }

      await db('users').insert(userData);
      res.json({ success: true, created: true, defaultPassword });
    } catch (err) {
      console.error('Failed to save user:', err);
      res.status(500).json({ error: 'Failed to save user' });
    }
  });

  // LOGIN (Local Auth with Secure Password Verification)
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      // Allow login by email or username
      const user = await db('users')
        .where({ email })
        .orWhere({ username: email })
        .first();
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      if (!user.password) {
        return res.status(401).json({ error: 'Account password is not set. Please contact an administrator.' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Return user profile without password hash
      const userProfile = stripPassword(user);

      try {
        await db('audit_logs').insert({
          action: 'USER_LOGIN',
          performed_by: user.uid,
          performed_by_name: user.name,
          target_user: user.uid,
          target_user_name: user.name,
          details: `${user.name} signed in`,
        });
      } catch (auditErr) {
        console.warn('Login audit log failed:', auditErr);
      }

      res.json({ success: true, user: userProfile });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed due to an internal server error.' });
    }
  });

  // RESET PASSWORD (Admin/SuperAdmin only)
  app.post('/api/users/:uid/reset-password', async (req, res) => {
    try {
      const { performed_by } = req.body; // uid of admin performing reset
      const targetUid = req.params.uid;

      // Verify the performing user is admin/manager
      if (performed_by) {
        const admin = await db('users').where({ uid: performed_by }).first();
        if (!admin || (admin.role !== 'admin' && admin.role !== 'manager')) {
          return res.status(403).json({ error: 'Only administrators or managers can reset passwords.' });
        }

        const target = await db('users').where({ uid: targetUid }).first();
        if (!target) return res.status(404).json({ error: 'User not found' });

        if (!target.username || !target.employee_id) {
          return res.status(400).json({ error: 'Cannot reset password: user has no username or ID number set. Please edit the user first.' });
        }

        const defaultPassword = `${target.username}@${target.employee_id}`;
        const hashed = await bcrypt.hash(defaultPassword, 10);

        await db('users').where({ uid: targetUid }).update({
          password: hashed,
          is_default_password: true,
        });

        // Audit log
        await db('audit_logs').insert({
          action: 'PASSWORD_RESET',
          performed_by: admin.uid,
          performed_by_name: admin.name,
          target_user: target.uid,
          target_user_name: target.name,
          details: `Password reset to default for ${target.username}`,
        });

        return res.json({ success: true, defaultPassword });
      }

      res.status(400).json({ error: 'Missing performed_by field' });
    } catch (err) {
      console.error('Reset password error:', err);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  // CHANGE PASSWORD (Self-service)
  app.patch('/api/users/:uid/change-password', async (req, res) => {
    try {
      const { current_password, new_password } = req.body;
      const uid = req.params.uid;

      if (!current_password || !new_password) {
        return res.status(400).json({ error: 'Current and new passwords are required.' });
      }

      if (new_password.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters.' });
      }

      const user = await db('users').where({ uid }).first();
      if (!user) return res.status(404).json({ error: 'User not found' });

      if (!user.password) {
        return res.status(400).json({ error: 'No current password set. Contact an administrator.' });
      }

      const match = await bcrypt.compare(current_password, user.password);
      if (!match) {
        return res.status(401).json({ error: 'Current password is incorrect.' });
      }

      // Ensure new password differs from current
      const sameAsOld = await bcrypt.compare(new_password, user.password);
      if (sameAsOld) {
        return res.status(400).json({ error: 'New password must be different from your current password.' });
      }

      const hashed = await bcrypt.hash(new_password, 10);
      await db('users').where({ uid }).update({
        password: hashed,
        is_default_password: false,
      });

      res.json({ success: true });
    } catch (err) {
      console.error('Change password error:', err);
      res.status(500).json({ error: 'Failed to change password' });
    }
  });

  // AUDIT LOGS
  app.get('/api/audit-logs', async (req, res) => {
    try {
      const logs = await db('audit_logs').select('*').orderBy('created_at', 'desc').limit(100);
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  });

  // DELETE USER
  app.delete('/api/users/:uid', async (req, res) => {
    try {
      const targetUid = req.params.uid;
      const { performed_by } = req.body;

      if (!performed_by) {
        return res.status(400).json({ error: 'Missing performed_by field' });
      }

      if (targetUid === performed_by) {
        return res.status(400).json({ error: 'You cannot delete your own account' });
      }

      const currentUser = await db('users').where({ uid: performed_by }).first();
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
        return res.status(403).json({ error: 'Unauthorized to delete users' });
      }

      await db.transaction(async (trx) => {
        await trx('tasks').where({ assigned_to: targetUid }).del();
        await trx('shifts').where({ user_id: targetUid }).del();
        await trx('time_logs').where({ user_id: targetUid }).del();
        await trx('schedule_change_requests').where({ user_id: targetUid }).del();
        await trx('leave_requests').where({ user_id: targetUid }).del();
        await trx('users').where({ uid: targetUid }).del();
      });

      res.json({ success: true });
    } catch (err) {
      console.error('Failed to delete user:', err);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // TASKS
  app.get('/api/tasks', async (req, res) => {
    try {
      const { assigned_to } = req.query;
      const query = db('tasks').select('*');
      if (assigned_to) query.where({ assigned_to });
      const tasks = await query;
      res.json(tasks);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  app.post('/api/tasks', async (req, res) => {
    try {
      const [id] = await db('tasks').insert(req.body);
      res.json({ id, ...req.body });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create task' });
    }
  });

  app.patch('/api/tasks/:id', async (req, res) => {
    try {
      await db('tasks').where({ id: req.params.id }).update(req.body);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  app.delete('/api/tasks/:id', async (req, res) => {
    try {
      await db('tasks').where({ id: req.params.id }).delete();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete task' });
    }
  });

  // SHIFTS
  app.get('/api/shifts', async (req, res) => {
    try {
      const { user_id, status } = req.query;
      const query = db('shifts').select('*');
      if (user_id) query.where({ user_id });
      if (status) query.where({ status });
      const shifts = await query;
      res.json(shifts);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch shifts' });
    }
  });

  app.post('/api/shifts', async (req, res) => {
    try {
      const shiftPayload = await normalizeShiftPayload(req.body);
      // Guard: prevent duplicate active shifts for the same user
      if (shiftPayload.user_id && shiftPayload.status === 'active') {
        const existing = await db('shifts')
          .where({ user_id: shiftPayload.user_id, status: 'active' })
          .first();
        if (existing) {
          return res.status(400).json({
            error: 'An active shift already exists. Please clock out first.'
          });
        }
      }
      const [id] = await db('shifts').insert(shiftPayload);
      res.json({ id, ...shiftPayload });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create shift' });
    }
  });

  app.patch('/api/shifts/:id', async (req, res) => {
    try {
      // Guard: validate clock_out is after clock_in when closing a shift
      const shift = await db('shifts').where({ id: req.params.id }).first();
      const shiftPayload = await normalizeShiftPayload(req.body, shift);
      await db('shifts').where({ id: req.params.id }).update(shiftPayload);
      res.json({ success: true });
    } catch (err: any) {
      if (err?.message === 'Clock-out time must be after clock-in time.') {
        return res.status(400).json({ error: err.message });
      }
      res.status(500).json({ error: 'Failed to update shift' });
    }
  });

  app.delete('/api/shifts/:id', async (req, res) => {
    try {
      await db('shifts').where({ id: req.params.id }).delete();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete shift' });
    }
  });

  // TIME LOGS
  app.get('/api/logs', async (req, res) => {
    try {
      const { user_id, task_id } = req.query;
      const query = db('time_logs').select('*');
      if (user_id) query.where({ user_id });
      if (task_id) query.where({ task_id });
      const logs = await query;
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  });

  app.post('/api/logs', async (req, res) => {
    try {
      const [id] = await db('time_logs').insert(req.body);
      res.json({ id, ...req.body });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create log' });
    }
  });

  app.patch('/api/logs/:id', async (req, res) => {
    try {
      await db('time_logs').where({ id: req.params.id }).update(req.body);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update log' });
    }
  });

  app.delete('/api/logs/:id', async (req, res) => {
    try {
      await db('time_logs').where({ id: req.params.id }).delete();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete log' });
    }
  });

  // APPROVALS
  app.get('/api/approvals', async (req, res) => {
    try {
      const { log_id } = req.query;
      const query = db('approvals').select('*');
      if (log_id) query.where({ log_id });
      const approvals = await query;
      res.json(approvals);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch approvals' });
    }
  });

  app.post('/api/approvals', async (req, res) => {
    try {
      const [id] = await db('approvals').insert(req.body);
      res.json({ id, ...req.body });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create approval' });
    }
  });

  // SCHEDULE CHANGE REQUESTS
  app.get('/api/schedule-requests', async (req, res) => {
    try {
      const { user_id } = req.query;
      const query = db('schedule_change_requests').select('*').orderBy('created_at', 'desc');
      if (user_id) query.where({ user_id });
      res.json(await query);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch schedule requests' }); }
  });

  app.post('/api/schedule-requests', async (req, res) => {
    try {
      const [id] = await db('schedule_change_requests').insert(req.body);
      res.json({ id, ...req.body });
    } catch (err) { res.status(500).json({ error: 'Failed to create schedule request' }); }
  });

  app.patch('/api/schedule-requests/:id', async (req, res) => {
    try {
      await db('schedule_change_requests').where({ id: req.params.id }).update(req.body);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to update schedule request' }); }
  });

  // LEAVE REQUESTS
  app.get('/api/leave-requests', async (req, res) => {
    try {
      const { user_id } = req.query;
      const query = db('leave_requests').select('*').orderBy('created_at', 'desc');
      if (user_id) query.where({ user_id });
      res.json(await query);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch leave requests' }); }
  });

  app.post('/api/leave-requests', async (req, res) => {
    try {
      const [id] = await db('leave_requests').insert(req.body);
      res.json({ id, ...req.body });
    } catch (err) { res.status(500).json({ error: 'Failed to create leave request' }); }
  });

  app.patch('/api/leave-requests/:id', async (req, res) => {
    try {
      await db('leave_requests').where({ id: req.params.id }).update(req.body);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to update leave request' }); }
  });

  // PENDING COUNT (for admin notification badge)
  app.get('/api/pending-request-count', async (req, res) => {
    try {
      const [sc] = await db('schedule_change_requests').where({ status: 'pending' }).count('id as n');
      const [lr] = await db('leave_requests').where({ status: 'pending' }).count('id as n');
      const count = Number((sc as any).n) + Number((lr as any).n);
      res.json({ count });
    } catch (err) { res.json({ count: 0 }); }
  });

  // --- VITE / STATIC ASSETS ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serving static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

