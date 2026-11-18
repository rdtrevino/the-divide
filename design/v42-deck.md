# The V42 deck: final walkthrough

The Host card rework, November 2026, for Robert's final review before it is built in as the rules.

## Where it landed

Measured on 60,000 bot games (3 and 4 players), with every locked choice in.

| | V41 (live) | V42 |
|---|---|---|
| Race to | 15 | **10** |
| Host cards | 69 + 3 without art | **69, all with art** (Ithuriel, Urim and Asmadai retired) |
| Once-per-game cards | 10 | **0** (Michael, Free Will, Mercy, Deliverance and Abaddon are "spent": use it, then discard it) |

| V42 result | |
|---|---|
| Days per game | 6.5 (3 players), 7.0 (4 players) |
| Winner's Glory per Day | 1.66 (3 players), 1.54 (4 players) |
| Cards outside 0.75–1.25 | none (lowest Mirage 0.80, highest Anathema 1.23) |
| Spread (lower is fairer) | 0.113, down from 0.151 in the first V42 draft |

The winner's Days (3 players): 22% gain nothing, 33% gain 1, 16% gain 2, 15% gain 3, 12% gain 4, 2% gain 5 or more. A 4-Glory Day is the flawless engine, not the norm.

**Rules wording.** "At the Reaping" becomes **"At the end of the Day"** on every card. No card or rule says "color": cards say "alignment", "Light" or "Dark". Every Light or Dark card is worth +1.

## Round 2 (November 18): engine building and mirrored scoring

Testing showed engine building never paid back: turn actions were 85% Offer, 14% Gather and 1% Exalt, and an engine card earned about 0.2 Glory a Day against 2 Glory to Exalt it. Robert chose the "G1" direction plus mirrored scoring. **Where this section and the tables below disagree, this section wins.**

### Rule changes

| Rule | Before | Now |
|---|---|---|
| Exalt | Pay 1 Glory: play a card from your hand into your Choir | **Play a card from your hand into your Choir** (no cost) |
| Gather | Take a card from the Altar or the top of the Host deck | **Take a card from the Altar** (blind deck draws were 2–3% of Gathers and lose to a free Exalt) |
| Reaping | With the Tide: alone 3, two 2 and 1, three or more 0. Against it: lose 1 | **With the Tide: alone 3, two 1 each, three or more 0. Against it: alone lose 3, otherwise lose 1** |

### Card changes

| Card | Now |
|---|---|
| Seraphim | When you Exalt a Light card, gain 1 Glory. |
| Legion | When you Exalt a Dark card, gain 1 Glory. (Seraphim's mirror; no longer re-uses abilities) |
| Uriel, Beelzebub | At the end of the Day: If your Choir has 3 or more other Light (Dark) cards, gain 2 Glory. |
| Providence | At the end of each Day your Choir leans with the Tide, put 1 Glory from the Pot on this card. On your turn: You may take all the Glory on it, then discard this card. |
| Mammon | The same as Providence (the Dark store). Its Offer clause is gone. |
| Favor | At the end of each Day your Choir leans with the Tide, put 1 Glory on this card. When it holds 3, remove them and gain 2 Glory. |
| Tree of Life | At the end of the Day: You may take a card from the Altar into your Choir. If your Choir is full, discard one of its cards first. (No cost) |
| Zealot | At the end of the Day: If every other card in your Choir (at least 3) shares one alignment, gain 1 Glory. (The earlier version could never pay: Zealot itself is Neutral) |
| Flaming Sword | On your turn: No other player may Exalt until the start of your next turn. (Anathema's mirror) |
| Temptation | On your turn: Draw 2 cards, then discard 1 card from your hand. (It worked only on deck Gathers) |
| Mercy | If yours is the only Choir against the Tide, lose 1 instead of 3, then discard this card. |
| Outcast | When you have the least Glory (or are tied for it), gain 1 Glory at the end of the Day. (The Exalt clause is gone) |

### Measured (bots that value card abilities; 20,000 games for balance, 1,000 per player count for shape)

| | 3 players | 4 players |
|---|---|---|
| Days | 7.2 | 7.5 |
| Winner's Glory per Day | 1.65 | 1.53 |
| Turn actions: Offer / Gather / Exalt | 62% / 17% / 21% | 64% / 16% / 20% |
| Glory from Offers / the Tide / cards | 44% / 29% / 27% | 49% / 22% / 29% |
| A lone Choir against the Tide | 7% of Reaping results | 5% |

Card balance, now counted over every card a player **held at the end of any Day** (fair to stores and spent cards): every card is between 0.82 (Fig Leaves) and 1.26 (Providence); spread 0.102.

## Light (23)

| # | Card | Value | V41 (live) | V42 | Change | Win ratio |
|---|---|---|---|---|---|---|
| 1 | **Michael** | +1 | On your turn: Flip a Host card in a player's Choir Facedown. It turns face up after the Reaping, or sooner if its owner pays 1 Glory. | On your turn: Discard a card from another player's Choir, then discard this card. | Spent | 0.95 |
| 3 | **Gabriel** | +1 | On your turn: Look at the top card of the Event deck, then return it. | On your turn: Look at another player's hand. | New | 1.02 |
| 4 | **Providence** | +1 | At the Reaping: You may pay 1 Glory to exchange 1 face-up card on the Altar with 1 card from your Choir. | At the end of each Day, put 1 Glory from the Pot on this card. On your turn: You may take all the Glory on it, then discard this card. | New: a store | 1.03 |
| 6 | **Tree of Life** | +1 | On your turn: Take the top card of the discard pile into your hand, then discard a card from your hand. | At the end of the Day: You may pay 1 Glory to take a card from the Altar into your Choir. If your Choir is full, discard one of its cards first. | New | 0.87 |
| 7 | **Free Will** | +1 | Once per game: Take two actions on your turn instead of one. Neither may be Turn. | On your turn: Take a second action this turn, then discard this card. | Spent | 1.03 |
| 8 | **Seraphim** | +1 | On your turn: Choose 1 other Light Host card in your Choir and activate its ability a second time. | Exalting a Light card costs you no Glory. | New | 1.02 |
| 12 | **Uriel** | +1 | At the Reaping: You may pay 1 Glory to make the Light Offering values in your Choir count double when calculating your Alignment. | At the end of the Day: If your Choir has 3 or more other Light cards, gain 1 Glory. | New: a set | 1.11 |
| 13 | **Martyr** | +1 | At the Reaping: If you lose Glory, replace any card in your Choir with a card from your hand. | At the end of the Day: If you lost Glory at the Reaping, you may replace a card in your Choir with a card from your hand. | Wording | 1.06 |
| 14 | **Covenant** | +1 | On your turn: Forbid Offer or Gather and name another player who has not yet taken their turn this Day. Neither of you may take that action before the next Evening. If the pact holds, you each gain 1 Glory in the Evening; if either of you breaks it, you each lose 1. | In the Morning: You may name another player. If neither of you Offers this Day, each of you gains 1 Glory. | Simpler | 1.05 |
| 16 | **Mercy** | +1 | Once per game: Choose to activate this card on your turn. You do not lose Glory at this Evening's Reaping. | When you share the Tide at the Reaping, you may score 3 as if you were alone, then discard this card. | Spent (flagged) | 1.1 |
| 17 | **Revelation** | +1 | Once per game: Reveal your Fate token to all players, then gain 2 Glory. This cannot be used on Day 6. | On your turn: Flip a facedown Altar card face up. You may then flip a face-up Altar card facedown. | New | 0.98 |
| 19 | **Morning Star** | +1 | At the Reaping: You may pay 1 Glory to treat 1 Host card in your Choir as the opposite alignment for this Reaping. Neutral cards are unaffected. | On your turn: Choose a card in your Choir. It counts as the opposite alignment this Day. | Free, on your turn | 1.21 |
| 21 | **Knowledge** | +1 | Once per game: Secretly look at another player's Fate token, then return it. | On your turn: Secretly look at up to 3 facedown Altar cards. | Urim's ability | 0.98 |
| 22 | **Deliverance** | +1 | Once per game: Choose any two players and exchange 1 Host card between their Choirs. | On your turn: Swap a card between any two players' Choirs, then discard this card. | Spent | 1.0 |
| 67 | **Remnant** | +1 | At the Reaping: You may take 1 card from the Altar into your hand, then discard 1 card from your hand. | At the end of the Day: You may take back a card you Offered today into your hand. | Own Offers only | 1.15 |

**No change** (win ratio): Wisdom (1.18), Confession (1.19), Hymn (1.03), Raphael (1.02), Sanctuary (1.07), Tribute (1.02), Cherubim (1.04), Absolution (1.08)

## Dark (23)

| # | Card | Value | V41 (live) | V42 | Change | Win ratio |
|---|---|---|---|---|---|---|
| 45 | **Anathema** | +1 | On your turn: Choose a player. They cannot take the Offer action until the start of your next turn. | On your turn: No other player may Offer until the start of your next turn. | Everyone | 1.23 |
| 53 | **Beelzebub** | +1 | At the Reaping: You may pay 1 Glory to make the Dark Offering values in your Choir count double when calculating your Alignment. | At the end of the Day: If your Choir has 3 or more other Dark cards, gain 1 Glory. | New: a set | 0.94 |
| 54 | **Leviathan** | +1 | At the Reaping: If your Alignment did not gain you Glory, gain 1 Glory if any other player loses Glory this Reaping. | At the end of the Day: If 2 or more other players lost Glory this Day, gain 1 Glory. | Simpler | 1.17 |
| 55 | **Hubris** | +1 | At the Reaping: If the player with the most Glory gains Glory this Reaping, they give 1 of that gained Glory to you. | At the end of the Day: If the player with the most Glory gained 4 or more Glory this Day, they give 1 to you. | Whole Day, 4+ | 1.18 |
| 56 | **Belial** | +1 | When any player executes a Turn, every player except you loses 1 Glory. | On your turn: Look at a facedown Altar card. You may swap it with a card from your hand. | Asmadai's ability | 0.95 |
| 57 | **Mammon** | +1 | When you Offer a Dark card, you may take its 1 Glory from a player of your choice instead of the Pot. When you Exalt, pay the Glory cost to the player, other than you, with the least Glory. | When you Offer a Dark card, you may take its 1 Glory from another player instead of the Pot. | Offer clause only | 1.17 |
| 59 | **Lilith** | +1 | You cannot be Targeted by Raguel, Covenant, or Scapegoat. On your turn, you may dissolve any pact or bond that includes you. | Other players' abilities cannot look at, take, or discard cards in your hand. | New | 0.88 |
| 60 | **Parasite** | +1 | This card cannot be voluntarily discarded or replaced when you Gather or Exalt. It has no ability and occupies a Choir slot. It leaves your Choir only when your or another player's effect moves it. | On your turn: Move this card into another player's Choir. Its holder cannot discard it. | An attack | 1.13 |
| 61 | **Winnowing** | +1 | On your turn: Choose another player and discard 1 random card from their hand. They draw 1 from the Host deck. | On your turn: Discard up to 2 facedown Altar cards without looking at them. | New | 1.0 |
| 62 | **Silence** | +1 | Once per game: As another player activates a Host or Celestial ability, negate it. It has no effect, and any cost paid is not refunded. | On your turn: Choose a player. Their Choir's abilities do not work until your next turn. | Repeatable | 0.93 |
| 63 | **Scapegoat** | +1 | Once per game: Choose a player. If you would lose Glory at this Day's Reaping, they lose it instead. You lose nothing. | When another player would gain Glory at the Reaping, you may pay 1 Glory. They gain nothing. | New | 1.06 |
| 64 | **Defiance** | +1 | Once per game: Choose to activate this card on your turn. Ignore the effects of the current Day's Event for yourself until the end of the Day. | Other players' abilities cannot make you lose or give up Glory. | New | 1.02 |
| 65 | **Bounty** | +1 | Once per game: Name a player and a Fate. At the endgame reveal, if you guessed their Fate correctly, gain 2 Glory. | In the Morning: You may name a player. At the end of the Day, if they lost Glory, gain 1 Glory. If they gained Glory, lose 1 Glory. | A bet | 1.07 |
| 66 | **Abaddon** | +1 | Once per game: Choose to activate this card on your turn. Discard every card on the Altar and replace each with the top card of the Host deck. | On your turn: Replace every Altar card with the top card of the Host deck, then discard this card. | Spent | 0.94 |

**No change** (win ratio): Serpent (0.9), Favor (0.92), Temptation (0.9), Legion (0.88), Lamentation (0.91), Azazel (0.9), Moloch (1.03), Envy (1.06), Snare (0.89)

## Neutral and both sides (23)

| # | Card | Value | V41 (live) | V42 | Change | Win ratio |
|---|---|---|---|---|---|---|
| 23 | **Vessel** | 0 | On your turn: You may place a card from your hand on the Altar facedown, then draw 1 card. At the Reaping, if that card is still on the Altar and matches the Tide, gain 1 Glory. This is not an Offer. | On your turn: You may place a card from your hand on the Altar facedown (this is not an Offer). At the end of the Day, if it is still there, gain 1 Glory if it matches the Tide, or lose 1 if it opposes it. | A bet; no draw | 0.95 |
| 24 | **Eternity** | 0 | At the Reaping: You may take 1 card from the Altar into your hand. | At the end of the Day: If you did not Offer this Day, gain 1 Glory. | New | 1.08 |
| 26 | **Raguel** | 0 | When this enters your Choir, choose another player. They are Bound to you while it remains. At each Reaping, if you lose Glory, your Bound player loses 1 Glory, and you lose 1 less. | When this enters your Choir, choose another player. They are Bound to you while it remains. At the end of the Day: if your Bound player gained Glory, gain 1 Glory. If they lost Glory, lose 1 Glory. | Shared fate | 0.93 |
| 27 | **Twilight** | 0 | At the Reaping: If your Choir holds at least one Light and at least one Dark Host card, gain 1 Glory. | At the end of the Day: If your Choir holds at least one Light and one Dark card, gain 1 Glory. | Label | 0.95 |
| 28 | **Zealot** | 0 | At the Reaping: If your Choir has the single most extreme net Alignment at the table (no ties), gain 1 Glory. | At the end of the Day: If your Choir has 3 or more cards, all of one alignment, gain 1 Glory. | New | 0.84 |
| 29 | **Stillness** | 0 | At the Reaping: If the Tide is Neutral (a tie or an empty Altar), gain 1 Glory. | At the end of the Day: If the Tide was Neutral (a tie or an empty Altar), gain 1 Glory. | Label | 1.22 |
| 30 | **Acolyte** | ±1 | This card's Alignment mimics the opposite of the previous Day's Tide. If the last Tide was Light, it counts as Dark +2. If it was Dark, it counts as Light +2. If it was Neutral, or on Day 1, this card is Neutral. | **Renamed Acolyte.** This card's alignment matches the previous Day's Tide: Light +1 after a Light Tide, Dark +1 after a Dark Tide. After a Neutral Tide, or on Day 1, it is Neutral. | Follows; +1; renamed | 1.04 |
| 32 | **Firmament** | 0 | At the Reaping: If the Tide's winning margin is exactly 1, gain 1 Glory. | At the end of the Day: If the Tide won by exactly 1 and your Choir leans with it, gain 1 Glory. | Must lean with it | 1.18 |
| 33 | **Moderation** | 0 | At the Reaping: If your Choir's Alignment is Neutral, gain 1 Glory. | At the end of the Day: If your Choir leans neither way, gain 1 Glory. | Label | 1.13 |
| 34 | **Fig Leaves** | 0 | At the Reaping: You may treat your entire Choir's Alignment as Neutral, gaining and losing nothing. | On your turn: Your Choir sits out this Day. It gains nothing, loses nothing, and does not count as leaning either way. | On your turn | 0.86 |
| 35 | **Flaming Sword** | 0 | While this card is face up in a Choir or on the Altar, no one may execute a Turn. | On your turn: Choose a player. They cannot Gather until your next turn. | New | 0.85 |
| 36 | **Outcast** | 0 | When you Exalt, if you have the lowest Glory at the table or are tied for lowest, you pay no Glory. At the Reaping, if you have the lowest Glory or are tied for it, gain 1 Glory. | When you Exalt, if you have the least Glory (or are tied for it), you pay no Glory. At the end of the Day, if you have the least Glory (or are tied for it), gain 1 Glory. | Label | 1.17 |
| 37 | **Heresy** | 0 | At the Reaping: You may score your Alignment in reverse. Gain Glory equal to your net Alignment if it opposes the Tide; lose that much if it matches. | On your turn: You may pay 1 Glory. Your Choir counts as leaning the opposite way this Day. | Costs 1, on your turn | 1.0 |
| 39 | **Mirage** | 0 | Your facedown Offerings cannot be flipped, looked at, exchanged, or destroyed before the Evening. At the Reaping, if a card you Offered facedown is still on the Altar and matches the Tide, gain 1 Glory. | Your facedown Offerings cannot be flipped, looked at, exchanged, or destroyed before the Evening. | Protection only | 0.8 |
| 40 | **Veil** | 0 | Other players' abilities cannot Look at, Reveal, Copy, or Flip your cards or Fate. Your cards may still be Replaced or Discarded. | At the end of the Day: If more Altar cards were facedown than face up when it was revealed, gain 1 Glory. | New | 0.96 |
| 41 | **Prophecy** | 0 | In the Morning: Publicly declare a Target Alignment, Light or Dark. At the Reaping, if the Tide matches, gain 1 Glory; otherwise, including a Neutral Tide, lose 1 Glory. | In the Morning: Declare Light or Dark. At the end of the Day, if the Tide matches, gain 1 Glory; otherwise (a Neutral Tide included), lose 1 Glory. | Label | 1.08 |
| 43 | **Apple** | 0 | At the Reaping: If your Choir's Alignment is the opposite color from the previous Day's Tide, gain 1 Glory. | At the end of the Day: If your Choir leans the other way from yesterday, gain 1 Glory. | Rewards switching | 0.83 |

**No change** (win ratio): Ordeal (1.21), Nephilim (0.86), Council (0.94), Watchers (1.11), Forger (0.9), Jubilee (1.19)

## Abilities that were removed

These no longer exist on any card. Any of them could come back if a card needs replacing.

| Card | Removed ability | Why |
|---|---|---|
| Michael | Flip a card in a Choir facedown | Now spent: discard a rival's Choir card |
| Gabriel | Peek at the Event deck | The Base game has no Events |
| Providence | Pay 1: swap an Altar card with a Choir card | Became a store (Tree of Life now takes from the Altar) |
| Tree of Life | Take the top discard into your hand | Became the pay-1 Altar-to-Choir take |
| Seraphim | Use another Light card's ability again | Became free Light Exalts (**Legion still re-uses Dark abilities, so the two no longer mirror**) |
| Uriel, Beelzebub | Double your Light (Dark) values | Doubling barely matters under coalition scoring; now set cards |
| Covenant | Forbid Gather too; lose 1 if broken | Simpler pact, made in the Morning |
| Mercy | Lose nothing at the Reaping | A loss is only 1 now |
| Revelation, Knowledge, Bounty | Fate abilities (Hidden Roles only) | One deck for every mode |
| Belial, Flaming Sword | Punish or block the Turn (Hidden Roles only) | One deck for every mode |
| Raguel | Share your loss with your Bound player | Now shared fate, both ways |
| Zealot | +1 for the most extreme lean at the table | Now a one-alignment Choir |
| Eternity | Take an Altar card into your hand | Duplicated Remnant; now pays for not Offering |
| Heresy, Fig Leaves, Morning Star | Decided after the Altar is revealed | Decided on your turn, before the reveal |
| Mirage | 1 Glory for a matching facedown Offer | Protection only |
| Veil | Protection from looks and flips | Now pays for a hidden Altar |
| Apple | Lean against yesterday's Tide | Now pays for switching sides |
| Leviathan | Gain when any other player loses | Too strong; now 2 or more must lose |
| Hubris | Paid at every Reaping | Now the whole Day, 4 or more |
| Mammon | The Exalt clause | Simpler |
| Lilith | Immune to bonds and pacts; dissolve them | Those cards changed; now protects your hand |
| Parasite | A dead card stuck in your Choir | Now an attack |
| Winnowing | Random hand discard (they draw a replacement) | Now hits facedown Altar cards |
| Silence | Cancel an ability as it happens | Too slow online; now on your turn |
| Scapegoat | Pass your loss to another player | Now denies another player's gain |
| Defiance | Ignore the Day's Event | The Base game has no Events |
| Free Will, Deliverance, Abaddon | Once per game | Now spent: use it, then discard it |
| Shroud | Opposes yesterday's Tide | Now follows it, renamed Acolyte |
| Remnant | Take any Altar card | Only your own Offer |
| Vessel | Draw a card | Made no difference; now a bet |
| Anathema | One target | Everyone but you |

## Parked versions

Versions Robert liked but did not pick. Each still has a test switch (see `design/parked-abilities.md`).

| Card | Parked version | Win ratio |
|---|---|---|
| Winnowing | On your turn: Discard a random card from another player's hand. They don't draw back up until the end of the Day. | 0.76 |
| Zealot | At the end of the Day: If more Altar cards were face up than facedown when it was revealed, gain 1 Glory. (Veil's mirror.) | 1.16 |

## To watch in playtests

- **Mercy** (flagged by Robert): scoring 3 alone on a shared Day may feel too strong.
- **Anathema** (1.23), **Stillness** (1.22), **Morning Star** (1.21), **Ordeal** (1.21): the top of the range.
- **Mirage** (0.80), **Apple** (0.83), **Zealot** (0.84): the bottom of the range. Bots don't switch sides on purpose, so Apple should do better with people.
- **Seraphim and Legion** are no longer mirrors.

## Still to do after approval

1. Make every locked choice the engine's default and remove the rejected test switches.
2. Card data V42: new texts, +1 values, Shroud renamed Acolyte, the 69-card deck; card faces re-rendered.
3. Rulebook v12, the Learn page, the changelog and design decisions.
4. Later: an Advanced pass for Celestials and Events written for the old scoring.
