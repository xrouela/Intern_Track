-- ============================================================
-- Migration: Remove deprecated attendance calculation columns
-- Database:  intern_track
-- Run in:   phpMyAdmin or MySQL CLI
-- ============================================================

ALTER TABLE shifts
  DROP COLUMN IF EXISTS lunch_deduction,
  DROP COLUMN IF EXISTS net_work_hours,
  DROP COLUMN IF EXISTS regular_hours;
