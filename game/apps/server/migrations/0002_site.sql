-- The Divide: stats database, additions for the online game site (November 2026).
-- Adds what the site records beyond the first schema: the full game config (so any stored game
-- can be replayed in the browser), turn-timer use, turn order, and a per-Day record of who held
-- which cards and how much Glory they made that Day.

ALTER TABLE games ADD COLUMN config_json TEXT;              -- the engine GameConfig; with inputs_json, replays the game
ALTER TABLE games ADD COLUMN days INTEGER;                  -- Days played
ALTER TABLE games ADD COLUMN two_seeds INTEGER NOT NULL DEFAULT 0;
ALTER TABLE games ADD COLUMN timer_seconds INTEGER;         -- turn timer in effect
ALTER TABLE games ADD COLUMN auto_inputs TEXT NOT NULL DEFAULT '[]'; -- indexes into inputs_json the turn timer answered
ALTER TABLE game_players ADD COLUMN timeouts INTEGER NOT NULL DEFAULT 0; -- decisions the turn timer made for this seat
ALTER TABLE game_players ADD COLUMN turn_order INTEGER;     -- 0 = first player on Day 1

-- Glory each seat held at the start and end of each Day (the endgame bonus is not included).
CREATE TABLE IF NOT EXISTS day_scores (
  game_id TEXT NOT NULL REFERENCES games(id),
  day INTEGER NOT NULL,
  seat INTEGER NOT NULL,
  glory_start INTEGER NOT NULL,
  glory_end INTEGER NOT NULL,
  PRIMARY KEY (game_id, day, seat)
);

-- One row for each Host card face up in a Choir when a Day's Reaping was over.
CREATE TABLE IF NOT EXISTS choir_days (
  game_id TEXT NOT NULL REFERENCES games(id),
  day INTEGER NOT NULL,
  seat INTEGER NOT NULL,
  card TEXT NOT NULL,
  PRIMARY KEY (game_id, day, seat, card)
);

CREATE INDEX IF NOT EXISTS idx_cd_card ON choir_days(card);
CREATE INDEX IF NOT EXISTS idx_games_version ON games(card_version, ended_at);
CREATE INDEX IF NOT EXISTS idx_fc_game ON final_choirs(game_id);

-- Average Glory a card's holder made on Days the card sat in their Choir.
-- Compare with the average over all seats and Days (v_day_baseline).
CREATE VIEW IF NOT EXISTS v_card_glory_per_day AS
SELECT cd.card,
       g.card_version,
       COUNT(*) AS choir_days,
       ROUND(AVG(ds.glory_end - ds.glory_start), 2) AS glory_per_day
FROM choir_days cd
JOIN day_scores ds ON ds.game_id = cd.game_id AND ds.day = cd.day AND ds.seat = cd.seat
JOIN games g ON g.id = cd.game_id
WHERE g.ended_at IS NOT NULL
GROUP BY cd.card, g.card_version;

CREATE VIEW IF NOT EXISTS v_day_baseline AS
SELECT g.card_version,
       COUNT(*) AS seat_days,
       ROUND(AVG(ds.glory_end - ds.glory_start), 2) AS glory_per_day
FROM day_scores ds JOIN games g ON g.id = ds.game_id
WHERE g.ended_at IS NOT NULL
GROUP BY g.card_version;
