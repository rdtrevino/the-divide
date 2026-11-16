# Changelog

## V36 cards and Rulebook v6 (November 16, 2026)

- **The race to 10.** The Open Game ends after the first Reaping at which any player has 10 or more Glory, with no Day limit. The endgame bonus is still scored, and the most Glory wins. Hidden Roles still lasts 6 Days.
- **Gifts:** the final-Day gift ban is removed.
- **The Arbiter:** the Glory it gives when you lose now goes to the player, other than you, with the least Glory.
- **Mammon:** its Exalt payment now goes to the player, other than you, with the least Glory.
- **New ruling:** when a card names the player with the most or least Glory and players tie, the user chooses among them, unless the card says otherwise.
- **Shroud** at game end uses the second-to-last Day's Tide.

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
