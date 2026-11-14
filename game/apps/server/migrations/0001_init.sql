-- The Divide: stats database (Cloudflare D1 / SQLite).
-- Every finished game is recorded with enough detail to replay it and to measure card and Celestial balance.

CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,              -- stable id stored in the player's browser
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  room_code TEXT,
  mode TEXT NOT NULL,               -- 'open' | 'hidden'
  player_count INTEGER NOT NULL,
  human_count INTEGER NOT NULL,
  seed INTEGER NOT NULL,
  variants TEXT NOT NULL DEFAULT '', -- comma-separated balance variants in effect
  engine_version TEXT NOT NULL,
  card_version TEXT NOT NULL,       -- e.g. V33
  final_tide TEXT,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  inputs_json TEXT                  -- full input log; with the seed, replays the game exactly
);

CREATE TABLE IF NOT EXISTS game_players (
  game_id TEXT NOT NULL REFERENCES games(id),
  seat INTEGER NOT NULL,
  player_id TEXT REFERENCES players(id),
  name TEXT NOT NULL,
  is_bot INTEGER NOT NULL,
  celestial TEXT NOT NULL,
  final_glory INTEGER NOT NULL,
  bonus INTEGER NOT NULL,
  matching INTEGER NOT NULL,
  win_share REAL NOT NULL,          -- 1 for a sole winner, 1/n for a shared dawn, 0 otherwise
  PRIMARY KEY (game_id, seat)
);

CREATE TABLE IF NOT EXISTS final_choirs (
  game_id TEXT NOT NULL REFERENCES games(id),
  seat INTEGER NOT NULL,
  card TEXT NOT NULL,
  facedown INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tides (
  game_id TEXT NOT NULL REFERENCES games(id),
  day INTEGER NOT NULL,
  event TEXT,
  dir TEXT NOT NULL,
  light INTEGER NOT NULL,
  dark INTEGER NOT NULL,
  margin INTEGER NOT NULL,
  PRIMARY KEY (game_id, day)
);

-- One row per engine stat event: actions, activations, Silence negations, Glory changes, Reapings.
CREATE TABLE IF NOT EXISTS game_events (
  game_id TEXT NOT NULL REFERENCES games(id),
  seq INTEGER NOT NULL,
  day INTEGER NOT NULL,
  type TEXT NOT NULL,
  seat INTEGER,
  card TEXT,
  amount INTEGER,
  source TEXT,
  data_json TEXT,
  PRIMARY KEY (game_id, seq)
);

CREATE INDEX IF NOT EXISTS idx_events_card ON game_events(card);
CREATE INDEX IF NOT EXISTS idx_events_type ON game_events(type, source);
CREATE INDEX IF NOT EXISTS idx_gp_celestial ON game_players(celestial);
CREATE INDEX IF NOT EXISTS idx_gp_player ON game_players(player_id);
CREATE INDEX IF NOT EXISTS idx_fc_card ON final_choirs(card);

-- Balance views. "Win ratio" = actual wins / wins expected by chance (1.00 is fair).
CREATE VIEW IF NOT EXISTS v_celestial_balance AS
SELECT gp.celestial,
       g.mode,
       COUNT(*) AS seats,
       SUM(gp.win_share) AS wins,
       ROUND(SUM(gp.win_share) / SUM(1.0 / g.player_count), 2) AS win_ratio,
       ROUND(AVG(gp.final_glory), 1) AS avg_glory,
       SUM(1 - gp.is_bot) AS human_seats
FROM game_players gp JOIN games g ON g.id = gp.game_id
WHERE g.ended_at IS NOT NULL
GROUP BY gp.celestial, g.mode;

CREATE VIEW IF NOT EXISTS v_card_final_choir AS
SELECT fc.card,
       g.mode,
       COUNT(*) AS seen,
       ROUND(SUM(gp.win_share) / SUM(1.0 / g.player_count), 2) AS win_ratio,
       ROUND(AVG(gp.final_glory), 1) AS avg_glory
FROM final_choirs fc
JOIN game_players gp ON gp.game_id = fc.game_id AND gp.seat = fc.seat
JOIN games g ON g.id = fc.game_id
WHERE fc.facedown = 0 AND g.ended_at IS NOT NULL
GROUP BY fc.card, g.mode;

CREATE VIEW IF NOT EXISTS v_ability_glory AS
SELECT source AS card,
       SUM(amount) AS glory,
       COUNT(DISTINCT game_id) AS games,
       ROUND(1.0 * SUM(amount) / COUNT(DISTINCT game_id), 2) AS glory_per_game
FROM game_events
WHERE type = 'glory' AND amount > 0 AND (source LIKE 'host-%' OR source LIKE 'celestial-%')
GROUP BY source;

CREATE VIEW IF NOT EXISTS v_card_plays AS
SELECT card,
       SUM(CASE WHEN type = 'action' AND source = 'offer.card' THEN 1 ELSE 0 END) AS offered,
       SUM(CASE WHEN type = 'action' AND source = 'gather' THEN 1 ELSE 0 END) AS gathered,
       SUM(CASE WHEN type = 'action' AND source = 'exalt' THEN 1 ELSE 0 END) AS exalted,
       SUM(CASE WHEN type = 'activate' THEN 1 ELSE 0 END) AS activations,
       SUM(CASE WHEN type = 'negated' THEN 1 ELSE 0 END) AS negated
FROM game_events
WHERE card IS NOT NULL
GROUP BY card;

CREATE VIEW IF NOT EXISTS v_player_record AS
SELECT COALESCE(gp.player_id, gp.name) AS player,
       MAX(gp.name) AS name,
       COUNT(*) AS games,
       SUM(gp.win_share) AS wins,
       ROUND(AVG(gp.final_glory), 1) AS avg_glory
FROM game_players gp JOIN games g ON g.id = gp.game_id
WHERE gp.is_bot = 0 AND g.ended_at IS NOT NULL
GROUP BY COALESCE(gp.player_id, gp.name);
