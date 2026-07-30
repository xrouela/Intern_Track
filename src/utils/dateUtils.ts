import { format as formatDate } from 'date-fns';

/**
 * Robust UTC Date Parser for Asia/Manila (UTC+8) environment
 * Prevents the classic 8-hour offset bug
 */
export function parseUTCDate(dateStr: any): Date {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;

  const str = String(dateStr).trim();

  // Already has timezone info → let native parser handle it
  if (str.includes('Z') || str.includes('+') || str.includes('GMT')) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  // Most common case: MySQL timestamp "2025-05-08 07:49:00"
  const regex = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/;
  const match = str.match(regex);

  if (match) {
    const [_, year, month, day, hour, minute, second] = match.map(Number);
    // Force UTC using Date.UTC → This fixes the 8-hour shift
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  }

  // Fallback: Force UTC by appending 'Z'
  const withZ = str.endsWith('Z') ? str : str + 'Z';
  const fallback = new Date(withZ);

  if (!isNaN(fallback.getTime())) {
    return fallback;
  }

  console.warn('⚠️ parseUTCDate fallback used for:', str);
  return new Date(str);
}

/**
 * Format seconds into HH:mm:ss
 */
export function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safe / 3600).toString().padStart(2, '0');
  const m = Math.floor((safe % 3600) / 60).toString().padStart(2, '0');
  const s = (safe % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/**
 * Format a time value using standard 12-hour AM/PM display.
 */
export function formatDisplayTime(value: any): string {
  if (!value && value !== 0) return '--:--';

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '--:--';

    if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(trimmed)) {
      const [hours, minutes] = trimmed.split(':').map(Number);
      return formatDate(new Date(2000, 0, 1, hours, minutes, 0), 'h:mm a');
    }

    const parsed = parseUTCDate(trimmed);
    if (!isNaN(parsed.getTime())) {
      return formatDate(parsed, 'h:mm a');
    }

    return trimmed;
  }

  if (value instanceof Date) {
    return formatDate(value, 'h:mm a');
  }

  return String(value);
}

/**
 * Get duration in hours between two dates
 */
export function getDurationInHours(start: any, end: any): number {
  if (!start || !end) return 0;
  const startTime = parseUTCDate(start).getTime();
  const endTime = parseUTCDate(end).getTime();
  let hrs = (endTime - startTime) / (1000 * 3600);
  if (hrs > 5) hrs -= 1;
  return Math.max(0, hrs);
}