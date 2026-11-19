# The Divide

A card game of divine ambition for 3 or 4 players by Robert Treviño. Players feed a shared, partly hidden Altar whose weight decides which side wins each Day, build public Choirs that score when their color wins, and hold a secret mix of Light and Dark allegiance tokens that score at the end. Every card is a choice between helping yourself and helping a side you can never be sure is yours.

**Current versions:** card data **V45**, rulebook **v15** (November 19, 2026). **Start with `design/the-game-now.md`; every decision is indexed in `DECISIONS.md`.**

## What's here

| Folder | Contents |
|---|---|
| `rules/` | `The_Divide_Quick_Guide.md`: the game on two pages, and what changed from V44. `The_Divide_Rulebook_v15.md`: the complete rules, organized for new players: the game in one minute, a Day at a glance (Morning, Noon, Evening), the actions and scoring as tables, then Celestials, Events, rulings by topic, and the glossary. The site's Rules page shows it with a search. |
| `cards/` | `The_Divide_Cards_V45.xlsx` (tabs: all cards, Open Game deck, changes since V32, reprint list), `cards.csv` (same data, one row per card), and `cards.json` (structured for the web build). To change card text, write a change set in `cards/changes/` and run `python3 cards/tools/apply_changes.py cards/changes/<VERSION>.json`; it updates all of these and the engine's copy together. |
| `design/` | **`vision.md`: the heart of the game, the principles every rule is measured against.** **`the-game-now.md`: the current design on one page, how it got here, and its validation.** `design-decisions.md`: the principles behind the rules, open questions, parked ideas, and the playtest watch list. `balance.md`: the measured win ratio of every Host card, Celestial and Event under the current rules. |
| `art/faces/` | Every card face as last printed (Host, Celestial, Event, Fate and Turn), about 370 DPI. |
| `art/plates/` | The illustration alone for every card, for the web build. |
| `art/overview/` | Contact sheets for a quick look at all the art. |
| `game/` | The online game: rules engine, computer players, balance simulator, the live server and the website. See `game/README.md` and `game/SITE.md`. |
| `print/` | The scripts that render the Claude Design deck sheets into print PDFs, and how to use them. |
| `DECISIONS.md` | Every decision in one line (what, why, where the evidence is), newest first. |
| `CHANGELOG.md` | What changed in each version and why, what was tried and rejected, and which cards need reprinting. |

Earlier card spreadsheets, rulebook drafts, print sheets, design write-ups and simulator reports are in the git history (removed November 18, 2026); the CHANGELOG records what each one decided.

## Sources of truth

- **Rules and card text:** the V45 card data and rulebook v15 in this folder. When the rulebook and the card data disagree, the card data wins.
- **Printed card visuals:** the Claude Design session. Card text changes must be made there too before printing. The **Reprint List** tab in the V45 spreadsheet lists every card whose printed face is out of date, in text or in number.
- **Card faces in `art/faces/`** show the most recent printing. Many carry older wording, numbers and (since V45) frame colors; check `print_status` in `cards.csv` before relying on a face's text. Ithuriel, Urim and Asmadai were retired in V42 and have no art.

## Quick facts

- **One deck:** 69 Host cards, every one Light or Dark (34 and 34, and Acolyte, whose color changes; numbers 24 to 46 were the Neutral cards before V45). Plus 24 allegiance tokens, a Tide track, 9 Celestials and 17 Events (3 more, which moved the Balance, are retired with Hidden Roles).
- **Modes:** the Base game (Host cards and tokens) and the Advanced game (adds Celestials and Events), both for 3 or 4 players. Hidden Roles was retired in V45.
- **Setup:** a hand of 3 (the Dominion 5) and a Choir of 2 random face-up cards, with room for 4.
- **The Day:** Morning (Event in Advanced, predictions, First Fruits: everyone gives one card, shuffled so no one knows whose), Noon (one turn each: Offer a card or a token facedown, Gather a card or token from the Altar, or Exalt a card from your hand), Evening (the anonymous reveal; the heavier side wins the Day; the Reaping).
- **Scoring:** each Choir card of the winning color scores 2 Glory each Evening. After 7 Days (the last is Judgment Day: everyone chooses their action in secret), each token scores 1 for every Day its color won, and the most Glory wins. **No offering, no harvest:** your Choir scores only on a Day you Offered.
- **Setup:** 6 secret allegiance tokens each, dealt from an even, shuffled pool.

## Online game

- **Play:** https://thedivide.pages.dev (3 or 4 players, bots fill empty seats). Every finished game is saved to the stats database and shown on the site's Stats page. Guide: `game/SITE.md`.
- **Engine:** every Open Game rule and card is implemented and tested in `game/packages/engine` (`npm test` runs 99 engine tests, including about 600 full bot games, and 11 server tests).
- **Stats database:** Cloudflare D1 database `divide-stats`. The schema and balance views are in `game/apps/server/migrations/0001_init.sql`.
- **Balance testing:** `game/tools/sim` plays thousands of bot games on fixed seeds: `npm run sim` and `exp45.ts` measure every card, `advanced.ts` the Celestials and Events. To test a rule change, run them on a branch and on `main` and compare.

## Next

1. Playtest V45 (online and in print) against the watch list in `design/design-decisions.md`.
2. Update the Claude Design session with the V45 text and frame colors, add the allegiance tokens and Tide track, and reprint the cards on the Reprint List.
3. Add the two Cloudflare secrets to this repository so every change publishes the site automatically (`game/SITE.md`, Publishing changes).
4. Read the results on the Stats page.
