# The Divide: Design Decisions

The standing principles behind the rules, what is still open, and what to watch in playtesting. Current to card data V45 and rulebook v15 (November 19, 2026).

**Start with `vision.md`:** the core dilemma and principles that every decision here serves. **`the-game-now.md`** is the current design and its validation.

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
| 3 or 4 | The **Base game** (Host cards and allegiance tokens) or the **Advanced game** (adds the 9 Celestials and 17 Events) |

**Hidden Roles is retired (V45).** The allegiance tokens give every game secret, shifting sides at 3 and 4 players, which is what Hidden Roles was for. Tested at 5 and 6 players (lab Round 41), the token core keeps sides hidden (53 to 57%), but a fair turn order needs Days in multiples of the player count (5 or 10 at 5 players, 6 at 6), which is either too short or too long, and seats measured 0.59 to 1.43. If a 5-player game is wanted later, start there. The Fates, the Turn, the Balance and its three Events (The Sabbath, Equilibrium, Armageddon) are retired with it.

One deck of 69 Host cards: **every card is Light or Dark** (V45, Robert): 34 Light, 34 Dark, and Acolyte, whose color is the most recent Day won's. Ithuriel, Urim and Asmadai were retired in V42; Revelation, Knowledge and Belial took over their abilities.

## Design principles

- **Every card between 0.75 and 1.25** win ratio in bot testing (Robert's target since V38). Under V45 every Host card measures 0.75 to 1.25 and every Celestial 0.86 to 1.23 (`balance.md`).
- **No Neutral cards** (V45). A card that never scores is a trap, and a rule to pay it is a patch; every card is a side, so building is always a statement about sides.
- **Few cards give easy Glory every turn.** Engines pay over time and can be lost.
- **No profit from playing only one alignment.** A one-color Choir scores big on its Days and nothing on the others; a mixed one scores a little every Day and tells the table less.
- **Paired cards are mirrors:** Raphael and Azazel, Hymn and Lamentation, Seraphim and Legion, Uriel and Beelzebub, Providence and Mammon, and the Light and Dark halves of the deck.
- **Chaos and choice over automatic play.** Hidden information should create reads and bluffs, not just luck (why facedown Offers stayed and the face-up row and "draw 2, keep 1" were rejected in V35).
- **Glory moves between players only when a card says so** (V40). Talk and promises are open and non-binding.
- **Ties on "most" or "least" Glory:** the player using the card chooses, unless the card says otherwise (Envy).
- **Secret personal objectives** were considered and rejected: the allegiance tokens already are the secret objective.
- **The public good stays public.** Offers earn nothing directly (V45); the Miser's Rule is the only thing that makes not contributing cost.

## Parked ideas

Versions Robert liked but did not pick in the V42 Host rework, to reconsider if a card needs replacing or a slot opens up:

| Card | Parked ability | Measured win ratio | Why it was parked |
|---|---|---|---|
| Winnowing | On your turn: Discard a random card from another player's hand. They don't draw back up until the end of the Day. | 0.76 | Robert preferred the blind Altar discard, but likes this one. |
| Zealot | At the end of the Day: If more Altar cards were face up than facedown when it was revealed, gain 1 Glory (a mirror of Veil). | 1.16 | Robert picked "3 or more other cards, all of one alignment", but likes this one. |

## Still to decide

- **V45 card and Celestial rewordings** are measured and built (`CHANGELOG.md`), but not yet approved card by card by Robert.
- **The card frames** of the 23 cards that changed color need new art frames before printing.
- **Talk rules worth a playtest:** may players show a token? trade tokens facedown?

## Playtest watch list

Bots cannot bluff, negotiate or betray, so these are the questions only people can answer:

- **Tokens:** do people Offer tokens (the strong lab bots: about 3 a game) or hoard them? Does the reveal feel like a satisfying climax?
- **Reads:** with anonymous Offers and mixed tokens, a careful card-counter is right about half the time. Does that make talk sharper or vaguer?
- **The Miser's Rule:** does it feel fair, or like a tax? Does anyone game it?
- **Length:** about 23 minutes at 3 players and 37 at 4 by the time model; real tables decide.
- **Bluffing and political cards** (Mirage, Veil, Council, Covenant, Fig Leaves, Gabriel's read): where people should beat the bots.
- **Mammon** sits at the bottom of the range (0.72 to 0.75); **the Whisper** at the top of the Celestials (1.2).
