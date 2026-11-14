# The Divide: game code

The online version of The Divide. Everything here is TypeScript.

| Folder | What it is |
|---|---|
| `packages/engine` | The rules engine. Deterministic: a game is its config (with a seed) plus the ordered list of player inputs, so any game can be replayed exactly. Every Host, Celestial, and Event ability is implemented here. |
| `tools/sim` | The balance simulator. Plays thousands of all-bot games and reports win rates by Celestial and card. |
| `reports/` | Saved simulator reports. |
| `apps/server` | Cloudflare Worker: live game rooms (Durable Objects) and the stats database. The D1 database `divide-stats` (id `2cd15db7-cb25-4b41-8800-8215ff8e7943`) is created and its schema applied from `migrations/0001_init.sql`. Server code is next. |
| `apps/web` | (next) The website, styled after the printed cards. |

## Commands

```
npm install
npm test                                   # run the rules tests and 600 bot games
npm run sim -- --games 20000 --players 3,4 # balance report
cd tools/sim && npx tsx ab.ts --games 20000 --variants confession-pure,covenant-strict  # A/B test rule variants
```

Balance variants (switch on with `variants` in the game config): `arbiter-reaping-only`, `arbiter-cap1`, `arbiter-catchup`, `confession-pure`, `covenant-strict`, `heresy-optional`, `heresy-shield`, `raguel-oneway`. See `reports/balance-proposals-2026-11-14.md`.

## Engine rulings to confirm

These are calls the engine makes where the card text leaves room. Each is easy to change.

- **The Tempest** is used on your own turn.
- **The Echo** copies only repeatable "On your turn" abilities (not once-per-game cards).
- **Seraphim and Legion** cannot re-activate each other.
- **The Patron** counts as Targeting only when the receiving Choir is full (Cherubim and Tribute apply then).
- **Casting Lots** resolves after the Tide is set (its text says "In the Evening", which is before the Tide).
- **The Flood and Let There Be Light** block only abilities a player chooses to activate; automatic effects such as Uriel still work.
- **Favor**: the Gathering player chooses "at random" or "they choose".
- **Hubris** (Hidden Roles only): every tied leader who gains Glory gives 1.
- **Arbiter**: the endgame bonus is also taken from rivals, since it is Glory gained.
- A once-per-game card that leaves a Choir is no longer "used" if it returns later.
