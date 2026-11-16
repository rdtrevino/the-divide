# The Divide: Design Decisions

The record of every standing design decision, why it was made, and what to watch in playtesting. Updated November 16, 2026, to match card data V39 and rulebook v9.

## Governing rules

1. **V32 wins over earlier printed text unless the V32 change breaks the game.** The V32 edits were deliberate. The one exception is Tide over Current (see Terminology).
2. **An ability that sometimes cannot be used is fine.** A card or Celestial may have moments where it does nothing, such as the Arbiter when no rival has Glory. Only changes that break game mechanics need fixing.
3. **Read card text literally.** Rulings follow from the exact card wording. For example, Nephilim never earns the endgame bonus, because its two values cancel.
4. **The card data is the source of truth over the rulebook.** When they disagree, the cards win and the rulebook is corrected. The Claude Design session holds the printed card visuals, so text changes must also be made there before printing.

## Modes and player counts

The Divide has two modes on one deck and one Day structure.

| Players | Mode |
|---|---|
| 3 or 4 | Open Game |
| 5 or 6 | Hidden Roles |

**The Open Game is the main focus.** Players race in the open to 10 Glory (V36): the game ends after the first Reaping at which any player has 10 or more, with no Day limit. There is no Balance, no Fates, and no Turn. Each Day's Tide scores every public Choir once (capped at 3), and the final Tide also sets an endgame bonus of 1 Glory per matching card in hand and Choir. Reaching 10 ends the game but does not win it; the most Glory after the bonus wins. Ties go to the player with more matching cards, then are shared. Optional: 2 Seeds per Day if Tides feel thin.

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
- **Glory:** never below 0; may be given freely at any time. V36 removed the final-Day gift ban, because no one knows which Day is last; a gift that pushes someone to 10 ends the game, and Robert likes the tension when everyone is near 10.
- **Most or least Glory ties:** when a card names the player with the most or least Glory and players are tied, the user of the card chooses, unless the card says otherwise (Envy).
- **Once-per-game cards** stay in the starting deal and carry +2. Light: Free Will, Mercy, Revelation, Knowledge, Deliverance. Dark: Bounty, Abaddon, Silence, Scapegoat, Defiance.

## Terminology

Choir, Altar, Offering, Gather, Reaping, Exalt, Unveiling, **Tide**, Fate. "Current" appeared in V32 but was drift from after the July 25 print run, which says Tide; Tide is canonical.

**Timing windows.**
- *In the Evening* resolves after the Altar is revealed (V35) and before it is counted. It is for abilities that do not care about the Tide: Providence, Eternity, Twilight, Zealot, Moderation.
- *At the Reaping* resolves after the Tide is set. It is for every ability that reacts to the Tide: Stillness, Firmament, Fig Leaves, Heresy, Prophecy, Uriel, Beelzebub, Morning Star, Martyr, Apple, Leviathan, Outcast, Hubris, the payoffs of the Whisper and Mirage, and the last chance to pay for a card Michael Flipped.
- *The Eclipse* (V38) is chosen in the Evening just before the Altar is revealed.
- Remnant names its own moment: before the Altar is Refreshed.

**Targeting.** "Target" is the umbrella term for any ability aimed at another player or their cards. Its six kinds are Look at, Reveal, Copy, Flip, Replace, and Discard. Cherubim and Veil are designed as opposites: Cherubim blocks Replace and Discard; Veil blocks Look at, Reveal, Copy, and Flip. Tribute and Lilith respond to any Targeting.

## Card rulings

| Card | Ruling |
|---|---|
| Nephilim | Counts as both Light +1 and Dark +1 for other cards (alone it satisfies Twilight). For your Alignment and the Tide its values are Neutral (V38 wording, same rule), even beside Uriel or Beelzebub, and it never earns the endgame bonus. |
| Shroud | Its value is the opposite of the previous Day's Tide, on the Altar and in the Choir. At game end it keeps the value it had on the final Day (the opposite of the Tide of the Day before). |
| The Whisper | Predicts direction. A correct call means the Choir gains its net value instead of losing it (cap 3). A net-zero Choir gains nothing. Payoff At the Reaping. |
| The Eclipse | V38: chosen In the Evening before the Altar is revealed (the old fallback), for that Day's Reaping. |
| The Arbiter | V38: "At the Reaping, if you gain 2 or more Glory, take 1 of it from a player of your choice. If you lose Glory, give 1 of it to the player, other than you, with the least Glory." Applies only to Alignment scoring; if no rival has Glory, the gain comes from the Pot. |
| Mammon | If no other player has Glory to take, the ability yields nothing. V36: the Exalt payment goes to the player, other than you, with the least Glory. V38: the Offer half needs a Dark card in the Offer. |
| Confession | V34: the Glory is earned only if the revealed hand holds no Dark card (Nephilim counts as Dark). |
| Covenant | V34: forbids only Offer or Gather, and names a player who has not yet taken their turn this Day. |
| Heresy | V34: optional reversal, chosen at the Reaping after the Tide is set; an activation (Tithe, Silence). |
| Raguel | V34: only the holder's Reaping loss is shared. V38: the Bound player loses 1 Glory (not the same amount) and the holder loses 1 less; a Bound player already losing at that Reaping loses the larger amount, not both. |
| Tithe | Every Host ability you activate costs 1, on your turn, in the Evening, or at the Reaping. Always-on abilities are never activated and are free. If you cannot pay, you cannot activate. |
| Silence | Responds after an ability is announced and before it resolves. Costs already paid, including Tithe, are lost. |
| Raguel (entry) | The Bound player is chosen when Raguel enters your Choir. |
| Raphael, Azazel | No Once per Day limit (mirror pair). V35: you turn your own Offering face up and forgo its reward; only face-up cards can be destroyed. |
| Hymn, Lamentation | V35: a two-card Offer goes face up so the shared color is visible; one reward. |
| Mirage | V35: your facedown Offerings cannot be flipped, looked at, exchanged, or destroyed before the Evening (blocks Ithuriel, Urim, Asmadai, Abaddon, the Tempest). They can still be Gathered. V38: at the Reaping, 1 Glory if a card you Offered facedown that Day is still on the Altar and matches the Tide (replaces the V37 draw); not an activation. |
| Ithuriel, Asmadai | V35 mirror pair. Light reveals a facedown card to everyone; Dark looks privately and may swap it for a hand card. Asmadai's swap keeps the card facedown and still Offered by its original owner. |
| Urim | V35 Neutral. Look privately at up to 2 facedown cards you did not Offer. What you say about them is up to you. V38: up to 3 cards. |
| Vessel | V38: place a card from your hand on the Altar facedown, then take the Offer reward (1 Glory or 1 card). Not an Offer (no Offer abilities, no Snare, no Mirage). |
| Pandemonium | V35: the Seed and First Fruits go facedown, and no Altar card may be flipped or looked at before the Evening. |
| Snare | Pays only on a Gather of a card you Offered; never First Fruits or the Seed. |
| Covenant | Imposed on the named player; no consent. |
| Forger | V37: on Gather, may take any Host card from the discard pile (was the top card). |
| Tree of Life | V37: takes only the top card of the discard pile, into hand, then discard a card from hand (was any card). |
| Leviathan | V37: pays 1 only if your own Alignment gained you nothing this Reaping (Neutral Tide, net zero, or a loss) and another player lost Glory. Other At the Reaping gains do not count. |
| Envy | V37: usable only while the leader has at least 3 more Glory than you, so the user is never a leader. |
| Tribute | V37: the 1 Glory goes to the Pot, not to Tribute's holder. |
| Watchers | V37: put 1 of the top 3 into your hand, discard a card from hand, return the rest in any order. |
| Apple | V37: 1 Glory if your Alignment is the opposite color from the previous Day's Tide. Nothing on Day 1 or after a Neutral Tide. Not Alignment scoring, so uncapped, and it pays even when your Choir loses. |
| Council | V37: the holder swaps another Choir card for a hand card; each other player may pay the holder 1 Glory to swap too. No vote. Not Targeting. |
| Michael | V38: the Flipped card turns face up when the Reaping ends; its owner may pay 1 Glory at any time before then, the last chance being after the Tide is set. |
| Uriel, Beelzebub | V38: pay 1 Glory at the Reaping (after the Tide is set) to double that Reaping; an activation; each needs its own payment. |
| Morning Star | V38: At the Reaping, pay 1 Glory to invert one Choir card for that Reaping (was on your turn until your next turn). |
| Scapegoat | V38: covers only the Reaping of the Day it is used. |
| Eternity | V38: In the Evening, take 1 card from the Altar into your hand (not Sanctuary-protected), before the Tide is set. |
| Outcast | V38: also 1 Glory at the Reaping if you have the least Glory (or tie for it) after Alignment scoring. |
| Prophecy | V38: a Neutral Tide counts as a miss (lose 1). |
| Providence | V38: costs 1 Glory. |
| Absolution | Once per Day, a discarded Choir card returns to hand; then discard 1 from hand. |
| Divine Calling | Exalt costs 0 Glory this Day. |
| Patron | Kept at full strength; watch in playtesting. |
| The Tempest | Confirmed November 16: used on your own turn, after your action. |
| The Echo | Confirmed November 16: copies only repeatable "On your turn" abilities, not once-per-game cards. |
| Seraphim, Legion | Each re-activates only another card of its own color, so they never re-activate each other. |
| The Patron (Targeting) | Confirmed November 16: a gift into a Choir with room is not Targeting; a gift into a full Choir (forcing a discard) is, so Cherubim blocks it and Tribute must be paid. |
| Casting Lots | V39 wording: pays At the Reaping (was "In the Evening"; same rule). |
| The Flood, Let There Be Light | V39, decided November 16: every ability of that color is off for the Day, automatic ones included (Hymn, Snare, Cherubim's protection); the cards still count toward Alignment. Parasite can be discarded on a Let There Be Light Day. Was: only abilities a player chooses to activate. |
| Favor | Confirmed November 16: the player using Favor chooses "at random" or "they choose". |
| Once-per-game cards | Confirmed November 16: a used card that leaves the Choir and later returns is fresh again. |
| Urim, Asmadai | Decided November 16: a peeked card is shown once, then goes back facedown; players must remember it (online, it is shown in one confirmation step and not named again). |
| Hubris | Decided November 16 (Claude's recommendation, for balance): one leader pays 1 Glory in total; when tied leaders both gain, the Hubris holder chooses which. Was: every tied leader who gains gives 1. |

## Design principles

- Few Host cards should give easy Glory every turn. (Vessel, V38, can pay 1 Glory every turn, at the cost of a card from hand.)
- **Balance target (V38):** every Host card and Celestial measures between 0.75 and 1.25 win ratio in bot testing.
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

## Race to 10 adopted (November 16, 2026)

Tested against the fixed 6 Days: average length 6.4 Days (59% end by Day 6, 93% by Day 10), skill edge 2.46 to 2.81 at 3 players, seat spread 0.20 to 0.08 at 4 players. Robert chose no Day limit. Cards that let a player pick who receives Glory (the Arbiter, Mammon) now give to the player with the least Glory, so no card can crown a winner. Details: `game/reports/v36-race-to-10-2026-11-16.md`.

Rejected the same day: two rounds of turns per Day (in the same order, or snake order 1-2-3-3-2-1), a Day 8 cap on the race, and a rule that no gift may bring a player to 10.

## Strongest and weakest cards rebalanced (November 16, 2026, V37)

The five strongest and five weakest V36 cards, tested on the same 20,000 seeds. Robert adopted nine; Michael is still open. All five weakest cards were Neutral, and Neutral cards average about 0.82 because they add nothing at the Reaping, so 0.85 to 0.95 is a realistic goal for a Neutral card.

| Card | Change | V36 | V37 |
|---|---|---|---|
| Leviathan | Pays only if your Alignment gained nothing | 1.44 | 1.11 |
| Tree of Life | Top card of the discard pile only | 1.36 | 1.09 |
| Envy | Only when the leader is 3 or more ahead of you | 1.30 | 1.08 |
| Tribute | Pays the Pot, not you | 1.29 | 1.05 |
| Watchers | Keep 1 of the top 3, then discard a card | 0.66 | 0.94 |
| Forger | Any card from the discard pile | 0.67 | 0.87 |
| Apple | 1 Glory when you lean against yesterday's Tide | 0.67 | 0.99 |
| Council | No vote; others pay you 1 Glory to swap | 0.67 | 0.88 |
| Mirage | Draw 1 if your facedown Offering survives to the reveal | 0.69 | 0.73 |

Skill edge unchanged (2.81 at 3 players). Rejected: Leviathan "another player loses 2 or more" (1.18); Tree of Life choosing from the top 3 (1.27) or discarding 2 (1.29); Envy with a gap of 2 (1.16) or a hand-card cost (1.36); Apple doubling on a Tide flip (0.72), on any color change (0.70), or past the cap (0.99 alone but 1.19 with the others, too swingy); Council with yes-voters swapping (0.69) or caller only (0.71); Mirage as a second facedown card (0.70) or a swap before the reveal (0.69). Details: `game/reports/v37-balance-2026-11-16.md` and `game/reports/v37-candidates-2026-11-16.md`.

**Michael (decided in V38, see below).** Unchanged in V37 at 1.47, then the strongest card. Robert's idea, the card flipping face up at the start of the next Day while its owner can still pay 1 Glory to flip it sooner, measured 1.30. A free flip back on the owner's turn measured 1.20, and both together 1.18.

## Toward every card between 0.75 and 1.25 (November 16, 2026, V38)

Robert set the target: every Host card and Celestial between 0.75 and 1.25 win ratio. Michael got Robert's rule (the card returns after the Reaping, or sooner if its owner pays 1 Glory). Claude proposed reworks for 17 more cards. Robert accepted 13 of them (the Arbiter and Vessel after a second look), kept Veil as it was, and chose his own versions of Urim (look at up to 3), Nephilim (wording only) and Raguel (the Bound player loses 1). Measured on 60,000 bot games before and after (Michael's new rule is in both columns).

| Card | V38 change | Before | V38 |
|---|---|---|---|
| Michael | Card returns after the Reaping; owner may pay 1 any time before | 1.47 (V37) | 1.11 |
| Uriel | Doubling costs 1 Glory each Reaping | 1.31 | 1.05 |
| Beelzebub | Same, mirroring Uriel | 1.22 | 0.98 |
| Mammon | Takes Glory only on a Dark Offer | 1.32 | 1.05 |
| Scapegoat | Covers only that Day's Reaping | 1.27 | 1.08 |
| The Eclipse | Chosen before the Altar is revealed | 1.25 | 1.14 |
| The Arbiter | Takes from a player only on a gain of 2 or more | 1.24 | 1.21 |
| Prophecy | A Neutral Tide is a miss | 1.20 | 1.08 |
| Providence | Costs 1 Glory | 1.20 | 1.15 |
| Vessel | Place a hand card facedown, then the Offer reward | 0.65 | 1.16 |
| Morning Star | At the Reaping, pay 1 to invert one card | 0.72 | 1.15 |
| Eternity | Take an Altar card into your hand in the Evening | 0.78 | 0.90 |
| Outcast | 1 Glory at the Reaping while you have the least | 0.80 | 0.92 |
| Mirage | 1 Glory if a surviving facedown Offering matches the Tide (replaces the V37 draw) | 0.76 | 1.17 |
| Raguel | Bound player loses 1; holder loses 1 less (Robert's version) | 0.76 | 0.89 |
| Urim | Look at up to 3 (Robert's version) | 0.71 | 0.74 |
| Nephilim | Wording only: its values are Neutral (Robert's version) | 0.71 | 0.74 |
| Veil | Unchanged (Robert's choice) | 0.80 | 0.76 |

**Outside the range by Robert's choice:** Urim (0.74) and Nephilim (0.74). Everything else measures between 0.76 (Veil) and 1.21 (the Arbiter). Card win ratio spread fell from 0.144 to 0.110. Skill edge 2.83 at 3 players (2.81 in V37); average length 6.2 Days.

Claude's proposals that Robert declined, with their measured results: Urim calling the Tide for +1 or -1 (1.11); Nephilim counting +1 toward the Tide when the Choir does not lean with it (0.86); Raguel passing on the full loss with the holder losing 1 less (0.89); Veil losing at most 1 at a Reaping (0.83). Other options tested are in `game/reports/v38-balance-2026-11-16.md`.

## Playtest watch list (Open Game, V38)

- **Outside 0.75 to 1.25:** Urim (0.74) and Nephilim (0.74), by Robert's choice. Next closest: Veil (0.76), the Arbiter (1.21).
- **Urim** is a pure information tool and **Nephilim** a pure enabler. Do people value them more than the bots do?
- **Vessel** pays 1 Glory or 1 card every turn at the cost of a hand card. Does it feel like a second Offer that everyone wants?
- **Pay-at-the-Reaping cards** (Uriel, Beelzebub, Morning Star, Michael's victims) add a decision after the Tide is known. Does the Reaping slow down?
- **Mirage, Veil, Council** are bluffing or political cards the bots cannot play well. Check them with people.
- **Covenant** can be aimed at a player at 9 Glory: if the pact holds, both gain 1. Does it get used as kingmaking?
- **Long games.** Does the table ever stall?
- **Gifts near 10.** Does the open gift rule create fun brinkmanship or kingmaking?
- **Bluffing.** Does the table read First Fruits and facedown Offers, or just guess?
- **Blind Gathers.** Do players ever Gather a facedown card?
- **Hubris removal.** Does the open deck play better without it?
- **Raphael and Azazel without Once per Day.** Watch for Altar wipes with Hymn or Lamentation.
- **Snowballing.** The sole leader after Day 3 wins 65% of 3-player bot games (chance: 33%).
- **Thin Altar** at 3 players; the 2-Seed option is in the rules.
