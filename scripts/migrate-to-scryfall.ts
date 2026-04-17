#!/usr/bin/env npx tsx
/**
 * Migration script — converts the old artofmtg-based curated-cards.ts
 * into the new Scryfall UUID-based format.
 *
 * What it does:
 * 1. Reads existing curated-cards.ts to get card names, set names, and vertical offsets
 * 2. Searches Scryfall for each card to get the UUID
 * 3. Downloads the high-res art image from artofmtg.com
 * 4. Saves images as {uuid}.jpg in the output directory
 * 5. Generates the new curated-cards.ts with CardEntry[] format
 *
 * Usage:
 *   npx tsx scripts/migrate-to-scryfall.ts
 *   npx tsx scripts/migrate-to-scryfall.ts --dry-run   (no downloads, just UUIDs)
 *   npx tsx scripts/migrate-to-scryfall.ts --output-dir ./mtg-art-images
 *
 * After running:
 * - Copy the images from the output directory to your GitHub Pages repo
 * - The new curated-cards.ts is written automatically
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CURATED_FILE = path.resolve(__dirname, '../src/data/curated-cards.ts')
const DEFAULT_OUTPUT_DIR = path.resolve(__dirname, '../migration-output/images')
const SCRYFALL_API = 'https://api.scryfall.com'
const MIN_REQUEST_INTERVAL = 120 // Scryfall asks for max 10 req/s; we go slower to be polite

interface OldCard {
  slug: string
  cardName: string
  artistName: string
  setName: string
  imageUrl: string
  scryfallUri: string
  verticalOffset?: number
}

interface NewCardEntry {
  uuid: string
  verticalOffset?: number
  dominantColor?: string
}

// --- Rate limiting ---
let lastRequestTime = 0

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now()
  const elapsed = now - lastRequestTime
  if (elapsed < MIN_REQUEST_INTERVAL) {
    await new Promise((r) => setTimeout(r, MIN_REQUEST_INTERVAL - elapsed))
  }
  lastRequestTime = Date.now()
  return fetch(url, {
    headers: {
      'User-Agent': 'ArcaneTab-Migration/1.0 (MTG New Tab Extension)',
      Accept: 'application/json',
    },
  })
}

// --- Parse existing curated-cards.ts ---
function loadExistingCards(): OldCard[] {
  if (!fs.existsSync(CURATED_FILE)) {
    console.error('curated-cards.ts not found!')
    process.exit(1)
  }

  const content = fs.readFileSync(CURATED_FILE, 'utf-8')
  const cards: OldCard[] = []

  // Match card objects in the file
  const blockRe =
    /\{\s*slug:\s*'((?:[^'\\]|\\.)*)'\s*,\s*cardName:\s*'((?:[^'\\]|\\.)*)'\s*,\s*artistName:\s*'((?:[^'\\]|\\.)*)'\s*,\s*setName:\s*'((?:[^'\\]|\\.)*)'\s*,\s*imageUrl:\s*\n?\s*'([^']*)'\s*,\s*scryfallUri:\s*'((?:[^'\\]|\\.)*)'\s*,?(?:\s*verticalOffset:\s*(\d+)\s*,?)?\s*\}/g

  let m: RegExpExecArray | null
  while ((m = blockRe.exec(content)) !== null) {
    const card: OldCard = {
      slug: unescape(m[1]),
      cardName: unescape(m[2]),
      artistName: unescape(m[3]),
      setName: unescape(m[4]),
      imageUrl: m[5],
      scryfallUri: unescape(m[6]),
    }
    if (m[7]) card.verticalOffset = Number(m[7])
    cards.push(card)
  }

  return cards
}

function unescape(s: string): string {
  return s
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\')
    .replace(/&#8217;/g, '\u2019') // HTML entity for right single quote
}

// --- Scryfall lookup ---
async function findScryfallUuid(cardName: string, setName: string): Promise<string | null> {
  // Clean up the card name (remove HTML entities, etc.)
  const cleanName = cardName
    .replace(/&#\d+;/g, (match) => {
      const code = parseInt(match.replace(/&#|;/g, ''))
      return String.fromCharCode(code)
    })
    .replace(/\u2019/g, "'") // curly apostrophe → straight

  // Try exact name search first
  const exactUrl = `${SCRYFALL_API}/cards/named?exact=${encodeURIComponent(cleanName)}`
  const exactRes = await rateLimitedFetch(exactUrl)

  if (exactRes.ok) {
    const data = await exactRes.json()
    // If Scryfall found it, check if the set matches
    if (data.set_name?.toLowerCase() === setName.toLowerCase()) {
      return data.id
    }
    // If set doesn't match, search for the specific printing
  }

  // Search for a specific printing
  const searchQuery = `!"${cleanName}" set_name:"${setName}"`
  const searchUrl = `${SCRYFALL_API}/cards/search?q=${encodeURIComponent(searchQuery)}&unique=prints`
  const searchRes = await rateLimitedFetch(searchUrl)

  if (searchRes.ok) {
    const data = await searchRes.json()
    if (data.data?.length > 0) {
      // Prefer the first result with art_crop
      const withArt = data.data.find((c: any) => c.image_uris?.art_crop)
      return (withArt ?? data.data[0]).id
    }
  }

  // Fallback: just search by name, take any printing
  if (!exactRes.ok) {
    const fuzzyUrl = `${SCRYFALL_API}/cards/named?fuzzy=${encodeURIComponent(cleanName)}`
    const fuzzyRes = await rateLimitedFetch(fuzzyUrl)
    if (fuzzyRes.ok) {
      const data = await fuzzyRes.json()
      return data.id
    }
  } else {
    // We had an exact match but wrong set — still use it
    const data = await exactRes.clone().json().catch(() => null)
    if (data?.id) return data.id
  }

  return null
}

// --- Image download ---
async function downloadImage(imageUrl: string, outputPath: string): Promise<boolean> {
  try {
    const res = await fetch(imageUrl)
    if (!res.ok) return false

    const buffer = Buffer.from(await res.arrayBuffer())
    fs.writeFileSync(outputPath, buffer)
    return true
  } catch {
    return false
  }
}

// --- Generate new curated-cards.ts ---
function saveNewCuratedCards(entries: NewCardEntry[]): void {
  const items = entries
    .map((e) => {
      const parts = [`    uuid: '${e.uuid}'`]
      if (e.verticalOffset != null && e.verticalOffset !== 50) {
        parts.push(`    verticalOffset: ${e.verticalOffset}`)
      }
      if (e.dominantColor) {
        parts.push(`    dominantColor: '${e.dominantColor}'`)
      }
      return `  {\n${parts.join(',\n')},\n  }`
    })
    .join(',\n')

  const content = `import type { CardEntry } from '../types'

/**
 * Curated collection of MTG card art, identified by Scryfall UUID.
 * Metadata (artist, card name, set) is fetched from Scryfall API at runtime.
 * Images are hosted on GitHub Pages: {CDN_BASE}/{uuid}.jpg
 *
 * Total: ${entries.length} cards
 * Generated by: npx tsx scripts/migrate-to-scryfall.ts
 */
export const CURATED_CARDS: CardEntry[] = [
${items},
]
`
  fs.writeFileSync(CURATED_FILE, content, 'utf-8')
}

// --- Main ---
async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const outputDirArg = args.find((a, i) => args[i - 1] === '--output-dir')
  const outputDir = outputDirArg ?? DEFAULT_OUTPUT_DIR

  console.log('\n🔮 Arcane Tab Migration: artofmtg → Scryfall UUIDs\n')

  // 1. Load existing cards
  const oldCards = loadExistingCards()
  console.log(`Found ${oldCards.length} cards in curated-cards.ts\n`)

  if (oldCards.length === 0) {
    console.error('No cards found! Make sure curated-cards.ts exists with the old format.')
    process.exit(1)
  }

  // Create output directory for images
  if (!dryRun) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const newEntries: NewCardEntry[] = []
  const failures: string[] = []

  for (let i = 0; i < oldCards.length; i++) {
    const card = oldCards[i]
    const progress = `[${i + 1}/${oldCards.length}]`

    process.stdout.write(`${progress} ${card.cardName} (${card.setName})...`)

    // Look up Scryfall UUID
    const uuid = await findScryfallUuid(card.cardName, card.setName)
    if (!uuid) {
      process.stdout.write(' ❌ UUID not found\n')
      failures.push(`${card.slug}: ${card.cardName} (${card.setName})`)
      continue
    }

    process.stdout.write(` UUID: ${uuid.slice(0, 8)}...`)

    // Download image
    if (!dryRun) {
      const imgPath = path.join(outputDir, `${uuid}.jpg`)
      if (fs.existsSync(imgPath)) {
        process.stdout.write(' (image exists)')
      } else {
        const downloaded = await downloadImage(card.imageUrl, imgPath)
        if (downloaded) {
          process.stdout.write(' ✅ image saved')
        } else {
          process.stdout.write(' ⚠️ image download failed')
        }
      }
    }

    newEntries.push({
      uuid,
      verticalOffset: card.verticalOffset,
    })

    process.stdout.write('\n')
  }

  // Save new curated-cards.ts
  if (!dryRun) {
    saveNewCuratedCards(newEntries)
    console.log(`\n✅ Generated new curated-cards.ts with ${newEntries.length} cards`)
    console.log(`📁 Images saved to: ${outputDir}`)
  } else {
    console.log(`\n🔍 Dry run complete. Found UUIDs for ${newEntries.length}/${oldCards.length} cards`)
  }

  if (failures.length > 0) {
    console.log(`\n⚠️ Failed lookups (${failures.length}):`)
    for (const f of failures) {
      console.log(`  - ${f}`)
    }
  }

  console.log('\nNext steps:')
  console.log('1. Push the images to your GitHub Pages repo')
  console.log('2. Run `npm run dev` to test the extension')
  console.log('3. If any cards failed, manually add their UUIDs to curated-cards.ts')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
