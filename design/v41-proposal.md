# V41 proposal: the growing Choir, and a simpler card set

Draft for Robert's review, November 17, 2026. Nothing here is adopted yet. Measured with the bot simulator (3,000 to 40,000 games per line); the bots now look ahead when building (`bot-future`), because bots that only count today's Reaping never invest in their Choir, and the question is about investing.

## Part A: build for later, or sway the Altar now

**Robert's goal:** one turn per Day, and every turn a real choice between building a Choir that pays out more and more, and Offering to sway the Altar for 1 Glory and maybe today's Reaping.

**What the numbers say about today's rules:** building never pays more later. The Reaping pays about 0.7 Glory per player per Day early and 0.6 late, the same as an Offer, because the Choir starts full and the cap of 3 is reached at once. Exalt is almost never worth 1 Glory (2% of actions).

### The proposal: the growing Choir

| Rule | Now | Proposed |
|---|---|---|
| Starting Choir | 3 random cards | **2 random cards** |
| Choir limit | 3 | **5** |
| Reaping cap | 3 | **none** (one rule fewer) |
| Exalt | costs 1 Glory | **free** |
| Seed | 1 card each Morning | **none** (First Fruits starts the Altar) |
| Race to | 10 | **15** |
| Lone bonus | | **+1 Glory if yours is the only Choir that gains at the Reaping** |
| Turns | one per Day | one per Day |

Every hand card now asks the question: into your Choir (free, permanent, pays every Reaping) or onto the Altar (1 Glory now, and a push on today's Tide)?

### Measured (3 players, 4 players in brackets)

| | Today's rules | Growing Choir |
|---|---|---|
| Days per game | 6.4 (6.2) | 8.7 (9.4) |
| Offer / Gather / Exalt | 63 / 33 / 4 | **47 / 30 / 23** |
| Reaping per player per Day, Days 1–2 → Day 5 on | 0.70 → 0.58 | **0.63 → 0.97** |
| Winner's Glory from Offers | 26% | 15% |
| Sole leader after Day 3 wins | 64% (57%) | **53% (43%)** |
| Final-Day comebacks | 14% (20%) | 18% (22%) |
| Celestial spread (lower is fairer) | 0.116 (0.142) | **0.090 (0.079)** |
| Skill edge (smart bot among random) | 2.73 (3.37) | 2.58 (3.07) |

The skill-edge figure falls a little because uncapped Reapings swing more, so a lucky random player sometimes wins big. People who plan their Choir should do better than these bots.

**Shared spoils** (Choirs with the Tide split it: up to 3 alone, 2 each with a partner, 1 each with more) was also measured: if a table herds, games stall at 20 to 24 Days. It needs a table of people to see whether players avoid herding. The **lone bonus** is safe and points the same way, so it is in the proposal; shared spoils can be a table option to try.

### What the growing Choir does to the cards

40,000 bot games. Card spread rises from 0.134 to 0.191, in two clear groups:

- **Too strong:** the +2 once-per-game cards: Free Will 1.46, Mercy 1.34, Scapegoat 1.29, Deliverance 1.29, Defiance 1.27, Abaddon 1.27. With no cap and five places, a +2 card is simply worth more. Ordeal (doubling) rises to 1.24.
- **Too weak:** Neutral cards that take a place a valued card could fill: Urim 0.56, Moderation 0.59, Nephilim 0.61, Prophecy 0.65, Veil 0.66, and a few others around 0.7.

**Proposed fix (to measure after the rewrite):** once-per-game cards become +1, like every other card, and turn sideways when used (one rule fewer: no +2 values at all). Neutral cards stay Neutral; the rewrite below makes their abilities a little stronger where they are weakest.

## Part B: simpler cards and language

### Four timing labels instead of thirteen

Open Game cards now use 13 labels. Proposed:

| Label | Covers |
|---|---|
| **In the Morning** | Prophecy (and the Oracle and the Whisper in Advanced) |
| **On your turn** | turn abilities, after your action |
| **At the Reaping** | everything after the Altar is revealed: today's "In the Evening", "At the Reaping" and "Before the Altar is Refreshed" |
| *(no label)* | always on, or triggered: "When you Offer…", "When you Gather…" |

"Once per game" becomes a small icon plus the rule "turn it sideways when used". "Once per Day" disappears (with one turn per Day, it is already once per Day).

Moving "In the Evening" cards to "At the Reaping" changes one thing: they now see the Tide. Providence moves to "On your turn" instead, so it still affects the Tide.

### Rules dropped or simplified

- The Seed.
- The Reaping cap.
- Exalt's cost, and with it Divine Calling's effect and Outcast's and Mammon's Exalt clauses.
- +2 values (once-per-game cards become +1).
- "Declarations" as its own step: Morning is the Event, predictions, then First Fruits.
- **To test next:** the endgame bonus. With a race to 15 it decides fewer games; dropping it means "most Glory wins" with no extra count.

### Base game and Advanced

- **Base game:** Host cards, the Altar and your Choir. No Celestials, no Events.
- **Advanced:** add Celestials (one each, public) and Events (one each Morning).
- **Gabriel** looks at the Event deck, so in the Base game it becomes "Look at the top 3 Host cards and put them back in any order". **Defiance** ignores the Event, so it is Advanced-only, or becomes "you lose no Glory to other players' abilities this Day".

### Card text, 20 words or fewer

Draft wording. **Bold** marks a rules change, not just wording. Cards not listed keep their text, apart from the timing label.

| Card | Proposed text |
|---|---|
| Michael | On your turn: Flip a card in any Choir facedown. It returns after the Reaping, or sooner if its owner pays 1 Glory. |
| Providence | **On your turn:** You may pay 1 Glory to swap a card in your Choir with a face-up Altar card. |
| Confession | On your turn: Reveal your hand until your next turn. If it holds no Dark card, gain 1 Glory. |
| Free Will | Once per game: Take two actions this turn. |
| Hymn / Lamentation | You may Offer 2 Light (Dark) cards at once, face up, for one reward. |
| Raphael / Azazel | When you Offer a Light (Dark) card, you may reveal it and skip its reward to destroy a face-up Dark (Light) Altar card. |
| Uriel / Beelzebub | At the Reaping: You may pay 1 Glory to **count one** Light (Dark) card in your Choir twice. |
| Covenant | On your turn: Name a player who hasn't acted. **If neither of you Offers this Day, you each gain 1 Glory.** |
| Tribute | Other players must pay 1 Glory to the Pot to target your Choir. |
| Mercy | Once per game, on your turn: You lose no Glory at this Reaping. |
| Cherubim | Other players cannot discard or replace your Choir cards. |
| Veil | Other players cannot look at, reveal, copy, or flip your cards. |
| Morning Star | At the Reaping: You may pay 1 Glory to treat one Choir card as the opposite color. |
| Absolution | When a card is discarded from your Choir, you may put it in your hand **instead**. |
| Deliverance | Once per game: Swap a card between any two Choirs. |
| Vessel | On your turn: Place a hand card facedown on the Altar and draw 1. Gain 1 Glory if it matches the Tide. |
| Eternity | At the Reaping: You may take a card from the Altar into your hand. |
| Ordeal | On your turn: Double your Reaping gain or loss this Day. |
| Raguel | When this enters your Choir, Bind a player. When you lose Glory at the Reaping, they lose 1 and you lose 1 less. |
| Twilight | At the Reaping: If your Choir holds a Light and a Dark card, gain 1 Glory. |
| Zealot | At the Reaping: If your Choir leans harder than any other, gain 1 Glory. |
| Shroud | Counts as +2 of the color opposite yesterday's Tide. Neutral on Day 1 and after a Neutral Tide. |
| Nephilim | Counts as a Light card and a Dark card for other cards, but adds nothing to your lean or the Tide. |
| Firmament | At the Reaping: If the Tide won by exactly 1, gain 1 Glory. |
| Moderation | At the Reaping: If your Choir is balanced, gain **2** Glory. |
| Fig Leaves | At the Reaping: You may score nothing from your Choir this Reaping. |
| Outcast | At the Reaping: If you have the least Glory, or tie for it, gain 1 Glory. |
| Heresy | At the Reaping: You may score in reverse: gain if you lean against the Tide, lose if with it. |
| Council | On your turn: Swap a hand card into your Choir. Each other player may pay you 1 Glory to do the same. |
| Mirage | Your facedown Offers are hidden from every ability. At the Reaping, gain 1 Glory if one matches the Tide. |
| Prophecy | In the Morning: Call Light or Dark. At the Reaping, gain **2** Glory if right; lose 1 if not. |
| Watchers | On your turn: Look at the top 3 Host cards. Keep 1, discard a hand card, return the rest. |
| Apple | At the Reaping: If your Choir leans against yesterday's Tide, gain 1 Glory. |
| Forger | When you Gather, you may take any card from the discard pile. |
| Anathema | On your turn: Choose a player. They cannot Offer until your next turn. |
| Serpent | On your turn: Look at a player's hand. You may swap a card with them. |
| Favor | When you Gather, you may take a random card from a player's hand **instead**. They draw 1. |
| Temptation | When you Gather from the deck, take 2: one to your Choir, one to your hand. Then discard a hand card. |
| Seraphim / Legion | On your turn: Use another Light (Dark) card's ability in your Choir again. |
| Moloch | On your turn: Discard another card from your Choir to gain 1 Glory. |
| Leviathan | At the Reaping: If your Choir gained nothing and another player lost Glory, gain 1 Glory. |
| Mammon | When you Offer a Dark card, you may take its 1 Glory from another player instead of the Pot. |
| Envy | On your turn: If the leader has 3 or more Glory than you, they lose 1. |
| Lilith | Raguel, Covenant, and Scapegoat cannot target you. On your turn, you may end any pact you are in. |
| Parasite | No ability. You cannot discard this card from your Choir. |
| Winnowing | On your turn: Discard a random card from another player's hand. They draw 1. |
| Silence | Once per game: Cancel another player's ability as they use it. |
| Scapegoat | Once per game, on your turn: Name a player. Your Reaping loss this Day goes to them. |
| Abaddon | Once per game, on your turn: Replace every Altar card with the top card of the Host deck. |
| Remnant | At the Reaping: Take an Altar card into your hand, then discard a hand card. |
| Jubilee | On your turn: Discard any hand cards, then draw back up to your hand limit. |
| Snare | When another player Gathers a card you Offered, gain 1 Glory. |
| Sanctuary | On your turn: Protect an Altar card. Other players cannot Gather or destroy it this Day. |
| Martyr | At the Reaping: If you lose Glory, swap a hand card into your Choir. |
| Tree of Life | On your turn: Take the top discard into your hand, then discard a hand card. |
| Gabriel (Base) | On your turn: Look at the top 3 Host cards and return them in any order. |

## Order of work, once agreed

1. Robert confirms Part A (or picks pieces) and marks up the card text.
2. Engine: the growing Choir rules, Base/Advanced, the new card text, the timing labels.
3. Measure every card again (target 0.75 to 1.25) and adjust.
4. Rulebook v11 (Base rules first, Advanced as its own section), the Learn page, the site's table option for Base or Advanced.
5. V41 card data and a reprint list.
