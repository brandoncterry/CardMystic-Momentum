# Claude Code Prompt: MTG New Tab Extension ("Arcane Tab")

## Project Overview

Build a **Momentum-style Chrome new tab replacement extension** that displays **Magic: The Gathering card art** as full-screen backgrounds. Each new tab shows beautiful MTG artwork with a greeting, clock, and artist credit overlay — similar to [Momentum](https://momentumdash.com/) but themed around Magic: The Gathering.

This extension will later be merged into an existing extension using the same stack, so **follow the target stack exactly**.

---

## Target Stack

| Layer | Technology |
|-------|-----------|
| Extension framework | **WXT** (wxt.dev) — modern Vite-based extension framework |
| UI framework | **Vue 3** (Composition API, `<script setup>`) |
| Component library | **Nuxt UI v3** via `@nuxt/ui/vite` (standalone, no Nuxt framework) |
| CSS framework | **Tailwind CSS v4** (required by Nuxt UI v3) |
| Language | **TypeScript** (strict mode) |
| MTG symbols | **mana-font** (npm package) |
| State management | Vue composables with `provide`/`inject` (no Pinia) |
| Storage | `chrome.storage.local` for persistence |

---

## WXT Project Structure

Use `entrypoints/newtab/` as the new tab entrypoint. WXT will automatically set `chrome_url_overrides.newtab` in the manifest.

```
src/
├── entrypoints/
│   ├── newtab/                    # New tab page (auto-registered by WXT)
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── App.vue
│   └── background.ts             # Service worker for image prefetching
├── components/
│   ├── BackgroundImage.vue        # Full-screen art display with crossfade
│   ├── ClockDisplay.vue           # Large centered clock
│   ├── GreetingMessage.vue        # "Good morning, [Name]" greeting
│   ├── ArtistCredit.vue           # Bottom overlay: card name, artist, © WotC
│   ├── SettingsPanel.vue          # Settings gear icon + panel
│   └── FavoriteButton.vue         # Heart icon to favorite current art
├── composables/
│   ├── useScryfall.ts             # Scryfall API fetching logic
│   ├── useArtCache.ts             # Art caching & rotation logic
│   ├── useSettings.ts             # User preferences (name, art filters, etc.)
│   ├── useClock.ts                # Reactive clock with time-of-day detection
│   └── useFavorites.ts            # Favorited art management
├── utils/
│   ├── scryfall-queries.ts        # Scryfall search query builders
│   └── storage.ts                 # Typed chrome.storage.local helpers
├── types/
│   └── index.ts                   # Shared TypeScript interfaces
└── assets/
    └── styles/
        └── main.css               # Tailwind v4 imports + custom styles
```

---

## WXT Configuration

```ts
// wxt.config.ts
import { defineConfig } from 'wxt'

export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    name: 'Arcane Tab — MTG Art New Tab',
    description: 'Replace your new tab with stunning Magic: The Gathering card art.',
    permissions: ['storage'],
    // Note: No host_permissions needed — Scryfall images are fetched via
    // standard fetch() which works in extension pages without extra permissions.
    // If you hit CORS issues, add: host_permissions: ['https://api.scryfall.com/*']
  },
})
```

### Newtab Entrypoint HTML

```html
<!-- entrypoints/newtab/index.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>New Tab</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./main.ts"></script>
  </body>
</html>
```

---

## Scryfall API Reference

The **Scryfall API** is free, requires **no API key**, and provides card art. All requests must include a `User-Agent` header.

### Key Endpoints

**Random card (with optional Scryfall search filter):**
```
GET https://api.scryfall.com/cards/random?q={scryfall_query}
```

**Search cards (paginated, 175 per page):**
```
GET https://api.scryfall.com/cards/search?q={scryfall_query}&unique=art
```

### Image Formats (in `image_uris` object)

| Key | Size | Format | Use Case |
|-----|------|--------|----------|
| `art_crop` | Variable rectangle | JPEG | **Use this** — isolated artwork, no card frame |
| `large` | 672×936 | JPEG | Full card with frame |
| `normal` | 488×680 | JPEG | Standard card display |
| `png` | 745×1040 | PNG | High quality full card |
| `border_crop` | 480×680 | JPEG | Card with borders trimmed |

**Always use `art_crop`** for backgrounds — it extracts just the artwork without the card frame.

### Multi-Face Cards

Cards with layouts like `transform`, `modal_dfc`, `split`, and `flip` store images on individual faces instead of the root object. Check for `image_uris` on the root; if absent, look in `card_faces[0].image_uris`.

```ts
function getArtCropUrl(card: ScryfallCard): string | null {
  if (card.image_uris?.art_crop) return card.image_uris.art_crop
  if (card.card_faces?.[0]?.image_uris?.art_crop) return card.card_faces[0].image_uris.art_crop
  return null
}
```

### Useful Scryfall Search Queries for Backgrounds

Scryfall's `q` parameter supports a powerful search syntax. Use these to get high-quality art:

```ts
// Only cards with high-res images available
'is:hires'

// Full-art cards (larger artwork area)
'is:full'

// Specific card types that tend to have scenic art
'type:land is:hires'

// Art from a specific set
'set:mkm is:hires'

// Exclude tokens and funny cards
'-is:token -is:funny is:hires'

// Combine: high-res lands (great landscapes)
'type:land is:hires -is:token'

// Showcase and borderless often have stunning extended art
'(is:showcase OR is:borderless) is:hires'

// Cards by a specific artist
'artist:"John Avon" is:hires'
```

### Rate Limits & Etiquette

- Insert **50–100ms delay** between requests (max ~10 req/sec)
- Cache aggressively — art URLs don't change frequently
- Include a descriptive `User-Agent` header (e.g., `ArcaneTab/1.0`)
- You **must** display the **artist name** and **© Wizards of the Coast** when using `art_crop` images

---

## Scryfall Image Guidelines (Mandatory)

When using `art_crop`, Scryfall requires you to:

1. **Display the artist name** in the same interface showing the art
2. **Display a copyright notice** (e.g., "© Wizards of the Coast")
3. Do NOT distort, skew, stretch, blur, desaturate, or color-shift card images
4. Do NOT imply someone other than Wizards of the Coast created the card

### WotC Fan Content Policy Compliance

This extension is **fan content** under the [Wizards of the Coast Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy). Requirements:

- The extension must be **free** (no paid features)
- Include this disclaimer somewhere accessible (e.g., settings/about panel):

> *"Arcane Tab is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. © Wizards of the Coast LLC."*

- Do NOT use Wizards' logos or trademarks independently
- Do NOT remove copyright/trademark notices from card images

---

## Core TypeScript Types

```ts
// types/index.ts

export interface CachedArt {
  id: string                    // Scryfall card ID
  artCropUrl: string            // art_crop image URL
  cardName: string              // Card name for display
  artistName: string            // Artist name (required for attribution)
  setName: string               // Set name
  manaCost?: string             // Mana cost string (e.g., "{2}{W}{U}")
  colorIdentity: string[]       // Color identity array
  scryfallUri: string           // Link to card on Scryfall
  cachedAt: number              // Timestamp when cached
}

export interface UserSettings {
  userName: string              // For greeting display
  clockFormat: '12h' | '24h'
  artQuery: string              // Scryfall search query filter
  rotationInterval: 'tab' | 'hour' | 'day' // How often to rotate art
  showClock: boolean
  showGreeting: boolean
  showArtistCredit: boolean
  theme: 'auto' | 'dark' | 'light' // Overlay text theme
}

export interface ArtCacheState {
  current: CachedArt | null     // Currently displayed art
  queue: CachedArt[]            // Pre-fetched art for fast loading
  favorites: CachedArt[]        // User-favorited art
  lastRotated: number           // Timestamp of last rotation
}
```

---

## Composable Specifications

### `useScryfall.ts`

Handles all Scryfall API communication.

```ts
// Key behaviors:
// - Fetch random cards matching a Scryfall query string
// - Extract art_crop URL, artist name, card name from response
// - Handle multi-face cards (check card_faces[0] if root image_uris is absent)
// - Respect rate limits: minimum 100ms between requests
// - Always include User-Agent header: 'ArcaneTab/1.0'
// - Return null gracefully if a card has no art_crop available
// - Prefetch multiple cards at once for the queue (batch with delays)
```

### `useArtCache.ts`

Manages the art rotation and caching pipeline.

```ts
// Key behaviors:
// - On extension load: show cached `current` art immediately (instant render)
// - In background: prefetch 3-5 cards into `queue` for future tabs
// - On new tab: pull next art from queue, push to `current`, backfill queue
// - Rotation logic based on user's rotationInterval setting:
//     'tab' = new art every new tab
//     'hour' = new art if >1 hour since lastRotated
//     'day' = new art if >24 hours since lastRotated
// - Persist current + queue to chrome.storage.local
// - On first ever load (empty cache): fetch and display immediately, show loading state
```

### `useSettings.ts`

User preferences persisted to `chrome.storage.local`.

```ts
// Default settings:
// - userName: '' (prompt on first use)
// - clockFormat: '12h'
// - artQuery: 'is:hires -is:token -is:funny' (sensible default)
// - rotationInterval: 'tab'
// - showClock: true
// - showGreeting: true
// - showArtistCredit: true
// - theme: 'auto'
```

### `useClock.ts`

Reactive clock that updates every second.

```ts
// Provides:
// - Formatted time string (respects 12h/24h setting)
// - Time-of-day period for greeting: 'morning' | 'afternoon' | 'evening' | 'night'
//     morning: 5:00–11:59
//     afternoon: 12:00–16:59
//     evening: 17:00–20:59
//     night: 21:00–4:59
// - Uses setInterval, cleans up on unmount
```

### `useFavorites.ts`

Let users save art they love.

```ts
// - Toggle favorite on current art
// - Persist favorites array to chrome.storage.local
// - Provide isFavorited computed for current art
// - When showing a favorite, pull from favorites array instead of queue
```

---

## Component Specifications

### `BackgroundImage.vue`

Full-screen background with crossfade transitions between images.

- Position: `fixed inset-0`, `object-cover` to fill viewport
- Use two stacked `<img>` elements for crossfade transitions (opacity-based)
- Preload the next image in a hidden `<img>` before transitioning
- Apply a subtle dark overlay/vignette gradient so text is readable over any art
- Show a minimal loading skeleton on first load before any art is cached

### `ClockDisplay.vue`

Large centered clock.

- Position: centered vertically and horizontally
- Font: large, semibold, white with subtle text shadow for readability
- Optionally show the date underneath in smaller text
- Respect `showClock` setting

### `GreetingMessage.vue`

Time-based greeting displayed above or below the clock.

- "Good morning, {name}" / "Good afternoon, {name}" / etc.
- If no name is set, just show "Good morning" without the name
- Respect `showGreeting` setting
- Font: medium weight, white with text shadow

### `ArtistCredit.vue`

**Required** attribution overlay at the bottom of the screen.

- Display format: `"{Card Name}" by {Artist Name} · © Wizards of the Coast`
- Position: bottom-left or bottom-center, semi-transparent background
- Card name links to Scryfall URI (opens in new tab)
- Small/subtle but always readable — **this must always be visible**
- Respect `showArtistCredit` setting — but even if hidden by user preference, still render it as accessible/screen-reader text for compliance

### `SettingsPanel.vue`

Gear icon that opens a settings overlay/drawer.

- Gear icon: bottom-right corner
- Panel: slide-in from right or modal overlay
- Settings to include:
  - Name input (for greeting)
  - Clock format toggle (12h / 24h)
  - Art rotation interval (every tab / hourly / daily)
  - Art filter/query (dropdown or input for Scryfall query presets):
    - "All cards" → `is:hires -is:token -is:funny`
    - "Lands only" → `type:land is:hires`
    - "Full art" → `is:full is:hires`
    - "Showcase & Borderless" → `(is:showcase OR is:borderless) is:hires`
    - "Custom query" → freeform Scryfall search input
  - Toggle visibility: clock, greeting, artist credit
  - Fan Content Policy disclaimer / about section
- Use Nuxt UI components for form inputs (UInput, USelect, UToggle, etc.)

### `FavoriteButton.vue`

Heart icon to favorite current art.

- Position: bottom-right area near settings gear
- Filled heart if current art is favorited, outline if not
- Click toggles favorite status
- Use mana-font icons or Nuxt UI icon set

---

## Background Service Worker

```ts
// entrypoints/background.ts
// Purpose: Prefetch art in the background so new tabs load instantly

export default defineBackground(() => {
  // Listen for extension install → prefetch initial art batch
  browser.runtime.onInstalled.addListener(async () => {
    // Fetch 5 random cards and store in chrome.storage.local queue
  })

  // Optional: set up an alarm to periodically refresh the queue
  // browser.alarms.create('refill-queue', { periodInMinutes: 60 })
  // browser.alarms.onAlarm.addListener(...)
})
```

---

## Storage Schema

All data stored in `chrome.storage.local` under these keys:

```ts
{
  'arcane-tab:settings': UserSettings,
  'arcane-tab:current': CachedArt | null,
  'arcane-tab:queue': CachedArt[],
  'arcane-tab:favorites': CachedArt[],
  'arcane-tab:last-rotated': number
}
```

Use a typed helper in `utils/storage.ts` wrapping `chrome.storage.local.get/set` with proper TypeScript generics. Use WXT's `storage` utilities if they simplify cross-browser compat.

---

## Visual Design Guidelines

### Layout
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              [Full-screen MTG art_crop]               │
│                                                      │
│                                                      │
│                Good afternoon, Player                 │
│                      2:47 PM                         │
│                  March 29, 2026                       │
│                                                      │
│                                                      │
│                                                      │
│                                                      │
│  "Atraxa, Grand Unifier" by Marta Nael · © WotC  ⚙ ♡│
└──────────────────────────────────────────────────────┘
```

### Styling Principles
- **Text readability over any image**: use `text-shadow` or a subtle gradient overlay from bottom (transparent → dark) to ensure text is always readable regardless of art brightness
- **Minimal UI**: the art is the star — UI should be understated and transparent-ish
- **Smooth transitions**: crossfade between images (300–500ms CSS transition on opacity)
- **Dark overlay**: consider a subtle radial or linear gradient vignette over the image so center text pops
- **Responsive**: fills any screen size with `object-cover`

---

## Implementation Priority

Build in this order:

1. **WXT project scaffold** — `npm create wxt@latest` with Vue template, add Nuxt UI v3, Tailwind v4, TypeScript strict mode
2. **Scryfall composable** — fetch random cards, extract art_crop URLs
3. **Background image component** — full-screen art display with loading state
4. **Artist credit** — mandatory attribution overlay
5. **Clock + greeting** — centered overlay widgets
6. **Art cache composable** — queue-based prefetching, chrome.storage persistence
7. **Settings panel** — name, clock format, art filters, rotation interval
8. **Favorites** — heart button, favorites storage
9. **Background service worker** — prefetch on install, queue refill alarms
10. **First-run experience** — name prompt on initial install

---

## Edge Cases to Handle

- **Card has no `art_crop`**: skip it, fetch another random card
- **Multi-face cards**: always check `card_faces[0].image_uris` as fallback
- **Scryfall API down**: show last cached art, display subtle offline indicator
- **Empty cache on first load**: show loading skeleton with mana symbol spinner, fetch first card inline
- **Image fails to load** (broken URL): catch `onerror`, fetch replacement from queue
- **User clears browser data**: gracefully reset to first-run state
- **Very slow connection**: show cached art immediately, prefetch in background

---

## Testing Notes

- Test with `npm run dev` which opens Chrome with the extension loaded
- Open new tabs repeatedly to verify rotation and crossfade behavior
- Test offline by disabling network after initial cache
- Verify artist credit is always visible and accurate
- Test with different Scryfall query filters to ensure they return valid results
- Verify multi-face cards display correctly (e.g., search for `layout:transform`)