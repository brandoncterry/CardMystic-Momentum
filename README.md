# CardMystic Companion

A Momentum-style new-tab Chrome extension that replaces every new tab with a piece of curated Magic: The Gathering card art. Built with [WXT](https://wxt.dev/), Vue 3, Tailwind CSS v4, and [Nuxt UI](https://ui.nuxt.com/).

One card per day, fetched from a Cloudflare Workers backend, with a clock, personalized greeting, search bar, top-sites shortcuts, and a favorites gallery on top.

## Features

- **Daily card art** — curated rotation, one piece per day, with prefetching of the next day's card by a background alarm so the next refresh is instant.
- **Clock + greeting** — 12h/24h format, time-of-day greeting, configurable font (system / serif / mono / rounded) and per-element sizes.
- **Search bar** — Google + CardMystic + MTG Wiki, with Scryfall autocomplete on the CardMystic provider.
- **Top sites** — eight most-visited sites with favicons, plus an "add shortcut" placeholder.
- **Favorites** — heart any card from the dashboard; saved cards appear in the settings panel and link out to Scryfall.
- **Readability controls** — text shadow + stroke options for legibility on busy artwork.
- **First-run onboarding** — a welcome modal asks for your name on the first new tab.

## Tech

- **WXT 0.20** — Chrome MV3 extension framework with Vue support
- **Vue 3.5** with `<script setup>`, `defineModel`, composables
- **Tailwind v4** + **`@nuxt/ui` v4** for styling and primitives
- **mana-font** for MTG mana symbols
- **WXT storage** (`storage.defineItem`) keyed under `local:cardmystic-companion:*`

## Project layout

```
src/
  components/         # Vue UI: SettingsPanel, DashboardControls, FirstRunModal, ClockDisplay, ...
  composables/        # useSettings, useArtCache, useFavorites, useClock, useTopSites
  entrypoints/
    background.ts     # Service worker — hourly prefetch alarm
    newtab/           # New-tab page (App.vue, main.ts, index.html)
  utils/              # storage, config, typography
  types/              # ResolvedCard, UserSettings, TimePeriod
public/icon/          # Extension icon (16/48/128 PNGs)
scripts/              # curate.ts, download-art.ts (offline tooling)
backend/              # Cloudflare Workers API (D1 + R2) — separate package
Companion/vue-exports # Reference design drop-ins (not part of the build)
```

## Commands

```
npm run dev                # Start WXT dev server (hot reload, Chrome MV3)
npm run dev:firefox        # Same, targeting Firefox
npm run build              # Production build → .output/chrome-mv3/
npm run build:firefox      # Production build → .output/firefox-mv2/
npm run zip                # Package the built extension as a zip
npm run download-art       # Run the offline art pipeline (artofmtg → Scryfall → R2)
npm run compile            # vue-tsc --noEmit type check
```

## Install in Chrome

### Daily-use install (recommended)

Loads the production build into your main Chrome profile as an unpacked extension. Survives Chrome restarts; Chrome will show a "Disable developer mode extensions" warning at startup, which is normal for unpacked installs.

1. `npm install`
2. `npm run build` — output lands at `.output/chrome-mv3/`
3. Open `chrome://extensions`
4. Toggle **Developer mode** on (top-right)
5. Click **Load unpacked** and select the `.output/chrome-mv3/` folder
6. Open a new tab — the first-run modal will appear

To update after editing code: `npm run build` again, then click the **reload** ↻ icon on the extension's card in `chrome://extensions`.

### Dev mode (hot reload, for active development)

`npm run dev` launches a separate Chrome instance with the extension auto-loaded and reloads on file save. The extension is wired to that dev Chrome only — it won't appear in your main profile.

### Packaging

`npm run zip` produces a `.zip` in `.output/` suitable for Chrome Web Store submission or sharing. Chrome stable blocks installing local `.crx` files, so for personal use the unpacked install above is the right path.

## Recommended IDE setup

- [VS Code](https://code.visualstudio.com/) with the [Vue (Volar) extension](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

## Fan Content Policy

CardMystic Companion is unofficial Fan Content permitted under the [Wizards of the Coast Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy). Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. © Wizards of the Coast LLC.
