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
npm test                                   # run 53 tests, including about 1,000 bot games
cd tools/sim && npx tsx quality.ts 6000    # skill expression and comeback measurements
npm run sim -- --games 20000 --players 3,4 # balance report
cd tools/sim && npx tsx ab.ts --games 20000 --variants my-variant  # A/B test a rule variant
```

The engine supports experimental rule `variants` in the game config for A/B testing. The five balance changes tested on November 14 were adopted as permanent V34 card text (see `reports/balance-proposals-2026-11-14.md`).

V35 (November 15) made First Fruits, facedown Offers, and the Offer reward choice the standard rules (see `reports/v35-facedown-offerings-2026-11-15.md`). The face-up row, draw 2 keep 1, and the secret offering experiments were removed. Remaining experimental rules: `two-rounds` (the Long Game), `snake-rounds`, `celestial-draft`, `catchup-order`, the seat-fairness tests `final-catchup`, `first-draw`, `seat-glory`, and the Glory race `target-N` with an optional `maxdays-N` cap (see `reports/glory-race-2026-11-15.md`) (see `reports/seat-fairness-2026-11-15.md`; measure with `cd tools/sim && npx tsx seats.ts 6000 base catchup-order`). Measure them with `cd tools/sim && npx tsx variants.ts 3000 out.json B R C RC`.

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
- **Arbiter** (V34): routes 1 Glory only for Alignment scoring at the Reaping, not for other Reaping-step abilities such as Firmament.
- A once-per-game card that leaves a Choir is no longer "used" if it returns later.
- **Facedown Altar cards** (V35): bots estimate an unseen Offering as leaning toward the Offerer's own Choir. Players who see a card through Urim or Asmadai see it in their own view until the Evening reveal.
- **Exalt with Absolution** (fixed in V35): the card being Exalted is set aside first, so Absolution's hand discard cannot take it.
