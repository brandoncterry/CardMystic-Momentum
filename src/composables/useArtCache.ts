import { ref } from 'vue'
import type { ResolvedCard } from '../types'
import { API_BASE, DEFAULT_DOMINANT_COLOR, DEFAULT_VERTICAL_OFFSET } from '../utils/config'
import { getLocalDate } from '../utils/date'
import { currentCardStorage, prefetchedCardStorage } from '../utils/storage'

/** Fetch a card from the API for a given date */
export async function fetchCardForDate(date: string): Promise<ResolvedCard> {
  const res = await fetch(`${API_BASE}/api/card?date=${encodeURIComponent(date)}`)
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

/** Fallback card for offline / API failure on first load */
const FALLBACK_CARD: ResolvedCard = {
  uuid: 'fallback',
  cardName: 'Welcome to CardMystic Companion',
  artistName: 'Wizards of the Coast',
  setName: 'CardMystic Companion',
  scryfallUri: 'https://scryfall.com',
  imageUrl: '',
  verticalOffset: DEFAULT_VERTICAL_OFFSET,
  dominantColor: DEFAULT_DOMINANT_COLOR,
  date: '',
}

export function useArtCache() {
  const currentArt = ref<ResolvedCard | null>(null)
  const isLoading = ref(true)

  async function init() {
    const today = getLocalDate()

    // 1. Check if we have today's card cached
    const cached = await currentCardStorage.getValue()
    if (cached && cached.date === today) {
      currentArt.value = cached
      isLoading.value = false
      return
    }

    // 2. Check if the background worker prefetched today's card
    const prefetched = await prefetchedCardStorage.getValue()
    if (prefetched && prefetched.date === today) {
      currentArt.value = prefetched
      await currentCardStorage.setValue(prefetched)
      isLoading.value = false
      return
    }

    // 3. Fetch from the API (first install, or cache miss)
    try {
      const card = await fetchCardForDate(today)
      currentArt.value = card
      await currentCardStorage.setValue(card)
    } catch (err) {
      console.warn('[CardMysticCompanion] API fetch failed, using cache or fallback:', err)
      // Stale cache is better than nothing
      if (cached) {
        currentArt.value = cached
      } else {
        currentArt.value = FALLBACK_CARD
      }
    }

    isLoading.value = false
  }

  init()

  return { currentArt, isLoading }
}
