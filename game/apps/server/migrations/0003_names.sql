-- The Divide: each name belongs to one player. The first browser to use a name gets a private
-- player code for it; using the name anywhere else needs that code. Only a hash of the code is stored.
ALTER TABLE players ADD COLUMN key_hash TEXT;
ALTER TABLE players ADD COLUMN claimed_at TEXT;
