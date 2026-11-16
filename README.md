# The Divide

A card game of divine ambition for 3 to 6 players by Robert Treviño. Players feed a shared, partly hidden Altar whose weight sets each Day's Tide, and score their public Choirs against it. At larger tables, secret factions fight over a tug-of-war Balance.

**Current versions:** card data **V36**, rulebook **v6** (November 16, 2026).

## What's here

| Folder | Contents |
|---|---|
| `rules/` | `The_Divide_Rulebook_v6.md`: the complete rules. Open Game first, Hidden Roles as a mode, Celestials, Events, rulings, glossary. |
| `cards/` | `The_Divide_Cards_V36.xlsx` (tabs: all cards, Open Game deck, changes since V32, reprint list), `cards.csv` (same data, one row per card), and `cards.json` (structured for the web build). |
| `design/` | `design-decisions.md`: every standing decision, card ruling, and the playtest watch list. `file-audit-2026-11-13.md`: the audit that produced V33. |
| `art/faces/` | Every card face as last printed (Host, Celestial, Event, Fate and Turn), about 370 DPI. |
| `art/plates/` | The illustration alone for every card, for the web build. |
| `art/overview/` | Contact sheets for a quick look at all the art. |
| `game/` | The online game: rules engine, computer players, balance simulator, and (soon) the live server and website. See `game/README.md`. |
| `print/` | The scripts that render the Claude Design deck sheets into print PDFs, and how to use them. |
| `sources/` | Archived originals: earlier card spreadsheets, rulebook drafts, print sheets, the V28 print kit, and the Claude Design HTML bundles. Reference only. |
| `CHANGELOG.md` | What changed in each version, and which cards need reprinting. |

## Sources of truth

- **Rules and card text:** the V36 card data and rulebook v6 in this folder. When the rulebook and the card data disagree, the card data wins.
- **Printed card visuals:** the Claude Design session. Card text changes must be made there too before printing. The **Reprint List** tab in the V36 spreadsheet lists every card whose printed face is out of date, plus the three new cards that need art.
- **Card faces in `art/faces/`** show the most recent printing. Many carry older wording than V36, and Ithuriel, Urim, and Asmadai have no art yet; check `print_status` in `cards.csv` before relying on a face's text.

## Quick facts

- **Full deck:** 72 Host cards (24 Light, 24 Dark, 24 Neutral or Variable), 9 Celestials, 20 Events, Fate tokens, Turn cards, the Balance.
- **Open Game deck:** 66 Hosts (22 Light, 21 Dark, 21 Neutral, 2 Variable; Offering 25 Light, 25 Dark) and 17 Events.
- **Modes:** Open Game at 3 or 4 players; Hidden Roles at 5 or 6.
- **The Day:** Event, Declarations, Seed, First Fruits (everyone reveals one card), one turn each with facedown Offers, then the Evening reveal, Tide, and Reaping. The Open Game ends after the first Reaping where anyone has 10 Glory.

## Online game

- **Engine:** every Open Game rule and card is implemented and tested in `game/packages/engine` (`npm test` runs 60 tests, including about 1,500 full bot games).
- **Stats database:** Cloudflare D1 database `divide-stats`. The schema and balance views are in `game/apps/server/migrations/0001_init.sql`.
- **Balance testing:** `game/tools/sim` plays thousands of bot games; `ab.ts` compares rule variants on identical seeds.

## Next

1. Update the Claude Design session with the V36 text, create art for Ithuriel, Urim, and Asmadai, and reprint the cards whose rules changed.
2. Finish the live server and website, and connect this repository to Cloudflare for automatic deploys.
3. Playtest against the watch list in `design/design-decisions.md`.
