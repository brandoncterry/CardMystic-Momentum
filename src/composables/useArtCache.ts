import { ref } from 'vue'
import type { CuratedCard } from '../types'
import { CURATED_CARDS } from '../data/curated-cards'
import { currentArtStorage, currentDayIndexStorage } from '../utils/storage'

/** UTC day index — same value for all users on the same calendar day */
function getTodayIndex(): number {
  return Math.floor(Date.now() / 86_400_000)
}

export function useArtCache() {
  const currentArt = ref<CuratedCard | null>(null)
  const isLoading = ref(true)
  let activeIndex = 0

  const todayIndex = getTodayIndex()
  const cardIndex = todayIndex % CURATED_CARDS.length

  async function init() {
    if (CURATED_CARDS.length === 0) {
      isLoading.value = false
      return
    }

    const [cachedArt, cachedDayIndex] = await Promise.all([
      currentArtStorage.getValue(),
      currentDayIndexStorage.getValue(),
    ])

    if (cachedArt && cachedDayIndex === todayIndex) {
      currentArt.value = cachedArt
      activeIndex = cardIndex
    } else {
      activeIndex = cardIndex
      currentArt.value = CURATED_CARDS[activeIndex]
      await Promise.all([
        currentArtStorage.setValue(currentArt.value),
        currentDayIndexStorage.setValue(todayIndex),
      ])
    }

    isLoading.value = false
  }

  /** Dev helper: cycle to next card in the curated list */
  function next() {
    if (CURATED_CARDS.length === 0) return
    activeIndex = (activeIndex + 1) % CURATED_CARDS.length
    currentArt.value = CURATED_CARDS[activeIndex]
  }

  /** Dev helper: cycle to previous card in the curated list */
  function prev() {
    if (CURATED_CARDS.length === 0) return
    activeIndex = (activeIndex - 1 + CURATED_CARDS.length) % CURATED_CARDS.length
    currentArt.value = CURATED_CARDS[activeIndex]
  }

  init()

  return { currentArt, isLoading, next, prev }
}
