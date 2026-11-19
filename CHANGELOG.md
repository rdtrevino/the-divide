# Changelog

Older entries name files that have since been removed (design write-ups, simulator reports, archived spreadsheets and rulebook drafts, the V28 print kit); every one of them is in the git history before November 18, 2026.

## Human-like bots (November 19, 2026)

Layer 3 of the bot plan (`design/bots.md`), built on the learned bot.
- **Simulations play the learned bot by default** (`BOT=heuristic` for the old one): about 14 ms a 4-player game.
- **The learned bot pays a small extra cost to Offer a token:** it overspent them; it now plays the strong bot even.
- **Levels and styles** (`persona.ts`): Novice to Expert by sampling temperature; Loyalist, Builder, Hoarder, Gambler, Bluffer. Tested by `tools/sim/personas.ts`.
- **A reader** (`tools/sim/reader.ts`): strong players hedge (a Choir opposite their tokens), which makes their sides 73–83% readable. An open question, in `DECISIONS.md`, with card measurements under stronger play.

## The learned bot (November 19, 2026)

Layer 2 of the bot plan (`design/bots.md`).
- **Learned bot** (`learned.ts`): a small network trained on the strong bot, reading only its seat's view. 1.62× a fair share among heuristic bots, 0.81 against the strong bot, a median 0.15 ms a decision.
- **The site's bots** now use it (`roomCore.ts`), warmed at Worker startup; the heuristic still answers minor decisions. Not yet deployed.
- **Hybrid strong bot** (`HYBRID`): searches only the network's top 2 options, with learned playouts. Beats the strong bot 1.12 to 0.88 at the same cost.
- **Tools:** `game/tools/distill` (data, training in numpy, play tests). Removed four redundant sim scripts; `exp45.ts` now reports seats and runs on every core. **`DECISIONS.md`** indexes every decision.

## Faster bots (November 19, 2026)

Layer 1 of the bot plan (`design/bots.md`): the same bots, about 3× faster, with every move unchanged (checked by fingerprint).
- **Engine:** the strong bot copies the game from the start of the Day (`Game.fork`) instead of replaying from the deal. 1.58 → 0.93 seconds for a game where all 4 players use the strong bot, on one core.
- **Every core:** `game/tools/par.ts` runs a script's games in parallel with identical results; used by the lab's main modes and `skill45.ts`. With 4 cores: 0.53 s a game in the engine (3.0×), 0.13 s in the lab (3.1×).
- **Fixed:** the Judgment Day choice being carried out was kept outside the game state, so two games running in one process could interfere. It is now part of the state.
- **Tools:** `bench-bots.ts` (bot speed and move fingerprint); `skill45.ts` prints a standard error; a test that a copied game always matches a full replay (104 engine tests).

## V45: no offering, no harvest (November 19, 2026)

Robert's questions about tokens and the Miser's Rule, tested in lab Rounds 44 and 45 (`design/tokens-and-offering.md`).
- **The Miser's Rule is replaced by "no offering, no harvest":** your Choir scores at the Reaping only on a Day you Offered (a card or a token). Offers rise to 67–68% of actions; strong play beats simple play 3.91×; nothing is tracked across the game.
- **Kept:** tokens are played as an Offer; leftover tokens go to whoever holds the fewest. Tokens should be made card-shaped, so a token Offer looks like any other.
- **Cards:** Anathema (other players' Offers go face up, instead of being blocked: 1.88 under the new rule), Temptation (a rival's Choir card counts as the opposite alignment this Day), Mercy (only if you Offered: 1.57), Moloch (3 Glory), Ordeal (no penalty), Favor (your Choir outscored everyone else's).
- **Site:** the table notes who has Offered today; the results drop the Miser column.

## V45: 7 Days and Judgment Day (November 19, 2026)

Robert's call, after lab Round 43 (`design/the-game-now.md`, "Seven Days at every table?").
- **Every game lasts 7 Days** (it was 6 at 3 players and 8 at 4): one number to learn.
- **Judgment Day.** On Day 7, after First Fruits, every player chooses their whole action in secret (which action and which card or token), then the turns carry them out in order. An action that can no longer be done does nothing. Measured with strong bots, seats are 0.92–1.12 at 3 players and 0.89–1.16 at 4 (7 Days without it: up to 1.24), and the rule holds at 5 and 6 players (0.85–1.24) if the game ever grows.
- **Engine and site:** the secret choice is a Judgment Day prompt listing every action you could take; the table shows "Judgment Day" on Day 7; both bots play it. 101 engine tests.
- **Strong computer players** (`game/packages/engine/src/mc.ts`): Monte Carlo search like the lab's, with reads (token guesses lean toward each player's Choir). One wins 2.4 times its share among the fast bots. The site still uses the fast bots.
- **Card measurement** (`game/tools/sim/card-value.ts`): what a card's ability is worth, from paired games against a plain card of its color, with each card's role (kept, activated, Glory made).

## V45: the Tide track, allegiance tokens, and every card Light or Dark (November 19, 2026)

Robert adopted the Tide-track core (`design/the-game-now.md`, measured in the lab over Rounds 35 to 42). Card data V45, rulebook v15.

**The core rules** (engine, site, rulebook)
- **Allegiance tokens.** Each player is dealt 6 secret tokens from an even, shuffled pool (9 + 9 at 3 players, 12 + 12 at 4). At the end each scores 1 Glory for every Day its color won. A token can be **Offered** facedown (it counts 2) and **Gathered** (it needs no room); tokens left on the Altar go, one at a time, to whoever holds the fewest.
- **The Tide track.** The heavier side **wins the Day**; a tie is Neutral and no one wins. The track replaces the race to 12.
- **The Reaping:** each Choir card of the winning color scores **2 Glory**. No lean, no pairs, no losses.
- **Offers earn nothing** directly: the Offer is the public good. **The Miser's Rule:** whoever Offered the fewest times loses 3 at the end (nobody, if all tied).
- **Anonymous First Fruits** (shuffled, no owner) and an **anonymous reveal** (facedown Offers and tokens are shuffled before they turn face up).
- **Fixed length:** 6 Days at 3 players, 8 at 4, so every seat is first equally often.
- **Hidden Roles is retired** (and with it the Fates, the Turn, the Balance, and The Sabbath, Equilibrium and Armageddon). The tokens give every game secret, shifting sides. A lab test at 5 and 6 players (Round 41) found the reads still hidden (53 to 57%) but the turn order unfair (seats 0.59 to 1.43) and 5 players too long at 10 Days; the game is for 3 and 4.

**Every card is Light or Dark** (Robert). A Neutral card never scores at the Reaping, so all 23 measured 0.50 to 0.70. A Neutral-pay rule was tested and balanced them, but it adds a rule and lets a Neutral Offer satisfy the Miser's Rule without pushing anything. Coloring them is simpler, keeps the deck mirrored (34 Light, 34 Dark, and Acolyte, whose color changes), cuts Days nobody wins from 29% to 20%, and in the lab is as hard to read (52%) and as skillful (3.56x) as any version.
- **Made Light:** Eternity, Raguel, Firmament, Stillness, Council, Prophecy, Moderation, Flaming Sword, Jubilee, Vessel, Twilight. **Made Dark:** Fig Leaves, Outcast, Heresy, Mirage, Veil, Apple, Forger, Watchers, Ordeal, Zealot, Nephilim (which also counts as Light for card abilities). **Acolyte** takes the color of the most recent Day won (Light before any).

**Cards reworded for the new scoring** ("lean", "with the Tide", and losses at the Reaping no longer exist): Providence and Mammon (fill on Light or Dark Days), Tree of Life (Light today and yesterday), Mercy (your Choir scored nothing), Ordeal (spent; double, or lose 2), Raguel (their Choir outscores yours), Firmament and Leviathan (the margin alone), Moderation (as many Light as Dark cards), Fig Leaves (take back a facedown Offer), Heresy (score the losing color), Council (both Choirs score), Apple (the Tide turned), Favor, Defiance, Bounty, Parasite and Scapegoat ("scored nothing", Scapegoat costs 2), Hubris (8), Envy (5), Uriel and Beelzebub (1), Moloch (2), Flaming Sword (Exalt only), Morning Star (costs 1).
**Celestials:** the Tempest (may destroy a facedown card), the Eclipse (in the Morning, a card counts as the other color), the Cantor (draw when you Offer), the Patron (exchange a hand card with a Choir card), the Whisper (+1 / -1), the Arbiter (take from a Choir that scored less). **Events:** Purgatory (the Day counts for neither side), False Prophecy and Famine reworded, the Flood and Let There Be Light (the cards still score), the Fast (no Turn).
**Measured** (`design/balance.md`): every Host card 0.75 to 1.25 and every Celestial 0.86 to 1.23 over 20,000 bot games.

**Engine and site:** the engine plays only V45 (99 engine tests, including 600 bot games); the table shows the Tide track, each Choir's colors, everyone's token count, your own tokens and what they are worth, tokens on the Altar, and the reveal in the results; the Learn page and the Rules page teach V45. `cards/tools/apply_changes.py` can now change a card's alignment. Every card whose color changed needs a reprinted frame (Reprint List).

## The engine keeps only the current rules; history moves to the git log (November 18, 2026)

No card text, rules or balance changes, and nothing on the site looks or plays differently.

- **One set of rules in the engine.** Every rework from V42 to V44 had been built as a switch, so adopted and rejected versions of the same card lived side by side (about 150 switches). The adopted versions are now the plain rules and the rejected ones are gone, along with the switch machinery. The rules engine is 27% smaller. Recordings of about 12,800 bot games (over a thousand of them with every player's view at every step) are identical before and after.
- **Retired with the switches:** the simulator tools that compared them (`ab`, `ab2`, `variants`, `flow`, `engine-vs-offer`, `held`); `ab3` is now `card-balance.ts`. To test a rule change, change the engine on a branch and compare the simulator's reports with `main` (`game/README.md`).
- **Parked ideas kept:** the two alternatives Robert wanted to keep in mind (Winnowing's hand discard, Zealot's face-up Altar count) are written out in `design/design-decisions.md`.
- **Design docs:** `design/design-decisions.md` is rewritten for V44: principles, open questions, parked ideas and a current watch list. The rulings it duplicated are in the rulebook. `design/balance.md` holds the measured win ratio of every Host card, Celestial and Event under the current rules (from the V43 results and the V44 Advanced pass). The proposals and assessments for V41 to V44, the November 13 file audit, and the V34 to V40 simulator reports (`game/reports/`) are removed; this changelog records what each decided.
- **Raphael and Azazel's prompt** no longer says you forgo the Offer's reward. You keep it, as the card, the rulebook and the game have said since V43 (Robert's decision: the rule stays).
- **Archives removed:** `sources/` (earlier card spreadsheets V28 to V43, rulebook drafts v2 to v10, the July 25 print sheets, the V28 print kit, and the Claude Design HTML bundles, 76 MB). `apply_changes.py` now deletes the superseded spreadsheet instead of archiving it. The print README keeps the one instruction from the V28 kit still in use (the frame overhang when capturing).

## Code cleanup, and the game record keeps the turn timer again (November 18, 2026)

No card text, rules or balance changes, and nothing on the site looks different. Every change was checked against a recording of about 16,000 bot games (every test switch included): each decision, view, log line and result is identical before and after. Every page of the site was compared screenshot by screenshot.

- **Fixed: stored games lost the turn timer record.** Since V41 a code comment had swallowed two fields, so the stats database stopped saving each game's timer setting and which moves the timer made for a player (the game record page never showed "The turn timer made N choices"). Games played from now on record both again; games already stored cannot be repaired.
- **The engine** lost code nothing used: functions with no callers, computer-player answers to questions the game never asks, and game state that was written but never read. The extra state the V43 and V44 test switches keep is now declared, instead of being added on the fly.
- **The simulator:** `flow.ts` works again in the Base game (it crashed looking for Celestials), and `variants.ts` stops with a message for the old letter codes, whose rules were removed from the engine long ago (they had been silently measuring the plain rules).
- **Docs:** `game/README.md` describes the rule switches as they work today; `game/BUILD_NOTES.md`, the first site brief that `SITE.md` replaced, is removed (it is in the history); tests and comments name Knowledge, Belial and Revelation instead of the retired Urim, Asmadai and Ithuriel.

Publishing this changes the engine fingerprint, so a table that is mid-game when it goes live returns to the lobby, as with any engine update.

## Site review: fixes across the table, the Learn page, the rulebook and the docs (November 18, 2026)

No card text or balance changes. Found by playing full Base and Advanced games in the browser (desktop and phone) and reading every page, prompt and log line against the V44 rules.

**The table**
- **Fixed a crash at First Fruits.** The Altar's Light/Dark tally gave the engine a partial game state without its rules settings, and the card values have read those settings since V43 (Hymn and Lamentation). The table broke as soon as a face-up card reached the Altar. Fixed in the table and made safe in the engine; a test covers it.
- **Anathema** no longer stops its own holder from Offering (it matters with a Free Will second action). The card says "No other player".
- **Bounty and Council** now pay Tithe and log whom they named, like every other *In the Morning* ability.
- **Flaming Sword** shows as "Flaming Sword: cannot Exalt or Gather" (it was labelled Anathema), and an unavailable action says why (Flaming Sword, The Fast, an empty Altar); the stale "Exalt costs 1 Glory" reason is gone.
- **The lean tooltip** explains the current scoring (alone +3, two +1 each, three or more 0; against: alone −3, otherwise −1), not the old "+N on a Light Tide".
- **The log says "lean"**: "gains 3 Glory at the Reaping (leans Light)" instead of "(Alignment 2)". Exalt no longer says "at no cost" every time; Raphael and Azazel no longer say they gave up the reward; Apple, Uriel and Beelzebub log the 2 Glory they pay.
- **Prompts match the current cards:** Vessel (no draw; it can lose 1), Silence (free), Bounty and Prophecy (the losing half), Flaming Sword and Anathema (until the start of your next turn), the Tempest (face-up), the Whisper, Eternity (any card).
- **Altar labels:** Creation's cards say Creation (not "the Seed"); Vessel's and Eternity's cards say who put them there and how.
- **Lobby:** a Base game no longer promises Celestials.

**The Learn page**
- The "goal" graphic now shows the race to 12 (bars, line and caption).
- Picking Choir cards in the "Your Choir leans" demo no longer pushes them into the heading and border; on a phone, chosen cards no longer cover the row above.
- The timing step adds *In the Evening* (Fig Leaves), says "spent" cards (not "once per game, turned sideways"), and "carry you to 12".
- A link to another step (`/learn#5`) works while you are already on the page.

**Rulebook v14** (wording only)
- First Fruits is the third step of Morning in the glossary too.
- The glossary no longer says Lilith protects your hand or Defiance your Glory; it names what does protect (Cherubim, Tribute, Mirage).
- New ruling, **At the Reaping**: Bounty, Raguel, Favor and Parasite count only Glory gained or lost at the Reaping, which is what the game does (Raguel's and Favor's rulings said "the whole Day" and "any source").
- Vessel's ruling no longer contradicts Snare's; the Flood's example is Martyr (Hymn's ability is not in a Choir); "Build for later" lists Tree of Life instead of Favor; *In the Evening* is listed wherever activation timings are.

**Docs:** the top-level README describes V44 (one deck of 69, free Exalt, mirrored scoring, race to 12, test counts); SITE.md and game/README no longer mention the 2 Seeds option or old test counts; the Cards page's checkbox reads "Current deck only".

**Cards (wording, still V44).** Favor, Raguel, Bounty and Parasite now say "at the Reaping", which is what the game always counted: "If 2 or more other players lost Glory at the Reaping", "if they gained (lost) Glory at the Reaping". No rule changes, so the card version stays V44 and the stats carry on. `cards/changes/V44-wording.json`; `apply_changes.py` now accepts a wording pass within a version. The rulebook's rulings for them are shorter to match.

## V44 cards and Rulebook v14: Celestials and Events for the current game; the deck numbered Light, Neutral, Dark (November 18, 2026)

Not yet merged. Full review, every option measured, and the renumbering table: `design/v44-advanced.md`.

**Celestials.** Every one now lands between 0.95 and 1.05 over 60,000 Advanced bot games (V43: 0.84 to 1.10), within 0.92 to 1.06 at each player count.

| Celestial | Now | Win ratio |
|---|---|---|
| The Tempest | When you Offer, you may destroy a face-up card on the Altar | 1.10 → 0.99 |
| The Oracle | In the Morning: look at the top 2 Events, play one, put the other on the bottom | 0.92 → 0.95 |
| The Cantor | A second Offer must match the first's alignment (Light, Dark or Neutral); both go face up, each with its reward | 0.97 → 0.99 (1.13–1.18 when played fully) |
| The Patron | Worded like Temptation, and Targeting like it | 1.00 → 0.95 |
| The Dominion | A hand of 5 (was 4) | 0.99 → 1.00 |
| The Arbiter | Takes 1 of any Reaping gain from a player against the Tide (else anyone); never gives its losses away | 0.84 → 1.01 |
| The Eclipse, the Echo, the Whisper | Wording only: timing labels and current scoring words | 1.04, 1.05, 1.09 → 1.05, 1.01, 1.05 |

**Events.**
- **Divine Calling:** "When you Exalt this Day, gain 1 Glory." (Exalt is free since V42, so the old text did nothing.)
- **Purgatory:** "No Choir loses Glory at the Reaping this Day. A Choir that leans neither way gains 1 Glory." (It used to ignore the Tide and cost the table about 3 Glory.)
- **Tithe:** unchanged text; the engine no longer charges for Celestial powers, which are not Host abilities.
- **Wording only:** The Fast (no one may Exalt, Turn, or spend Glory), Famine (no Choir counts as leaning with or against the Tide), Ascension and Fall From Grace (cards on the Altar, First Fruits included, count double).

**Host card numbers.** 1–23 Light, 24–46 Neutral (with Acolyte and Nephilim), 47–69 Dark, each group in its old order; 46 cards changed number (Remnant 67 → 23, Jubilee 68 → 46, Vessel through Forger +1, Anathema through Abaddon +2). The face and plate images are renamed to match, and the Reprint List notes each new number. `apply_changes.py` does this with `"renumber": true`.

**Code**
- `V44_RULES` in `core.ts`; the rejected options remain as test switches.
- Bots judge the Day's Event (for the Oracle, Tithe, Purgatory, Divine Calling) and make the Cantor's second Offer with Neutral cards too (`bot-v44`).
- New sim tool `tools/sim/advanced.ts`: Celestial win ratios overall and by player count, and what each Event does to its Day.
- Card data V44 (`cards/changes/V44.json`), Rulebook v14 (Celestials, Events, and rulings for the Tempest, Oracle, Cantor, Patron, Arbiter, Tithe, Purgatory and Divine Calling), the Stats page's bot column re-measured.
- The renumbering changes the deck order a seed deals from, so games recorded on V43 show the site's "earlier version" notice on replay; one server test moved to a seed whose deal it expects.

## V43 cards and Rulebook v13: a deck built around engines, a race to 12 (November 18, 2026)

Robert's decisions of November 18, card by card. Not yet merged.

**Rules**
- **Race to 12** (was 10). Engines need Days to pay off: about 8 Days a game, and every card lands within 0.8–1.2 for bots.
- Scoring is unchanged: alone ±3; two with the Tide 1 each; three or more with it nothing; against it with company −1. (A 2/1 pair and "three or more gain 1" were measured and not adopted.)
- A new timing, *In the Evening* (before the Altar is revealed), for Fig Leaves.

**Cards (24 changed)**

| Card | Now |
|---|---|
| Wisdom | When you Offer or Exalt, look at the top 2 Host cards; put 1 into your hand, discard the other |
| Gabriel | In the Morning: look at a player's hand, name Light or Dark; +1 if they Offer that alignment |
| Tree of Life | +1 if your Choir leaned with the Tide today and yesterday |
| Hymn, Lamentation | **+2**; they go face up when Offered |
| Martyr | +1 when another card is discarded from your Choir |
| Tribute | The fee for Targeting your Choir is paid to you |
| Remnant | +1 if 2 or more places in your Choir are empty |
| Lilith | Take a card discarded from another player's Choir into your hand |
| Parasite | Exalt or Gather it into another player's Choir; +1 when they lose; discarded when they gain |
| Snare | +1 when another player Gathers, flips, or discards a card you placed on the Altar |
| Eternity | Keep one card on the Altar, face up, through the next Day |
| Twilight | +2 if the other cards hold as many Light as Dark (at least 1 each) |
| Council | Name a player in the Morning; if your Choirs lean the same way, each gains 1 |
| Forger | Gather or Exalt from the discard pile |
| Mirage | Other players cannot Gather, flip, look at, exchange, or destroy cards you placed on the Altar |
| Apple | +2 (was +1) |
| Fig Leaves | Decided in the Evening, before the reveal |
| Raphael, Azazel | Destroying keeps the Offer's Glory |
| Flaming Sword | No other player may Exalt or Gather until your next turn |
| Leviathan | +1 if the Tide won by 3 or more and you lean with it |
| Defiance | +1 if you lean with the Tide and more Choirs leaned against it than with it |
| Favor | +1 if 2 or more other players lost Glory this Day |

Full history, with every version measured: `design/v43-proposal.md`.

**Code**
- `V43_RULES` in `core.ts` and `GLORY_TARGET = 12`; the new abilities live in `engine/src/v43.ts`. The rejected versions remain as test switches.
- New sim tools: `playrate.ts` (how often each card is held, Offered, Exalted, Gathered and used) and `usage.ts`.
- Card data V43 (`cards/changes/V43.json`), Rulebook v13, the Learn page and the table's labels (race to 12).

## V42 cards and Rulebook v12: one deck, free Exalt, mirrored scoring (November 18, 2026)

Robert's decisions of November 17 and 18, reviewed card by card. Not yet merged.

**Rules**
- **Exalt costs no Glory.** It costs the card and the Offer you give up. Building was a losing move before (turns were 85% Offer and 1% Exalt); now about 58% Offer, 15% Gather, 27% Exalt.
- **Gather takes from the Altar only** (blind deck draws were 2–3% of Gathers and lose to a free Exalt).
- **Mirrored Reaping.** With the Tide: alone 3, two 1 each, three or more 0. Against it: alone lose 3, otherwise lose 1. How strongly you lean no longer matters.
- **One deck of 69 Host cards**, all with art, for every way to play. Ithuriel, Urim and Asmadai (no art) are retired; their abilities moved to Revelation, Knowledge and Belial. No once-per-game cards: five are "spent" (use it, then discard it).
- **Every Light or Dark card is +1.** "At the Reaping" becomes **"At the end of the Day"**; no card says "color".

**Cards (46 changed).** Michael, Gabriel, Providence, Tree of Life, Free Will, Seraphim, Uriel, Covenant, Mercy, Revelation, Morning Star, Knowledge, Deliverance, Remnant; Anathema, Favor, Temptation, Legion, Beelzebub, Leviathan, Hubris, Belial, Mammon, Lilith, Parasite, Winnowing, Silence, Scapegoat, Defiance, Bounty, Abaddon; Vessel, Eternity, Raguel, Zealot, Shroud (renamed **Acolyte**), Firmament, Fig Leaves, Flaming Sword, Outcast, Heresy, Mirage, Veil, Apple. Full before and after, with win ratios: `design/v42-deck.md`. Parked alternatives: `design/parked-abilities.md`.

**Measured** (bots that value card abilities): 7.1 Days a game at 3 players, 7.7 at 4; the winner earns 1.4–1.5 Glory a Day; turns are 57–59% Offer, 15% Gather, 26–28% Exalt; Glory comes from Offers 41–46%, the Tide 23–31%, cards 28–30%; every card between 0.77 and 1.26 (counted over cards held at the end of any Day).

**Code**
- The approved choices are the engine's rules (`V42_RULES` in `core.ts`). The rejected alternatives remain as test switches; `-name` turns one rule off and `v41-rules` turns them all off, for comparisons.
- Bots value a card's ability when they build, use the stores, Temptation and Morning Star, and target rivals' facedown Offers with Winnowing.
- New sim tools: `income.ts` (Glory a card earns per Day held), `shape.ts` (game length, Glory sources, action mix), `held.ts` (card balance over cards held at the end of any Day).
- `cards/tools/apply_changes.py` now handles values, renames and deck changes; `cards/changes/V42.json`.
- Rulebook v12, the Learn page (actions, the Reaping, a new scoring calculator) and the action labels.

**Still to do:** an Advanced pass on the Celestials and Events (written for the earlier scoring; Divine Calling has no effect now), and reprinting the changed card faces (see the Reprint List in `cards/The_Divide_Cards_V42.xlsx`).

## Race to 10, a Learn step on building your Choir, current-rules stats (November 17, 2026)

Robert's decisions. Still card data V41 and rulebook v11 (no card text changes; no V41 games had been recorded yet).

- **Race to 10.** The game ends after the first Reaping where anyone has 10 Glory (was 15): with everything V41 added, the game should be harder. All-bot games now run a median of 6 Days at 3 players and 7 at 4 (90th percentile 9 and 10), down from 10 and 12. Rulebook, Learn page, engine and bots updated.
- **Rulebook:** the Table Talk section is removed. Its one rule, that Glory and cards pass between players only when a card says so, is now in the Glory entry of "The Places on the Table".
- **Learn page:** no hover magnification in the two click-to-try demos (picking a Choir, taking cards off the Altar), where the preview covered the cards being clicked; every other card on the page still magnifies. New step, **Building your Choir**: growing it with Gather and Exalt, what a card's value and ability each do, Neutral cards, and the four timing labels with real cards for each. 13 steps.
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
