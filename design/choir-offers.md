# Choir Offers: getting players to Offer from the Choir

November 20, 2026. Robert adopted turnover with Gather into the hand or the Choir (`flow-fixes.md`) "for now", and asked to fix the remaining problem: **players almost never Offer from their Choir** (0.3–0.4 a game each). He asked to test going back to Offering from the hand, a Glory reward for Offering, and anything else.

**Base:** the current core (engine defaults), rMajGH plus turnover and Gather into either:
- spoils to the Offerers;
- Offer only from your Choir (face up) or a token (facedown);
- First Fruits facedown, a card or a token;
- a Gathered card goes into your hand or your Choir;
- after the Reaping, a full Choir loses its oldest card;
- only your majority color's tokens score.

**Why it matters for the vision.** The face-up Choir Offer is where principle 1 is most visible: you give up your own engine, in public, for a side. If nobody makes it, the flow's "Offer from your Choir" is a rule that does nothing; the token does all the work.

**Why players do not do it** (the bots' arithmetic): a Choir card scores 2 Glory on each Day its color wins, for as long as it stays. A token pushes 2 and is easy to get back (spoils). A Choir card pushes 1–2 and costs tonight's Reaping and its later Days. So the token is almost always the cheaper Offer.

**A bot fix first.** The bots valued a Choir card as if it stayed to the end of the game, ignoring turnover, which made them Offer from the Choir too rarely. They now count only the Days it has left before turnover takes it (`choirLife` in `bots.ts`). Every result below uses the fixed bots, including the new base.

## 1. The ideas

| Switch | Idea | Serves (`vision.md`) | Builds on / risks |
|---|---|---|---|
| `offerFrom: 'hand'` | **Back to Offering from the hand** (facedown), or a token | 3: hidden Offers are what make the Altar readable, fakeable, doubtable | The flow study: with hand Offers, never Offering a token won (1.21–1.23), so tokens stopped moving. Turnover may change that |
| `offerFrom: 'both'` | Offer from the hand or the Choir, or a token | Choice | Rejected in the flow study (a token never Offered won). Retested on the new core |
| `offerTokens: false` | **Tokens cannot be Offered**; they reach the Altar only as First Fruits | 1: the only Offer is a card from your Choir, face up | Tokens move less; never Offering may win |
| `choirOfferGlory: 1, 2` | **Glory at once for Offering a Choir card** (Robert's idea) | 1: pays for the sacrifice | A patch (a reward); risk that Offering becomes automatic |
| `offerGlory: 1` | Glory at once for any Offer | 1 | Rewards token Offers equally: may not help the Choir |
| `choirOfferDraw: 1` | Draw a card for Offering a Choir card | 1 and 5: the sacrifice refills the hand, which feeds Exalt and First Fruits | Smaller than the swap (which broke the tokens) |
| `choirOfferReaps` | **The Offered card still scores for you tonight**, as if it were in your Choir | 1: the sacrifice costs only the future, not tonight | Makes the timing matter: Offer the card that is about to turn over |
| `choirOfferWeight: 2` | A Choir card counts double on the Altar | 3: a Choir Offer can swing a Day | Rejected in the flow study (still rare: 0.4–0.6). Retested with turnover |
| `tokenWeight: 1` | Tokens count 1 instead of 2 | 1: the card becomes the stronger push | Tokens matter less on the Altar |
| `choirSpoils: 'first'`, `'only'` | Spoils go first, or only, to whoever Offered a Choir card | 3: the Choir Offer buys the Altar | `'only'`: a token Offer earns nothing |
| `oldestFree` | **After your action, a full Choir may also Offer its oldest card** (the one turnover will take tonight) | 1 and 6: turnover's loss becomes a choice: let the card go, or give it to a side, in public | New. Risk: an extra Offer every Day makes Days lopsided |

Results: `tools/sim/results/choir-r1.jsonl` (300 games a mode), exploits in `results/choir-exploits.jsonl`, which add two strategies: never Offer a Choir card (`noChoir`) and always Offer a Choir card when Offering (`choirFirst`).
