import { randomShuffle } from '../utils/shuffle'

/**
 * Generate the card rotation schedule.
 *
 * The deck system:
 * - An "epoch" is one complete pass through all cards in a shuffled order
 * - Each day consumes the next card in the epoch
 * - When the epoch is exhausted, a new one begins with a fresh shuffle
 * - No card repeats until every card has been shown
 *
 * Adding new cards mid-epoch:
 * - New cards are added to the "unserved" pool of the current epoch
 * - The remaining days are re-shuffled with the expanded pool
 * - Already-served dates are never touched
 */

/** Format a Date as YYYY-MM-DD */
function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Add N days to a date, returning a new Date */
function addDays(d: Date, n: number): Date {
  const result = new Date(d)
  result.setUTCDate(result.getUTCDate() + n)
  return result
}

/**
 * Generate schedule rows for the next `daysAhead` days.
 * Respects the deck/epoch system: no repeats until all cards shown.
 */
export async function generateSchedule(
  db: D1Database,
  daysAhead: number = 365,
): Promise<number> {
  // Get all card UUIDs
  const cardsResult = await db
    .prepare('SELECT uuid FROM cards ORDER BY uuid')
    .all<{ uuid: string }>()
  const allUuids = cardsResult.results.map((r) => r.uuid)

  if (allUuids.length === 0) {
    throw new Error('No cards in the database. Seed cards first.')
  }

  // Find the latest scheduled date and which cards were served in the current epoch
  const today = formatDate(new Date())

  const lastScheduled = await db
    .prepare('SELECT date FROM schedule ORDER BY date DESC LIMIT 1')
    .first<{ date: string }>()

  // Determine the start date for new schedule entries
  let startDate: Date
  if (lastScheduled) {
    startDate = addDays(new Date(lastScheduled.date + 'T00:00:00Z'), 1)
  } else {
    startDate = new Date(today + 'T00:00:00Z')
  }

  const endDate = addDays(new Date(today + 'T00:00:00Z'), daysAhead)

  // If we're already scheduled far enough ahead, nothing to do
  if (startDate >= endDate) return 0

  // Figure out the current epoch state:
  // Find the most recent full epoch boundary by looking at served cards
  // We need to know which cards have been shown since the last full cycle
  const servedInCurrentEpoch = await getServedInCurrentEpoch(db, allUuids)

  // Build the remaining unserved pool for this epoch
  const servedSet = new Set(servedInCurrentEpoch)
  let unservedPool = allUuids.filter((uuid) => !servedSet.has(uuid))

  // Generate day-by-day schedule
  const rows: { date: string; uuid: string }[] = []
  let current = new Date(startDate)

  while (current < endDate) {
    // If the pool is empty, start a new epoch
    if (unservedPool.length === 0) {
      unservedPool = [...allUuids]
      randomShuffle(unservedPool)
    } else if (rows.length === 0) {
      // First batch — shuffle the remaining pool
      randomShuffle(unservedPool)
    }

    const uuid = unservedPool.shift()!
    rows.push({ date: formatDate(current), uuid })
    current = addDays(current, 1)
  }

  // Batch insert into schedule
  if (rows.length > 0) {
    const batchSize = 50
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize)
      const stmts = batch.map((row) =>
        db
          .prepare('INSERT OR IGNORE INTO schedule (date, card_uuid) VALUES (?, ?)')
          .bind(row.date, row.uuid),
      )
      await db.batch(stmts)
    }
  }

  return rows.length
}

/**
 * Determine which cards have been served in the current (most recent) epoch.
 * Walks backward from the latest scheduled date until we find a full cycle.
 */
async function getServedInCurrentEpoch(
  db: D1Database,
  allUuids: string[],
): Promise<string[]> {
  const totalCards = allUuids.length
  if (totalCards === 0) return []

  // Get the most recent scheduled entries, up to totalCards * 2
  // (enough to find the boundary of the current epoch)
  const recent = await db
    .prepare(
      'SELECT card_uuid FROM schedule ORDER BY date DESC LIMIT ?',
    )
    .bind(totalCards * 2)
    .all<{ card_uuid: string }>()

  // Walk from most recent backward. The current epoch starts after the last
  // time all cards had been shown.
  const seen = new Set<string>()
  const currentEpochCards: string[] = []

  for (const row of recent.results) {
    if (seen.has(row.card_uuid)) {
      // We hit a repeat — this is the boundary of the current epoch
      break
    }
    seen.add(row.card_uuid)
    currentEpochCards.push(row.card_uuid)
  }

  return currentEpochCards
}

/**
 * Refresh the schedule after adding new cards.
 * Regenerates future dates to include new cards in the current epoch's
 * unserved pool.
 */
export async function refreshScheduleForNewCards(
  db: D1Database,
  daysAhead: number = 365,
): Promise<number> {
  const today = formatDate(new Date())

  // Delete all future schedule entries (today and beyond)
  await db
    .prepare('DELETE FROM schedule WHERE date > ?')
    .bind(today)
    .run()

  // Regenerate with the updated card pool
  return generateSchedule(db, daysAhead)
}
