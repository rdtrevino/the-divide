# The Divide: game code

The online version of The Divide. Everything here is TypeScript.

| Folder | What it is |
|---|---|
| `packages/engine` | The rules engine. Deterministic: a game is its config (with a seed) plus the ordered list of player inputs, so any game can be replayed exactly. Every Host, Celestial, and Event ability is implemented here. |
| `tools/sim` | The balance simulator. Plays thousands of all-bot games and reports win rates by Celestial and card. |
| `reports/` | Saved simulator reports. |
| `packages/protocol` | The messages between the browser and a game table, and the shapes of the stats API. |
| `apps/server` | The Cloudflare Worker: live game tables (one Durable Object each), bots and the turn timer, and the stats database (D1 `divide-stats`, schema in `migrations/`). |
| `apps/web` | The website, drawn after the printed cards: lobby, game table, cards, rules, stats and game records. |

**The site is live at https://thedivide.pages.dev.** How to play, how it works, what the stats record, and how to publish changes: `SITE.md`.

## Commands

```
npm install
npm test                                   # engine tests (79, including about 1,500 bot games) and server tests
npm run dev                                # the whole site locally at http://127.0.0.1:8787
npm run deploy                             # publish (see SITE.md)
cd tools/sim && npx tsx quality.ts 6000    # skill expression and comeback measurements
npm run sim -- --games 20000 --players 3,4 # balance report
cd tools/sim && npx tsx ab.ts --games 20000 --variants my-variant  # A/B test a rule variant
```

The engine supports experimental rule `variants` in the game config for A/B testing. The five balance changes tested on November 14 were adopted as permanent V34 card text (see `reports/balance-proposals-2026-11-14.md`).

V35 (November 15) made First Fruits, facedown Offers, and the Offer reward choice the standard rules (see `reports/v35-facedown-offerings-2026-11-15.md`). The face-up row, draw 2 keep 1, and the secret offering experiments were removed. V36 (November 16) made the race to 10 Glory the standard ending (`reports/v36-race-to-10-2026-11-16.md`); `six-days` restores the fixed 6-Day game. Remaining experimental rules: `two-rounds` (the Long Game), `snake-rounds`, `celestial-draft`, `catchup-order`, the seat-fairness tests `final-catchup`, `first-draw`, `seat-glory`, and other Glory targets `target-N` with an optional `maxdays-N` cap (see `reports/glory-race-2026-11-15.md`) (see `reports/seat-fairness-2026-11-15.md`; measure with `cd tools/sim && npx tsx seats.ts 6000 base catchup-order`). Measure them with `cd tools/sim && npx tsx variants.ts 3000 out.json B R C RC`.

V37 (November 16) adopted nine card changes for the strongest and weakest cards (`reports/v37-balance-2026-11-16.md`). V38 (November 16) changed Michael and 15 more cards toward Robert's target of every card between 0.75 and 1.25 (`reports/v38-balance-2026-11-16.md`); the trial variants were removed once adopted. Measure every card on fixed seeds with `cd tools/sim && npx tsx ab3.ts 20000 0 out.json base` (run several offsets in parallel and merge the counts).

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
