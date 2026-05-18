/**
 * Date helpers for movable holidays. All dates are constructed in UTC so
 * Prisma's @db.Date column stores the same calendar day regardless of the
 * server's local timezone.
 */

/** UTC midnight on (year, month, day). month is 1-indexed (1 = January). */
export function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Nth weekday of a given month. weekday is 0=Sun..6=Sat. n is 1-indexed.
 * Returns the date of the Nth occurrence; throws if n is out of range.
 *
 * Example: nthWeekdayOfMonth(2024, 5, 0, 2) === Mother's Day 2024 (May 12).
 */
export function nthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date {
  const first = utcDate(year, month, 1);
  const firstWeekday = first.getUTCDay();
  const offset = (weekday - firstWeekday + 7) % 7;
  const day = 1 + offset + (n - 1) * 7;
  // Sanity: stay within the same month
  const candidate = utcDate(year, month, day);
  if (candidate.getUTCMonth() !== month - 1) {
    throw new Error(`nthWeekdayOfMonth: ${year}-${month} has no ${n}th weekday=${weekday}`);
  }
  return candidate;
}

/** Last weekday of a given month (e.g., Memorial Day = last Mon of May). */
export function lastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
  // Start from the last day of the month and walk backwards.
  const nextMonthFirst = utcDate(year, month + 1, 1);
  const lastDay = new Date(nextMonthFirst.getTime() - 24 * 60 * 60 * 1000);
  const lastDayWeekday = lastDay.getUTCDay();
  const offset = (lastDayWeekday - weekday + 7) % 7;
  return new Date(lastDay.getTime() - offset * 24 * 60 * 60 * 1000);
}

/** date + n days, returned as a UTC midnight. */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

// Weekday constants for readability.
export const SUN = 0;
export const MON = 1;
export const TUE = 2;
export const WED = 3;
export const THU = 4;
export const FRI = 5;
export const SAT = 6;
