# The Divide

A card game of divine ambition for 3 to 6 players by Robert Treviño. Players feed a shared Altar whose weight sets each Day's Tide, and score their public Choirs against it. At larger tables, secret factions fight over a tug-of-war Balance.

**Current versions:** card data **V34**, rulebook **v4.1** (November 14, 2026).

## What's here

| Folder | Contents |
|---|---|
| `rules/` | `The_Divide_Rulebook_v4.md` (v4.1): the complete rules. Open Game first, Hidden Roles as a mode, Celestials, Events, rulings, glossary. |
| `cards/` | `The_Divide_Cards_V34.xlsx` (tabs: all cards, Open Game deck, changes since V32, reprint list), `cards.csv` (same data, one row per card), and `cards.json` (structured for the web build). |
| `design/` | `design-decisions.md`: every standing decision, card ruling, and the playtest watch list. `file-audit-2026-11-13.md`: the audit that produced V33. |
| `art/faces/` | Every card face as last printed (Host, Celestial, Event, Fate and Turn), about 370 DPI. |
| `art/plates/` | The illustration alone for every card, for the web build. |
| `art/overview/` | Contact sheets for a quick look at all the art. |
| `game/` | The online game: rules engine, computer players, balance simulator, and (soon) the live server and website. See `game/README.md`. |
| `print/` | The scripts that render the Claude Design deck sheets into print PDFs, and how to use them. |
| `sources/` | Archived originals: earlier card spreadsheets, rulebook drafts, print sheets, the V28 print kit, and the Claude Design HTML bundles. Reference only. |
| `CHANGELOG.md` | What changed in each version, and which cards need reprinting. |

## Sources of truth

- **Rules and card text:** the V34 card data and rulebook v4.1 in this folder. When the rulebook and the card data disagree, the card data wins.
- **Printed card visuals:** the Claude Design session. Card text changes must be made there too before printing. The **Reprint List** tab in the V34 spreadsheet lists every card whose printed face is out of date.
- **Card faces in `art/faces/`** show the most recent printing. 55 of them carry older wording than V34; check `print_status` in `cards.csv` before relying on a face's text.

## Quick facts

- **Full deck:** 69 Host cards (23 Light, 23 Dark, 23 Neutral or Variable), 9 Celestials, 20 Events, Fate tokens, Turn cards, the Balance.
- **Open Game deck:** 63 Hosts (21 Light, 20 Dark, 22 Neutral or Variable; Offering 24 Light, 24 Dark) and 17 Events.
- **Modes:** Open Game at 3 players; either at 4 (Open by default); Hidden Roles by default at 5 or 6.

## Online game

- **Engine:** every Open Game rule and card is implemented and tested in `game/packages/engine` (`npm test` runs 31 rules tests and 600 bot games).
- **Stats database:** Cloudflare D1 database `divide-stats`. The schema and balance views are in `game/apps/server/migrations/0001_init.sql`.
- **Balance testing:** `game/tools/sim` plays thousands of bot games; `ab.ts` compares rule variants on identical seeds.

## Next

1. Update the Claude Design session with the V34 text and reprint the 19 cards whose rules changed.
2. Finish the live server and website, and connect this repository to Cloudflare for automatic deploys.
3. Playtest against the watch list in `design/design-decisions.md`.
