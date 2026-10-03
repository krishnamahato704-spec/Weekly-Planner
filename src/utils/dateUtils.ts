/**
 * Date utilities for Sunday-centric weekly planning
 */

/**
 * Returns the Date object representing the Sunday of the week containing the given date.
 * If the given date is Sunday, it returns that date (reset to midnight).
 */
export function getSunday(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday, etc.
  d.setDate(d.getDate() - day);
  return d;
}

/**
 * Formats a Date into standard YYYY-MM-DD
 */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a Sunday date into friendly title, e.g. "Week of Sunday, Sep 27"
 */
export function formatWeekTitle(dateKeyOrDate: string | Date): string {
  const date = typeof dateKeyOrDate === 'string' ? parseDateKey(dateKeyOrDate) : dateKeyOrDate;
  const monthName = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `Week of Sunday, ${monthName} ${day}`;
}

/**
 * Parses YYYY-MM-DD or ISO string safely into a local Date
 */
export function parseDateKey(key: string): Date {
  if (!key) return new Date();
  if (key.includes('T')) {
    const d = new Date(key);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  const parts = key.split('-').map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  const parsed = new Date(key);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Returns the previous Sunday relative to a given Sunday date
 */
export function getPreviousSunday(currentSunday: Date): Date {
  const d = new Date(currentSunday);
  d.setDate(d.getDate() - 7);
  return d;
}

/**
 * Returns the next Sunday relative to a given Sunday date
 */
export function getNextSunday(currentSunday: Date): Date {
  const d = new Date(currentSunday);
  d.setDate(d.getDate() + 7);
  return d;
}

/**
 * Check if today is Sunday
 */
export function isTodaySunday(): boolean {
  return new Date().getDay() === 0;
}

/**
 * Format date range for week (Sunday to Saturday)
 */
export function formatWeekRange(sundayKey: string): string {
  const sun = parseDateKey(sundayKey);
  const sat = new Date(sun);
  sat.setDate(sat.getDate() + 6);
  
  const sunStr = sun.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const satStr = sat.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${sunStr} – ${satStr}`;
}
