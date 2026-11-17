# Where The Divide stands, and what would make it great

Date: 2026-11-17, at V40. Prompted by Robert's game: a 3-Day win with 15 Glory that felt easy, with a lot to take in for a game that lasted a few minutes.

## What already works

- **A core nobody else has.** One shared Altar sets a Tide that scores everyone's public Choir. Your lean is public, your votes are hidden, and First Fruits forces one honest card a Day. It is a tug-of-war you play with bluffs.
- **A small turn.** Three actions, one choice each turn.
- **Theme and look.** The names, art and Day structure (Morning, Noon, Evening) carry the game.

## What holds it back

Measured on 6,000 bot games per player count unless noted.

### 1. Too few decisions for what you have to learn

| | 3 players | 4 players |
|---|---|---|
| Actions per player per game | **6.4** | **6.2** |
| Games over by Day 4 | 25% | 26% |
| Games over by Day 3 | 9% | 9% |

To play you must learn 66 different Host cards, 9 Celestials, 17 Events and five timing windows, then you get about six actions. That ratio is the feeling Robert described. A game with this much to learn needs 15 or more meaningful turns to pay it back; otherwise it should shed rules and become a 20-minute game.

### 2. Glory is easy and barely contested

- A good Day pays up to **4 Glory** (3 from the Reaping, 1 from the Offer), so 10 Glory is three good Days. Robert's game: +3 at every Reaping, +1 every Offer, +1 Prophecy twice, +2 endgame bonus = 15 by Day 3.
- The Reaping pays your full lean however close the Tide was. Winning the Tide by 1 pays the same as winning it by 6, so a narrow contest is worth no more than a landslide.
- Where the winner's Glory comes from: Reaping 7.7, Offers 4.2, endgame bonus 2.3, card abilities 1.8.

### 3. When everyone leans the same way, nobody fights

The Tide is shared: everyone leaning with it scores. In Robert's game, **every player gained at all three Reapings**: all four Choirs leaned the same way, so the Tide was never contested and the game became a race of who had the biggest lean. Among bots this happens in 13% to 22% of Reapings, but a person can steer into it on purpose, and the bots never punish it.

### 4. Early leads snowball

The sole leader after Day 3 wins 66% of 3-player games (chance is 33%) and 59% of 4-player games (chance is 25%).

### 5. The bots are soft opponents

They don't bluff, they read facedown cards crudely, and they never gang up on the leader's color. Online, a person playing bots will usually win easily, so games against bots understate how hard the game is, and overstate how easy Glory is.

## Measured fixes

3,000 games per line; 3 players, with 4 players in brackets. "Actions" is actions per player per game. Spread is how far the Celestials are from even (lower is fairer).

| Rules | Actions | Days | Day 3 leader wins | Skill edge | Celestial spread |
|---|---|---|---|---|---|
| Current (V40) | 6.2 | 6.2 | 66% (59%) | 2.69 (3.42) | 0.129 (0.102) |
| Race to 15 | 9.7 | 9.7 | 56% (45%) | 2.87 (3.71) | 0.176 (0.152) |
| Reaping capped at 2 | 7.2 | 7.2 | 63% (54%) | 2.70 (3.41) | 0.132 (0.150) |
| **Reaping capped at the Tide's margin** | 7.5 | 7.5 | 60% (55%) | 2.71 (3.43) | **0.072 (0.076)** |
| Offers pay only if the card matches the Tide | 7.7 | 7.7 | 61% (52%) | 2.76 (3.51) | 0.135 (0.170) |
| Two turns each at Noon | 9.3 | 4.7 | 75% (70%) | 2.81 (3.62) | 0.121 (0.102) |
| Two turns + race to 15 | 14.5 | 7.3 | 63% (53%) | 2.95 (3.86) | 0.108 (0.103) |
| Margin cap + race to 15 | 11.9 | 11.9 | 52% (45%) | 2.88 (3.75) | 0.092 (0.089) |
| **Two turns + margin cap + race to 15** | **15.9** | **8.0** | 61% (51%) | **2.94 (3.86)** | **0.086 (0.064)** |
| Two turns + margin cap + Tide-matched Offers | 20.4 | 10.2 | 58% (47%) | 2.91 (3.75) | 0.087 (0.143) |

Two turns at Noon alone makes games shorter (more Glory per Day) and snowballing worse, so it only works together with a higher target or less Glory per Day.

## Recommendations

**The fork to decide first:** is The Divide a 45-minute strategy game or a 20-minute filler? With today's card pool and timing rules it is the first, so it needs more turns. The alternative is a much simpler game: fewer card types, no Events, no Celestials.

Assuming the 45-minute game:

1. **"The Long Day": two turns each at Noon, the Reaping gains or loses at most the Tide's margin, race to 15.** About 16 actions per player in 8 Days, the fairest Celestials of anything measured, the highest skill edge, and less snowballing (61% (51%) against 66% (59%)). The margin cap also makes every Altar card count: a Tide won by 1 pays 1.
2. **Make herding costly (needs people to test; bots can't judge it).** Options, simplest first:
   - *Lone Faithful:* if yours is the only Choir leaning with the Tide, gain 1 more.
   - *Shared spoils:* Choirs leaning with the Tide split the margin between them.
   - *Crowding:* each Choir that gains loses 1 of its gain for every other Choir that gains (minimum 1).
3. **A first-game setup.** No Events for the first game, and a 30-card starter Host deck of the plainest cards (no reactions, no timing windows), so new players learn the Altar and the Tide before the exceptions.
4. **Better bots.** Contest the leader's color, hold cards back, and Offer against their own lean sometimes. Online play is where most playtesting happens now, so this is the cheapest way to make the game feel real.
5. **Let the site test variants.** An option in the lobby for "The Long Day" (and later a herding rule) so friends can play both and the Stats page can compare them.

## Follow-up: two turns, a race to 15, no Seed (same day)

Robert rejected the margin cap and liked two turns at Noon with a race to 15, and proposed removing the Seed, since First Fruits already starts the Altar. 3,000 games per line; 3 players, with 4 players in brackets.

| Rules | Actions | Days | Day 3 leader wins | Winner's Glory from Offers | Celestial spread |
|---|---|---|---|---|---|
| Current (V40) | 6.2 | 6.2 | 66% (59%) | about 4 of 13 | 0.129 (0.102) |
| Two turns + race to 15 | 14.5 | 7.3 | 63% (53%) | about 10 of 18 | 0.108 (0.103) |
| Two turns + race to 15 + no Seed | 14.4 | 7.2 | 63% (54%) | about 10 of 18 | 0.106 (0.099) |
| Two turns + no Seed + Offers pay only if the card matches the Tide (race to 10) | 15.2 | 7.6 | 61% (53%) | about 4 of 13 | 0.124 (0.136) |
| …the same, race to 12 | 19.2 | 9.6 | 57% (47%) | about 5 of 15 | 0.126 (0.167) |
| Two turns + race to 15 + no Seed + shared spoils | 18.5 | 9.2 | 60% (50%) | | 0.103 (0.133) |
| Two turns + race to 15 + no Seed + lone bonus | 13.9 | 6.9 | 64% (55%) | | 0.105 (0.114) |

- **The Seed** can go: removing it changes nothing measurable.
- **Two turns with flat 1-Glory Offers** makes Offers more than half of the winner's Glory, so the Tide matters less than it does now.
- **Tide-matched Offers** keep the Tide central at the same length (15 actions, 7.6 Days). They also give hidden allegiance a payoff: you can lean Light in public and bet Dark in secret.
- **Shared spoils** ("alone you gain up to 3, with one partner up to 2 each, with more 1 each") and the **lone bonus** (+1 if yours is the only Choir with the Tide) reward small winning coalitions. Bots don't react to them, so these numbers only show length and balance; whether they stop herding needs people.
