#!/usr/bin/env npx tsx
/**
 * Curator script — reads cards.txt (artofmtg slugs), scrapes metadata,
 * and generates src/data/curated-cards.ts.
 *
 * Usage:
 *   npm run curate              — build curated-cards.ts from cards.txt
 *   npm run curate -- --count   — show current card count
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CARDS_FILE = path.resolve(__dirname, '../cards.txt')
const CURATED_FILE = path.resolve(__dirname, '../src/data/curated-cards.ts')
const ARTOFMTG_BASE = 'https://www.artofmtg.com/art'
const MIN_REQUEST_INTERVAL = 200

interface CuratedCard {
  slug: string
  cardName: string
  artistName: string
  setName: string
  imageUrl: string
  scryfallUri: string
  verticalOffset?: number
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
  return fetch(url)
}

// --- Scraping ---

/**
 * Scrape an artofmtg.com card page for image URL and metadata.
 * Extracts from JSON-LD schema and og: meta tags in the HTML.
 */
async function scrapeArtOfMtg(slug: string): Promise<CuratedCard | null> {
  const pageUrl = `${ARTOFMTG_BASE}/${slug}/`
  const res = await rateLimitedFetch(pageUrl)

  if (!res.ok) {
    console.error(`  [error] ${res.status} fetching: ${pageUrl}`)
    return null
  }

  const html = await res.text()

  // Extract image URL from JSON-LD schema (most reliable)
  const imageUrl = extractFromJsonLd(html, 'contentUrl')
    ?? extractFromJsonLd(html, 'url')
    ?? extractMetaContent(html, 'og:image')

  if (!imageUrl) {
    console.error(`  [error] No image found for: ${slug}`)
    return null
  }

  // Extract card name, set, and artist from <h1>
  // Format: "Card Name MtG Art from Set Name by Artist Name"
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  const h1Text = h1Match
    ? h1Match[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    : ''

  let cardName = slug
  let artistName = 'Unknown Artist'
  let setName = 'Unknown Set'

  // Parse: "Card Name MtG Art from Set Name by Artist Name"
  const h1Parts = h1Text.match(/^(.+?)\s+MtG Art(?:\s+from\s+(.+?))?\s+by\s+(.+)$/i)
  if (h1Parts) {
    cardName = h1Parts[1].trim()
    setName = h1Parts[2]?.trim() ?? 'Unknown Set'
    artistName = h1Parts[3].trim()
  } else {
    // Fallback: try og:title for card name
    const rawTitle = extractMetaContent(html, 'og:title') ?? ''
    cardName = rawTitle.replace(/\s*MtG Art.*$/i, '').trim() || slug
  }

  // Build a Scryfall search link for this card
  const scryfallUri = `https://scryfall.com/search?q=${encodeURIComponent(`!"${cardName}"`)}`

  return { slug, cardName, artistName, setName, imageUrl, scryfallUri }
}

/** Extract a value from JSON-LD script tags */
function extractFromJsonLd(html: string, key: string): string | null {
  const scriptMatch = html.match(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )
  if (!scriptMatch) return null

  for (const block of scriptMatch) {
    const jsonStr = block.replace(/<\/?script[^>]*>/gi, '')
    try {
      const data = JSON.parse(jsonStr)
      // Check root level
      if (data[key]) return data[key]
      // Check @graph array
      if (Array.isArray(data['@graph'])) {
        for (const node of data['@graph']) {
          if (node[key]) return node[key]
          // Check nested primaryImageOfPage
          if (node.primaryImageOfPage?.[key]) return node.primaryImageOfPage[key]
        }
      }
    } catch { /* skip malformed JSON-LD */ }
  }
  return null
}

/** Extract content from an og: meta tag */
function extractMetaContent(html: string, property: string): string | null {
  const re = new RegExp(
    `<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`,
    'i',
  )
  const match = html.match(re)
  if (match) return match[1]

  // Try reversed attribute order
  const re2 = new RegExp(
    `<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`,
    'i',
  )
  const match2 = html.match(re2)
  return match2 ? match2[1] : null
}


// --- File I/O ---

/** Load already-scraped cards from the generated curated-cards.ts */
function loadExistingCards(): Map<string, CuratedCard> {
  const map = new Map<string, CuratedCard>()
  if (!fs.existsSync(CURATED_FILE)) return map

  const content = fs.readFileSync(CURATED_FILE, 'utf-8')
  const blockRe = /\{\s*slug:\s*'((?:[^'\\]|\\.)*)'\s*,\s*cardName:\s*'((?:[^'\\]|\\.)*)'\s*,\s*artistName:\s*'((?:[^'\\]|\\.)*)'\s*,\s*setName:\s*'((?:[^'\\]|\\.)*)'\s*,\s*imageUrl:\s*\n?\s*'([^']*)'\s*,\s*scryfallUri:\s*'((?:[^'\\]|\\.)*)'\s*,?(?:\s*verticalOffset:\s*(\d+)\s*,?)?\s*\}/g
  let m: RegExpExecArray | null
  while ((m = blockRe.exec(content)) !== null) {
    const card: CuratedCard = {
      slug: m[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\'),
      cardName: m[2].replace(/\\'/g, "'").replace(/\\\\/g, '\\'),
      artistName: m[3].replace(/\\'/g, "'").replace(/\\\\/g, '\\'),
      setName: m[4].replace(/\\'/g, "'").replace(/\\\\/g, '\\'),
      imageUrl: m[5],
      scryfallUri: m[6].replace(/\\'/g, "'").replace(/\\\\/g, '\\'),
    }
    if (m[7]) card.verticalOffset = Number(m[7])
    map.set(card.slug, card)
  }
  return map
}

function readSlugs(): string[] {
  if (!fs.existsSync(CARDS_FILE)) {
    console.error(`cards.txt not found at: ${CARDS_FILE}`)
    process.exit(1)
  }
  return fs
    .readFileSync(CARDS_FILE, 'utf-8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
}

function saveCards(cards: CuratedCard[]): void {
  const entries = cards
    .map((c) => {
      let s = `  {\n    slug: '${esc(c.slug)}',\n    cardName: '${esc(c.cardName)}',\n    artistName: '${esc(c.artistName)}',\n    setName: '${esc(c.setName)}',\n    imageUrl:\n      '${c.imageUrl}',\n    scryfallUri: '${esc(c.scryfallUri)}',`
      if (c.verticalOffset != null && c.verticalOffset !== 50) {
        s += `\n    verticalOffset: ${c.verticalOffset},`
      }
      s += '\n  }'
      return s
    })
    .join(',\n')

  const content = `import type { CuratedCard } from '../types'

/**
 * Hand-curated collection of MTG card art.
 * All users see the same card on the same UTC day.
 * Generated from cards.txt via: npm run curate
 *
 * Total: ${cards.length} cards
 */
export const CURATED_CARDS: CuratedCard[] = [${entries ? '\n' + entries + ',\n' : ''}]
`
  fs.writeFileSync(CURATED_FILE, content, 'utf-8')
}

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

// --- Main ---
async function main() {
  const args = process.argv.slice(2)
  const slugs = readSlugs()
  const forceAll = args.includes('--force')

  console.log(`\nArcane Tab Card Curator`)
  console.log(`cards.txt: ${slugs.length} entries\n`)

  if (args.includes('--count')) return

  const savedCards = loadExistingCards()
  const existing = forceAll ? new Map<string, CuratedCard>() : savedCards
  const desiredSet = new Set(slugs)

  const toAdd = slugs.filter((s) => !existing.has(s))
  const toRemove = [...existing.keys()].filter((s) => !desiredSet.has(s))
  const kept = slugs.length - toAdd.length

  console.log(`Keeping ${kept} · Adding ${toAdd.length} · Removing ${toRemove.length}`)
  if (toRemove.length > 0) {
    for (const slug of toRemove) console.log(`  - ${slug}`)
  }

  let errors = 0

  if (toAdd.length > 0) {
    console.log(`\nScraping ${toAdd.length} new card(s) from artofmtg.com...\n`)

    for (let i = 0; i < toAdd.length; i++) {
      const slug = toAdd[i]
      process.stdout.write(`  [${i + 1}/${toAdd.length}] ${slug}...`)

      const card = await scrapeArtOfMtg(slug)
      if (card) {
        existing.set(slug, card)
        process.stdout.write(` ${card.cardName} by ${card.artistName}\n`)
      } else {
        errors++
        process.stdout.write(' FAILED\n')
      }
    }
  }

  // Assemble final list in cards.txt order, preserving manual verticalOffset values
  const cards: CuratedCard[] = []
  for (const slug of slugs) {
    const card = existing.get(slug)
    if (card && !card.verticalOffset && savedCards.has(slug)) {
      card.verticalOffset = savedCards.get(slug)!.verticalOffset
    }
    if (card) cards.push(card)
  }

  saveCards(cards)
  console.log(`\nDone! Generated ${cards.length} cards.`)
  if (errors > 0) console.log(`Failed: ${errors}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
