import { Hono } from 'hono'
import type { Env } from '../index'
import { generateSchedule } from '../db/schedule'

const card = new Hono<{ Bindings: Env }>()

/** Validate YYYY-MM-DD date format */
function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date))
}

/**
 * GET /api/card?date=2026-04-19
 *
 * Returns the card for a given date. The extension sends its local date
 * so the card changes at midnight in each user's timezone.
 */
card.get('/', async (c) => {
  const dateParam = c.req.query('date')

  // Validate or default to UTC today
  const date =
    dateParam && isValidDate(dateParam)
      ? dateParam
      : new Date().toISOString().slice(0, 10)

  // Look up the scheduled card for this date
  let row = await c.env.DB.prepare(
    `SELECT s.date, c.uuid, c.card_name, c.artist_name, c.set_name,
            c.scryfall_uri, c.vertical_offset, c.dominant_color
     FROM schedule s
     JOIN cards c ON s.card_uuid = c.uuid
     WHERE s.date = ?`,
  )
    .bind(date)
    .first<{
      date: string
      uuid: string
      card_name: string
      artist_name: string
      set_name: string
      scryfall_uri: string
      vertical_offset: number
      dominant_color: string
    }>()

  // If no schedule entry exists for this date, generate the schedule and retry
  if (!row) {
    await generateSchedule(c.env.DB)
    row = await c.env.DB.prepare(
      `SELECT s.date, c.uuid, c.card_name, c.artist_name, c.set_name,
              c.scryfall_uri, c.vertical_offset, c.dominant_color
       FROM schedule s
       JOIN cards c ON s.card_uuid = c.uuid
       WHERE s.date = ?`,
    )
      .bind(date)
      .first()
  }

  if (!row) {
    return c.json({ error: 'No card available for this date' }, 404)
  }

  const r2Url = c.env.R2_PUBLIC_URL || 'https://art.arcanetab.com'

  return c.json({
    uuid: row.uuid,
    cardName: row.card_name,
    artistName: row.artist_name,
    setName: row.set_name,
    scryfallUri: row.scryfall_uri,
    imageUrl: `${r2Url}/${row.uuid}.jpg`,
    verticalOffset: row.vertical_offset,
    dominantColor: row.dominant_color,
    date,
  })
})

export default card
