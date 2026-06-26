import knex from 'knex';
import path from 'path';

const db = knex({
  client: 'mysql2',
  connection: {
    host: '127.0.0.1',
    user: 'root',
    password: '', // Default XAMPP password is empty
    database: 'intern_track'
  }
});

export async function initDb() {
  const hasUsers = await db.schema.hasTable('users');
  if (!hasUsers) {
    await db.schema.createTable('users', (table) => {
      table.string('uid').primary();
      table.string('name').notNullable();
      table.string('email').notNullable().unique();
      table.string('role').notNullable();
      table.string('department');
      table.string('photoURL');
      table.string('start_date');
      table.string('end_date');
      table.integer('required_hours');
      table.string('schedule_start');
      table.string('schedule_end');
      table.json('active_task');
      table.timestamps(true, true);
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
      table.string('status').defaultTo('pending');
      table.string('priority').defaultTo('medium');
      table.timestamps(true, true);
    });
  }

  const hasShifts = await db.schema.hasTable('shifts');
  if (!hasShifts) {
    await db.schema.createTable('shifts', (table) => {
      table.increments('id').primary();
      table.string('user_id').references('users.uid');
      table.string('user_name');
      table.timestamp('clock_in').nullable();
      table.timestamp('clock_out').nullable();
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
