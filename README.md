# The Divide

A card game of divine ambition for 3 to 6 players by Robert Treviño. Players feed a shared, partly hidden Altar whose weight sets each Day's Tide, and score their public Choirs against it. At larger tables, secret factions fight over a tug-of-war Balance.

**Current versions:** card data **V44**, rulebook **v14** (November 18, 2026).

## What's here

| Folder | Contents |
|---|---|
| `rules/` | `The_Divide_Rulebook_v14.md`: the complete rules, organized for new players: the game in one minute, a Day at a glance (Morning, Noon, Evening), the actions and scoring as tables, then Celestials, Events, rulings by topic, Hidden Roles, and the glossary. The site's Rules page shows it with a search. |
| `cards/` | `The_Divide_Cards_V44.xlsx` (tabs: all cards, Open Game deck, changes since V32, reprint list), `cards.csv` (same data, one row per card), and `cards.json` (structured for the web build). To change card text, write a change set in `cards/changes/` and run `python3 cards/tools/apply_changes.py cards/changes/<VERSION>.json`; it updates all of these and the engine's copy together. |
| `design/` | **`vision.md`: the heart of the game, the principles every rule is measured against.** `design-decisions.md`: the principles behind the rules, open questions, parked ideas, and the playtest watch list. `balance.md`: the measured win ratio of every Host card, Celestial and Event under the current rules. |
| `art/faces/` | Every card face as last printed (Host, Celestial, Event, Fate and Turn), about 370 DPI. |
| `art/plates/` | The illustration alone for every card, for the web build. |
| `art/overview/` | Contact sheets for a quick look at all the art. |
| `game/` | The online game: rules engine, computer players, balance simulator, the live server and the website. See `game/README.md` and `game/SITE.md`. |
| `print/` | The scripts that render the Claude Design deck sheets into print PDFs, and how to use them. |
| `CHANGELOG.md` | What changed in each version and why, what was tried and rejected, and which cards need reprinting. |

Earlier card spreadsheets, rulebook drafts, print sheets, design write-ups and simulator reports are in the git history (removed November 18, 2026); the CHANGELOG records what each one decided.

## Sources of truth

- **Rules and card text:** the V44 card data and rulebook v14 in this folder. When the rulebook and the card data disagree, the card data wins.
- **Printed card visuals:** the Claude Design session. Card text changes must be made there too before printing. The **Reprint List** tab in the V44 spreadsheet lists every card whose printed face is out of date, in text or in number.
- **Card faces in `art/faces/`** show the most recent printing. Many carry older wording and numbers than V44; check `print_status` in `cards.csv` before relying on a face's text. Ithuriel, Urim and Asmadai were retired in V42 and have no art.

## Quick facts

- **One deck for every way to play:** 69 Host cards, numbered Light (1–23), Neutral (24–46, with Acolyte and Nephilim), then Dark (47–69). Plus 9 Celestials, 20 Events (the Advanced game uses 17; the other 3 move the Balance), and for Hidden Roles the Fate tokens, Turn cards and the Balance.
- **Modes:** the Base game (Host cards only) and the Advanced game (adds Celestials and Events) at 3 or 4 players; Hidden Roles at 5 or 6.
- **Setup:** a hand of 3 (the Dominion 5) and a Choir of 2 random face-up cards, with room for 4.
- **The Day:** Morning (Event in Advanced, predictions, First Fruits: everyone reveals one card), Noon (one turn each: Offer a card facedown for 1 Glory, Gather a card from the Altar, or Exalt a card from your hand, both free), Evening (reveal, Tide, Reaping).
- **Scoring:** only which way a Choir leans matters. With the Tide: alone 3, two 1 each, three or more nothing. Against it: alone −3, otherwise −1. The game ends after the first Reaping where anyone has 12 Glory; the most Glory wins.

## Online game

- **Play:** https://thedivide.pages.dev (3 or 4 players, bots fill empty seats). Every finished game is saved to the stats database and shown on the site's Stats page. Guide: `game/SITE.md`.
- **Engine:** every Open Game rule and card is implemented and tested in `game/packages/engine` (`npm test` runs 92 engine tests, including about 600 full bot games, and 11 server tests).
- **Stats database:** Cloudflare D1 database `divide-stats`. The schema and balance views are in `game/apps/server/migrations/0001_init.sql`.
- **Balance testing:** `game/tools/sim` plays thousands of bot games on fixed seeds: `npm run sim` and `card-balance.ts` measure every card, `advanced.ts` the Celestials and Events. To test a rule change, run them on a branch and on `main` and compare.

## Next

1. Update the Claude Design session with the V44 text and numbers, and reprint the cards on the Reprint List.
2. Add the two Cloudflare secrets to this repository so every change publishes the site automatically (`game/SITE.md`, Publishing changes).
3. Playtest online against the watch list in `design/design-decisions.md`, and read the results on the Stats page.
