# The Divide: Design Decisions

The standing principles behind the rules, what is still open, and what to watch in playtesting. Current to card data V44 and rulebook v14 (November 18, 2026).

**Start with `vision.md`:** the core dilemma and principles that every decision here serves.

Where everything else lives:

- **The rules and every card ruling:** the rulebook (`rules/`), whose Rulings section settles the questions card text leaves open.
- **Card text:** `cards/cards.json` (and the spreadsheet beside it).
- **Measured balance of the current rules:** `balance.md`.
- **How each version got here, with what was tried and rejected:** `CHANGELOG.md`.

## Governing rules

1. **The card data is the source of truth.** When the rulebook and the cards disagree, the cards win and the rulebook is corrected. When a card's wording and an approved ruling disagree, the card is reworded to match the game (V44: Favor, Raguel, Bounty and Parasite say "at the Reaping").
2. **Read card text literally.** Rulings follow from the exact wording.
3. **An ability that sometimes does nothing is fine.** A card may have moments where it cannot be used, such as the Arbiter when no rival has Glory. Only changes that break the game's mechanics need fixing.
4. **Printed cards are drawn in the Claude Design session.** Text changes must be made there too before printing; the Reprint List tab of the card spreadsheet lists every card whose printed face is out of date.

## Modes

| Players | Mode |
|---|---|
| 3 or 4 | The **Base game** (Host cards only) or the **Advanced game** (adds the 9 Celestials and 17 Events) |
| 5 or 6 | **Hidden Roles**: secret Fates, the Balance and the Turn (not playable online; the engine does not implement it) |

One deck of 69 Host cards serves every mode: 23 Light, 23 Neutral (Acolyte and Nephilim among them), 23 Dark, numbered in that order. The Sabbath, Equilibrium and Armageddon move the Balance and are used only in Hidden Roles. Ithuriel, Urim and Asmadai were retired in V42; Revelation, Knowledge and Belial took over their abilities.

## Design principles

- **Every card between 0.75 and 1.25** win ratio in bot testing (Robert's target since V38). Today every Host card measures 0.8 to 1.2 and every Celestial 0.95 to 1.05 (`balance.md`).
- **Few cards give easy Glory every turn.** Engines pay over time and can be lost.
- **No profit from playing only one alignment.** The Tide rewards reading the table, not loyalty to a color.
- **Paired cards are mirrors:** Raphael and Azazel, Hymn and Lamentation, Seraphim and Legion, Uriel and Beelzebub, Providence and Mammon, and the Light and Dark halves of the deck.
- **Chaos and choice over automatic play.** Hidden information should create reads and bluffs, not just luck (why facedown Offers stayed and the face-up row and "draw 2, keep 1" were rejected in V35).
- **Glory moves between players only when a card says so** (V40). Talk and promises are open and non-binding.
- **Ties on "most" or "least" Glory:** the player using the card chooses, unless the card says otherwise (Envy).
- **Secret personal objectives** were considered for the Open Game and rejected: they work the way Fates already do.

## Parked ideas

Versions Robert liked but did not pick in the V42 Host rework, to reconsider if a card needs replacing or a slot opens up:

| Card | Parked ability | Measured win ratio | Why it was parked |
|---|---|---|---|
| Winnowing | On your turn: Discard a random card from another player's hand. They don't draw back up until the end of the Day. | 0.76 | Robert preferred the blind Altar discard, but likes this one. |
| Zealot | At the end of the Day: If more Altar cards were face up than facedown when it was revealed, gain 1 Glory (a mirror of Veil). | 1.16 | Robert picked "3 or more other cards, all of one alignment", but likes this one. |

## Still to decide

- **V44 Celestials and Events** are measured and built, but not yet approved by Robert.
- **Hidden Roles:** the winner tiebreak within the winning faction; how the endgame card bonus works when the Forsaken win; whether a player who Turns reveals their Fate; printed Fate token counts (4 Faithful, 4 Fallen, 2 Forsaken printed; setup needs at most 3, 3 and 1).

## Playtest watch list

Bots cannot bluff, negotiate or betray, so these are the questions only people can answer:

- **Bluffing and political cards** (Mirage, Veil, Council, Covenant, Gabriel's read): do people play them better than the bots, whose numbers put Mirage and Veil at 0.82 to 0.83?
- **Coalition scoring:** do tables learn to split their leans, or herd onto one side and score nothing?
- **Snowballing:** does a leader after Day 3 run away with the game, or do coalitions pull them back?
- **Facedown Offers:** does the table read First Fruits and facedown Offers, or just guess?
- **Covenant and the leader:** can a pact with a player near 12 crown them?
- **The Echo** varies most by player count (0.97 at 3, 1.05 at 4). **The Oracle and the Patron** (0.95) depend on judgment the bots only approximate.
- **Purgatory** speeds the game up a little; if Days of reprieve feel flat, a Neutral Choir could gain 2.
