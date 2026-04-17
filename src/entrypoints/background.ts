import { resolveCardForDay } from '../composables/useArtCache'
import {
  prefetchedArtStorage,
  prefetchedDayIndexStorage,
} from '../utils/storage'
import { IMAGE_CDN_BASE } from '../utils/config'

const PREFETCH_ALARM = 'arcane-tab-prefetch'

export default defineBackground(() => {
  console.log('[ArcaneTab] Background worker started')

  // Set up hourly alarm for prefetching tomorrow's card
  browser.alarms.create(PREFETCH_ALARM, {
    periodInMinutes: 60,
    // First fire after 1 minute so it runs soon after install
    delayInMinutes: 1,
  })

  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name !== PREFETCH_ALARM) return

    try {
      const tomorrowIndex = Math.floor(Date.now() / 86_400_000) + 1

      // Skip if we already prefetched for tomorrow
      const cachedDayIndex = await prefetchedDayIndexStorage.getValue()
      if (cachedDayIndex === tomorrowIndex) return

      console.log('[ArcaneTab] Prefetching tomorrow\'s card...')

      const card = await resolveCardForDay(tomorrowIndex)
      if (!card) return

      // Save resolved metadata
      await Promise.all([
        prefetchedArtStorage.setValue(card),
        prefetchedDayIndexStorage.setValue(tomorrowIndex),
      ])

      // Warm the browser HTTP cache by fetching the image
      await fetch(card.imageUrl)

      console.log(`[ArcaneTab] Prefetched: "${card.cardName}" by ${card.artistName}`)
    } catch (err) {
      console.warn('[ArcaneTab] Prefetch failed (will retry next hour):', err)
    }
  })
})
