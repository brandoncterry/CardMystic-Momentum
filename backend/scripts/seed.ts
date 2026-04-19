#!/usr/bin/env npx tsx
/**
 * Seed script — reads UUID-named image files from migration-output/images/,
 * fetches metadata from Scryfall, and outputs SQL to populate D1.
 *
 * Usage:
 *   cd backend
 *   npx tsx scripts/seed.ts > seed.sql
 *   wrangler d1 execute arcane-tab-db --file=seed.sql --remote
 *
 *   # Custom images directory:
 *   npx tsx scripts/seed.ts --images-dir ../path/to/images > seed.sql
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_IMAGES_DIR = path.resolve(__dirname, '../../migration-output/images')
const SCRYFALL_API = 'https://api.scryfall.com'
const SCRYFALL_INTERVAL = 120 // ms between requests

interface ScryfallData {
  name: string
  artist: string
  set_name: string
  scryfall_uri: string
}

// ── Rate limiting ──
let lastRequestTime = 0

async function fetchScryfall(url: string): Promise<Response> {
  const wait = SCRYFALL_INTERVAL - (Date.now() - lastRequestTime)
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastRequestTime = Date.now()
  return fetch(url, {
    headers: {
      'User-Agent': 'ArcaneTab-Seed/1.0',
      Accept: 'application/json',
    },
  })
}

// ── Read UUIDs from image filenames ──
function readUuidsFromImages(dir: string): string[] {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/
  return fs
    .readdirSync(dir)
    .filter((f) => uuidPattern.test(f))
    .map((f) => f.replace('.jpg', ''))
}

// ── SQL escaping ──
function esc(s: string): string {
  return s.replace(/'/g, "''")
}

// ── Fisher-Yates shuffle ──
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// ── Main ──
async function main() {
  const args = process.argv.slice(2)
  const imagesDirArg = args.find((_, i) => args[i - 1] === '--images-dir')
  const imagesDir = imagesDirArg ?? DEFAULT_IMAGES_DIR
  const toStderr = (msg: string) => process.stderr.write(msg + '\n')

  toStderr('🔮 Arcane Tab — Database Seeder\n')

  if (!fs.existsSync(imagesDir)) {
    toStderr(`Images directory not found: ${imagesDir}`)
    process.exit(1)
  }

  const uuids = readUuidsFromImages(imagesDir)
  toStderr(`Found ${uuids.length} UUID-named images in ${imagesDir}\n`)

  if (uuids.length === 0) {
    toStderr('No UUID-named .jpg files found!')
    process.exit(1)
  }

  const sql: string[] = []
  const validUuids: string[] = []

  // Fetch metadata from Scryfall for each UUID
  toStderr('Fetching metadata from Scryfall...\n')

  for (let i = 0; i < uuids.length; i++) {
    const uuid = uuids[i]
    toStderr(`  [${i + 1}/${uuids.length}] ${uuid.slice(0, 8)}...`)

    let data: ScryfallData
    try {
      const res = await fetchScryfall(`${SCRYFALL_API}/cards/${uuid}`)
      if (!res.ok) {
        toStderr(` ❌ Scryfall ${res.status}\n`)
        continue
      }
      const json = (await res.json()) as any
      data = {
        name: json.name,
        artist: json.artist || 'Unknown Artist',
        set_name: json.set_name || 'Unknown Set',
        scryfall_uri: json.scryfall_uri,
      }
    } catch {
      toStderr(` ❌ fetch error\n`)
      continue
    }

    toStderr(` "${data.name}" ✅\n`)
    validUuids.push(uuid)

    sql.push(
      `INSERT OR IGNORE INTO cards (uuid, card_name, artist_name, set_name, scryfall_uri, vertical_offset, dominant_color) VALUES ('${esc(uuid)}', '${esc(data.name)}', '${esc(data.artist)}', '${esc(data.set_name)}', '${esc(data.scryfall_uri)}', 50, '#1a1a2e');`,
    )
  }

  // Generate schedule (365 days, epoch-based)
  toStderr(`\nGenerating rotation schedule (365 days for ${validUuids.length} cards)...\n`)

  let pool = shuffle([...validUuids])
  const today = new Date()

  for (let day = 0; day < 365; day++) {
    if (pool.length === 0) {
      pool = shuffle([...validUuids])
    }
    const uuid = pool.shift()!
    const date = new Date(today)
    date.setUTCDate(date.getUTCDate() + day)
    const dateStr = date.toISOString().slice(0, 10)
    sql.push(
      `INSERT OR IGNORE INTO schedule (date, card_uuid) VALUES ('${dateStr}', '${esc(uuid)}');`,
    )
  }

  toStderr(`\n✅ Generated ${sql.length} SQL statements (${validUuids.length} cards + 365 schedule entries)\n`)

  // Output SQL to stdout
  console.log('-- Arcane Tab seed data')
  console.log(`-- Generated: ${new Date().toISOString()}`)
  console.log(`-- Cards: ${validUuids.length}`)
  console.log(`-- Schedule: 365 days\n`)
  for (const stmt of sql) {
    console.log(stmt)
  }
}

main().catch((err) => {
  process.stderr.write(`\n${err}\n`)
  process.exit(1)
})
