import { differenceInMinutes } from 'date-fns';
import { parseUTCDate } from './dateUtils';

export interface AttendanceCalculation {
  total_hours: number;
  overtime_hours: number;
}

/**
 * Calculates attendance metrics based on clock-in and clock-out times.
 *
 * Rules:
 *   total_hours    = clock_out - clock_in (in hours, supports overnight/cross-date)
 *   overtime_hours = max(total_hours - 8, 0)
 *
 * Throws if clock_out is not after clock_in.
 */
export function calculateAttendance(clockIn: Date, clockOut: Date): AttendanceCalculation {
  if (clockOut <= clockIn) {
    throw new Error('Clock-out time must be after clock-in time.');
  }

  const diffInMinutes = differenceInMinutes(clockOut, clockIn);
  const totalHours = diffInMinutes / 60;
  const overtimeHours = Math.max(totalHours - 8, 0);

  return {
    total_hours: totalHours,
    overtime_hours: overtimeHours,
  };
}

export function getShiftHoursValue(shift: any): number {
  if (typeof shift?.total_hours === 'number' && Number.isFinite(shift.total_hours)) {
    return Number(shift.total_hours);
  }

  if (shift?.clock_in && shift?.clock_out) {
    const clockIn = parseUTCDate(shift.clock_in);
    const clockOut = parseUTCDate(shift.clock_out);
    const diffMs = clockOut.getTime() - clockIn.getTime();

    if (diffMs > 0) {
      return Number((diffMs / 3600000).toFixed(2));
    }
  }

  return 0;
}

export function getTrackedHours(logs: any[] = [], shifts: any[] = []): number {
  const taskHours = logs.reduce((acc, log) => acc + Number(log?.rendered_hours || 0), 0);
  const shiftHours = shifts.reduce((acc, shift) => acc + getShiftHoursValue(shift), 0);
  return Number((taskHours + shiftHours).toFixed(2));
}

/**
 * Compute hours using the same DTR rules used by the attendance report UI.
 * This mirrors `computeHours` from the DTR generator: overnight support,
 * optional 1-hour lunch deduction for shifts >5h, and optional rounding.
 */
export function computeDTRHoursFromHHMM(timeIn: string, timeOut: string, deductLunch = true, roundHours = false): number {
  if (!timeIn || !timeOut) return 0;
  const [h1, m1] = timeIn.split(':').map(Number);
  const [h2, m2] = timeOut.split(':').map(Number);
  if (Number.isNaN(h1) || Number.isNaN(m1) || Number.isNaN(h2) || Number.isNaN(m2)) return 0;
  let start = h1 * 60 + m1;
  let end = h2 * 60 + m2;
  if (end <= start) end += 24 * 60; // overnight shift
  let hrs = (end - start) / 60;
  if (deductLunch && hrs > 5) hrs -= 1;
  if (roundHours) {
    const frac = hrs % 1;
    const whole = Math.floor(hrs);
    if (frac < 0.25) hrs = whole;
    else if (frac < 0.75) hrs = whole + 0.5;
    else hrs = whole + 1;
  }
  return Math.max(0, Number(hrs.toFixed(2)));
}

/**
 * For a shift object with `clock_in` and `clock_out` timestamps, compute
 * the DTR-style hours. This mirrors the DTRGenerator's behavior which
 * converts parsed Date -> ISO string slice(11,16) to produce HH:mm.
 */
export function getDTRShiftHours(shift: any, deductLunch = true, roundHours = false): number {
  if (!shift?.clock_in || !shift?.clock_out) return 0;
  try {
    const clockIn = parseUTCDate(shift.clock_in);
    const clockOut = parseUTCDate(shift.clock_out);
    const timeIn = clockIn.toISOString().slice(11, 16);
    const timeOut = clockOut.toISOString().slice(11, 16);
    return computeDTRHoursFromHHMM(timeIn, timeOut, deductLunch, roundHours);
  } catch (err) {
    return 0;
  }
}

/**
 * Sum task-rendered hours and DTR-style shift hours to match the
 * Attendance Report total shown in the DTR generator UI.
 */
export function getDTRTotalHours(logs: any[] = [], shifts: any[] = [], deductLunch = true, roundHours = false): number {
  const taskHours = logs.reduce((acc, log) => acc + Number(log?.rendered_hours || 0), 0);
  const shiftHours = shifts.reduce((acc, shift) => acc + getDTRShiftHours(shift, deductLunch, roundHours), 0);
  return Number((taskHours + shiftHours).toFixed(2));
}
