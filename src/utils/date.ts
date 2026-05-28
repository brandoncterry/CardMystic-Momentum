/**
 * Format a Date as YYYY-MM-DD using LOCAL time components.
 *
 * Note: `new Date().toISOString().slice(0, 10)` looks similar but returns
 * the UTC date, which causes the wallpaper to roll over at UTC midnight
 * instead of the user's local midnight. Always use this helper for the
 * date keys we send to the card API and store in `*Storage`.
 */
export function getLocalDate(d: Date = new Date()): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
