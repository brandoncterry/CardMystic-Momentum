import type { ScryfallCard } from '../types'
import { SCRYFALL_API_BASE } from './config'

/**
 * Fetch card metadata from the Scryfall API by UUID.
 * Scryfall rate limit: 10 req/s — we only make ~1 req/day, well within limits.
 *
 * @see https://scryfall.com/docs/api/cards/id
 */
export async function fetchCardByUuid(uuid: string): Promise<ScryfallCard> {
  const url = `${SCRYFALL_API_BASE}/cards/${encodeURIComponent(uuid)}`

  const res = await fetch(url, {
    headers: {
      // Scryfall asks API users to identify themselves
      'User-Agent': 'ArcaneTab/1.0 (MTG New Tab Extension)',
      Accept: 'application/json',
    },
  })

  if (!res.ok) {
    throw new Error(`Scryfall API error: ${res.status} ${res.statusText} for UUID ${uuid}`)
  }

  const data = await res.json()

  return {
    id: data.id,
    name: data.name,
    artist: data.artist ?? 'Unknown Artist',
    set_name: data.set_name ?? 'Unknown Set',
    scryfall_uri: data.scryfall_uri,
    image_uris: data.image_uris,
  }
}
