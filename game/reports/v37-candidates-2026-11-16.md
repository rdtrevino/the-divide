# V37 candidates: the five strongest and five weakest Host cards (November 16, 2026)

**Outcome:** Robert adopted the recommended set as V37, except Michael, which is still open. See `v37-balance-2026-11-16.md`. The engine variants named below were removed when the changes became the standard rules, apart from the Michael options.

Every variant below was measured on the same 20,000 seeds as the V36 baseline (3 and 4 players alternating, Open Game, race to 10). Win ratio counts players who finished with the card face up in their Choir; 1.00 is fair. With 1,400 to 4,000 sightings per card, treat differences under about 0.06 as noise. Raw numbers: `v37-candidates-2026-11-16.json`. Tool: `tools/sim/ab2.ts`. All variants are gated in the engine, so the base game is unchanged.

Context: Light and Dark cards average 1.05; Neutral cards average 0.82, because they add nothing to Alignment scoring. All five weakest cards are Neutral.

## Recommended set

| Card | Variant | Alone | All ten together |
|---|---|---|---|
| Leviathan | lev-nogain | 1.44 to 1.12 | 1.12 |
| Michael | mic-free | 1.42 to 1.14 | 1.19 |
| Tree of Life | tol-top1 | 1.35 to 1.10 | 1.08 |
| Envy | envy-gap3 | 1.30 to 1.10 | 1.06 |
| Tribute | tribute-pot | 1.29 to 1.07 | 1.05 |
| Watchers | watchers-take | 0.66 to 0.86 | 0.94 |
| Forger | forger-any | 0.67 to 0.81 | 0.86 |
| Apple | apple-plus1 | 0.67 to 0.82 | 1.02 |
| Council | council-toll | 0.67 to 0.81 | 0.87 |
| Mirage | mirage-draw | 0.69 to 0.74 | 0.74 |

Combined: average length 6.44 to 6.27 Days; card win ratio standard deviation 0.190 to 0.156. New extremes: Uriel 1.30, Scapegoat 1.30, Mammon 1.28, Beelzebub 1.26; Vessel 0.66, Urim 0.69, Morning Star 0.73.

## All variants tested

| Variant | Card | Result |
|---|---|---|
| lev-nogain | Leviathan | 1.12 |
| lev-2 (another player loses 2+) | Leviathan | 1.18 |
| mic-free (restore is free) | Michael | 1.14 |
| mic-reaping (flips back after the Reaping) | Michael | 1.19 |
| tol-top1 | Tree of Life | 1.10 |
| tol-top3 | Tree of Life | 1.27 |
| tol-discard2 | Tree of Life | 1.29 |
| tol-top3+tol-discard2 | Tree of Life | 1.25 |
| envy-gap2 | Envy | 1.16 |
| envy-gap3 | Envy | 1.10 |
| envy-card (discard a card to use) | Envy | 1.36 |
| tribute-pot | Tribute | 1.07 |
| watchers-take | Watchers | 0.86 |
| forger-any | Forger | 0.81 |
| apple-tide (Tide flip condition) | Apple | 0.72 |
| apple-any (any change of color) | Apple | 0.70 |
| apple-plus1 | Apple | 0.82 |
| apple-nocap (Tide flip, doubled past the cap) | Apple | 0.99 alone, 1.19 combined |
| council-open (yes voters swap, no unanimity) | Council | 0.69 |
| council-self (caller swaps another card) | Council | 0.71 |
| council-toll | Council | 0.81 |
| mirage-decoy (second facedown card) | Mirage | 0.70 |
| mirage-swap (swap an Offering before reveal) | Mirage | 0.69 |
| mirage-draw | Mirage | 0.74 |
| mirage-swap+mirage-draw | Mirage | 0.76 |

Bot caveats: the bots value every card by its Offering value, never by its ability, so they replace Neutral cards readily. They order Watchers' cards at random, and they cannot bluff, which is Mirage's whole purpose.
