/**
 * A curated card entry bundled with the extension.
 * Minimal data — just enough to identify the card and style the loading state.
 * Full metadata is fetched from Scryfall at runtime.
 */
export interface CardEntry {
  /** Scryfall card UUID — the universal key for this printing */
  uuid: string
  /** Vertical image anchor: 0 = top, 50 = center (default), 100 = bottom */
  verticalOffset?: number
  /** Pre-computed dominant color hex for instant themed background (e.g. "#1a3a5c") */
  dominantColor?: string
}

/**
 * Fully resolved card — CardEntry + Scryfall metadata + computed image URL.
 * This is what gets cached in chrome.storage and passed to components.
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
}

/** Subset of Scryfall API card response that we actually use */
export interface ScryfallCard {
  id: string
  name: string
  artist: string
  set_name: string
  scryfall_uri: string
  image_uris?: {
    art_crop?: string
    large?: string
    normal?: string
    png?: string
  }
}

/** User preferences */
export interface UserSettings {
  userName: string
  clockFormat: '12h' | '24h'
  showClock: boolean
  showGreeting: boolean
  showArtistCredit: boolean
  showSearchBar: boolean
  showTopSites: boolean
}

/** Time-of-day period for greeting */
export type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'night'
