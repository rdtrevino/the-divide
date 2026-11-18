# V44: the Advanced pass on the Celestials and Events

November 18, 2026. The Host deck was reworked for V42 and V43 (free Exalt, Gather from the Altar, mirrored coalition scoring, the race to 12). The Celestials and Events were still written for the older game. This pass reads each one against the current rules, changes the ones that no longer work, and measures every Celestial's win ratio. It also renumbers the Host deck: Light, then Neutral, then Dark.

## How it was measured

`game/tools/sim/advanced.ts` plays all-bot Advanced games, half at 3 players and half at 4, and reports each Celestial's win ratio (actual wins over the wins expected by chance; 1.00 is fair) overall and by player count, plus what each Event does to its Day: Glory gained and lost across the table, and how much the leader and the last-placed player gained (measured from the start of that Day).

Every option was a test switch measured on identical seeds against the V43 rules. The final numbers are 60,000 games of V44 against 40,000 of V43.

```
cd game/tools/sim && npx tsx advanced.ts 20000 0 out.json [switches...]
```

The bots were also taught what a player would see (`bot-v44`): they judge the Day's Event for the Oracle (the leader wants quiet Days, a trailer wants swings, a side wants the Event that favors its cards), skip optional abilities on a Tithe Day unless they pay, value an Exalt on a Divine Calling Day, take a Purgatory Day's safety into account, and make the Cantor's second Offer with a Neutral card too. Before this, the bots buried Events at random and underplayed the Cantor, so those two Celestials' numbers were noise.

## Results

Every Celestial now lands between **0.95 and 1.05** (V43: 0.84 to 1.10), and within 0.92 to 1.06 at each player count. Games run a median of 8 Days at 3 and at 4 players (V43: 8 and 9).

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

## The Celestials, one by one

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

## The Events, one by one

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

## Engine switches

All are on by default (`V44_RULES` in `game/packages/engine/src/core.ts`); `-name` turns one off.

| Switch | What it does |
|---|---|
| `tempest-up`, `tempest-offer` | The Tempest destroys a face-up card, on a turn you Offer |
| `oracle-two` | The Oracle chooses between the top 2 Events |
| `cantor-chorus`, `cantor-chorus-n` | The Cantor's second card shares the first's alignment (Neutral pairs too); both go face up |
| `patron-target` | The Patron is always Targeting |
| `arbiter-judge`, `arbiter-any` | The Arbiter takes from a player against the Tide, else anyone; it never gives |
| `dominion-5` | The Dominion's hand is 5 |
| `calling-reward` | Divine Calling: an Exalt pays 1 |
| `purgatory-spare` | Purgatory: no losses at the Reaping; a Neutral Choir gains 1 |
| `tithe-host` | Tithe charges Host abilities only |
| `bot-v44` | Bots judge Events and play the Cantor fully |

Measured and not adopted: `cantor-up` (only the second card face up), `arbiter-nogive`, `arbiter-take`.

## Watch in play

- **The Echo** varies most by player count (0.97 at 3, 1.05 at 4): more Choirs to copy from.
- **The Oracle and the Patron** (0.95) depend on judgment the bots only approximate; people should do better with both.
- **Purgatory** speeds the game up a little; if Days of reprieve feel flat, a Neutral Choir could gain 2.

## Renumbering: Light, then Neutral, then Dark

The Host deck is now numbered 1–23 Light, 24–46 Neutral (Acolyte and Nephilim included), 47–69 Dark, keeping each group's order. Remnant (Light) and Jubilee (Neutral) were numbered at the end and moved into their groups. Retired cards keep 70–72. The face and plate images in `art/` are renamed to match, and each renumbered card's Reprint List entry notes its new number, since the number is printed on the face.

| New | Card | Group | Was |
|---|---|---|---|
| 23 | Remnant | Light | 67 |
| 24 | Vessel | Neutral | 23 |
| 25 | Eternity | Neutral | 24 |
| 26 | Ordeal | Neutral | 25 |
| 27 | Raguel | Neutral | 26 |
| 28 | Twilight | Neutral | 27 |
| 29 | Zealot | Neutral | 28 |
| 30 | Stillness | Neutral | 29 |
| 31 | Acolyte | Neutral (Acolyte) | 30 |
| 32 | Nephilim | Neutral (Nephilim) | 31 |
| 33 | Firmament | Neutral | 32 |
| 34 | Moderation | Neutral | 33 |
| 35 | Fig Leaves | Neutral | 34 |
| 36 | Flaming Sword | Neutral | 35 |
| 37 | Outcast | Neutral | 36 |
| 38 | Heresy | Neutral | 37 |
| 39 | Council | Neutral | 38 |
| 40 | Mirage | Neutral | 39 |
| 41 | Veil | Neutral | 40 |
| 42 | Prophecy | Neutral | 41 |
| 43 | Watchers | Neutral | 42 |
| 44 | Apple | Neutral | 43 |
| 45 | Forger | Neutral | 44 |
| 46 | Jubilee | Neutral | 68 |
| 47 | Anathema | Dark | 45 |
| 48 | Serpent | Dark | 46 |
| 49 | Favor | Dark | 47 |
| 50 | Temptation | Dark | 48 |
| 51 | Legion | Dark | 49 |
| 52 | Lamentation | Dark | 50 |
| 53 | Azazel | Dark | 51 |
| 54 | Moloch | Dark | 52 |
| 55 | Beelzebub | Dark | 53 |
| 56 | Leviathan | Dark | 54 |
| 57 | Hubris | Dark | 55 |
| 58 | Belial | Dark | 56 |
| 59 | Mammon | Dark | 57 |
| 60 | Envy | Dark | 58 |
| 61 | Lilith | Dark | 59 |
| 62 | Parasite | Dark | 60 |
| 63 | Winnowing | Dark | 61 |
| 64 | Silence | Dark | 62 |
| 65 | Scapegoat | Dark | 63 |
| 66 | Defiance | Dark | 64 |
| 67 | Bounty | Dark | 65 |
| 68 | Abaddon | Dark | 66 |
