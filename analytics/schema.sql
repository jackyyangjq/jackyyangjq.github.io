-- Raw events: only for the owner's private "recent visits" view. No IP address or browser details are stored.
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,          -- UTC time, ISO 8601
  kind TEXT NOT NULL,        -- 'view' or 'download'
  path TEXT NOT NULL,
  referrer TEXT,             -- referring domain only
  country TEXT,              -- ISO 3166-1 alpha-2
  region TEXT,
  city TEXT,
  new_visit INTEGER NOT NULL DEFAULT 0,
  lang TEXT
);
CREATE INDEX IF NOT EXISTS events_ts ON events (ts);

-- Aggregates kept up to date on every write, so public statistics never scan the raw events
CREATE TABLE IF NOT EXISTS daily (
  day TEXT PRIMARY KEY,
  visits INTEGER NOT NULL DEFAULT 0,
  pageviews INTEGER NOT NULL DEFAULT 0,
  downloads INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS countries (
  code TEXT PRIMARY KEY,
  visits INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS cities (
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  lat REAL,
  lon REAL,
  visits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (city, country)
);
CREATE TABLE IF NOT EXISTS referrers (
  domain TEXT PRIMARY KEY,
  visits INTEGER NOT NULL DEFAULT 0
);
