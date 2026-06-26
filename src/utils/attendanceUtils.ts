import { differenceInMinutes } from 'date-fns';

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
