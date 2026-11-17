# The online game site

**Address:** https://thedivide.pages.dev

Robert and friends play the Open Game (3 or 4 players) in the browser, in real time, with computer players in any empty seat. Every finished game is saved to the stats database, and the Stats page shows which cards and Celestials win more or less than their share.

## Playing

New players: **Learn to play** (https://thedivide.pages.dev/learn) walks through the game in 12 short steps.

1. Open the site, type your name, and press **Start a new table**.
2. Send the link (or the 5-letter code) to your friends. Anyone who opens it takes an empty seat.
3. The host (whoever opened the table) can **Add a bot** to any empty seat, switch between 3 and 4 players, set the time per decision, and turn on the optional 2-Seeds rule.
4. **Start the game.** Celestials and the first player are dealt at random.

At the table:

- The whole table fits on one screen (on a phone the page scrolls). The card sizes follow the window; `apps/web/src/lib/fit.ts` works them out.
- The bar under your cards shows the decision in front of you; it never covers the table. Click a glowing card on the table, or its name in the bar, then confirm; double-click chooses at once. Between turns the bar shows the last two things that happened.
- Hover over any card (or press and hold on a phone) to see it full size with its current text.
- After each Evening a panel shows the revealed Altar, the Tide, and what everyone gained or lost.
- The log on the right shows everything you are allowed to see, including your own private information (marked "only you"). Table talk is beside it.

**Turn timer.** Each decision has a clock (90 seconds unless the host changes it). When it runs out, a bot makes that one choice. After two missed decisions in a row a bot covers the seat until the player presses **I'm back**. A player whose browser disconnects gets 25 seconds per decision. When nobody is connected the clock stops, so a table can be left and picked up later.

**Reconnecting.** Closing the tab or losing the connection does not lose your seat. Reopen the link and you are back.

**Names are yours.** The first time you use a name, your browser is given a private **player code** for it. Nobody else can use that name. To play under your name on another device, enter the name and your player code (shown under "Playing on another device?" on the front page and in the lobby). The same player on two devices has one seat. The computer players' names (Asher, Naomi, Ezra, Tirzah) cannot be taken.

## What it costs

Nothing. Everything runs on Cloudflare's free plan: the address (a Cloudflare Pages project named `thedivide`), one Worker (`the-divide`: the website files and the game tables), Durable Objects (one per table), a D1 database (the stats) and Workers KV (the website's files). A group of friends playing every day uses a small fraction of the free limits. Cloudflare does not charge on the free plan; if a limit were ever reached, the site would pause until the next day rather than bill anyone.

**How the address works.** `thedivide.pages.dev` is a Pages project whose only content is `apps/server/pages/_worker.js`, a few lines that pass every request to the `the-divide` Worker through a service binding called `GAME` (set on the Pages project). The Worker's own address, `the-divide.divide-game.workers.dev`, redirects to `thedivide.pages.dev`, so there is only one link to share.

## How it is built

| Part | Where | What it does |
|---|---|---|
| Rules engine | `packages/engine` | Every rule and card. The site never reimplements a rule: the server runs the engine and the browser only shows what the engine allows that seat to see. |
| Messages | `packages/protocol` | The shapes of the messages between the browser and a table, and of the stats API. |
| Server | `apps/server` | The Cloudflare Worker. `src/roomCore.ts` is one table: seats, bots, the turn timer, reconnects, saving. `src/room.ts` connects it to a Durable Object. `src/stats.ts` writes and reads the stats. `src/index.ts` routes requests. |
| Website | `apps/web` | Preact and Vite. `src/components/Card.tsx` draws every card like the printed deck, using the current text from the card data. `src/table/` is the game table. `src/pages/` are the home, lobby, cards, rules, stats and game-record pages. |

**Fair play.** The server sends each player only their own view (`viewFor` in the engine): their hand, face-up cards, their own facedown Offers, and the log lines they may see. Other hands and facedown cards never reach a browser, so they cannot be found by inspecting the page.

**Accuracy.** Every move is checked by the engine before it is accepted, and every table stores its seed and the list of moves. A table that is unloaded (Cloudflare does this to idle tables) rebuilds itself exactly by replaying them. When a game ends, the stats are written by replaying the stored moves from scratch, which proves the record reproduces the game. Every stored game can be replayed in the browser from the Stats page.

**Rules changes.** Card text comes from `packages/engine/src/cards.data.json`, so a text change shows on the site as soon as it is published. A game in progress when new rules are published cannot continue (its moves may mean something different); that table returns to the lobby with a note. Every stored game records its card version and an engine fingerprint, and the Stats page shows one card version at a time, so results from different rules are never mixed.

## The stats

Each finished game writes these tables in the `divide-stats` database:

| Table | One row per |
|---|---|
| `games` | game: seed, config, every move, card version, engine fingerprint, Days, final Tide, the turn timer setting and which moves it made |
| `game_players` | seat: name, bot or person, Celestial, final Glory, endgame bonus, win share (1, or 1/n for a shared win), turn order, timer misses |
| `final_choirs` | card in a final Choir |
| `choir_days` | Host card face up in a Choir after each Day's Reaping |
| `day_scores` | seat and Day: Glory at the start and end of the Day |
| `tides` | Day: the Event, the Tide and its Light and Dark totals |
| `game_events` | engine event: every First Fruits, Offer, Gather and Exalt, every activation and Silence, every Glory change with its source |
| `players` | person, keyed by name (lower case), with a hash of their player code |

The **Stats page** reads them directly and can be filtered by card version, player count, and whether bot seats are counted:

- **Win ratio** (wins divided by the wins expected by chance; 1.00 is fair) for every Celestial and for every Host card in a final Choir. The same measure from 10,000 all-bot games is shown beside it, and the 0.75 to 1.25 target is shaded.
- **Glory per Day vs average**: on Days a card sat in someone's Choir, how much more or less Glory its holder made than the average player. This counts every Day the card was held, not just the end of the game, so it settles faster than the win ratio.
- **How each card is played**: First Fruits, Offered, Gathered, Exalted, and **Kept** (the share of plays that put it into a Choir rather than onto the Altar; a card people always keep is one they value).
- **Activations**, how often Silence negated them, and the Glory each ability produced.
- Player records, turn-order fairness, Tide counts, and the average Glory per player on each Event.

**Reading it.** One game decides little. A card needs roughly a dozen final Choirs before its win ratio means much; until then, lean on Glory per Day and Kept, and on the bot column. Bots cannot bluff, make deals or give gifts, so the bluffing and political cards (Mirage, Veil, Council, Covenant) are exactly where real games are expected to differ from the bot numbers. The "Seats counted: People only" filter shows how people do when they hold a card.

For questions the page does not answer, the database can be queried directly in the Cloudflare dashboard (Storage & Databases, D1, `divide-stats`, Console). For example, the Celestials people win with:

```sql
SELECT celestial, COUNT(*) AS seats, SUM(win_share) AS wins,
       ROUND(SUM(win_share) / SUM(1.0 / g.player_count), 2) AS win_ratio
FROM game_players gp JOIN games g ON g.id = gp.game_id
WHERE gp.is_bot = 0 AND g.card_version = 'V38'
GROUP BY celestial ORDER BY win_ratio DESC;
```

## Publishing changes

**Automatic.** `.github/workflows/deploy-site.yml` runs on every pull request (tests and build only) and on every change to `main` in `game/`, `cards/cards.json` or `rules/` (tests, build, stats database changes, publish). It needs two repository secrets, added once on GitHub under Settings, Secrets and variables, Actions:

- `CLOUDFLARE_API_TOKEN`: a Cloudflare API token. In the Cloudflare dashboard: My Profile, API Tokens, Create Token, use the **Edit Cloudflare Workers** template, and add **Account, D1, Edit** to its permissions.
- `CLOUDFLARE_ACCOUNT_ID`: shown on the right side of the Workers & Pages overview in the Cloudflare dashboard.

Until both are added the workflow still runs the tests and skips the publish step. A publish takes about two minutes; the Actions tab on GitHub shows each run.

**By hand**, from `game/` with `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` set:

```bash
npm install
```

```bash
npm run migrate -w @divide/server
```

```bash
npm run deploy
```

The publish uploads only the website files that changed, then the Worker. The Pages front door (`apps/server/pages/_worker.js`) never needs republishing; if it ever does, `npm run deploy:pages -w @divide/server`.

## Working on it

From `game/`:

```bash
npm test
```

```bash
npm run dev
```

`npm run dev` builds the website and starts the Worker locally at http://127.0.0.1:8787 with a local copy of the stats database, so tables and stats there never touch the real ones. After changing website code, run `npm run dev` again (the local server keeps the files it started with). `npm run dev -w @divide/web` runs the website alone with live reload at http://localhost:5173, talking to that local Worker.

New card art: put the plate in `art/plates/` and point the card's `plate` at it in the card data, then run `npm run art -w @divide/web` to make the web-sized image.

## Decisions made in the first build (November 16, 2026)

- **Absent players:** a turn timer (host's choice of 1, 1.5, 2 or 5 minutes) after which a bot makes that choice; a bot covers the seat after two misses until the player returns.
- **Hosting:** Cloudflare's free plan, at a workers.dev address. GitHub Pages cannot run live tables or a database.
- **Access:** anyone with a table's link can join it. The Stats page is open to anyone with the site address.
- **Player identity in the stats:** by name. A name belongs to whoever used it first (their player code proves it on another device), so the stats never mix two people under one name. No accounts or passwords.
- **Rule variants:** none in real games, except the optional 2 Seeds rule the host can switch on.

## Known limits

- Hidden Roles (5 and 6 players) is not playable online; the engine does not implement it yet.
- Bots cannot bluff, deal or give gifts.
- Ithuriel, Urim and Asmadai have no art yet and are drawn with a placeholder.
- Table chat keeps the last 100 lines. A table nobody opens for two weeks is deleted (its finished games stay in the stats).
- Publishing from this project's cloud sessions uses the KV setup (`wrangler.kv.jsonc`), because Cloudflare's standard static-assets upload is refused through the session's network proxy. `wrangler.jsonc` (static assets) is the standard setup and is used by `npm run dev`; the Worker serves the site either way.
