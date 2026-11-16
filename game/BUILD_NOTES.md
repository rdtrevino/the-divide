# Build notes: the online game site

> **Status (November 16, 2026): built and live** at https://thedivide.pages.dev. The early decisions below were made (see "Decisions made in the first build" in `SITE.md`), and the suggested order of work is done. `SITE.md` is now the guide to the site; this file is kept as the original brief.

Written November 16, 2026, at card data V38 and rulebook v8, as the starting brief for building the site where Robert and his friends play The Divide online and every game feeds the balance stats.

## Goal and scope

A website where 3 or 4 people open a room link, fill empty seats with bots, and play the **Open Game** in the browser. Every finished game is written to the stats database, so real games can be compared with the bot numbers in `reports/`.

Out of scope for the first version: Hidden Roles (the engine does not implement it yet), accounts and passwords, matchmaking with strangers, and mobile-specific layouts beyond a page that works on a phone.

## What already exists

**The rules engine** (`packages/engine`) is the whole game. The site should never reimplement a rule.

- `new Game(config)` starts a game. `GameConfig` is `{ seed, mode: 'open', players: [{ name, isBot }], twoSeeds? }`. Leave `variants` empty in real games.
- `game.pending` lists the open `Decision`s. Each has an `id`, the `seat` that must answer, a `tag` (what kind of choice), a `prompt`, `options` (with optional `card` and `seat` hints for display), `min` and `max`, and `reveal` for cards only that seat may see. Several decisions can be open at once (First Fruits, Council, Reaping choices), and they may be answered in any order.
- `game.answer(seat, id, choice)` applies an answer and throws `RuleError` with a readable message if it is not legal. `game.gift(from, to, amount)` handles Glory gifts at any time; `canGift` explains why one is refused.
- `viewFor(state, seat, pending)` returns exactly what that seat may see: their own hand, everyone's public Choir, the Altar with facedown cards hidden, and the log entries visible to them. **The server must only ever send views, never the raw state**, or hidden hands and facedown Offers leak.
- `botAnswer(state, decision)` answers any decision for a bot seat.
- `game.inputs` is the full input log. `Game.replay(config, inputs)` rebuilds a game exactly from the seed and the log. This is how a room survives a server restart and how a game is stored for stats.
- `npm test` runs 79 tests. `tools/sim` measures balance.

**Card data** is `packages/engine/src/cards.data.json` (a copy of `cards/cards.json`): names, text, alignment, value, cadence, and `face` and `plate` image paths into `art/`. The site should render card text from this file, so card text changes never need code changes. Rules changes still need engine changes.

**The stats database** is the Cloudflare D1 database `divide-stats` (id `2cd15db7-cb25-4b41-8800-8215ff8e7943`), with the schema in `apps/server/migrations/0001_init.sql` already applied: `players`, `games` (seed, mode, engine and card version, the full input log), `game_players`, `final_choirs`, and per-event stats.

**Visual design**: the Claude Design bundles in `sources/design-bundles/` hold the card frames, fonts and colors (their card text is old, V27). Card art is in `art/faces/` and `art/plates/`.

## Suggested architecture (Cloudflare)

- **One Worker** serves the static site and the API.
- **One Durable Object per room.** It holds the `Game`, the seat assignments, and the connected WebSockets. After every accepted input it sends each connected seat its own `viewFor`. It stores `config` and `inputs` in Durable Object storage after each input, so it can rebuild with `Game.replay` after an eviction.
- **Bots run inside the room.** When a pending decision belongs to a bot seat, the room answers it with `botAnswer` after a short delay (about 1 second) so humans can follow what happened.
- **WebSocket messages** can stay small: the client sends `{answer: {id, choice}}` or `{gift: {to, amount}}`; the server sends `{view}` or `{error}`.
- **When a game ends**, the room writes one row to `games` (with `card_version: 'V38'` and the engine version), the `game_players` rows, and the final Choirs to D1.
- **Identity without accounts**: a random player id and display name kept in the browser's local storage, a short room code in the URL, and a seat claimed by that id. Reconnecting with the same id reclaims the seat.

## Decisions to make early in the build session

1. **Absent players.** What happens when a human stops answering: a turn timer that hands the seat to a bot, or the table waits? Robert's call.
2. **Generic or custom decision UI.** The fastest first version renders every `Decision` generically (prompt plus buttons, with card images for options that carry a `card`). Custom screens for the common tags (`action`, `offer.card`, `gather.source`, `activate`) can follow.
3. **Who may see the log.** The engine already filters log entries by visibility; the UI decides how much history to show.
4. **Rule variants in real games.** Keep `variants` empty except for the optional `twoSeeds` rule, which the host can switch on for 3 players.

## Things to know before starting

- **The Cloudflare connector used in earlier sessions is deprecated.** Its tools still work but point users to the newer Cloudflare API server (`https://mcp.cloudflare.com/mcp`). Connect that at the start of the build session, or deploy with `wrangler` and an API token.
- **Deploys from GitHub** need the GitHub repository connected to Cloudflare (Workers Builds) in the Cloudflare dashboard. Robert has to do that step himself.
- **The local folder is not a git checkout.** `~/Documents/The Divide/the-divide` has been kept in sync by copying files. Cloning `rdtrevino/the-divide` into that location (after moving the current folder aside) would let Robert pull each session's work instead.
- **Three cards have no art yet**: Ithuriel, Urim and Asmadai. Use a placeholder frame until art exists.
- **The card faces in `art/` show older card text** for every card changed since V28. The site should draw the current text from `cards.data.json` on top of the art (the plate images are the illustrations alone, with no card text) rather than showing the printed faces.
- **Rules will keep changing with playtests.** Store `engine_version` and `card_version` with every game (the schema already has both), so stats from different versions are never mixed.
- **The playtest rules doc artifact is still V36**: https://claude.ai/artifact/R9szLjAR7irARoZAUvb1rx. Players learning online will want the V38 rules; updating it is a quick task worth doing before the first online playtest.
- **Bots cannot bluff, deal or give gifts.** That is fine for filling seats, but stats from games with bots should be read with that in mind (the `human_count` column makes the split easy).

## Suggested order of work

1. Monorepo additions: `apps/web` (static front end) and `apps/server` (Worker and Durable Object), both importing `@divide/engine`.
2. A room that runs a full game with four bots and streams views to a watching browser.
3. Human seats: join by link, claim a seat, answer decisions, gifts.
4. Card rendering from `cards.data.json` with art, styled from the Claude Design bundles.
5. Reconnect and replay from Durable Object storage.
6. Stats writes to D1 at game end, then a simple stats page (win ratio per card and Celestial, the same measure as the bot reports).
7. Deploy, then a first private playtest with friends.
