/**
 * Fully resolved card returned by the API.
 * This is the single type used throughout the extension.
 */
export interface ResolvedCard {
  uuid: string
  cardName: string
  artistName: string
  setName: string
  scryfallUri: string
  imageUrl: string
  /** Vertical image anchor: 0 = top, 50 = center (default), 100 = bottom */
  verticalOffset: number
  /** Dominant color hex for instant themed background */
  dominantColor: string
  /** The date this card is assigned to (YYYY-MM-DD) */
  date: string
}

/** User preferences */
export interface UserSettings {
  userName: string
  clockFormat: '12h' | '24h'
  showClock: boolean
  showGreeting: boolean
  showSearchBar: boolean
  showTopSites: boolean
  textReadability: 'subtle' | 'strong'
  fontFamily: 'system' | 'serif' | 'mono' | 'rounded'
  clockSize: 'small' | 'medium' | 'large'
  dateSize: 'small' | 'medium' | 'large'
  greetingSize: 'small' | 'medium' | 'large'
}

/** Time-of-day period for greeting */
export type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'night'
