import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDisplayTime } from './dateUtils';

test('formats 24-hour time strings as standard AM/PM', () => {
  assert.equal(formatDisplayTime('08:00'), '8:00 AM');
  assert.equal(formatDisplayTime('17:30'), '5:30 PM');
});

test('formats dates using the same AM/PM convention', () => {
  assert.equal(formatDisplayTime(new Date('2026-07-31T13:45:00')), '1:45 PM');
});
