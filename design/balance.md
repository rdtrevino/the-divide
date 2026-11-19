# Balance: the current rules, measured

Bot measurements of the **V45** rules (the Tide track, allegiance tokens, every card Light or Dark), from `game/tools/sim`: 20,000 all-bot games, half at 3 players and half at 4, half Base and half Advanced (`baseline.ts`, which also writes the Stats page's bot column). Win ratio is wins over the wins expected by chance for a player holding the card in their final Choir: 1.00 is fair, and the target is 0.75 to 1.25. Bots cannot bluff, negotiate or read tokens, so treat these as a floor check, not a verdict; the strong-bot lab (`game/tools/lab`) measures the core itself (`the-game-now.md`).

To re-measure after a rules change: `npx tsx baseline.ts 20000` and `npx tsx exp45.ts 16000` in `game/tools/sim`.

## Summary (November 19, 2026)

- **Every Host card** is within 0.75 to 1.25: from 0.75 (Mammon) to 1.25 (Jubilee). On other seeds (`exp45.ts`, 16,000 games) Mammon dipped to 0.72: watch it in play.
- **Every Celestial** is within 0.86 to 1.23: the Whisper is highest, the Cantor lowest.
- **Days nobody wins:** 20% (they were 29% with 23 Neutral cards). Offers are about 33% of the heuristic bots' actions and they Offer about 1 token a game; the strong lab bots Offer about 50% of the time and about 3 tokens.

## Celestials

| Celestial | Win ratio |
|---|---|
| The Tempest | 0.95 |
| The Oracle | 0.91 |
| The Eclipse | 1.07 |
| The Cantor | 0.86 |
| The Arbiter | 1.00 |
| The Patron | 0.95 |
| The Echo | 0.96 |
| The Dominion | 1.06 |
| The Whisper | 1.23 |

## Host cards

| # | Card | Color | Win ratio |
|---|---|---|---|
| 1 | Michael | Light | 1.02 |
| 2 | Wisdom | Light | 1.01 |
| 3 | Gabriel | Light | 1.02 |
| 4 | Providence | Light | 0.83 |
| 5 | Confession | Light | 0.95 |
| 6 | Tree of Life | Light | 1.17 |
| 7 | Free Will | Light | 0.98 |
| 8 | Seraphim | Light | 1.00 |
| 9 | Hymn | Light | 0.93 |
| 10 | Raphael | Light | 0.99 |
| 11 | Sanctuary | Light | 1.01 |
| 12 | Uriel | Light | 1.16 |
| 13 | Martyr | Light | 1.15 |
| 14 | Covenant | Light | 1.01 |
| 15 | Tribute | Light | 1.04 |
| 16 | Mercy | Light | 1.21 |
| 17 | Revelation | Light | 0.94 |
| 18 | Cherubim | Light | 0.97 |
| 19 | Morning Star | Light | 0.98 |
| 20 | Absolution | Light | 0.93 |
| 21 | Knowledge | Light | 0.95 |
| 22 | Deliverance | Light | 0.97 |
| 23 | Remnant | Light | 0.94 |
| 24 | Vessel | Light | 1.03 |
| 25 | Eternity | Light | 1.06 |
| 26 | Ordeal | Dark | 0.75 |
| 27 | Raguel | Light | 1.12 |
| 28 | Twilight | Light | 1.00 |
| 29 | Zealot | Dark | 1.07 |
| 30 | Stillness | Light | 1.08 |
| 31 | Acolyte | Variable | 0.99 |
| 32 | Nephilim | Dark | 0.95 |
| 33 | Firmament | Light | 1.16 |
| 34 | Moderation | Light | 0.99 |
| 35 | Fig Leaves | Dark | 0.86 |
| 36 | Flaming Sword | Light | 1.06 |
| 37 | Outcast | Dark | 0.97 |
| 38 | Heresy | Dark | 0.93 |
| 39 | Council | Light | 1.04 |
| 40 | Mirage | Dark | 0.89 |
| 41 | Veil | Dark | 0.99 |
| 42 | Prophecy | Light | 1.02 |
| 43 | Watchers | Dark | 1.03 |
| 44 | Apple | Dark | 1.02 |
| 45 | Forger | Dark | 0.84 |
| 46 | Jubilee | Light | 1.25 |
| 47 | Anathema | Dark | 0.99 |
| 48 | Serpent | Dark | 0.89 |
| 49 | Favor | Dark | 1.10 |
| 50 | Temptation | Dark | 0.80 |
| 51 | Legion | Dark | 0.94 |
| 52 | Lamentation | Dark | 0.92 |
| 53 | Azazel | Dark | 0.88 |
| 54 | Moloch | Dark | 0.91 |
| 55 | Beelzebub | Dark | 0.91 |
| 56 | Leviathan | Dark | 0.99 |
| 57 | Hubris | Dark | 1.08 |
| 58 | Belial | Dark | 0.88 |
| 59 | Mammon | Dark | 0.75 |
| 60 | Envy | Dark | 0.97 |
| 61 | Lilith | Dark | 1.07 |
| 62 | Parasite | Dark | 0.88 |
| 63 | Winnowing | Dark | 0.90 |
| 64 | Silence | Dark | 0.96 |
| 65 | Scapegoat | Dark | 1.11 |
| 66 | Defiance | Dark | 0.83 |
| 67 | Bounty | Dark | 0.85 |
| 68 | Abaddon | Dark | 1.18 |
| 69 | Snare | Dark | 0.83 |
