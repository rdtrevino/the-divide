# Balance: the current rules, measured

Bot measurements of the V44 rules, from the simulator in `game/tools/sim` (all-bot games; bots cannot bluff or make deals, so the bluffing and political cards are where people will differ). Win ratio is actual wins over the wins expected by chance: 1.00 is fair, and the target is 0.75 to 1.25 for every card. The Stats page on the site shows the same measure from real games beside a bot baseline.

To re-measure after a rules change: `npm run sim`, `npx tsx card-balance.ts` and `npx tsx advanced.ts` in `game/tools/sim` (see `game/README.md`).

## The Host deck

Measured November 18, 2026 on the V43 rules, which are the Host deck's current rules (V44 changed only Celestials, Events and card numbers). Win ratio over 20,000 games (every card a player held at the end of any Day). Play rate over 3,000 games: the share of games in which any player held the card in their Choir, and how often per game it was Offered, Exalted or Gathered, and its ability did something.

| Game | 3 players | 4 players |
|---|---|---|
| Days | 8.2 (90% within 11) | 8.5 (90% within 11) |
| Winner's Glory per Day | 1.56 | 1.51 |
| Turns: Offer / Gather / Exalt | 49 / 19 / 32 | 50 / 19 / 30 |
| Glory from Offers / the Tide / cards | 35 / 27 / 38 | 39 / 19 / 42 |

All 69 cards are within 0.8–1.2; spread 0.114.

### Light

| Card | Win ratio | Held in (games) | Offered / game | Exalted / game | Gathered / game | Ability / game |
|---|---|---|---|---|---|---|
| Michael | 0.95 | 10% | 0.25 | 0.05 | 0.04 | 0.19 |
| Wisdom | 0.93 | 18% | 0.25 | 0.05 | 0.03 | 1.70 |
| Gabriel | 1.04 | 66% | 0.11 | 0.34 | 0.23 | 7.22 |
| Providence | 1.17 | 70% | 0.11 | 0.43 | 0.24 | 0.52 |
| Confession | 0.95 | 40% | 0.20 | 0.15 | 0.15 | 2.11 |
| Tree of Life | 1.14 | 54% | 0.13 | 0.23 | 0.22 | 0.61 |
| Free Will | 0.97 | 11% | 0.26 | 0.05 | 0.03 | 0.15 |
| Seraphim | 0.88 | 53% | 0.16 | 0.22 | 0.22 | 0.38 |
| Hymn | 0.85 | 28% | 0.22 | 0.10 | 0.07 | 0.00 |
| Raphael | 0.88 | 18% | 0.27 | 0.05 | 0.02 | 0.10 |
| Sanctuary | 0.88 | 19% | 0.25 | 0.05 | 0.03 | 1.00 |
| Uriel | 0.98 | 61% | 0.10 | 0.26 | 0.27 | 0.30 |
| Martyr | 1.09 | 66% | 0.10 | 0.35 | 0.23 | 0.89 |
| Covenant | 0.86 | 29% | 0.23 | 0.11 | 0.08 | 0.76 |
| Tribute | 0.91 | 18% | 0.24 | 0.06 | 0.03 | 0.01 |
| Mercy | 0.89 | 16% | 0.24 | 0.05 | 0.04 | 0.05 |
| Revelation | 0.85 | 17% | 0.26 | 0.05 | 0.03 | 1.84 |
| Cherubim | 0.80 | 19% | 0.23 | 0.05 | 0.03 | 0.00 |
| Morning Star | 0.97 | 18% | 0.25 | 0.04 | 0.03 | 0.07 |
| Absolution | 0.90 | 18% | 0.24 | 0.04 | 0.03 | 0.27 |
| Knowledge | 0.86 | 19% | 0.24 | 0.05 | 0.03 | 0.94 |
| Deliverance | 0.84 | 15% | 0.24 | 0.05 | 0.03 | 0.12 |
| Remnant | 0.93 | 19% | 0.24 | 0.06 | 0.04 | 0.08 |

### Dark

| Card | Win ratio | Held in (games) | Offered / game | Exalted / game | Gathered / game | Ability / game |
|---|---|---|---|---|---|---|
| Anathema | 1.10 | 16% | 0.22 | 0.03 | 0.03 | 0.67 |
| Serpent | 0.84 | 16% | 0.24 | 0.04 | 0.02 | 0.71 |
| Favor | 1.12 | 39% | 0.18 | 0.18 | 0.12 | 0.42 |
| Temptation | 0.84 | 16% | 0.24 | 0.03 | 0.03 | 0.36 |
| Legion | 0.89 | 47% | 0.16 | 0.22 | 0.15 | 0.32 |
| Lamentation | 0.90 | 21% | 0.23 | 0.07 | 0.04 | 0.00 |
| Azazel | 0.87 | 17% | 0.25 | 0.04 | 0.02 | 0.08 |
| Moloch | 0.98 | 30% | 0.20 | 0.12 | 0.09 | 0.31 |
| Beelzebub | 1.01 | 53% | 0.11 | 0.25 | 0.19 | 0.31 |
| Leviathan | 0.99 | 55% | 0.12 | 0.32 | 0.15 | 0.31 |
| Hubris | 0.97 | 24% | 0.23 | 0.09 | 0.06 | 0.13 |
| Belial | 0.85 | 17% | 0.25 | 0.04 | 0.02 | 1.11 |
| Mammon | 1.12 | 69% | 0.12 | 0.47 | 0.18 | 0.49 |
| Envy | 0.98 | 16% | 0.22 | 0.04 | 0.02 | 0.28 |
| Lilith | 0.97 | 17% | 0.23 | 0.04 | 0.03 | 0.66 |
| Parasite | 1.00 | 14% | 0.24 | 0.04 | 0.02 | 0.05 |
| Winnowing | 0.86 | 17% | 0.23 | 0.04 | 0.02 | 0.55 |
| Silence | 0.88 | 17% | 0.24 | 0.04 | 0.02 | 0.33 |
| Scapegoat | 0.87 | 16% | 0.23 | 0.04 | 0.02 | 0.21 |
| Defiance | 0.87 | 55% | 0.14 | 0.31 | 0.16 | 0.11 |
| Bounty | 0.90 | 23% | 0.21 | 0.08 | 0.04 | 0.00 |
| Abaddon | 0.93 | 13% | 0.24 | 0.04 | 0.03 | 0.10 |
| Snare | 1.02 | 41% | 0.17 | 0.19 | 0.13 | 0.31 |

### Neutral

| Card | Win ratio | Held in (games) | Offered / game | Exalted / game | Gathered / game | Ability / game |
|---|---|---|---|---|---|---|
| Vessel | 0.93 | 49% | 0.19 | 0.25 | 0.15 | 5.94 |
| Eternity | 0.98 | 49% | 0.20 | 0.23 | 0.16 | 2.01 |
| Ordeal | 0.93 | 16% | 0.31 | 0.05 | 0.01 | 0.22 |
| Raguel | 0.81 | 22% | 0.30 | 0.07 | 0.05 | 0.43 |
| Twilight | 1.00 | 65% | 0.15 | 0.38 | 0.20 | 0.28 |
| Zealot | 0.93 | 23% | 0.30 | 0.08 | 0.05 | 0.15 |
| Stillness | 1.05 | 55% | 0.17 | 0.30 | 0.17 | 0.63 |
| Acolyte | 0.81 | 17% | 0.25 | 0.04 | 0.02 | 0.00 |
| Nephilim | 0.86 | 17% | 0.30 | 0.05 | 0.01 | 0.00 |
| Firmament | 1.03 | 43% | 0.21 | 0.20 | 0.13 | 0.40 |
| Moderation | 0.90 | 58% | 0.18 | 0.31 | 0.18 | 0.35 |
| Fig Leaves | 0.82 | 17% | 0.28 | 0.06 | 0.01 | 0.81 |
| Flaming Sword | 0.83 | 16% | 0.29 | 0.05 | 0.01 | 1.00 |
| Outcast | 0.98 | 66% | 0.15 | 0.39 | 0.21 | 0.98 |
| Heresy | 0.91 | 16% | 0.29 | 0.05 | 0.01 | 0.14 |
| Council | 1.04 | 72% | 0.14 | 0.43 | 0.22 | 1.83 |
| Mirage | 0.83 | 16% | 0.30 | 0.06 | 0.02 | 0.00 |
| Veil | 0.82 | 22% | 0.28 | 0.07 | 0.05 | 0.05 |
| Prophecy | 0.98 | 16% | 0.30 | 0.05 | 0.01 | 0.68 |
| Watchers | 0.90 | 16% | 0.31 | 0.06 | 0.01 | 1.11 |
| Apple | 0.80 | 16% | 0.29 | 0.05 | 0.01 | 0.00 |
| Forger | 0.81 | 17% | 0.30 | 0.05 | 0.01 | 0.17 |
| Jubilee | 0.91 | 17% | 0.30 | 0.06 | 0.01 | 1.20 |

"Ability / game" is read from the game log, so always-on cards (Hymn, Lamentation, Cherubim, Mirage, Acolyte, Nephilim) show 0, and a few cards whose log lines name them differently (Bounty, Tribute) are undercounted.

## The Celestials

Measured on 60,000 Advanced games of V44 against 40,000 of V43. Every Celestial now lands between **0.95 and 1.05** (V43: 0.84 to 1.10), and within 0.92 to 1.06 at each player count. Games run a median of 8 Days at 3 and at 4 players (V43: 8 and 9).

| Celestial | V43 | V44 | V44 at 3 / 4 players |
|---|---|---|---|
| I. The Tempest | 1.10 | **0.99** | 0.97 / 1.01 |
| II. The Oracle | 0.92 | **0.95** | 0.95 / 0.95 |
| III. The Eclipse | 1.04 | **1.05** | 1.06 / 1.03 |
| IV. The Cantor | 0.97 | **0.99** | 0.97 / 1.02 |
| V. The Patron | 1.00 | **0.95** | 0.98 / 0.92 |
| VI. The Echo | 1.05 | **1.01** | 0.97 / 1.05 |
| VII. The Dominion | 0.99 | **1.00** | 1.00 / 1.00 |
| VIII. The Whisper | 1.09 | **1.05** | 1.05 / 1.05 |
| IX. The Arbiter | 0.84 | **1.01** | 1.04 / 0.97 |

| Celestial | Verdict | V44 text | Why |
|---|---|---|---|
| **I. The Tempest** | Too strong | When you Offer, you may destroy a face-up card on the Altar. | It removed a facedown vote every Day for free, and a vote decides a 3-Glory swing under mirrored scoring (1.09 to 1.15 across runs). Every other destroy ability (Raphael, Azazel) takes a face-up card on a turn you Offer; the Tempest now does the same. Face-up only alone: 1.11; with Tithe no longer charging it (below): 1.15; on Offer turns too: 1.00. |
| **II. The Oracle** | Weak, and a coin flip | In the Morning: Look at the top 2 Event cards. Play one, and put the other on the bottom of the Event deck. | Burying one Event only to draw a random one is rarely worth it. Choosing between two is a real decision. With bots that judge Events: 0.93 for the old power, 0.98 to 1.00 for this one. |
| **III. The Eclipse** | Works | In the Evening: Choose a card in your Choir. It counts as Neutral at this Day's Reaping. | Wording only: the *In the Evening* timing label already means "before the Altar is revealed". |
| **IV. The Cantor** | Too strong when played well | When you Offer, you may Offer a second card of the same alignment (Light, Dark, or Neutral). Both go face up, and each earns its reward. | A second Offer reward on every turn is +1 Glory a Day. V43's bots only made the second Offer when it pushed their side, so it looked fair (0.97); played properly it measured 1.13 to 1.18. A matching pair, sung aloud like Hymn, costs information and needs the right hand: 0.99. (A face-up second card alone changed nothing, 1.14 to 1.17; a matching pair without Neutral pairs, 0.90 to 0.93.) |
| **V. The Patron** | Works, but ruled unlike Temptation | On your turn: Play a card from your hand into another player's Choir. If it is full, they discard one of its cards first. | V43's Temptation does the same thing and is always Targeting. The Patron now uses the same words and the same ruling (Cherubim blocks it, Tribute is paid). |
| **VI. The Echo** | Works | On your turn: Use the On your turn ability of a card in another player's Choir, as if it were yours. Spent cards cannot be copied. | Wording only: the card now says what the ruling already said. |
| **VII. The Dominion** | Fell behind | Your hand limit is 5 instead of 3. Begin the game with 5 cards in hand. | Once the Arbiter, Oracle and Cantor worked, a hand of 4 measured 0.88 to 0.94. A hand of 5: 1.00. |
| **VIII. The Whisper** | Works | In the Morning: Name Light or Dark aloud. At the Reaping, if the Tide matches, your Choir counts as leaning with it. | Wording only: timing label, and "counts as leaning with it" in place of "scores as if aligned". |
| **IX. The Arbiter** | Broken by mirrored scoring | When you gain Glory at the Reaping, take 1 of it from another player: one whose Choir leaned against the Tide, if any of them has Glory. | The Reaping now pays 3 or 1, so "gain 2 or more" meant only a lone win, while any loss handed 1 Glory to an opponent: a power that hurt its holder (0.84). Without the giving: 0.94. Taking on every gain from any player: 1.08 to 1.12. From a player against the Tide only: 0.91 to 0.93. From a player against the Tide, else anyone: 1.01. |

## The Events

Glory gained and lost per Day across the table; the leader's and the last-placed player's gain that Day. Every Day averages about 5 Glory gained.

| Event | Verdict | V44 text (changes in bold) | Gained / lost, V43 | V44 | Leader / last, V43 | V44 |
|---|---|---|---|---|---|---|
| Creation | Works | In the Morning, reveal 3 Host cards from the deck onto the Altar. | 4.9 / 1.3 | 4.8 / 1.4 | +0.9 / +1.1 | +0.9 / +1.0 |
| Manna | Works | Each player draws 1 card; hand limits increase by 1 this Day. Discard back to your limit in the Evening. | 4.9 / 1.1 | 4.8 / 1.2 | +1.1 / +1.0 | +1.0 / +1.0 |
| Ascension | Wording | **Light cards on the Altar count double when the Tide is set.** (First Fruits count too, as the engine always did.) | 5.1 / 1.4 | 5.0 / 1.4 | +1.0 / +1.1 | +1.0 / +1.0 |
| Let There Be Light | Works | The abilities of Dark Host cards in Choirs do not work this Day... | 4.6 / 1.1 | 4.6 / 1.2 | +1.0 / +1.0 | +0.9 / +0.9 |
| **Divine Calling** | **Did nothing** | **When you Exalt this Day, gain 1 Glory.** Exalt has been free since V42, so "Exalt costs 0" had no effect. The new text keeps the idea (a Day that rewards building) and makes an Exalt pay like an Offer. | 5.0 / 1.2 | 6.4 / 1.4 | +1.0 / +1.1 | +1.4 / +1.4 |
| Dispersion | Works | Each player passes their entire hand to the player on their left. | 5.2 / 1.3 | 5.1 / 1.4 | +1.1 / +1.1 | +1.0 / +1.1 |
| **Purgatory** | **A tax on everyone** | **No Choir loses Glory at the Reaping this Day. A Choir that leans neither way gains 1 Glory.** It ignored the Tide, and almost every Choir leans, so it cost the table about 3 Glory and erased the Day's contest. Now the Tide still pays, nobody is damned, and the lone-against gamble is free for a Day. | 4.5 / 2.9 | 5.4 / 0.3 | +0.3 / +0.5 | +1.5 / +1.5 |
| Casting Lots | Works | Each player secretly predicts the Tide in the Morning... | 6.5 / 3.1 | 6.5 / 3.2 | +0.9 / +1.0 | +0.8 / +1.0 |
| Pandemonium | Works | First Fruits are placed facedown, and no card on the Altar may be flipped or looked at before the Evening. | 5.1 / 1.3 | 5.0 / 1.4 | +1.1 / +1.1 | +1.0 / +1.0 |
| False Prophecy | Works | Set the Tide and move the Balance marker as normal. During the Reaping, score as if the Tide ran the opposite direction. | 5.2 / 1.7 | 5.0 / 1.8 | +0.9 / +1.1 | +0.9 / +1.1 |
| Famine | Wording | **No Choir gains or loses Glory at the Reaping this Day, and no Choir counts as leaning with or against the Tide.** (What the engine already did; Tree of Life, Providence and Mammon see it.) | 3.5 / 0.1 | 3.5 / 0.2 | +1.0 / +0.9 | +1.0 / +0.9 |
| Babel | Works (for people; bots do not talk) | No table talk or deals this Day. | 5.0 / 1.2 | 4.9 / 1.3 | +1.0 / +1.1 | +1.0 / +1.0 |
| Fall From Grace | Wording | **Dark cards on the Altar count double when the Tide is set.** | 5.2 / 1.5 | 5.0 / 1.5 | +1.0 / +1.1 | +0.9 / +1.1 |
| The Plague | Works | Each player discards 1 Host card from their Choir and replaces it from the top of the deck. | 5.0 / 1.2 | 5.0 / 1.3 | +1.0 / +1.1 | +1.0 / +1.1 |
| **Tithe** | **Charged Celestials by mistake** | Pay 1 Glory for each Host ability you activate this Day. (Unchanged; the engine also charged Celestial powers, which are not Host abilities. Fixed, and bots now skip abilities that do not pay for themselves.) | 4.7 / 4.1 | 4.6 / 2.1 | +0.0 / +0.3 | +0.7 / +0.7 |
| The Flood | Works | The abilities of Light Host cards in Choirs do not work this Day... | 4.3 / 1.2 | 4.2 / 1.3 | +0.8 / +0.9 | +0.8 / +0.9 |
| The Fast | Wording | **No one may Exalt, Turn, or spend Glory this Day.** Exalt is free now, so it is named on its own rather than as a way to spend Glory. | 5.6 / 1.3 | 5.6 / 1.3 | +1.2 / +1.2 | +1.2 / +1.2 |

The Sabbath, Equilibrium and Armageddon move the Balance and are used only in Hidden Roles; they are unchanged.

Divine Calling and Purgatory now come up a little more often in bot games (7% of Days each, against 5.5–6% for the others) because the bots' Oracle picks them; that is the Oracle working.

## Watch in play (Advanced)

- **The Echo** varies most by player count (0.97 at 3, 1.05 at 4): more Choirs to copy from.
- **The Oracle and the Patron** (0.95) depend on judgment the bots only approximate; people should do better with both.
- **Purgatory** speeds the game up a little; if Days of reprieve feel flat, a Neutral Choir could gain 2.
