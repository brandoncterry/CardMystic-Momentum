import { Hono } from 'hono'
import type { Env } from '../index'
import { generateSchedule, refreshScheduleForNewCards } from '../db/schedule'

const admin = new Hono<{ Bindings: Env }>()

/** Simple API key auth middleware */
admin.use('*', async (c, next) => {
  const apiKey = c.req.header('X-API-Key') || c.req.query('key')
  if (!apiKey || apiKey !== c.env.API_KEY) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
})

/**
 * POST /api/admin/cards
 * Add a new card and refresh the schedule.
 *
 * Body: { uuid, cardName, artistName, setName, scryfallUri, verticalOffset?, dominantColor? }
 */
admin.post('/cards', async (c) => {
  const body = await c.req.json<{
    uuid: string
    cardName: string
    artistName: string
    setName: string
    scryfallUri: string
    verticalOffset?: number
    dominantColor?: string
  }>()

  if (!body.uuid || !body.cardName || !body.artistName || !body.setName || !body.scryfallUri) {
    return c.json({ error: 'Missing required fields' }, 400)
  }

  await c.env.DB.prepare(
    `INSERT INTO cards (uuid, card_name, artist_name, set_name, scryfall_uri, vertical_offset, dominant_color)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      body.uuid,
      body.cardName,
      body.artistName,
      body.setName,
      body.scryfallUri,
      body.verticalOffset ?? 50,
      body.dominantColor ?? '#1a1a2e',
    )
    .run()

  // Refresh the schedule to include the new card in the current epoch's unserved pool
  const generated = await refreshScheduleForNewCards(c.env.DB)

  return c.json({
    ok: true,
    message: `Card added. Schedule refreshed with ${generated} new entries.`,
  })
})

/**
 * DELETE /api/admin/cards/:uuid
 * Remove a card and refresh the schedule.
 */
admin.delete('/cards/:uuid', async (c) => {
  const uuid = c.req.param('uuid')

  // Remove from schedule first (foreign key)
  await c.env.DB.prepare('DELETE FROM schedule WHERE card_uuid = ?')
    .bind(uuid)
    .run()

  const result = await c.env.DB.prepare('DELETE FROM cards WHERE uuid = ?')
    .bind(uuid)
    .run()

  if (!result.meta.changes) {
    return c.json({ error: 'Card not found' }, 404)
  }

  // Refresh schedule
  const generated = await refreshScheduleForNewCards(c.env.DB)

  return c.json({
    ok: true,
    message: `Card removed. Schedule refreshed with ${generated} new entries.`,
  })
})

/**
 * POST /api/admin/generate
 * Manually regenerate the schedule.
 */
admin.post('/generate', async (c) => {
  const days = Number(c.req.query('days') || 365)
  const generated = await generateSchedule(c.env.DB, days)

  return c.json({
    ok: true,
    message: `Generated ${generated} schedule entries.`,
  })
})

/**
 * GET /api/admin/schedule?days=30
 * Preview upcoming schedule.
 */
admin.get('/schedule', async (c) => {
  const days = Number(c.req.query('days') || 30)
  const today = new Date().toISOString().slice(0, 10)

  const rows = await c.env.DB.prepare(
    `SELECT s.date, c.uuid, c.card_name, c.set_name
     FROM schedule s
     JOIN cards c ON s.card_uuid = c.uuid
     WHERE s.date >= ?
     ORDER BY s.date
     LIMIT ?`,
  )
    .bind(today, days)
    .all<{ date: string; uuid: string; card_name: string; set_name: string }>()

  return c.json({
    totalCards: (
      await c.env.DB.prepare('SELECT COUNT(*) as count FROM cards').first<{ count: number }>()
    )?.count,
    totalScheduled: (
      await c.env.DB.prepare('SELECT COUNT(*) as count FROM schedule WHERE date >= ?')
        .bind(today)
        .first<{ count: number }>()
    )?.count,
    upcoming: rows.results,
  })
})

/**
 * PATCH /api/admin/cards/:uuid
 * Update a card's metadata (e.g., vertical offset after calibration).
 */
admin.patch('/cards/:uuid', async (c) => {
  const uuid = c.req.param('uuid')
  const body = await c.req.json<{
    verticalOffset?: number
    dominantColor?: string
    cardName?: string
    artistName?: string
    setName?: string
    scryfallUri?: string
  }>()

  const updates: string[] = []
  const values: (string | number)[] = []

  if (body.verticalOffset !== undefined) {
    updates.push('vertical_offset = ?')
    values.push(body.verticalOffset)
  }
  if (body.dominantColor !== undefined) {
    updates.push('dominant_color = ?')
    values.push(body.dominantColor)
  }
  if (body.cardName !== undefined) {
    updates.push('card_name = ?')
    values.push(body.cardName)
  }
  if (body.artistName !== undefined) {
    updates.push('artist_name = ?')
    values.push(body.artistName)
  }
  if (body.setName !== undefined) {
    updates.push('set_name = ?')
    values.push(body.setName)
  }
  if (body.scryfallUri !== undefined) {
    updates.push('scryfall_uri = ?')
    values.push(body.scryfallUri)
  }

  if (updates.length === 0) {
    return c.json({ error: 'No fields to update' }, 400)
  }

  values.push(uuid)
  const result = await c.env.DB.prepare(
    `UPDATE cards SET ${updates.join(', ')} WHERE uuid = ?`,
  )
    .bind(...values)
    .run()

  if (!result.meta.changes) {
    return c.json({ error: 'Card not found' }, 404)
  }

  return c.json({ ok: true })
})

export default admin
