import type { CardEntry } from '../types'

/**
 * Curated collection of MTG card art, identified by Scryfall UUID.
 * Metadata (artist, card name, set) is fetched from Scryfall API at runtime.
 * Images are hosted on GitHub Pages: {CDN_BASE}/{uuid}.jpg
 *
 * To generate this file from the old artofmtg-based format:
 *   npx tsx scripts/migrate-to-scryfall.ts
 *
 * To add a new card:
 * 1. Find the card on Scryfall (scryfall.com)
 * 2. Copy its UUID from the URL or API
 * 3. Upload the art image as {uuid}.jpg to the GitHub Pages repo
 * 4. Add the entry below
 *
 * Total: 5 cards (placeholder — run migration script for full set)
 */
export const CURATED_CARDS: CardEntry[] = [
  {
    // Lightning Bolt — Alpha Edition
    uuid: '41e73353-4be8-4e88-95a2-9a639d28e4c2',
    dominantColor: '#8b2500',
  },
  {
    // Counterspell — Alpha Edition
    uuid: 'a4572856-bd53-4abe-923f-42337203e4cb',
    dominantColor: '#1a3a5c',
  },
  {
    // Black Lotus — Alpha Edition
    uuid: 'bd8fa327-dd41-4737-8f19-2cf5eb1f7571',
    dominantColor: '#2d4a22',
  },
  {
    // Sol Ring — Commander 2021
    uuid: '4cbc6901-6a4a-4d0a-83ea-7eefa3b35021',
    dominantColor: '#c4a44a',
  },
  {
    // Swords to Plowshares — Alpha Edition
    uuid: 'f51a9748-4b97-425a-87fc-1ee0890d39e4',
    dominantColor: '#d4c894',
  },
]
