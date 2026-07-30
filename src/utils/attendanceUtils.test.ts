import test from 'node:test';
import assert from 'node:assert/strict';
import { getTrackedHours, getShiftHoursValue } from './attendanceUtils';
import { getDTRTotalHours } from './attendanceUtils';

test('prefers persisted shift hours over inferred duration', () => {
  const shift = {
    total_hours: 7.5,
    clock_in: '2025-01-01T08:00:00.000Z',
    clock_out: '2025-01-01T17:00:00.000Z',
  };

  assert.equal(getShiftHoursValue(shift), 7.5);
});

test('sums task logs and attendance shifts with a shared helper', () => {
  const logs = [{ rendered_hours: 2.5 }, { rendered_hours: 1.25 }];
  const shifts = [
    { total_hours: 4.5 },
    { clock_in: '2025-01-01T08:00:00.000Z', clock_out: '2025-01-01T17:00:00.000Z' },
  ];

  assert.equal(getTrackedHours(logs, shifts), 17.25);
});

test('computes DTR-style totals (deduct lunch, no rounding) matching DTR generator', () => {
  const logs = [{ rendered_hours: 2.5 }, { rendered_hours: 1.25 }];
  const shifts = [
    { clock_in: '2025-01-01 08:00:00', clock_out: '2025-01-01 17:00:00' }, // 8h -> deduct 1 => 7
    { clock_in: '2025-01-02 12:00:00', clock_out: '2025-01-02 20:00:00' }, // 8h -> deduct 1 => 7
  ];

  // Task hours: 3.75, Shift hours: 15 (8 + 7) => total 18.75
  assert.equal(getDTRTotalHours(logs, shifts, true, false), 18.75);
});
