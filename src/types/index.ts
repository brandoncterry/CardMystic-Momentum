/** A curated card entry shipped with the extension */
export interface CuratedCard {
  slug: string
  cardName: string
  artistName: string
  setName: string
  imageUrl: string
  scryfallUri: string
  /** Vertical image anchor: 0 = top, 50 = center (default), 100 = bottom */
  verticalOffset?: number
}

/** User preferences */
export interface UserSettings {
  userName: string
  clockFormat: '12h' | '24h'
  showClock: boolean
  showGreeting: boolean
  showArtistCredit: boolean
}

/** Time-of-day period for greeting */
export type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'night'
