# The Divide: Design Decisions

The record of every standing design decision, why it was made, and what to watch in playtesting. Updated November 13, 2026, to match card data V33 and rulebook v4.

## Governing rules

1. **V32 wins over earlier printed text unless the V32 change breaks the game.** The V32 edits were deliberate. The one exception is Tide over Current (see Terminology).
2. **An ability that sometimes cannot be used is fine.** A card or Celestial may have moments where it does nothing, such as the Arbiter when no rival has Glory. Only changes that break game mechanics need fixing.
3. **Read card text literally.** Rulings follow from the exact card wording. For example, Nephilim's values cancel to 0 for every kind of scoring, including the endgame bonus.
4. **The card data is the source of truth over the rulebook.** When they disagree, the cards win and the rulebook is corrected. The Claude Design session holds the printed card visuals, so text changes must also be made there before printing.

## Modes and player counts

The Divide has two modes on one deck and one Day structure.

| Players | Mode |
|---|---|
| 3 | Open Game only |
| 4 | Table's choice; Open Game is the default |
| 5 or 6 | Hidden Roles by default; Open Game allowed |

**The Open Game is the main focus.** Players compete in the open for the most Glory over six fixed Days. There is no Balance, no Fates, and no Turn. Each Day's Tide scores every public Choir once (capped at 3), and the final Tide also sets an endgame bonus of 1 Glory per matching card in hand and Choir. Ties go to the player with more matching cards, then are shared. Optional: 2 Seeds per Day if Tides feel thin.

**Hidden Roles** is the original design: secret Fates (Faithful, Fallen, Forsaken), the 11-space Balance with an early end at either extreme, the Turn, and faction victory plus most Glory within the faction.

The web build offers both modes at 4 or more players so playtesting can move the line.

## Open Game deck

The Open Game sets aside 6 Host cards and 3 Events:

| Card | Reason |
|---|---|
| Revelation, Knowledge, Bounty | Reference Fates |
| Flaming Sword, Belial | Reference the Turn |
| Hubris | Keeps the Light and Dark Offering totals equal; also a Glory-theft card that gets stronger without factions |
| The Sabbath, Equilibrium, Armageddon | Move the Balance marker |

That leaves **63 Host cards: 21 Light, 20 Dark, and 22 Neutral or Variable**, with Offering totals of **24 Light and 24 Dark**. The +2 once-per-game cards remaining are three Light (Free Will, Mercy, Deliverance) and four Dark (Abaddon, Silence, Scapegoat, Defiance). The Event deck has 17 cards. Hubris can be restored if testing shows the Offering mirror does not matter.

## Shared rules (both modes)

- **Day loop:** Unveiling (Event, Declarations, Seed), one turn each, then the Evening (In the Evening abilities, Set the Tide, the Reaping, Refresh the Altar, Upkeep).
- **Actions:** Offer (gain 1 Glory), Gather (free; discard from a full Choir), Exalt (flat 1 Glory; discard from a full Choir). Turn exists only in Hidden Roles.
- **Starting position:** a hidden hand of 3 and a face-up Choir of 3 random cards. Choir limit 3 for everyone. Hand limit 3 (the Dominion has 4 and starts with 4).
- **Reaping cap:** 3 Glory gained or lost per Reaping, applied after doubling. Effects outside Alignment scoring (Leviathan and similar) are not capped.
- **Deck reshuffle:** when the Host deck runs out, shuffle the discard pile.
- **Glory:** never below 0; may be given freely, except that **no Glory may be given on the final Day of the Open Game** (prevents an eliminated player from choosing the winner).
- **Once-per-game cards** stay in the starting deal and carry +2. Light: Free Will, Mercy, Revelation, Knowledge, Deliverance. Dark: Bounty, Abaddon, Silence, Scapegoat, Defiance.

## Terminology

Choir, Altar, Offering, Gather, Reaping, Exalt, Unveiling, **Tide**, Fate. "Current" appeared in V32 but was drift from after the July 25 print run, which says Tide; Tide is canonical.

**Timing windows.**
- *In the Evening* resolves before the Altar is counted. It is for abilities that do not care about the Tide: Providence, Eternity, Twilight, Zealot, Moderation.
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
| The Arbiter, Mammon | If no eligible player has Glory, the ability yields nothing. |
| Tithe | Every Host ability you activate costs 1, on your turn, in the Evening, or at the Reaping. Always-on abilities are never activated and are free. If you cannot pay, you cannot activate. |
| Silence | Responds after an ability is announced and before it resolves. Costs already paid, including Tithe, are lost. |
| Raguel | The Bound player is chosen when Raguel enters your Choir. |
| Raphael, Azazel | No Once per Day limit on either (mirror pair). |
| Covenant | Imposed on the named player; no consent. |
| Forger | On Gather, may take the top of the discard pile. |
| Absolution | Once per Day, a discarded Choir card returns to hand; then discard 1 from hand. |
| Divine Calling | Exalt costs 0 Glory this Day. |
| Patron, Eclipse | Kept at full strength; watch in playtesting. |

## Design principles

- Few Host cards should give easy Glory every turn.
- No player should be able to profit by playing only cards of one alignment.
- Paired cards are designed as mirrors or opposites (the Light and Dark numbering, Cherubim and Veil, Raphael and Azazel).
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

## Playtest watch list (Open Game)

- **Hubris removal.** Does the open deck play better without it?
- **Final-Day gift ban.** Does it remove kingmaking without flattening Day 6 negotiation?
- **Raphael and Azazel without Once per Day.** Watch for Altar wipes with Hymn or Lamentation.
- **The Arbiter's slow start.** Its Offers earn nothing until a rival has Glory.
- **The Eclipse at the Reaping.** Move the declaration before the Tide if it dominates.
- **The odd player out.** Two players often lean the same way and the third loses that Day. Counters: Heresy, Fig Leaves, the Eclipse, Morning Star.
- **Direct Glory theft is worth double** in an open race: the Arbiter, Mammon, Envy, Leviathan, Winnowing.
- **Days feel separate.** Only Shroud and Apple carry the previous Day forward.
- **Thin Altar** at 3 players; the 2-Seed option is in the rules.
- **The 4-player default.** Which mode do 4-player tables prefer?
