/**
 * Format a Date as YYYY-MM-DD in the local timezone.
 * Avoid `toISOString().split('T')[0]`: it converts to UTC first, which yields
 * the previous day for local times before the UTC offset (e.g. before 08:00 in UTC+8).
 */
export function toLocalDateString(date: Date = new Date()): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}
