# The flow: fixes for balance and Choir changing

November 20, 2026. Robert adopted the flow as `rMajGH` (`the-flow.md`) and asked for fixes that make it more balanced and get players to change their Choirs more.

**Base:** the adopted core (engine defaults):
- spoils to the Offerers;
- Offer only from your Choir (face up) or a token (facedown);
- First Fruits facedown, a card or a token;
- Gather into the hand;
- only your majority color's tokens score.

**What it does less well** (1,200 games, `the-flow.md` Section 6):
- **Choirs change least of any version:** 0.17 lean changes a game per player, against 0.24 before. The only way into a Choir is now Exalt, and Choir Offers are rare (0.4 a game).
- **Balance:**
  - 3-player seats 0.89–1.10 (4 players: 0.95–1.08);
  - a lopsided deal is worth a little more (4p, 5–1 or more: 1.14);
  - the side you are dealt still matters (1.29 against 0.69);
  - fewer close Days (0.22) and wider margins (4.4).
- **A leak:** whoever gives a token as First Fruits draws no card, so the table sees who gave one.

## 1. The ideas

| Switch | Idea | Serves (`vision.md`) | Builds on / risks |
|---|---|---|---|
| `offerSwap` | **Offer a Choir card and put a card from your hand in its place** (a free Exalt) | 1 and 5: the Choir Offer becomes a trade, not only a loss; Robert's "Choir changing" | New. Risk: Choir Offers become cheap, so the face-up Offer is less of a sacrifice |
| `gatherTo: 'either'` | **A Gathered card goes into your hand or your Choir** | 3: the Altar feeds Choirs again | Gather into the Choir was the V45 rule; into the hand evened the seats. Risk: undoes that |
| `devotion: 1` | At the end, each Choir card of your majority color scores 1 | 2: now that sides move, a Choir has a reason to follow | Held in V45 (a 17th rule; made sides readable at 2). Risk: readability |
| `choirLimit: 3` | A Choir of 3 | Each card is a larger share of the lean | Kept at 4 in V45 (no gain) |
| `replacedToHand` | A card that leaves a full Choir to make room goes to your hand | Cheaper to change: the old card is not lost | Tested on spoils: no gain |
| `decay` | Turnover: after the Reaping, a full Choir loses its oldest card | Choirs must change | Rejected on V45 and on spoils: never Offering won (1.16, 1.50). Risk: same |
| `witherIdle` | On a Day you did not Offer, a full Choir loses its oldest card | Choirs change for those who sit out | Rejected on spoils. Risk: a penalty |
| `fruitsDraw: 'all'` | Everyone draws 1 after First Fruits, whatever they gave | 2: closes the leak; a token as First Fruits becomes a little cheaper | New |
| `tokensEach: 5, 7, 8` | Odd counts make a majority certain; more tokens make each one a smaller share | 2 and 9: fewer ties, less luck in the deal | 8 gave the fairest seats in V45 |
| `spoilsEach: 1` | Each Offerer takes one spoil; the rest go to whoever holds the fewest tokens (cards are discarded) | 9: the first in turn order no longer takes extra | Tested on spoils: no gain |

Results: `tools/sim/results/fix-r1.jsonl`.
