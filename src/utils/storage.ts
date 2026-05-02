import { storage } from 'wxt/utils/storage'
import type { ResolvedCard, UserSettings } from '../types'

export const DEFAULT_SETTINGS: UserSettings = {
  userName: '',
  clockFormat: '12h',
  showClock: true,
  showGreeting: true,
  showSearchBar: true,
  showTopSites: true,
  textReadability: 'strong',
  fontFamily: 'system',
  clockSize: 'medium',
  dateSize: 'medium',
  greetingSize: 'medium',
}

export const settingsStorage = storage.defineItem<UserSettings>(
  'local:cardmystic-companion:settings',
  { fallback: DEFAULT_SETTINGS },
)

/** Today's card — rendered on new tab. Keyed by date in the card itself. */
export const currentCardStorage = storage.defineItem<ResolvedCard | null>(
  'local:cardmystic-companion:current-card',
  { fallback: null },
)

/** Tomorrow's card — prefetched by the background worker for instant transition. */
export const prefetchedCardStorage = storage.defineItem<ResolvedCard | null>(
  'local:cardmystic-companion:prefetched-card',
  { fallback: null },
)

/** User's favorited cards. */
export const favoritesStorage = storage.defineItem<ResolvedCard[]>(
  'local:cardmystic-companion:favorites',
  { fallback: [] },
)
