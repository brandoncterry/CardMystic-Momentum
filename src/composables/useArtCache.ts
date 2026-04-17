import { ref } from 'vue'
import type { CardEntry, ResolvedCard } from '../types'
import { CURATED_CARDS } from '../data/curated-cards'
import { fetchCardByUuid } from '../utils/scryfall'
import { IMAGE_CDN_BASE, DEFAULT_DOMINANT_COLOR, DEFAULT_VERTICAL_OFFSET } from '../utils/config'
import {
  currentArtStorage,
  currentDayIndexStorage,
  prefetchedArtStorage,
  prefetchedDayIndexStorage,
} from '../utils/storage'

/**
 * UTC day index — same value for all users on the same calendar day.
 * Uses a Knuth multiplicative hash so the daily card doesn't cycle sequentially.
 */
function getDayIndex(): number {
  return Math.floor(Date.now() / 86_400_000)
}

/**
 * Knuth multiplicative hash — turns a sequential day index into a
 * pseudo-random but deterministic card index.
 */
function knuthHash(dayIndex: number, totalCards: number): number {
  const hash = (dayIndex * 2654435761) >>> 0 // unsigned 32-bit
  return hash % totalCards
}

/** Resolve a CardEntry into a full ResolvedCard by fetching Scryfall metadata */
async function resolveCard(entry: CardEntry): Promise<ResolvedCard> {
  const scryfall = await fetchCardByUuid(entry.uuid)

  return {
    uuid: entry.uuid,
    cardName: scryfall.name,
    artistName: scryfall.artist,
    setName: scryfall.set_name,
    scryfallUri: scryfall.scryfall_uri,
    imageUrl: `${IMAGE_CDN_BASE}/${entry.uuid}.jpg`,
    verticalOffset: entry.verticalOffset ?? DEFAULT_VERTICAL_OFFSET,
    dominantColor: entry.dominantColor ?? DEFAULT_DOMINANT_COLOR,
  }
}

/** Bundled fallback card for first-run / offline scenarios */
const FALLBACK_CARD: ResolvedCard = {
  uuid: 'fallback',
  cardName: 'Welcome to Arcane Tab',
  artistName: 'Wizards of the Coast',
  setName: 'Arcane Tab',
  scryfallUri: 'https://scryfall.com',
  imageUrl: '',
  verticalOffset: DEFAULT_VERTICAL_OFFSET,
  dominantColor: DEFAULT_DOMINANT_COLOR,
}

export function useArtCache() {
  const currentArt = ref<ResolvedCard | null>(null)
  const isLoading = ref(true)
  let activeIndex = 0

  const todayIndex = getDayIndex()

  async function init() {
    if (CURATED_CARDS.length === 0) {
      currentArt.value = FALLBACK_CARD
      isLoading.value = false
      return
    }

    const cardIndex = knuthHash(todayIndex, CURATED_CARDS.length)
    activeIndex = cardIndex

    // 1. Check if we have today's card cached
    const [cachedArt, cachedDayIndex] = await Promise.all([
      currentArtStorage.getValue(),
      currentDayIndexStorage.getValue(),
    ])

    if (cachedArt && cachedDayIndex === todayIndex) {
      currentArt.value = cachedArt
      isLoading.value = false
      return
    }

    // 2. Check if the service worker prefetched today's card
    const [prefetchedArt, prefetchedDayIndex] = await Promise.all([
      prefetchedArtStorage.getValue(),
      prefetchedDayIndexStorage.getValue(),
    ])

    if (prefetchedArt && prefetchedDayIndex === todayIndex) {
      currentArt.value = prefetchedArt
      await Promise.all([
        currentArtStorage.setValue(prefetchedArt),
        currentDayIndexStorage.setValue(todayIndex),
      ])
      isLoading.value = false
      return
    }

    // 3. Fetch from Scryfall + GitHub Pages
    const entry = CURATED_CARDS[cardIndex]

    try {
      const resolved = await resolveCard(entry)
      currentArt.value = resolved
      await Promise.all([
        currentArtStorage.setValue(resolved),
        currentDayIndexStorage.setValue(todayIndex),
      ])
    } catch (err) {
      console.warn('[ArcaneTab] Scryfall fetch failed, using cache or fallback:', err)
      // Fall back to last cached card (stale is better than nothing)
      if (cachedArt) {
        currentArt.value = cachedArt
      } else {
        currentArt.value = FALLBACK_CARD
      }
    }

    isLoading.value = false
  }

  /** Dev helper: cycle to next card in the curated list */
  function next() {
    if (CURATED_CARDS.length === 0) return
    activeIndex = (activeIndex + 1) % CURATED_CARDS.length
    const entry = CURATED_CARDS[activeIndex]
    // In dev mode, resolve immediately for quick cycling
    resolveCard(entry)
      .then((resolved) => {
        currentArt.value = resolved
      })
      .catch((err) => {
        console.warn('[ArcaneTab] Dev cycle failed:', err)
      })
  }

  /** Dev helper: cycle to previous card in the curated list */
  function prev() {
    if (CURATED_CARDS.length === 0) return
    activeIndex = (activeIndex - 1 + CURATED_CARDS.length) % CURATED_CARDS.length
    const entry = CURATED_CARDS[activeIndex]
    resolveCard(entry)
      .then((resolved) => {
        currentArt.value = resolved
      })
      .catch((err) => {
        console.warn('[ArcaneTab] Dev cycle failed:', err)
      })
  }

  init()

  return { currentArt, isLoading, next, prev }
}

/**
 * Resolve a card for a given day index. Used by the background service worker
 * for prefetching tomorrow's card.
 */
export async function resolveCardForDay(dayIndex: number): Promise<ResolvedCard | null> {
  if (CURATED_CARDS.length === 0) return null
  const cardIndex = knuthHash(dayIndex, CURATED_CARDS.length)
  const entry = CURATED_CARDS[cardIndex]
  return resolveCard(entry)
}
