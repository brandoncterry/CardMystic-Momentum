import { storage } from 'wxt/utils/storage'
import type { CuratedCard, UserSettings } from '../types'

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

/** Cache the current day's card for instant render on new tab */
export const currentArtStorage = storage.defineItem<CuratedCard | null>(
  'local:arcane-tab:current',
  { fallback: null },
)

/** Track which UTC day index was last stored, to detect day change */
export const currentDayIndexStorage = storage.defineItem<number>(
  'local:arcane-tab:day-index',
  { fallback: -1 },
)
