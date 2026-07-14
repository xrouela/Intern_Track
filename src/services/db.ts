import knex from 'knex';
import path from 'path';

const db = knex({
  client: 'mysql2',
  connection: {
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'intern_track',
  timezone: '+08:00'
}
});

export async function initDb() {
  const hasUsers = await db.schema.hasTable('users');
  if (!hasUsers) {
    await db.schema.createTable('users', (table) => {
      table.string('uid').primary();
      table.string('name').notNullable();
      table.string('email').notNullable().unique();
      table.string('username').unique().nullable();
      table.string('employee_id').nullable();
      table.string('password', 255); // bcrypt hash
      table.boolean('is_default_password').defaultTo(true);
      table.string('role').notNullable();
      table.string('department');
      table.string('photoURL');
      table.string('school');
      table.string('program');
      table.string('year_level');
      table.string('emergency_contact_name');
      table.string('emergency_contact_relation');
      table.string('emergency_contact_phone');
      table.string('emergency_contact_email');
      table.string('emergency_contact_location');
      table.json('skills');
      table.json('documents');
      table.string('start_date');
      table.string('end_date');
      table.integer('required_hours');
      table.string('schedule_start');
      table.string('schedule_end');
      table.json('active_task');
      table.timestamps(true, true);
    });
  } else {
    // Migrations: add columns to existing tables that don't have them
    const migrations: Array<{ col: string; add: (t: any) => void }> = [
      { col: 'password', add: (t) => t.string('password', 255).nullable() },
      { col: 'username', add: (t) => t.string('username').nullable() },
      { col: 'employee_id', add: (t) => t.string('employee_id').nullable() },
      { col: 'is_default_password', add: (t) => t.boolean('is_default_password').defaultTo(true) },
      { col: 'program', add: (t) => t.string('program').nullable() },
      { col: 'year_level', add: (t) => t.string('year_level').nullable() },
      { col: 'emergency_contact_name', add: (t) => t.string('emergency_contact_name').nullable() },
      { col: 'emergency_contact_relation', add: (t) => t.string('emergency_contact_relation').nullable() },
      { col: 'emergency_contact_phone', add: (t) => t.string('emergency_contact_phone').nullable() },
      { col: 'emergency_contact_email', add: (t) => t.string('emergency_contact_email').nullable() },
      { col: 'emergency_contact_location', add: (t) => t.string('emergency_contact_location').nullable() },
      { col: 'school', add: (t) => t.string('school').nullable() },
      { col: 'skills', add: (t) => t.json('skills').nullable() },
      { col: 'documents', add: (t) => t.json('documents').nullable() },
    ];
    for (const m of migrations) {
      const exists = await db.schema.hasColumn('users', m.col);
      if (!exists) {
        await db.schema.table('users', m.add);
      }
    }
  }

  // Audit logs table
  const hasAuditLogs = await db.schema.hasTable('audit_logs');
  if (!hasAuditLogs) {
    await db.schema.createTable('audit_logs', (table) => {
      table.increments('id').primary();
      table.string('action').notNullable(); // e.g. PASSWORD_RESET
      table.string('performed_by'); // uid of admin
      table.string('performed_by_name');
      table.string('target_user'); // uid of target
      table.string('target_user_name');
      table.text('details').nullable();
      table.timestamps(true, true);
    });
  }

  const hasNotifications = await db.schema.hasTable('notifications');
  if (!hasNotifications) {
    await db.schema.createTable('notifications', (table) => {
      table.increments('id').primary();
      table.string('recipient_id').notNullable().references('users.uid');
      table.string('type').notNullable();
      table.string('title').notNullable();
      table.text('message').notNullable();
      table.boolean('is_read').notNullable().defaultTo(false);
      table.dateTime('read_at').nullable();
      table.timestamps(true, true);
      table.index(['recipient_id', 'is_read']);
    });
  }

  const hasTasks = await db.schema.hasTable('tasks');
  if (!hasTasks) {
    await db.schema.createTable('tasks', (table) => {
      table.increments('id').primary();
      table.string('title').notNullable();
      table.text('description');
      table.string('assigned_to').references('users.uid');
      table.string('assigned_to_name');
      table.string('start_date');
      table.string('end_date');
      table.float('estimated_hours');
      table.string('ticket_link');
      table.string('status').defaultTo('pending');
      table.string('priority').defaultTo('medium');
      table.timestamps(true, true);
    });
  } else if (!(await db.schema.hasColumn('tasks', 'ticket_link'))) {
    await db.schema.alterTable('tasks', (table) => {
      table.string('ticket_link');
    });
  }

  const hasShifts = await db.schema.hasTable('shifts');
  if (!hasShifts) {
    await db.schema.createTable('shifts', (table) => {
      table.increments('id').primary();
      table.string('user_id').references('users.uid');
      table.string('user_name');
      table.dateTime('clock_in').nullable();
      table.dateTime('clock_out').nullable();
      table.string('status');
      table.float('total_hours');
      table.float('overtime_hours');
      table.boolean('is_late');
      table.boolean('is_overtime');
      table.boolean('is_undertime');
      table.boolean('manual_entry').defaultTo(false);
      table.string('source');
      table.string('description');
      table.string('audit_label');
      table.string('imported_by_id');
      table.string('imported_by_name');
      table.json('edit_history');
      table.timestamps(true, true);
    });
  } else {
    try {
      await db.raw('ALTER TABLE shifts MODIFY clock_in DATETIME NULL, MODIFY clock_out DATETIME NULL');
    } catch (err) {
      console.warn('Could not update shifts clock columns to DATETIME:', err);
    }
  }

  const hasLogs = await db.schema.hasTable('time_logs');
  if (!hasLogs) {
    await db.schema.createTable('time_logs', (table) => {
      table.increments('id').primary();
      table.string('user_id');
      table.string('user_name');
      table.integer('task_id');
      table.string('task_name');
      table.string('date');
      table.string('date_out');
      table.string('start_time');
      table.string('end_time');
      table.float('rendered_hours');
      table.text('description');
      table.string('status').defaultTo('pending');
      table.timestamps(true, true);
    });
  } else {
    const hasDateOut = await db.schema.hasColumn('time_logs', 'date_out');
    if (!hasDateOut) {
      await db.schema.table('time_logs', (table) => {
        table.string('date_out');
      });
    }
  }

  const hasApprovals = await db.schema.hasTable('approvals');
  if (!hasApprovals) {
    await db.schema.createTable('approvals', (table) => {
      table.increments('id').primary();
      table.string('log_id');
      table.string('approved_by');
      table.string('approved_by_name');
      table.string('status');
      table.text('comments');
      table.timestamps(true, true);
    });
  }

  const hasScheduleRequests = await db.schema.hasTable('schedule_change_requests');
  if (!hasScheduleRequests) {
    await db.schema.createTable('schedule_change_requests', (table) => {
      table.increments('id').primary();
      table.string('user_id').references('users.uid');
      table.string('user_name');
      table.string('request_date');
      table.string('affected_date');
      table.string('current_time_in');
      table.string('current_time_out');
      table.string('requested_time_in');
      table.string('requested_time_out');
      table.text('reason');
      table.text('attachment_base64').nullable();
      table.string('attachment_name').nullable();
      table.string('status').defaultTo('pending');
      table.string('reviewed_by').nullable();
      table.string('reviewed_by_name').nullable();
      table.text('review_notes').nullable();
      table.timestamps(true, true);
    });
  }

  const hasLeaveRequests = await db.schema.hasTable('leave_requests');
  if (!hasLeaveRequests) {
    await db.schema.createTable('leave_requests', (table) => {
      table.increments('id').primary();
      table.string('user_id').references('users.uid');
      table.string('user_name');
      table.string('request_date');
      table.string('leave_type');
      table.string('start_date');
      table.string('end_date');
      table.text('reason');
      table.text('attachment_base64').nullable();
      table.string('attachment_name').nullable();
      table.string('status').defaultTo('pending');
      table.string('reviewed_by').nullable();
      table.string('reviewed_by_name').nullable();
      table.text('review_notes').nullable();
      table.timestamps(true, true);
    });
  }
}

export default db;


