# Seat Fairness in the One-Round Game

Date: 2026-11-15. V35 Open Game, smart bots. A seat is named by where it sits relative to the Day 1 first player (seat 1 starts the game). Win ratio 1.00 is a fair share. Base and catch-up order are 12,000 games per player count; the other options are 6,000. With this many games, chance alone puts the spread between best and worst seat at about 0.03 to 0.05.

## Where the imbalance comes from

Acting later in a Day is worth more: the late players see more of the Altar before they choose. Per Day, turn positions earn 1.49, 1.56, 1.59 Glory at 3 players and 1.40, 1.48, 1.54, 1.54 at 4 players.

The first player marker passes left each Day. At 3 players, 6 Days divide evenly, so every seat takes every position twice and the game comes out nearly even. At 4 players, 6 Days do not divide by 4, so two seats are last twice and two seats are last once. The final Day also matters most, and whoever sits last on Day 6 has the best seat.

## Results

| Option | 3p win ratio by seat | Spread | 4p win ratio by seat | Spread |
|---|---|---|---|---|
| V35 (marker passes left) | 0.99, 1.04, 0.98 | 0.06 | 1.05, 0.90, 0.96, 1.10 | **0.20** |
| **Catch-up order** | 0.98, 1.03, 0.99 | 0.05 | 0.99, 0.98, 0.99, 1.05 | **0.07** |
| First player draws 1 extra card | 0.97, 1.01, 1.02 | 0.05 | 0.99, 1.02, 0.94, 1.05 | 0.11 |
| First-player draw + catch-up order | 0.97, 1.02, 1.01 | 0.05 | 1.01, 0.95, 1.01, 1.03 | 0.07 |
| First-player draw + catch-up on the final Day only | 1.01, 0.99, 1.00 | 0.03 | 0.93, 1.00, 1.04, 1.03 | 0.11 |
| Catch-up on the final Day only | 0.99, 0.94, 1.08 | 0.14 | 0.98, 1.00, 0.97, 1.06 | 0.09 |
| Starting Glory for the early final-Day seats | 0.97, 0.95, 1.08 | 0.13 | 0.93, 0.98, 1.09, 1.01 | 0.16 |

**Catch-up order** means that from Day 2 on, the player with the least Glory takes the last turn, and the player to their left goes first (ties go to whoever would have acted earliest). The advantage of acting last goes to whoever is behind, not to a seat. On the earlier V35 measurements it left everything else about the same: skill edge 2.47 vs 2.46, final-Day comebacks 20% vs 19%, winning Glory 12.2 vs 12.4. The Celestial spread at 3 players went from 0.12 to 0.15.

## Takeaway

At 3 players the seats are already even, within what chance alone would produce. At 4 players they are not, and catch-up order is the simplest fix that works: it cuts the 4-player spread from 0.20 to 0.07 and is still one rule for both player counts. Fixed compensation (starting Glory, an extra card) either overshoots or leaves the 4-player problem in place.

The bots may undervalue acting last. At a real table, where the last player can read everyone else, the seat effect is probably larger, so this is worth checking in playtests.
