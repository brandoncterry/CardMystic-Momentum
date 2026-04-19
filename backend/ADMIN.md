# CardMystic Companion — Admin Guide

## API Base URL

```
https://cardmystic-companion-api.cardmystic-companion.workers.dev
```

All admin endpoints require your API key, passed as either:
- Header: `X-API-Key: YOUR_API_KEY`
- Query param: `?key=YOUR_API_KEY`

---

## Add a New Card

### 1. Upload the image to R2

```bash
cd backend
npx wrangler r2 object put "arcane-tab-images/{uuid}.jpg" --file="path/to/image.jpg" --remote
```

### 2. Add card metadata to the database

```bash
curl -X POST "https://cardmystic-companion-api.cardmystic-companion.workers.dev/api/admin/cards" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "uuid": "the-scryfall-uuid",
    "cardName": "Card Name",
    "artistName": "Artist Name",
    "setName": "Set Name",
    "scryfallUri": "https://scryfall.com/card/...",
    "verticalOffset": 40,
    "dominantColor": "#1a3a5c"
  }'
```

The schedule automatically refreshes to include the new card in the current epoch's unserved pool.

**Required fields:** `uuid`, `cardName`, `artistName`, `setName`, `scryfallUri`
**Optional fields:** `verticalOffset` (default: 50), `dominantColor` (default: "#1a1a2e")

---

## Remove a Card

```bash
curl -X DELETE "https://cardmystic-companion-api.cardmystic-companion.workers.dev/api/admin/cards/{uuid}" \
  -H "X-API-Key: YOUR_API_KEY"
```

This removes the card from the database and regenerates the schedule. Optionally, also delete the image from R2:

```bash
cd backend
npx wrangler r2 object delete "arcane-tab-images/{uuid}.jpg" --remote
```

---

## Adjust Vertical Offset

```bash
curl -X PATCH "https://cardmystic-companion-api.cardmystic-companion.workers.dev/api/admin/cards/{uuid}" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"verticalOffset": 35}'
```

Values: `0` = top of image, `50` = center (default), `100` = bottom.

You can also update other fields in the same request:

```bash
curl -X PATCH "https://cardmystic-companion-api.cardmystic-companion.workers.dev/api/admin/cards/{uuid}" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "verticalOffset": 35,
    "dominantColor": "#2a4a6c",
    "cardName": "Corrected Name"
  }'
```

**Updatable fields:** `verticalOffset`, `dominantColor`, `cardName`, `artistName`, `setName`, `scryfallUri`

---

## Preview Upcoming Schedule

```bash
curl "https://cardmystic-companion-api.cardmystic-companion.workers.dev/api/admin/schedule?days=14&key=YOUR_API_KEY"
```

Returns total card count, total scheduled days, and the upcoming card list.

---

## Manually Regenerate Schedule

```bash
curl -X POST "https://cardmystic-companion-api.cardmystic-companion.workers.dev/api/admin/generate?key=YOUR_API_KEY"
```

Generates schedule entries up to 365 days ahead. Normally this happens automatically when cards are added/removed.

---

## Public Endpoint (no auth required)

```bash
# Get today's card (pass the user's local date)
curl "https://cardmystic-companion-api.cardmystic-companion.workers.dev/api/card?date=2026-04-19"

# Health check
curl "https://cardmystic-companion-api.cardmystic-companion.workers.dev/"
```

---

## Infrastructure

| Resource | Location |
|---|---|
| Worker | `cardmystic-companion-api` on Cloudflare Workers |
| Database | `arcane-tab-db` on Cloudflare D1 |
| Image storage | `arcane-tab-images` on Cloudflare R2 |
| R2 public URL | `https://pub-7b17b8297065456094ad110fe94cabe0.r2.dev` |
| API key secret | Set via `cd backend && npx wrangler secret put API_KEY` |
| Deploy | `cd backend && npm run deploy` |
