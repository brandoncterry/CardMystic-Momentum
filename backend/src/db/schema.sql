-- Card metadata (source of truth for all card info)
CREATE TABLE IF NOT EXISTS cards (
  uuid TEXT PRIMARY KEY,
  card_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  set_name TEXT NOT NULL,
  scryfall_uri TEXT NOT NULL,
  vertical_offset INTEGER NOT NULL DEFAULT 50,
  dominant_color TEXT NOT NULL DEFAULT '#1a1a2e',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Pre-generated schedule: one row per date, mapping to a card.
-- This is the "deck" — ensures no card repeats until all have been shown.
CREATE TABLE IF NOT EXISTS schedule (
  date TEXT PRIMARY KEY,
  card_uuid TEXT NOT NULL REFERENCES cards(uuid)
);
