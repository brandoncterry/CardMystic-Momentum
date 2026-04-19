#!/usr/bin/env npx tsx
/**
 * Unified art pipeline — scrapes artofmtg, resolves Scryfall UUIDs, downloads
 * images as {uuid}.jpg, and generates curated-cards.ts. All automated.
 *
 * For each slug in cards.txt:
 *   1. Scrape artofmtg.com for the card name, artist, set name, and image URL
 *   2. Search Scryfall for all printings of that card name
 *   3. Match the printing whose set_name matches the artofmtg set name
 *   4. Download the art image and save as {uuid}.jpg
 *   5. Add the UUID to the curated cards list
 *
 * Cards that fail lookup or download are logged and skipped for manual handling.
 *
 * Usage:
 *   npx tsx scripts/download-art.ts                   — full pipeline
 *   npx tsx scripts/download-art.ts --skip-existing    — skip already-downloaded images
 *   npx tsx scripts/download-art.ts --dry-run          — scrape + UUID lookup only, no downloads
 *   npx tsx scripts/download-art.ts --output-dir ./out
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CARDS_FILE = path.resolve(__dirname, '../cards.txt')
const CURATED_FILE = path.resolve(__dirname, '../src/data/curated-cards.ts')
const DEFAULT_OUTPUT_DIR = path.resolve(__dirname, '../migration-output')
const ARTOFMTG_BASE = 'https://www.artofmtg.com/art'
const SCRYFALL_API = 'https://api.scryfall.com'

// Scryfall asks for max 10 req/s — we space requests 150ms apart to stay well under
const SCRYFALL_INTERVAL = 150
const ARTOFMTG_INTERVAL = 250

interface ScrapedCard {
  slug: string
  cardName: string
  artistName: string
  setName: string
  imageUrl: string
}

interface ResolvedCard {
  slug: string
  cardName: string
  artistName: string
  setName: string
  imageUrl: string
  uuid: string
  verticalOffset?: number
}

// ── Rate limiting ──────────────────────────────────────────────────────────

let lastArtofmtgTime = 0
let lastScryfallTime = 0

async function fetchArtofmtg(url: string): Promise<Response> {
  const wait = ARTOFMTG_INTERVAL - (Date.now() - lastArtofmtgTime)
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastArtofmtgTime = Date.now()
  return fetch(url)
}

async function fetchScryfall(url: string): Promise<Response> {
  const wait = SCRYFALL_INTERVAL - (Date.now() - lastScryfallTime)
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastScryfallTime = Date.now()
  return fetch(url, {
    headers: {
      'User-Agent': 'ArcaneTab/1.0 (MTG New Tab Extension)',
      Accept: 'application/json',
    },
  })
}

// ── Artofmtg scraping ──────────────────────────────────────────────────────

async function scrapeArtOfMtg(slug: string): Promise<ScrapedCard | null> {
  const pageUrl = `${ARTOFMTG_BASE}/${slug}/`
  const res = await fetchArtofmtg(pageUrl)

  if (!res.ok) {
    return null
  }

  const html = await res.text()

  const imageUrl =
    extractFromJsonLd(html, 'contentUrl') ??
    extractFromJsonLd(html, 'url') ??
    extractMetaContent(html, 'og:image')

  if (!imageUrl) return null

  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  const h1Text = h1Match
    ? h1Match[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    : ''

  let cardName = slug
  let artistName = 'Unknown Artist'
  let setName = 'Unknown Set'

  const h1Parts = h1Text.match(
    /^(.+?)\s+MtG Art(?:\s+from\s+(.+?))?\s+by\s+(.+)$/i,
  )
  if (h1Parts) {
    cardName = h1Parts[1].trim()
    setName = h1Parts[2]?.trim() ?? 'Unknown Set'
    artistName = h1Parts[3].trim()
  } else {
    const rawTitle = extractMetaContent(html, 'og:title') ?? ''
    cardName = rawTitle.replace(/\s*MtG Art.*$/i, '').trim() || slug
  }

  // Decode HTML entities (e.g. &#8217; → ')
  cardName = decodeHtmlEntities(cardName)
  artistName = decodeHtmlEntities(artistName)
  setName = decodeHtmlEntities(setName)

  return { slug, cardName, artistName, setName, imageUrl }
}

function extractFromJsonLd(html: string, key: string): string | null {
  const scriptMatch = html.match(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )
  if (!scriptMatch) return null
  for (const block of scriptMatch) {
    const jsonStr = block.replace(/<\/?script[^>]*>/gi, '')
    try {
      const data = JSON.parse(jsonStr)
      if (data[key]) return data[key]
      if (Array.isArray(data['@graph'])) {
        for (const node of data['@graph']) {
          if (node[key]) return node[key]
          if (node.primaryImageOfPage?.[key]) return node.primaryImageOfPage[key]
        }
      }
    } catch { /* skip */ }
  }
  return null
}

function extractMetaContent(html: string, property: string): string | null {
  const re = new RegExp(
    `<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i',
  )
  const m = html.match(re)
  if (m) return m[1]
  const re2 = new RegExp(
    `<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`, 'i',
  )
  const m2 = html.match(re2)
  return m2 ? m2[1] : null
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

// ── Scryfall UUID resolution ───────────────────────────────────────────────

/**
 * Normalize a string for fuzzy set-name comparison.
 * Strips punctuation, colons, articles, and lowercases everything.
 */
function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/['']/g, "'")       // curly → straight quotes
    .replace(/[^a-z0-9 ']/g, '') // strip punctuation except apostrophes
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Search Scryfall for all printings of a card name and match by set name.
 * Returns the UUID of the best-matching printing, or null.
 */
async function resolveUuid(
  cardName: string,
  setName: string,
): Promise<string | null> {
  // Clean curly quotes for Scryfall search
  const cleanName = cardName.replace(/[\u2018\u2019]/g, "'")

  // 1. Try exact name lookup first (fastest, one API call)
  const exactUrl = `${SCRYFALL_API}/cards/named?exact=${encodeURIComponent(cleanName)}`
  const exactRes = await fetchScryfall(exactUrl)

  if (exactRes.ok) {
    const card = await exactRes.json()
    if (normalizeForMatch(card.set_name) === normalizeForMatch(setName)) {
      return card.id
    }
  }

  // 2. Search all printings and match by set name
  const query = `!"${cleanName}"`
  const searchUrl = `${SCRYFALL_API}/cards/search?q=${encodeURIComponent(query)}&unique=prints&order=released&dir=desc`
  const searchRes = await fetchScryfall(searchUrl)

  if (!searchRes.ok) return null

  const data = await searchRes.json()
  if (!data.data?.length) return null

  const normalizedTarget = normalizeForMatch(setName)

  // Exact set_name match
  const exactSetMatch = data.data.find(
    (c: any) => normalizeForMatch(c.set_name) === normalizedTarget,
  )
  if (exactSetMatch) return exactSetMatch.id

  // Partial match: set_name contains the target or vice versa
  const partialMatch = data.data.find(
    (c: any) =>
      normalizeForMatch(c.set_name).includes(normalizedTarget) ||
      normalizedTarget.includes(normalizeForMatch(c.set_name)),
  )
  if (partialMatch) return partialMatch.id

  // If we have paginated results, check additional pages
  let nextPage = data.has_more ? data.next_page : null
  while (nextPage) {
    const pageRes = await fetchScryfall(nextPage)
    if (!pageRes.ok) break
    const pageData = await pageRes.json()

    const match = pageData.data?.find(
      (c: any) => normalizeForMatch(c.set_name) === normalizedTarget,
    )
    if (match) return match.id

    const partial = pageData.data?.find(
      (c: any) =>
        normalizeForMatch(c.set_name).includes(normalizedTarget) ||
        normalizedTarget.includes(normalizeForMatch(c.set_name)),
    )
    if (partial) return partial.id

    nextPage = pageData.has_more ? pageData.next_page : null
  }

  return null
}

// ── Image download ─────────────────────────────────────────────────────────

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

// ── Load existing verticalOffset data from old curated-cards.ts in git ─────

function loadVerticalOffsets(): Map<string, number> {
  const map = new Map<string, number>()
  // Try reading the legacy file from git history
  try {
    const { execSync } = require('node:child_process')
    const content = execSync(
      'git show 779f2d6:src/data/curated-cards.ts',
      { cwd: path.resolve(__dirname, '..'), encoding: 'utf-8' },
    )
    const re = /slug:\s*'([^']+)'[\s\S]*?verticalOffset:\s*(\d+)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(content)) !== null) {
      map.set(m[1], Number(m[2]))
    }
  } catch { /* no git history available, skip */ }
  return map
}

// ── File I/O ───────────────────────────────────────────────────────────────

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

function escapeTsString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function saveCuratedCards(cards: ResolvedCard[]): void {
  const items = cards
    .map((c) => {
      const lines = [
        `    // ${escapeTsString(c.cardName)} — ${escapeTsString(c.setName)}`,
        `    uuid: '${c.uuid}'`,
      ]
      if (c.verticalOffset != null && c.verticalOffset !== 50) {
        lines.push(`    verticalOffset: ${c.verticalOffset}`)
      }
      return `  {\n${lines.join(',\n')},\n  }`
    })
    .join(',\n')

  const content = `import type { CardEntry } from '../types'

/**
 * Curated collection of MTG card art, identified by Scryfall UUID.
 * Metadata (artist, card name, set) is fetched from Scryfall API at runtime.
 * Images are hosted as {uuid}.jpg on the configured CDN.
 *
 * Total: ${cards.length} cards
 * Generated by: npm run download-art
 */
export const CURATED_CARDS: CardEntry[] = [
${items},
]
`
  fs.writeFileSync(CURATED_FILE, content, 'utf-8')
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const skipExisting = args.includes('--skip-existing')
  const dryRun = args.includes('--dry-run')
  const outputDirArg = args.find((_, i) => args[i - 1] === '--output-dir')
  const outputDir = outputDirArg ?? DEFAULT_OUTPUT_DIR
  const imagesDir = path.join(outputDir, 'images')

  console.log('\n🔮 Arcane Tab — Automated Art Pipeline\n')
  console.log('  Step 1: Scrape artofmtg.com for card metadata + image URLs')
  console.log('  Step 2: Search Scryfall for matching UUID by card name + set')
  console.log('  Step 3: Download images as {uuid}.jpg')
  console.log('  Step 4: Generate curated-cards.ts\n')

  const slugs = readSlugs()
  console.log(`📋 ${slugs.length} slugs in cards.txt\n`)

  if (!dryRun) {
    fs.mkdirSync(imagesDir, { recursive: true })
  }

  // Load vertical offsets from old data
  const offsets = loadVerticalOffsets()
  if (offsets.size > 0) {
    console.log(`📐 Loaded ${offsets.size} vertical offsets from git history\n`)
  }

  const resolved: ResolvedCard[] = []
  const scrapeFailures: string[] = []
  const uuidFailures: { slug: string; cardName: string; setName: string }[] = []
  const downloadFailures: { slug: string; uuid: string }[] = []

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i]
    const progress = `[${String(i + 1).padStart(3)}/${slugs.length}]`

    // ── Step 1: Scrape artofmtg ──
    process.stdout.write(`${progress} ${slug}`)

    const scraped = await scrapeArtOfMtg(slug)
    if (!scraped) {
      process.stdout.write(' ❌ scrape failed\n')
      scrapeFailures.push(slug)
      continue
    }

    process.stdout.write(` → "${scraped.cardName}" (${scraped.setName})`)

    // ── Step 2: Resolve Scryfall UUID ──
    const uuid = await resolveUuid(scraped.cardName, scraped.setName)
    if (!uuid) {
      process.stdout.write(' ❌ UUID not found\n')
      uuidFailures.push({
        slug,
        cardName: scraped.cardName,
        setName: scraped.setName,
      })
      continue
    }

    process.stdout.write(` → ${uuid.slice(0, 8)}…`)

    // ── Step 3: Download image as {uuid}.jpg ──
    if (!dryRun) {
      const imgPath = path.join(imagesDir, `${uuid}.jpg`)
      if (skipExisting && fs.existsSync(imgPath)) {
        process.stdout.write(' (cached)')
      } else {
        const ok = await downloadImage(scraped.imageUrl, imgPath)
        if (!ok) {
          process.stdout.write(' ⚠️ download failed')
          downloadFailures.push({ slug, uuid })
        } else {
          process.stdout.write(' ✅')
        }
      }
    }

    resolved.push({
      ...scraped,
      uuid,
      verticalOffset: offsets.get(slug),
    })

    process.stdout.write('\n')
  }

  // ── Step 4: Generate curated-cards.ts ──
  if (!dryRun && resolved.length > 0) {
    saveCuratedCards(resolved)
  }

  // ── Save failures for manual handling ──
  if (uuidFailures.length > 0 || scrapeFailures.length > 0) {
    const failuresPath = path.join(outputDir, 'failures.json')
    fs.mkdirSync(outputDir, { recursive: true })
    fs.writeFileSync(
      failuresPath,
      JSON.stringify({ scrapeFailures, uuidFailures, downloadFailures }, null, 2),
      'utf-8',
    )
  }

  // ── Summary ──
  console.log('\n' + '─'.repeat(60))
  console.log(`\n✅ Resolved: ${resolved.length}/${slugs.length} cards`)

  if (!dryRun && resolved.length > 0) {
    console.log(`📁 Images:   ${imagesDir}`)
    console.log(`📦 Generated curated-cards.ts with ${resolved.length} entries`)
  }

  if (scrapeFailures.length > 0) {
    console.log(`\n❌ Scrape failures (${scrapeFailures.length}) — page not found on artofmtg:`)
    for (const s of scrapeFailures) console.log(`   - ${s}`)
  }

  if (uuidFailures.length > 0) {
    console.log(`\n❌ UUID failures (${uuidFailures.length}) — no Scryfall match for set:`)
    for (const f of uuidFailures) console.log(`   - ${f.slug}: "${f.cardName}" (${f.setName})`)
  }

  if (downloadFailures.length > 0) {
    console.log(`\n⚠️  Download failures (${downloadFailures.length}):`)
    for (const f of downloadFailures) console.log(`   - ${f.slug} (${f.uuid})`)
  }

  if (uuidFailures.length > 0 || scrapeFailures.length > 0) {
    console.log(`\n📋 Failures saved to: ${path.join(outputDir, 'failures.json')}`)
    console.log('   Handle these manually and re-run with --skip-existing')
  }

  console.log()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
