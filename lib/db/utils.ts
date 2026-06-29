/**
 * Database utility helpers
 */

export function getDbTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}
