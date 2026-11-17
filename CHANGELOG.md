# Changelog

## Race to 10, a Learn step on building your Choir, current-rules stats (November 17, 2026)

Robert's decisions. Still card data V41 and rulebook v11 (no card text changes; no V41 games had been recorded yet).

- **Race to 10.** The game ends after the first Reaping where anyone has 10 Glory (was 15): with everything V41 added, the game should be harder. All-bot games now run a median of 6 Days at 3 players and 7 at 4 (90th percentile 9 and 10), down from 10 and 12. Rulebook, Learn page, engine and bots updated.
- **Rulebook:** the Table Talk section is removed. Its one rule, that Glory and cards pass between players only when a card says so, is now in the Glory entry of "The Places on the Table".
- **Learn page:** no hover magnification on this page (its cards are already large; everywhere else keeps it). New step, **Building your Choir**: growing it with Gather and Exalt, what a card's value and ability each do, Neutral cards, and the four timing labels with real cards for each. 13 steps.
- **Stats page:** shows only the current card version; the "earlier rules" choice is gone (old games stay in the database). The bot column is now measured on V41 at 10 Glory (10,000 games, half Base and half Advanced); it showed V38 numbers before. `cd game/tools/sim && npx tsx baseline.ts 10000` regenerates it.
- **Bots:** the fourth computer player is now called **Delilah** (was Tirzah).

## V41 cards and Rulebook v11: coalition scoring, a growing Choir, Base and Advanced (November 17, 2026)

Robert's decisions of November 17. The Host card rework is next.

- **Coalition scoring.** At the Reaping, the Choirs leaning with the Tide share it: alone, 3 Glory; two, 2 for the stronger lean and 1 for the weaker (1 each if equal); three or more, nothing. A Choir leaning against the Tide loses 1. Was: gain or lose your lean, capped at 3.
- **No Reaping cap**: coalition scoring has fixed amounts.
- **Choir: start with 2 random cards, room for 4.** Was 3 and 3.
- **No Seed.** First Fruits starts the Altar each Morning. The three-player "two Seeds" option is gone.
- **Race to 15.** Was 10.
- **No endgame bonus**, and nothing else left over from the fixed-length game: most Glory wins, a tie is shared.
- **Base game and Advanced.** The Base game is the Host cards only; the Advanced game adds Celestials and Events. Hidden Roles uses the Advanced rules.
- **Four timing labels**: In the Morning, On your turn, At the Reaping, and none (always on or "When…"). Morning's steps are the Event (Advanced), Predictions, and First Fruits; the Evening's are Reveal, Set the Tide, the Reaping, Refresh, Upkeep.
- **The actions are unchanged**: Offer (1 Glory), Gather (free), Exalt (1 Glory); a replaced Choir card is discarded.
- **Rulebook v11**, the Learn page (goal, starting Choir, Morning, and a new Reaping walk-through), and the site (an Advanced game option in the lobby replacing Two Seeds; four Choir places; no Celestials or Event place in a Base game; results without the bonus column).
- **Bots** play coalition scoring: they count who else leans their way, and value building their Choir for later Reapings.

**Card changes (V41):**

- **Timing labels (wording):** Twilight, Zealot, Moderation and Remnant now say "At the Reaping".
- **Timing (rules):** Providence and Eternity move from "In the Evening" to "At the Reaping", so they now act after the Tide is set. Absolution and Mammon lose "Once per Day".
- **No Seed:** Creation reveals 3 Host cards onto the Altar; Pandemonium places First Fruits facedown.

**Watch:** with bots, Base games run a median of 10 Days at 3 players and 12 at 4 (some much longer), because coalition scoring pays less than the old lean scoring. The engine cards in the Host rework are meant to speed up the late game. The Stats page's bot column still shows V40 numbers.

## V40 cards and Rulebook v10: Morning, Noon and Evening; the Offer pays 1 Glory (November 17, 2026)

Measured over 6,000 bot games per option at 3 and 4 players; see `game/reports/v40-dealing-2026-11-17.md`.

- **Three phases each Day.** Morning (Event, Declarations, Seed, First Fruits), **Noon** (one turn each), Evening (reveal, Tide, Reaping, Upkeep). "The Unveiling" is retired.
- **The starting Choir stays at 3 random cards.** Starting with 1, 2 or 3 random cards was measured; 3 keeps games shortest and the cards and Celestials best balanced.
- **The Offer reward is 1 Glory.** The choice to draw a card instead is gone.
- **First Fruits keeps its draw.**
- **Glory moves between players only when a card says so.** The gift rule is gone from the rules and the engine.
- **Rulebook v10:** the above, plus the open Hidden Roles questions moved out of the rulebook (they stay in `design/design-decisions.md`) and a clean version line. v9 moved to `sources/rulebook-drafts/`.
- **Site:** the table shows Morning, Noon or Evening, and the Learn page teaches the three phases. Per-Day Glory in the stats is now recorded once the Reaping is over (it could be taken before a Reaping choice such as Uriel's was made).

**Card changes:**

- **Vessel** (rules, reprint): "On your turn: You may place a card from your hand on the Altar facedown, then draw 1 card. At the Reaping, if that card is still on the Altar and matches the Tide, gain 1 Glory. This is not an Offer." With the Offer reward fixed at 1 Glory, copying it measured 1.49; drawing alone 0.64; this measures 0.91.
- **Wording only, reprint when convenient:** "During the Unveiling" becomes "In the Morning" on Prophecy, the Oracle (also drops "Once per Day"), the Whisper, Creation, Equilibrium and Casting Lots. Babel: "No table talk or deals this Day."

## The game table fits one screen (November 17, 2026)

No card or rule changes.

- **The whole table on one screen.** On a computer or tablet the table no longer scrolls. The card sizes are worked out from the window: your cards are the largest, opponents' a little smaller, and the table fills the space between the top bar and the decision bar at any window size. On a phone the page still scrolls, so cards stay large enough to read.
- **The decision bar never covers anything.** It is its own row under your cards. While you choose, the cards you can pick glow and the rest of the table dims; the choices are also listed in the bar as names (hover one to see the card).
- **Opponents** have their facts (Glory, Alignment, hand size, notes) beside their cards, or above them when there are three opponents, so their cards stay large.
- **Your area** keeps your Glory, Alignment and notes together at the left, then your Celestial, Choir and hand. On a tall, narrow window your hand gets a row of its own.
- **Between turns** the bar shows the last two things that happened. The full log is still at the side.
- **The Evening panel** covers the table only, not the decision bar.
- **No more Give button.** Glory can no longer be given to another player on the site (the server refuses it too).
- **Hover effects are never cut off:** buttons in the decision bar and cards in the discard pile have room for their lift and glow.
- **Lettering:** the title's decorative H is back; it has extra room on its left so it never joins the T ("The"). `apps/web/scripts/spaced-h.py` makes the font change (replaces `plain-h.py`).

## V39 cards, Rulebook v9, and the site's Learn page and names (November 16, 2026)

**Rulings confirmed or decided** (recorded in `design/design-decisions.md`):

- **The Flood and Let There Be Light:** every ability of that color is off for the Day, automatic ones included (Hymn, Snare, Cherubim's protection). The cards still count toward Alignment. New card text; reprint both.
- **Casting Lots:** wording only, pays "At the Reaping" (was "In the Evening").
- **Urim and Asmadai:** a peeked card is shown once, then goes back facedown; players must remember it.
- **Hubris** (Hidden Roles): 1 Glory in total; the holder chooses among tied leaders.
- **Confirmed as already played:** the Tempest on your own turn; the Echo copies only repeatable turn abilities; the Patron is Targeting only into a full Choir; the Favor player chooses how the card is taken; a once-per-game card that leaves the Choir is fresh if it returns; Seraphim and Legion never re-activate each other.

**Rulebook v9:** the same rules as v8, reorganized for new players: the game in one minute, a Day at a glance, the three actions and Reaping scoring as tables, advice gathered into one section, and rulings grouped by topic. Also fixes three errors in v8: Hidden Roles uses all 72 Host cards (v8 said 69), the 4-player rows of the Hidden Roles setup tables are now marked as an optional variant, and Casting Lots matches its card. v8 moved to `sources/rulebook-drafts/`.

**Site:**

- **Learn to play** (`/learn`): a 12-step, clickable walk-through with real cards and things to try (build a Choir, fill an Altar and reveal the Tide, score a Reaping).
- **Rules page:** sections, folded reference parts (Rulings, Hidden Roles, Glossary) and a search for any rule or card.
- **Names are unique.** The first browser to use a name gets a private player code; the name can be used anywhere else only with that code, so nobody can play or be counted in the stats under someone else's name. The same player on two devices shares one seat. Bot names are reserved. New migration `0003_names.sql`.
- **Lettering:** the title font's H no longer joins the letter beside it ("The").
- Cards page: "Celestials (9)" heading.

## Online game site (November 16, 2026)

The Divide is playable online at https://thedivide.pages.dev. No card or rule changes.

- **Tables:** start a table, send the link, fill empty seats with bots, play the Open Game in real time. 3 or 4 players; optional 2 Seeds rule.
- **Turn timer:** a bot makes a choice when a player's time runs out, and covers the seat after two misses until the player returns. Reconnecting (or switching device under the same name) keeps your seat.
- **Fair play:** each browser receives only what that seat may see. Every move is checked by the rules engine; every table can rebuild itself from its seed and moves.
- **Stats:** every finished game is saved to the D1 database `divide-stats` (new tables `day_scores` and `choir_days`, migration `0002_site.sql`). The Stats page shows win ratios for every Celestial and Host card beside the bot numbers, Glory per Day while a card is held, how each card is played, player records, turn order, Tides and Events. Any stored game can be replayed in the browser.
- **Look:** cards drawn from the current card data in the printed deck's style (fonts, frames and colors from the Claude Design bundles, illustrations from `art/plates/`). Cards, rules (rulebook v8) and stats pages.
- **Publishing:** free Cloudflare hosting; `.github/workflows/deploy-site.yml` publishes every change to main once two repository secrets are added (`game/SITE.md`).
- **Engine:** the Tide log entry now records the counted Altar, so the site can show each Evening.

## V38 cards and Rulebook v8 (November 16, 2026)

Working toward every Host card and Celestial between 0.75 and 1.25 (measured over 60,000 bot games). Two cards are outside by Robert's choice: Urim 0.74 and Nephilim 0.74. See `game/reports/v38-balance-2026-11-16.md`.

- **Michael:** "On your turn: Flip a Host card in a player's Choir Facedown. It turns face up after the Reaping, or sooner if its owner pays 1 Glory." 1.47 to 1.11.
- **Uriel and Beelzebub:** doubling now costs 1 Glory at each Reaping. 1.31 to 1.05; 1.22 to 0.98.
- **Mammon:** takes Glory only when you Offer a Dark card. 1.32 to 1.05.
- **Scapegoat:** covers only the Reaping of the Day you use it. 1.27 to 1.08.
- **The Eclipse:** chosen in the Evening before the Altar is revealed. 1.25 to 1.14.
- **The Arbiter:** takes from a player only on a gain of 2 or more. 1.24 to 1.21.
- **Prophecy:** a Neutral Tide is a miss. 1.20 to 1.08.
- **Providence:** costs 1 Glory. 1.20 to 1.15.
- **Vessel:** place a card from your hand on the Altar facedown, then gain 1 Glory or draw 1 card, as with an Offer; not an Offer. 0.65 to 1.16.
- **Morning Star:** at the Reaping, pay 1 Glory to invert one Choir card for that Reaping. 0.72 to 1.15.
- **Eternity:** in the Evening, take 1 card from the Altar into your hand. 0.78 to 0.90.
- **Outcast:** also gain 1 Glory at the Reaping while you have the least. 0.80 to 0.92.
- **Mirage:** at the Reaping, 1 Glory if a card you Offered facedown is still on the Altar and matches the Tide (replaces the V37 draw). 0.76 to 1.17.
- **Raguel:** "...your Bound player loses 1 Glory, and you lose 1 less." 0.76 to 0.89.
- **Urim:** look at up to 3 facedown cards (was 2). 0.71 to 0.74.
- **Nephilim:** wording only, "its two values are Neutral". 0.74.
- **Veil:** unchanged. 0.76.
- **Rulebook v8:** new rulings for all of the above.
- **Tooling:** `apply_changes.py` now handles Celestials, cadence changes and wording-only changes; `tools/sim/ab3.ts` measures every card on fixed seeds.

**Reprints:** 41 cards with rules changes and 22 with wording changes (see `cards/The_Divide_Cards_V38.xlsx`).

## V37 cards and Rulebook v7 (November 16, 2026)

The five strongest and five weakest V36 cards, rebalanced toward a win ratio of 1.00. Each change was tested on 20,000 simulated games. See `game/reports/v37-balance-2026-11-16.md`.

- **Leviathan:** "At the Reaping: If your Alignment did not gain you Glory, gain 1 Glory if any other player loses Glory this Reaping." 1.44 to 1.11.
- **Tree of Life:** "On your turn: Take the top card of the discard pile into your hand, then discard a card from your hand." (was any card). 1.36 to 1.09.
- **Envy:** "On your turn: If the player with the most Glory has at least 3 more Glory than you, they lose 1 Glory. Each tied leader loses 1." 1.30 to 1.08.
- **Tribute:** the 1 Glory is paid to the Pot (was to you). 1.29 to 1.05.
- **Watchers:** "On your turn: Look at the top 3 cards of the Host deck. Put 1 into your hand and discard a card from your hand, then return the rest in any order." 0.66 to 0.94.
- **Forger:** may take any Host card from the discard pile when you Gather (was the top card). 0.67 to 0.87.
- **Apple:** "At the Reaping: If your Choir's Alignment is the opposite color from the previous Day's Tide, gain 1 Glory." (was a doubled gain). 0.67 to 0.99.
- **Council:** "On your turn: You may replace another card in your Choir with a card from your hand. Then each other player may do the same by paying you 1 Glory. Replaced cards are discarded." (was a unanimous vote). 0.67 to 0.88.
- **Mirage:** adds "When the Altar is revealed, if any of your facedown Offerings is still on it, draw 1 card." 0.69 to 0.73.
- **Rulebook v7:** new rulings for Leviathan, Apple, Mirage, Council, Tree of Life and Forger, Envy, and Tribute.
- **Michael** is unchanged and still open (1.47; options measured in the report).
- **Card data tooling:** `cards/tools/apply_changes.py` applies a change set such as `cards/changes/V37.json` to `cards.json`, the engine's copy, the spreadsheet, and `cards.csv` in one step.

**Reprints:** all nine cards join the rules-changed reprint list, which now has 34 cards (see the Reprint List tab in `cards/The_Divide_Cards_V37.xlsx`).

## V36 cards and Rulebook v6 (November 16, 2026)

- **The race to 10.** The Open Game ends after the first Reaping at which any player has 10 or more Glory, with no Day limit. The endgame bonus is still scored, and the most Glory wins. Hidden Roles still lasts 6 Days.
- **Gifts:** the final-Day gift ban is removed.
- **The Arbiter:** the Glory it gives when you lose now goes to the player, other than you, with the least Glory.
- **Mammon:** its Exalt payment now goes to the player, other than you, with the least Glory.
- **New ruling:** when a card names the player with the most or least Glory and players tie, the user chooses among them, unless the card says otherwise.
- **Leviathan:** "At the Reaping: Gain 1 Glory if any other player loses Glory this Reaping." (was 1 Glory for each rival who loses). Win ratio 1.67 to 1.44 in the race.
- **Shroud** at game end keeps the value it had on the final Day.

Measured: average length 6.4 Days, skill edge 2.81 (was 2.46) at 3 players, 4-player seat spread 0.08 (was 0.20). See `game/reports/v36-race-to-10-2026-11-16.md`. Also tested and not adopted: two rounds of turns per Day, snake order, catch-up turn order, and a Day 8 cap.

## V35 cards and Rulebook v5 (November 15, 2026)

More hidden information and more choices, measured on simulated games before adoption. See `game/reports/v35-facedown-offerings-2026-11-15.md`.

### Rules

- **First Fruits:** a fourth Unveiling step. After the Seed, every player secretly picks 1 card from hand, all reveal at once face up on the Altar, then each draws 1. No Glory; not an Offer.
- **Facedown Offers** in both modes. The Offer reward is now a choice: 1 Glory or 1 card.
- **Reveal the Altar** is the new first step of the Evening, before In the Evening abilities.
- **Player counts:** Open Game at 3 or 4, Hidden Roles at 5 or 6.

### Cards

- **Mirage:** "Your facedown Offerings cannot be flipped, looked at, exchanged, or destroyed before the Evening."
- **Raphael / Azazel:** turn your Offering face up and forgo its reward to destroy 1 face-up opposing card.
- **Hymn / Lamentation:** a two-card Offer goes face up; one reward.
- **Vessel:** adds its card facedown.
- **The Cantor:** a reward for each of its two Offers.
- **Pandemonium:** "The Seed and First Fruits are placed facedown, and no card on the Altar may be flipped or looked at before the Evening."
- **New:** Ithuriel (Light +1, flip a facedown Altar card), Urim (Neutral, secretly look at up to 2 facedown Altar cards), Asmadai (Dark +1, look at a facedown Altar card and may swap it with one from your hand). The full deck is 72 Host cards; the Open Game uses 66.

### Results (3 players)

Core decisions per player rose from 21.8 to 33.2, the skill edge held (2.37 to 2.46), and the Day 3 leader's win rate fell from 65% to 62%.

## V34 cards and Rulebook v4.1 (November 14, 2026)

Five balance changes, each tested on 20,000 simulated games before adoption. See `game/reports/balance-proposals-2026-11-14.md`.

- **The Arbiter:** "At the Reaping, if you gain Glory, take 1 of it from a player of your choice. If you lose Glory, give 1 of it to a player of your choice." (was: all Glory gained or lost routed through players). Win ratio 1.84 to 1.19.
- **Confession:** gain the Glory only if your revealed hand holds no Dark card. 1.61 to 1.18.
- **Covenant:** forbid only Offer or Gather, and name a player who has not yet taken their turn this Day. 1.22 to 1.00.
- **Heresy:** "At the Reaping: You may score your Alignment in reverse." (was mandatory). 0.59 to 0.94.
- **Raguel:** only the holder's Reaping loss is shared with the Bound player (was: both lose the greater amount). 0.61 to 0.75.

**Reprints:** all five join the rules-changed reprint list, which now has 19 cards (see the Reprint List tab in `cards/The_Divide_Cards_V34.xlsx`).

## V33 cards and Rulebook v4 (November 13, 2026)

A full review of every Divide file against the design decisions to date. Every card-level change is listed with its old and new text in the **V32 to V33 Changes** tab of `sources/card-data/The_Divide_Cards_V33.xlsx` (archived).

### Rules

- The Open Game (formerly the 3-player variant) is now the core rules. Hidden Roles is a mode for 5 or 6 players, or 4 by choice.
- The Open Game sets aside Revelation, Knowledge, Bounty, Flaming Sword, Belial, and Hubris, plus The Sabbath, Equilibrium, and Armageddon. Its deck is 63 Hosts (21 Light, 20 Dark, 22 Neutral or Variable; Offering 24 Light, 24 Dark) and 17 Events.
- In the Open Game, no Glory may be given on the final Day.
- Two timing windows are defined: *In the Evening* (before the Tide is set) and *At the Reaping* (after it).
- "Target" is defined as the umbrella term for six kinds of Targeting: Look at, Reveal, Copy, Flip, Replace, Discard.
- New rulings for Nephilim, Shroud, the Whisper, the Eclipse, the Arbiter, Mammon, Tithe, and Silence (see `rules/The_Divide_Rulebook_v4.md`, Rulings).
- Rulebook v4 assembles the v3 drafts, the 3-player variant, and the pre-rework back half (Celestials, Events, glossary) into one document.

### Cards (V32 to V33, 35 cards changed)

- **Current back to Tide** on Providence, Stillness, Shroud, Nephilim, Firmament, Mirage, and Prophecy.
- **Timing moved to At the Reaping:** Stillness, Firmament, Fig Leaves, Heresy, Prophecy, the Whisper, the Eclipse.
- **The Eclipse:** "At the Reaping, once per Day, treat one Host card in your Choir as Neutral."
- **Raguel:** restores "When this enters your Choir, choose another player."
- **Council:** "If every player votes yes."
- **Nephilim:** "and" restored, so it counts as both colors at once.
- **Azazel:** Once per Day removed to mirror Raphael.
- **Michael:** uses the Flip keyword.
- **Cadence format** ("On your turn: Choose...") applied to every card.
- **Typos:** Veil, Uriel, Sanctuary, Watchers, Tree of Life.

### Reprints needed

**Rules changed since the last printing (15).** Reprint before the next physical playtest.

| Deck | No. | Card | What changed |
|---|---|---|---|
| Host | 1 | Michael | Can target any player's Choir; uses the Flip keyword |
| Host | 3 | Gabriel | No longer forbids revealing the Event |
| Host | 5 | Confession | Hand stays revealed until the end of your next turn |
| Host | 10 | Raphael | Once per Day removed |
| Host | 18 | Cherubim | Blocks Replace and Discard only |
| Host | 32 | Firmament | Timing moves to At the Reaping |
| Host | 40 | Veil | Adds Flip; Discard explicitly allowed |
| Host | 41 | Prophecy | Pays on the Tide instead of your Choir; resolves At the Reaping |
| Host | 51 | Azazel | Once per Day removed |
| Host | 60 | Parasite | Turn no longer listed |
| Celestial | III | The Eclipse | Acts At the Reaping |
| Celestial | VII | The Dominion | Adds: begin the game with 4 cards in hand |
| Celestial | VIII | The Whisper | Payoff At the Reaping |
| Event | | Manna | Hand limits increase by 1 |
| Event | | Divine Calling | Full-Choir surcharge removed |

**Wording or format only (38).** Reprint when convenient: Wisdom, Providence, Tree of Life, Seraphim, Sanctuary, Uriel, Martyr, Covenant, Morning Star, Absolution, Deliverance, Vessel, Eternity, Ordeal, Twilight, Zealot, Stillness, Shroud, Moderation, Fig Leaves, Heresy, Council, Mirage, Watchers, Apple, Anathema, Serpent, Legion, Moloch, Beelzebub, Leviathan, Hubris, Mammon, Envy, Winnowing, Remnant, Jubilee, Pandemonium.

## Earlier history (summary)

- **V31 to V32 (July 30, 2026):** cadence format started on cards 1 to 43; Cherubim and Veil split into opposites; Phantasm renamed Vessel; several rewordings.
- **V31 update sheet (July 25):** Vessel, Shroud, Firmament, and Council reworked for the 3-player variant.
- **Rework update sheet (July 25):** Absolution, Outcast, Forger, Moloch, Parasite reworked; Remnant, Jubilee, Snare added (69 cards, 23/23/23); the Dominion changed to hand limit 4.
- **Rulebook v3 (July):** full 3-card starting Choir, free Gather replacement, flat 1-Glory Exalt, deck reshuffle rule.
- **V28 print kit:** 66 Hosts rebalanced to 22/22/22; once-per-game cards set to +2.
