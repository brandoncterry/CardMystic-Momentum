import { storage } from 'wxt/utils/storage'
import type { ResolvedCard, UserSettings } from '../types'

export const DEFAULT_SETTINGS: UserSettings = {
  userName: '',
  clockFormat: '12h',
  showClock: true,
  showGreeting: true,
  showArtistCredit: true,
  showSearchBar: true,
  showTopSites: true,
}

export const settingsStorage = storage.defineItem<UserSettings>(
  'local:arcane-tab:settings',
  { fallback: DEFAULT_SETTINGS },
)

/** Cache the current day's resolved card for instant render on new tab */
export const currentArtStorage = storage.defineItem<ResolvedCard | null>(
  'local:arcane-tab:current',
  { fallback: null },
)

/** Track which UTC day index was last stored, to detect day change */
export const currentDayIndexStorage = storage.defineItem<number>(
  'local:arcane-tab:day-index',
  { fallback: -1 },
)

/** Cache prefetched card for tomorrow (avoids network wait at midnight) */
export const prefetchedArtStorage = storage.defineItem<ResolvedCard | null>(
  'local:arcane-tab:prefetched',
  { fallback: null },
)

/** UTC day index of the prefetched card */
export const prefetchedDayIndexStorage = storage.defineItem<number>(
  'local:arcane-tab:prefetched-day-index',
  { fallback: -1 },
)
