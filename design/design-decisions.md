# The Divide: Design Decisions

The record of every standing design decision, why it was made, and what to watch in playtesting. Updated November 15, 2026, to match card data V35 and rulebook v5.

## Governing rules

1. **V32 wins over earlier printed text unless the V32 change breaks the game.** The V32 edits were deliberate. The one exception is Tide over Current (see Terminology).
2. **An ability that sometimes cannot be used is fine.** A card or Celestial may have moments where it does nothing, such as the Arbiter when no rival has Glory. Only changes that break game mechanics need fixing.
3. **Read card text literally.** Rulings follow from the exact card wording. For example, Nephilim's values cancel to 0 for every kind of scoring, including the endgame bonus.
4. **The card data is the source of truth over the rulebook.** When they disagree, the cards win and the rulebook is corrected. The Claude Design session holds the printed card visuals, so text changes must also be made there before printing.

## Modes and player counts

The Divide has two modes on one deck and one Day structure.

| Players | Mode |
|---|---|
| 3 or 4 | Open Game |
| 5 or 6 | Hidden Roles |

**The Open Game is the main focus.** Players compete in the open for the most Glory over six fixed Days. There is no Balance, no Fates, and no Turn. Each Day's Tide scores every public Choir once (capped at 3), and the final Tide also sets an endgame bonus of 1 Glory per matching card in hand and Choir. Ties go to the player with more matching cards, then are shared. Optional: 2 Seeds per Day if Tides feel thin.

**Hidden Roles** is the original design: secret Fates (Faithful, Fallen, Forsaken), the 11-space Balance with an early end at either extreme, the Turn, and faction victory plus most Glory within the faction.

Decided November 15, 2026: the Open Game is for 3 or 4 players, like the 3-player game it grew from; Hidden Roles is for 5 or 6.

## Open Game deck

The Open Game sets aside 6 Host cards and 3 Events:

| Card | Reason |
|---|---|
| Revelation, Knowledge, Bounty | Reference Fates |
| Flaming Sword, Belial | Reference the Turn |
| Hubris | Keeps the Light and Dark Offering totals equal; also a Glory-theft card that gets stronger without factions |
| The Sabbath, Equilibrium, Armageddon | Move the Balance marker |

That leaves **66 Host cards: 22 Light, 21 Dark, 21 Neutral, and 2 Variable**, with Offering totals of **25 Light and 25 Dark** (V35 added Ithuriel, Urim, and Asmadai). The +2 once-per-game cards remaining are three Light (Free Will, Mercy, Deliverance) and four Dark (Abaddon, Silence, Scapegoat, Defiance). The Event deck has 17 cards. Hubris can be restored if testing shows the Offering mirror does not matter.

## Shared rules (both modes)

- **Day loop:** Unveiling (Event, Declarations, Seed, First Fruits), one turn each, then the Evening (Reveal the Altar, In the Evening abilities, Set the Tide, the Reaping, Refresh the Altar, Upkeep).
- **First Fruits (V35):** each Morning after the Seed, every player secretly picks 1 card from hand, all reveal at once face up on the Altar, then each draws 1. A tithe: no Glory, not the Offer action, triggers no Offer abilities.
- **Facedown Offers (V35, both modes):** every Offer goes on the Altar facedown. The whole Altar is revealed as the first step of the Evening, so In the Evening abilities see every card. Facedown cards may be Gathered blind.
- **Actions:** Offer (facedown; reward is 1 Glory or 1 card), Gather (free; discard from a full Choir), Exalt (flat 1 Glory; discard from a full Choir). Turn exists only in Hidden Roles.
- **Starting position:** a hidden hand of 3 and a face-up Choir of 3 random cards. Choir limit 3 for everyone. Hand limit 3 (the Dominion has 4 and starts with 4).
- **Reaping cap:** 3 Glory gained or lost per Reaping, applied after doubling. Effects outside Alignment scoring (Leviathan and similar) are not capped.
- **Deck reshuffle:** when the Host deck runs out, shuffle the discard pile.
- **Glory:** never below 0; may be given freely, except that **no Glory may be given on the final Day of the Open Game** (prevents an eliminated player from choosing the winner).
- **Once-per-game cards** stay in the starting deal and carry +2. Light: Free Will, Mercy, Revelation, Knowledge, Deliverance. Dark: Bounty, Abaddon, Silence, Scapegoat, Defiance.

## Terminology

Choir, Altar, Offering, Gather, Reaping, Exalt, Unveiling, **Tide**, Fate. "Current" appeared in V32 but was drift from after the July 25 print run, which says Tide; Tide is canonical.

**Timing windows.**
- *In the Evening* resolves after the Altar is revealed (V35) and before it is counted. It is for abilities that do not care about the Tide: Providence, Eternity, Twilight, Zealot, Moderation.
- *At the Reaping* resolves after the Tide is set. It is for every ability that reacts to the Tide: Stillness, Firmament, Fig Leaves, Heresy, Prophecy, Uriel, Beelzebub, Martyr, Apple, Leviathan, Hubris, the Whisper's payoff, and the Eclipse.
- Remnant names its own moment: before the Altar is Refreshed.

**Targeting.** "Target" is the umbrella term for any ability aimed at another player or their cards. Its six kinds are Look at, Reveal, Copy, Flip, Replace, and Discard. Cherubim and Veil are designed as opposites: Cherubim blocks Replace and Discard; Veil blocks Look at, Reveal, Copy, and Flip. Tribute and Lilith respond to any Targeting.

## Card rulings

| Card | Ruling |
|---|---|
| Nephilim | Counts as both Light +1 and Dark +1 for other cards (alone it satisfies Twilight). Always scores 0, even beside Uriel or Beelzebub, and never earns the endgame bonus. |
| Shroud | Its value is the opposite of the previous Day's Tide, on the Altar and in the Choir. At game end it uses Day 5's Tide. |
| The Whisper | Predicts direction. A correct call means the Choir gains its net value instead of losing it (cap 3). A net-zero Choir gains nothing. Payoff At the Reaping. |
| The Eclipse | "At the Reaping, once per Day, treat one Host card in your Choir as Neutral." Fallback if too strong: declare before the Tide is set. |
| The Arbiter | V34: "At the Reaping, if you gain Glory, take 1 of it from a player of your choice. If you lose Glory, give 1 of it to a player of your choice." Applies only to Alignment scoring; if no rival has Glory, the gain comes from the Pot. |
| Mammon | If no other player has Glory to take, the ability yields nothing. |
| Confession | V34: the Glory is earned only if the revealed hand holds no Dark card (Nephilim counts as Dark). |
| Covenant | V34: forbids only Offer or Gather, and names a player who has not yet taken their turn this Day. |
| Heresy | V34: optional reversal, chosen at the Reaping after the Tide is set; an activation (Tithe, Silence). |
| Raguel | V34: only the holder's Reaping loss is shared with the Bound player. |
| Tithe | Every Host ability you activate costs 1, on your turn, in the Evening, or at the Reaping. Always-on abilities are never activated and are free. If you cannot pay, you cannot activate. |
| Silence | Responds after an ability is announced and before it resolves. Costs already paid, including Tithe, are lost. |
| Raguel (entry) | The Bound player is chosen when Raguel enters your Choir. |
| Raphael, Azazel | No Once per Day limit (mirror pair). V35: you turn your own Offering face up and forgo its reward; only face-up cards can be destroyed. |
| Hymn, Lamentation | V35: a two-card Offer goes face up so the shared color is visible; one reward. |
| Mirage | V35: your facedown Offerings cannot be flipped, looked at, exchanged, or destroyed before the Evening (blocks Ithuriel, Urim, Asmadai, Abaddon, the Tempest). They can still be Gathered. |
| Ithuriel, Asmadai | V35 mirror pair. Light reveals a facedown card to everyone; Dark looks privately and may swap it for a hand card. Asmadai's swap keeps the card facedown and still Offered by its original owner. |
| Urim | V35 Neutral. Look privately at up to 2 facedown cards you did not Offer. What you say about them is up to you. |
| Vessel | V35: its card goes on the Altar facedown. |
| Pandemonium | V35: the Seed and First Fruits go facedown, and no Altar card may be flipped or looked at before the Evening. |
| Snare | Pays only on a Gather of a card you Offered; never First Fruits or the Seed. |
| Covenant | Imposed on the named player; no consent. |
| Forger | On Gather, may take the top of the discard pile. |
| Absolution | Once per Day, a discarded Choir card returns to hand; then discard 1 from hand. |
| Divine Calling | Exalt costs 0 Glory this Day. |
| Patron, Eclipse | Kept at full strength; watch in playtesting. |

## Design principles

- Few Host cards should give easy Glory every turn.
- No player should be able to profit by playing only cards of one alignment.
- Paired cards are designed as mirrors or opposites (the Light and Dark numbering, Cherubim and Veil, Raphael and Azazel, Ithuriel and Asmadai).
- Chaos and choice over automatic play: hidden information should create reads and bluffs, not just luck (why V35 rejected the face-up row and draw 2, keep 1).
- Secret personal objectives were considered for the Open Game and rejected, because they work the same way Fates do.

## Still to decide (Hidden Roles only)

- Winner tiebreak within the winning faction.
- How the endgame card bonus works when the Forsaken win.
- Whether a player who Turns reveals their Fate (the old glossary said yes; the Turn rules say nothing).
- Printed Fate token counts (4 Faithful, 4 Fallen, 2 Forsaken printed; setup needs at most 3, 3, 1).

## Editorial changes made in V33 for review

These were made for consistency while building V33. Revert any you disagree with.

- **Michael** now says "Flip ... Facedown" instead of "Turn ... face-down", so it uses the Flip keyword and no longer reads like the Turn action.
- **Martyr** gained the label "At the Reaping:" in front of its existing text.
- **Remnant** now opens with "Before the Altar is Refreshed:" so its timing label names its real moment.
- **Prophecy** keeps the phrase "Target Alignment" from V32. It is not Targeting in the keyword sense; consider rewording to "declare an Alignment" at the next print.

## Balance changes adopted (November 14, 2026)

Tested on 20,000 bot games each against V33 (win ratio 1.00 = fair), then adopted as permanent card changes in V34.

| Card | V33 | V34 (re-measured with all five changes) |
|---|---|---|
| The Arbiter | 1.84 | 1.19 |
| Confession | 1.61 | 1.18 |
| Covenant | 1.22 (1.67 Glory per game) | 1.00 |
| Heresy | 0.59 | 0.94 |
| Raguel | 0.61 | 0.75 |

Details and rejected alternatives: `game/reports/balance-proposals-2026-11-14.md`.

## First Fruits and facedown Offers adopted (November 15, 2026)

Measured on the same seeds as the V34 decision report (3 players; 4 players in brackets). Core decisions per player: V34 21.8 (21.9), V35 33.2 (33.4). Skill edge: 2.37 (2.80) to 2.46 (2.95). Day 3 leader wins: 65% (59%) to 62% (55%). Winning Glory unchanged at 12.4. The first version had no draw after First Fruits; it starved hands and dropped the skill edge to 2.14, so the draw was added. Details: `game/reports/v35-facedown-offerings-2026-11-15.md`.

Rejected the same day: the face-up row of 3 Host cards and "draw 2, keep 1" at Upkeep (Robert did not like them). Still available as tested options: the Long Game (two rounds of turns each Day) and the Celestial draft.

## Playtest watch list (Open Game, V35)

- **Bluffing.** The bots cannot bluff, so they undervalue the hidden Altar. Does the table read First Fruits and facedown Offers, or just guess?
- **Ithuriel, Urim, Asmadai, Mirage.** Bots rate them 0.98, 0.78, 0.92, 0.73 (Neutral cards normally sit between 0.68 and 0.84). Is Urim's private look worth a card slot? Is Asmadai's swap too strong late in the Day?
- **Blind Gathers.** Do players ever Gather a facedown card, or does the Gather action shrink?
- **The Eclipse (1.26 in V35)** is the strongest Celestial. Fallback: declare before the Tide is set.
- **Leviathan (1.54 in V35)** pays 1 Glory per rival who loses at the Reaping, which rarely misses in a three-way race.
- **Fig Leaves** recovered to 0.97 in V35 (0.75 in V34).
- **Raguel (0.78 in V35)** improved but is still weak.
- **The Patron (0.86), the Oracle (0.87), the Echo (0.86)** may be undervalued by the bots; confirm with people.
- **Hubris removal.** Does the open deck play better without it?
- **Final-Day gift ban.** Does it remove kingmaking without flattening Day 6 negotiation?
- **Raphael and Azazel without Once per Day.** Watch for Altar wipes with Hymn or Lamentation.
- **Snowballing.** The sole leader after Day 3 wins 62% of 3-player bot games in V35 (65% in V34; chance: 33%); the winner was not leading entering Day 6 in 19%.
- **Days feel separate.** Only Shroud and Apple carry the previous Day forward.
- **Thin Altar** at 3 players; the 2-Seed option is in the rules.
