# Spoils, the Altar as a market, and Choirs that move

November 20, 2026. Robert's direction after the harvest study:
- Keep no harvest rule and no Miser, and find other ways to balance.
- Should Choirs never reset, or should some cards leave, so players do not stick to one side?
- Spoils for the winners: the Altar's cards and tokens taken one by one, perhaps instead of (or with less) Choir Glory.
- Cards from the Altar as a commodity: extra hand cards, perhaps replacing the draw, so Gathering becomes valuable.

"Consider this in tandem with everything we've discussed to make the most compelling game design overall."

**A study and a recommendation, not adopted.**

**Method:**
- **Players:** the engine's strong (Monte Carlo) bot in every seat, with the real cards. Every idea is a switch in the engine (`rules.ts`), so the bots play it as written.
- **Games:** 300 per package at 3 and at 4 players; 1,200 for the finalist.
- **Fixed strategies** (`exploits.ts`): one strong bot leaning hard into a strategy among three plain ones, 4 players, 300 games, ±0.1. The one that matters most here is **never Offering**: without a harvest rule, it won 1.11.
- **Results:** `game/tools/sim/results/` (`economy-r1` to `economy-r4`, `economy-confirm`, `economy-exploits`).
- **New measures:**
  - *Choir flips:* how often a player's Choir changes its majority color during a game.
  - *One-color Choirs:* the share of players ending with a full Choir of one color.
  - *Spoils:* cards and tokens taken per player per game.

## The ideas

| Idea | Serves (`vision.md`) | Tested as |
|---|---|---|
| **Choirs**: never reset (now) | 5: the engine grows the longer you invest | baseline |
| Turnover: a full Choir loses its oldest card each Evening | 2: no player locked to a color | `turnover` |
| The Fall: a Choir card of the losing color leaves each Evening | 2 | earlier (`core-validation.md`): Offers fell to 44% |
| A reset at fixed Days (after Days 3 and 6) | 2 | not tested: it wipes the engine (principle 5) and adds a timer to remember |
| Scored cards return to hand (score, then replay) | 3, 5 | not tested: a second card cycle to teach |
| **Spoils**: to players whose Choir leans to the winning color | 1, 3 | `spoils` (Choir pays 2, 1 or 0) |
| Spoils to players who Offered that Day | 1, 3: contributing earns a share | `offererSpoils`, in turn order, reverse order, one spoil each |
| Spoils to those who Offered the winning color | 1 | not tested: needs each Offer's owner revealed, which ends the anonymous reveal (principle 2) |
| A champion (most winning-color Choir cards) takes all | | not tested: rich get richer |
| Spoils as Glory split by the winners | | not tested: the "collection plate" of Rounds 22–30, ruled out for making the public good private |
| **The Altar as a market**: a Gathered card goes to hand, and you draw 1 card a Day instead of refilling | 3: Gather becomes the way to choose cards | `market`, with and without spoils |
| **Fewer Days nobody wins**: carryover (a tied Altar stays for the next Day) | 3: rising stakes instead of a tie-break | `carry` |
| Choir pays 1 instead of 2 | 1 | `pay1` |

## Results

### 1. Do players stick to one side? Choirs barely move, but it does not give sides away

| (4p) | Current (no offering, no harvest) | No rule | Turnover | Spoils to Offerers |
|---|---|---|---|---|
| Choir flips per player per game | **0.10** | 0.26 | **1.16** | 0.26 |
| One-color full Choirs | 17% | 32% | 19% | 32% |
| Reader (guessing 50%) | 68% | 62% | 60% | **59%** |

- **Robert's instinct is right that Choirs stick.** Today a Choir changes color once in ten games: the hedge holds it in place. Without a harvest rule, more Choirs end up one color.
- **But sticking no longer gives a side away.** Without the harvest rule, Choirs follow tactics rather than the hidden side (the reader drops to 59–62%). And with spoils, tokens move every Day, so the secret side shifts even while the Choir holds (principle 2: "not even permanent").
- **Turnover is the only rule that makes Choirs move,** more than once a game, with fair seats and a good reader (60%). But it rewards building over contributing: never Offering wins 1.16, and 1.50 with spoils.
- **So Choirs should keep their cards** (principle 5).

### 2. Free-riding without a harvest rule

| Never Offering (one player, 4p, ±0.1) | Win share |
|---|---|
| Current rule (for reference) | 0.28 |
| No rule | **1.11** |
| Turnover / turnover + carryover | 1.16 / 1.01 |
| Spoils to Offerers + turnover (turn order / reverse) | 1.50 / 1.56 |
| Spoils to Offerers, one each (turn order / reverse) | 1.11 / 1.03 |
| **Spoils to Offerers** (take turns until the Altar is empty) | **0.96** |
| Spoils to Offerers, reverse order | 0.90 |

**Only spoils to Offerers stops free-riding without a penalty.** Offering earns a share of the Altar, so skipping it stops paying. It is not punished, as under the harvest rule (0.28): it is a fair temptation. That is arguably what a public-goods game should feel like.

### 3. The packages

| 300 games; 4p, or 4p / 3p | Current | No rule | Spoils to the Choir side | **Spoils to Offerers** | Market | Turnover |
|---|---|---|---|---|---|---|
| Offer / Gather / Exalt (4p) | 60 / 24 / 16% | 29 / 39 / 32% | 27 / 46 / 27% | **42 / 35 / 23%** | 24 / 34 / 41% | 21 / 42 / 37% |
| Even use of the actions (max 1.58) | 1.36 | 1.57 | 1.54 | 1.54 | 1.55 | 1.53 |
| Close-call choices | 39% | 46% | 40% | 45% | 46% | 48% |
| Reader, 4p / 3p | 68 / 72% | 62 / 68% | 60 / 66% | **59 / 62%** | 65 / 70% | 60 / 67% |
| Side won / lost (4p) | 1.18 / 0.70 | 1.45 / 0.48 | 1.48 / 0.48 | **1.60 / 0.47** | 1.55 / 0.44 | 1.56 / 0.46 |
| Seats, 4p / 3p | 0.97–1.04 / 0.89–1.12 | 0.91–1.08 / 0.95–1.03 | 0.93–1.10 / 0.92–1.04 | 0.84–1.09 / 0.93–1.05 | 0.87–**1.24** / 0.90–1.18 | 0.88–1.07 / 0.91–1.06 |
| Days nobody wins | 21% | 30% | **38%** | 28% | 26% | 32% |
| Never Offering (exploit) | 0.28 | 1.11 | | **0.96** | | 1.16 |

What each package showed:
- **Spoils to the winning Choir side** pushes players into one-color Choirs to qualify (38–46%), more Days end with nobody winning (38%), and skill drops. With Choir paying 1, seats spread to 0.80–1.24; with 0, skill falls to 1.36×. **Rejected.**
- **The market** (Gather into hand, draw 1 a Day) makes rich choices and plenty of Exalting, but seats spread at 4 players (0.87–1.24), and hands run dry for whoever loses the Altar. With spoils added: seats 0.81–1.10 / 0.91–1.16. **Not now:** the most promising idea for later, if the card economy is reworked.
- **Carryover** does not reduce tied Days (still 30–32%) and unsettled token mixes (0.90–1.28). **Rejected.**
- **Choir paying 1** gives no gain (reader 68%, seats to 1.19). **Keep 2.**
- **The spoils draft order matters.** Taking turns until the Altar is empty, starting with the Day's first player, is fair on its own (0.84–1.09 / 0.93–1.05). With turnover or carryover it favored the first seat (1.17–1.26). In reverse order, or one spoil each in reverse, seats went to 0.71–1.50.

## Recommendation: spoils to the Offerers

> **Evening, after the Choirs score:** if a side won the Day, everyone who Offered that Day takes the Altar's cards and tokens, one at a time in turn order, until it is empty. Cards go into your hand (hold up to 5); tokens join your secret tokens. On a tied Day, tokens go to whoever holds the fewest, as now.
>
> **No offering, no harvest is gone:** your Choir scores every Day its color wins.

Confirmed at 1,200 games: *(see below)*.

Measured against `vision.md`:
- **1. Self versus side:** sharper and in balance. Offering gives up a card to push a side, and earns a share of the spoils only if *some* side wins. Never Offering is a fair temptation (0.96), no longer a winning one (1.11) or a doomed one (0.28). Always Offering loses badly (0.05). Your side matters a lot (1.60 against 0.47).
- **2. Uncertain allegiance:** the best of any package (reader 59–62%). With no forced Offer there is no forced hedge, and spoiled tokens move allegiance every Day.
- **3. The Altar as a contest:** the Altar becomes the prize. What is Offered tonight is what someone takes home, so every card placed is also a gift. This is the commodity Robert wanted, without replacing the draw.
- **4. Allies are rivals:** Offerers on both sides share the spoils, so your ally's card may end up in your rival's hand.
- **5. Checkable on the table:** yes. Everyone saw who Offered; the draft is in the open.

**Cost and complexity, honestly:**
- **Rules:** one rule replaces another (spoils for no offering, no harvest), the hand limit becomes 5, and the leftover rule now applies only on tied Days.
- **Time:** the Evening gains a short draft, about 5–6 spoils per player per game.
- **Days nobody wins:** 28%, against 21% under the current rule.
- **Choirs** still change color rarely (0.26 a game), though this no longer tells the table your side.

**Not recommended now:**
- Turnover: free-riding wins with it.
- Spoils by Choir claim.
- Carryover.
- Choir paying 1 or 0.
- The market: unfair seats; worth revisiting with a card-economy rework.

## What only people can show

- Whether the Evening draft feels like a reward or a chore.
- Whether people read "who Offered" as "who is on the winning side". The bots cannot act on reads, and Offerers of both sides share.
- Whether spoils feel like the rich getting richer. The bots show fair seats, and the spoils go to contributors, not to the leader.
