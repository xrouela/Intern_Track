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

  // USERS
  app.get('/api/users', async (req, res) => {
    try {
      const users = await db('users').select('*');
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.get('/api/users/:uid', async (req, res) => {
    try {
      const user = await db('users').where({ uid: req.params.uid }).first();
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  app.post('/api/users', async (req, res) => {
    try {
      const existing = await db('users').where({ uid: req.body.uid }).first();
      if (existing) {
        await db('users').where({ uid: req.body.uid }).update(req.body);
        return res.json({ success: true, updated: true });
      }
      await db('users').insert(req.body);
      res.json({ success: true, created: true });
    } catch (err) {
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
      
      const user = await db('users').where({ email }).first();
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Check if user has a password in the DB, and verify it
      if (!user.password) {
        return res.status(401).json({ error: 'Account password is not set. Please contact an administrator.' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Secure the returned user object (do not send the password hash to the frontend)
      const userProfile = { ...user };
      delete userProfile.password;

      res.json({ success: true, user: userProfile });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed due to an internal server error.' });
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
      // Guard: prevent duplicate active shifts for the same user
      if (req.body.user_id && req.body.status === 'active') {
        const existing = await db('shifts')
          .where({ user_id: req.body.user_id, status: 'active' })
          .first();
        if (existing) {
          return res.status(400).json({
            error: 'An active shift already exists. Please clock out first.'
          });
        }
      }
      const [id] = await db('shifts').insert(req.body);
      res.json({ id, ...req.body });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create shift' });
    }
  });

  app.patch('/api/shifts/:id', async (req, res) => {
    try {
      // Guard: validate clock_out is after clock_in when closing a shift
      if (req.body.clock_out) {
        const shift = await db('shifts').where({ id: req.params.id }).first();
        if (shift && shift.clock_in) {
          const clockIn = new Date(shift.clock_in).getTime();
          const clockOut = new Date(req.body.clock_out).getTime();
          if (clockOut <= clockIn) {
            return res.status(400).json({
              error: 'Clock-out time must be after clock-in time.'
            });
          }
        }
      }
      await db('shifts').where({ id: req.params.id }).update(req.body);
      res.json({ success: true });
    } catch (err) {
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
        host: '10.22.15.5',
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

  app.listen(PORT, '10.22.15.5', () => {
    console.log(`Server running on http://10.22.15.5:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
