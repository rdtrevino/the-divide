# The Divide from the ground up: finding the core

November 18, 2026. A proposal, not adopted. Starting from `vision.md` instead of the current rules, this tests whole cores (not patches) that put back the heart of the original design at 3 and 4 players: every card is a choice between helping yourself and helping a side you can never be sure is yours. Every number comes from `game/tools/lab` (Rounds 22 to 30, files in `results/`), played by Monte Carlo bots; what they cannot show is listed at the end.

## The cores tested

| Core | Inspired by | Your side | Self vs side |
|---|---|---|---|
| **Dominance** | Pax Pamir | Public: your Choir's lean | A side ahead by 2+ pays its Choirs by rank of strength; otherwise every Choir is paid by strength |
| **Collection plate** | Your "the Tide pays the few" | Whoever secretly Offered with you today | Winning Offers share a pot; more co-bettors means a likelier win but a smaller share |
| **Fates** | A War of Whispers, Secrets | A secret Fate from a bag | Choir cards pay you on matching Days; your Fate pays at the end |
| **Fates, multiplied** | (fix for hedging) | A secret Fate | Only your Fate's Days score: 1, plus 1 per Choir card of your Fate's side |
| **Oaths** | Doppelkopf, Mascarade | **The Oath card you hold**: it can be Offered, stolen and lost | Same as multiplied Fates |

Each with variants: the Forsaken in the bag; the Miser's Rule (hard: the fewest Offers cannot win; soft: they lose 3 Glory); wagers; payout ladders.

## Against the vision's test

| | Dominance | Collection plate | Fates | Fates, multiplied (+ Forsaken 2-2-2, soft Miser) | **Oaths (+ soft Miser)** |
|---|---|---|---|---|---|
| **1. Self vs side**: Offering costs you and helps your side | Partly: free-riders do not outrank contributors (top 0.37 vs second 0.45 Offers a Day) | **No**: every Offer is a private bet | **No**: players hedge (Choir pays on the other side's Days) | **Yes** | **Yes**, and Offering your Oath is the biggest vote and the biggest risk |
| Gathering the enemy's card is a sacrifice | weak | weak | no (it is a hedge) | **yes**: 67–71% of Gathers | **yes** |
| **2. Uncertain allegiance**: Choir reveals your side | always (public) | n/a (teams last one Day) | 38–50% (tells nothing) | 61–66% with the Forsaken | **65–67%**, with no Forsaken needed: allegiance moves |
| **3. Altar as contest** | yes | yes | yes | yes | **yes**: the Altar holds loyalties (Oaths Offered 1.0–2.2 a game, stolen 0.3–1.3) |
| **4. Allies are rivals** | yes (rank) | yes (shares) | weakly | yes: a bigger Choir takes more from the same winning Day | yes |
| **5. Checkable on the table** | yes | yes | needs hidden scoring | needs hidden scoring | needs hidden scoring (see below) |
| Skill (strong player among heuristic players) | 1.95–2.12 | 1.90–2.15 | 1.49–2.65 | 1.38 | **2.12–2.29** |
| Snowball (Day-3 leader wins, 4p; chance 25%) | **53–63%** | 47–56% | 47–63% | hidden scores | hidden scores |
| Balance by allegiance (4p) | — | — | — | 0.94–1.06 | **0.95–1.07** |

**Ruled out:** Dominance (public teams, the worst snowballing), the collection plate (makes the public good private), and plain Fates (hedging empties the dilemma).

**Finalists:** multiplied Fates with the Forsaken, and **Oaths**. Both pass every question but the fifth; Oaths pass more strongly and measure the most skill of anything in the study.

## What each piece did

- **Paying only on your side's Days (multiplied)** removes hedging. Without it, players keep a Choir of the *other* side so they score either way, and allegiance stops mattering (Round 23).
- **The Forsaken** (2 Light, 2 Dark, 2 Forsaken in the bag; the Forsaken scores narrow Days, multiplied by Neutral Choir cards) blurs the read from 85% to 61–68%. In a 3-3-1 bag without the Miser's Rule it is too strong (win ratio 2.08); with the soft Miser's Rule every Fate is within 0.89–1.08 at 3 and 4 players (Rounds 26, 27, 29).
- **The Miser's Rule** answers free-riding, which the lab measured plainly: as a pure public good, Offers fall to about 22% of actions, and a player who never Offers still earns 0.59 of a fair share.
  - **Hard** (the fewest Offers cannot win): contribution doubles, but it decides 15–25% of games by itself, and simply Offering every turn becomes a fair strategy (0.91). Too blunt.
  - **Soft** (the fewest Offers lose 3 Glory): contribution still doubles (46–54% of actions). Exploit results are in "Exploit checks" below.
- **Oaths that can be Exalted** fail: strong players lock their Oath in their Choir at once (3 times a game), and the Choir reveals their side 88–90% of the time (Round 28). **Oaths that cannot be Exalted** come alive: Offered and stolen, with the read at 65–67% (Round 29).

## The proposed core: Oaths

**Components.** Host cards (plain cards plus a Pantheon of abilities, as in `rework-proposal.md`), 3 Light Oaths (Light +2) and 3 Dark Oaths (Dark +2), Glory.

**Setup.** Each player is dealt 1 Oath at random, face down, into a hand of 3; the other Oaths are set aside unseen, so nobody knows how many of each side are in play. Each player starts with a Choir of 2 face-up cards (room for 4).

**Your allegiance** is the side of the Oath you hold (in hand). Holding none, or one of each, makes you Forsaken for that Day.

**Each Day:**

1. **Morning.** First Fruits: everyone reveals a card from hand at once onto the Altar, then draws 1. (An Oath can be played here; it is then face up and anyone can take it.)
2. **Noon.** One action each:
   - **Offer** a card facedown. An Oath counts +2 for its side.
   - **Gather** a card from the Altar into your Choir. **An Oath you Gather goes into your hand instead**: you have taken that allegiance, and a facedown card you Gather blind may turn out to be someone's Oath.
   - **Exalt** a card from your hand into your Choir. **Oaths cannot be Exalted.**
3. **Evening.**
   - Reveal; the heavier side is the Tide.
   - **Every player whose allegiance matches the Tide scores 1, plus 1 for each card of that side in their Choir.** The Forsaken score on a narrow Day (the Tide won by 1, or tied): 1, plus 1 for each Neutral card in their Choir.
   - **Oaths left on the Altar go back to whoever placed them.**
   - Clear the Altar; draw to 3.

**End.** After 7 Days (about 30 minutes at 4 players). The player who Offered the fewest cards loses 3 Glory (the soft Miser's Rule). Most Glory wins.

**Why it is the vision:**
- The shared middle literally holds people's loyalties.
- Offering your Oath is the strongest thing you can do for your side and the most dangerous thing you can do to yourself.
- Gathering is double-edged three ways: your own color (strength for you, weakness for the side), the enemy's color (the reverse), or a facedown card that might be someone's Oath.
- Your side changes when your Oath does, so the Turn from the original design is built into the core instead of being a separate action.

## The open problem: secret scoring at a real table

The lab scores allegiance in secret and reveals it at the end. At a table, if players take their Glory openly each Evening, everyone sees who scored on a Light Day and the secret is gone by Day 2. Options, simplest first:

1. **A sealed ledger** (as in *Kremlin*): each Evening every player privately notes on a pad the side of the Oath in their hand. At the end, ledgers are scored against the public record of each Day's Tide and each Choir (Choirs are public, so the record is a short row per Day). Honor system, like hidden roles in any social deduction game.
2. **Final allegiance only** (as in *Heimlich & Co.*): keep the public row per Day; at the end, each player scores every Day whose Tide matches the Oath they hold *at the end*. One reveal, no ledger, and a dramatic last Day, but late theft becomes very strong. Needs testing.
3. **Online first:** the server keeps the score hidden, which is exactly what the lab models. The site can test the core before the tabletop question is settled.

## Exploit checks

One player with a fixed plan among Monte Carlo players (win ratio; 1.00 is a fair share; Rounds 27, 29 and 30):

| Strategy | Oaths + soft Miser | Fates (2-2-2 bag) + soft Miser | Oaths, no Miser | Multiplied Fates, hard Miser |
|---|---|---|---|---|
| Always Offer (pure contributor) | **0.29** | 0.51 | 0.12 | 0.91 |
| Never Offer (pure free-rider) | **0.21** | 0.28 | 0.59 | 0.00 |
| Never change sides | 0.50 | — | 0.38 | — |
| Random | 0.12 | — | — | — |

With the soft Miser's Rule, neither giving everything nor keeping everything works: the decision is how much to give, and when. Without it, free-riding is the best simple plan (0.59); with the hard version, contributing is (0.91).

## What the simulations cannot show

The bots do not talk. These need people:

- Whether stealing an Oath feels thrilling or cruel, and whether victims can win back their side.
- Whether players bluff with their Offers ("that was my Oath, take it if you dare") or never risk it.
- Whether the Miser's Rule feels like fair civic duty or a tax.
- How fast a real table reads allegiance from behavior, which the bots do not try to do.
- How the Pantheon's card abilities fit; every test here used plain cards, so the engine layer still has to be rebuilt on this core.

## Next

1. Test a 3-player Oath bag and the "final allegiance only" scoring.
2. Rebuild the engine layer on this core: which of the 69 abilities serve self vs side when allegiance is secret and movable.
3. A print-and-play and an online table for people to try it.
