# Balance: the current rules, measured

Bot measurements of the **V45** rules (the Tide track, allegiance tokens, every card Light or Dark, 7 Days with Judgment Day, no offering, no harvest), from `game/tools/sim`: 20,000 all-bot games, half at 3 players and half at 4, half Base and half Advanced (`baseline.ts`, which also writes the Stats page's bot column). Win ratio is wins over the wins expected by chance for a player holding the card in their final Choir: 1.00 is fair, and the target is 0.75 to 1.25. Bots cannot bluff, negotiate or read tokens, so treat these as a floor check, not a verdict; the strong-bot lab (`game/tools/lab`) measures the core itself (`the-game-now.md`).

To re-measure after a rules change: `npx tsx baseline.ts 20000` and `npx tsx exp45.ts 16000` in `game/tools/sim`.

## Summary (November 19, 2026)

- **Final-Choir win ratio** (the Stats page's measure): every Host card is within 0.75 to 1.25 except **Michael (1.35)**, from 0.78 (Ordeal). Michael is spent when used, so it is rarely in a final Choir: this measure cannot judge one-use cards. On other seeds (`exp45.ts`, 12,000 games) no card is out of range.
- **Every Celestial** is within 0.79 to 1.16: the Patron lowest, the Whisper and the Eclipse highest.
- **A fairer measure for every role** is `game/tools/sim/card-value.ts`: what a card's ability is worth against a plain card of its color, in paired games, with how the card was used. Its full run with a strong player is the next step.

## Celestials

| Celestial | Win ratio |
|---|---|
| The Tempest | 1.09 |
| The Oracle | 0.91 |
| The Eclipse | 1.16 |
| The Cantor | 0.90 |
| The Arbiter | 1.03 |
| The Patron | 0.79 |
| The Echo | 0.97 |
| The Dominion | 1.00 |
| The Whisper | 1.15 |

## Host cards

| # | Card | Color | Win ratio |
|---|---|---|---|
| 1 | Michael | Light | 1.35 |
| 2 | Wisdom | Light | 1.00 |
| 3 | Gabriel | Light | 1.21 |
| 4 | Providence | Light | 0.79 |
| 5 | Confession | Light | 1.03 |
| 6 | Tree of Life | Light | 1.13 |
| 7 | Free Will | Light | 1.00 |
| 8 | Seraphim | Light | 0.91 |
| 9 | Hymn | Light | 0.89 |
| 10 | Raphael | Light | 0.96 |
| 11 | Sanctuary | Light | 1.01 |
| 12 | Uriel | Light | 1.03 |
| 13 | Martyr | Light | 0.93 |
| 14 | Covenant | Light | 0.90 |
| 15 | Tribute | Light | 1.09 |
| 16 | Mercy | Light | 1.08 |
| 17 | Revelation | Light | 0.86 |
| 18 | Cherubim | Light | 0.94 |
| 19 | Morning Star | Light | 0.89 |
| 20 | Absolution | Light | 0.96 |
| 21 | Knowledge | Light | 0.87 |
| 22 | Deliverance | Light | 1.00 |
| 23 | Remnant | Light | 0.91 |
| 24 | Vessel | Light | 1.05 |
| 25 | Eternity | Light | 1.09 |
| 26 | Ordeal | Dark | 0.78 |
| 27 | Raguel | Light | 1.15 |
| 28 | Twilight | Light | 1.02 |
| 29 | Zealot | Dark | 1.08 |
| 30 | Stillness | Light | 1.03 |
| 31 | Acolyte | Variable | 0.97 |
| 32 | Nephilim | Dark | 0.93 |
| 33 | Firmament | Light | 1.15 |
| 34 | Moderation | Light | 1.13 |
| 35 | Fig Leaves | Dark | 0.97 |
| 36 | Flaming Sword | Light | 1.01 |
| 37 | Outcast | Dark | 1.08 |
| 38 | Heresy | Dark | 0.97 |
| 39 | Council | Light | 0.99 |
| 40 | Mirage | Dark | 0.87 |
| 41 | Veil | Dark | 1.03 |
| 42 | Prophecy | Light | 0.99 |
| 43 | Watchers | Dark | 1.04 |
| 44 | Apple | Dark | 1.23 |
| 45 | Forger | Dark | 0.88 |
| 46 | Jubilee | Light | 1.22 |
| 47 | Anathema | Dark | 0.90 |
| 48 | Serpent | Dark | 0.95 |
| 49 | Favor | Dark | 1.00 |
| 50 | Temptation | Dark | 1.03 |
| 51 | Legion | Dark | 0.87 |
| 52 | Lamentation | Dark | 0.87 |
| 53 | Azazel | Dark | 0.90 |
| 54 | Moloch | Dark | 1.01 |
| 55 | Beelzebub | Dark | 0.88 |
| 56 | Leviathan | Dark | 1.13 |
| 57 | Hubris | Dark | 1.03 |
| 58 | Belial | Dark | 0.92 |
| 59 | Mammon | Dark | 0.85 |
| 60 | Envy | Dark | 0.96 |
| 61 | Lilith | Dark | 0.96 |
| 62 | Parasite | Dark | 0.89 |
| 63 | Winnowing | Dark | 0.90 |
| 64 | Silence | Dark | 0.93 |
| 65 | Scapegoat | Dark | 0.95 |
| 66 | Defiance | Dark | 0.90 |
| 67 | Bounty | Dark | 0.88 |
| 68 | Abaddon | Dark | 1.07 |
| 69 | Snare | Dark | 0.88 |
