import { fetchCardForDate } from '../composables/useArtCache'
import { prefetchedCardStorage } from '../utils/storage'

const PREFETCH_ALARM = 'arcane-tab-prefetch'

export default defineBackground(() => {
  console.log('[ArcaneTab] Background worker started')

  // Set up hourly alarm for prefetching tomorrow's card.
  // Since each user installs and opens tabs at different times,
  // prefetch requests are naturally staggered — no thundering herd at midnight.
  browser.alarms.create(PREFETCH_ALARM, {
    periodInMinutes: 60,
    delayInMinutes: 1, // first fire shortly after install
  })

  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name !== PREFETCH_ALARM) return

    try {
      // Compute tomorrow's local date
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowDate = tomorrow.toISOString().slice(0, 10)

      // Skip if we already prefetched tomorrow's card
      const cached = await prefetchedCardStorage.getValue()
      if (cached?.date === tomorrowDate) return

      console.log('[ArcaneTab] Prefetching card for', tomorrowDate)

      const card = await fetchCardForDate(tomorrowDate)

      // Save resolved card data
      await prefetchedCardStorage.setValue(card)

      // Warm the browser HTTP cache by fetching the image
      if (card.imageUrl) {
        await fetch(card.imageUrl)
      }

      console.log(`[ArcaneTab] Prefetched: "${card.cardName}" by ${card.artistName}`)
    } catch (err) {
      console.warn('[ArcaneTab] Prefetch failed (will retry next hour):', err)
    }
  })
})
