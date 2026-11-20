# Robert's flow: Offer from the Choir, facedown First Fruits, spoils, and how to score

November 20, 2026. Robert's idea, which combines many things tested before:

> The First Fruits are placed downward. You can place a card or a token. You can only Offer from your Choir: this is where it becomes very costly to Offer, and it introduces Choir changing. Offering also becomes more costly because it would be face up, or you can still Offer a token facedown. You could also Gather a card from the Altar (face up or facedown) and play it to your Choir (or maybe to your hand). Or you can Exalt from your hand to your Choir. There is never a card that goes from your hand to the Altar (unless that's its ability). Spoils go back to the people who Offered that Day, one by one by some metric (who went first, lowest score…). The Altar scoring: 1 or 2 for every card of the winning alignment, the difference of your Choir, or 3/1 by whether you match alone or with others. At the end, the bonus of each token × the Days its side won, and variations of it.
>
> Test as many as you can and get back to me on the best combination. (The Turn as a card ability: later, once the core is solid.)

**A study and a recommendation, not adopted.** Nothing in the rules, the site or the cards has changed.

## 1. The pieces

Base for everything: **spoils to the Offerers** (Robert's assumed direction, `spoils-and-economy.md`): no harvest rule; after a won Day, everyone who Offered takes the Altar's cards (into hand, limit 5) and tokens, one at a time in turn order.

| # | Piece | Serves (`vision.md`) | Builds on | Risks repeating |
|---|---|---|---|---|
| A | **Offer only from your Choir**, face up (the card is public: everyone saw it leave) | 1. Self vs side made literal: every push costs your own engine. 5. The engine plugs into the tension. Choirs change | Offer from the Choir *as an option* (`spoils-and-economy.md` §4): Choirs barely moved (0.29 flips), token Offers vanished | 2 and 3: a face-up, attributable Offer is "watched, not trusted"; the facedown Offer was adopted (V35) so a contribution could be doubted. And any rule that rewards keeping your engine over contributing let never Offering win (turnover 1.16, withering 1.46) |
| B | **First Fruits facedown** until the Evening reveal | 2, 3: the whole Altar is hidden while people act | Pandemonium (an Event that already does this) | 4: First Fruits face up are "the one honest card, the read that starts every bluff". Facedown, Gathering becomes partly blind: luck, not reads |
| C | **A token may be given as First Fruits** (anonymous) | 2: tokens move more, so allegiance could shift (the root cause found last time) | Tokens as First Fruits in the lab (`tokens-and-offering.md` §2) | Cheaper token play made uneven token mixes matter more (4p mixes 0.81–1.14) |
| D | **Gather into the Choir or into the hand** | 3: the Altar as a commodity | The market (`spoils-and-economy.md`): Gathering into hand with 1 draw a Day spread seats (0.87–1.24) | With a full refill instead, unknown |
| E | **Exalt** hand to Choir | 5 | unchanged | |
| F | **Spoils to that Day's Offerers**, in an order: turn order, reverse, lowest Glory first | 1: contributing earns a share | Spoils to Offerers stopped free-riding (0.96) in turn order; reverse spread seats (0.71–1.50 with turnover) | Lowest Glory first is a catch-up, which the vision calls a last resort |
| G | **The Reaping**: 2 or 1 a card (now 2); the difference of your Choir (`net`); 3 alone / 1 shared by Choir lean (`crowd`) | `net`: 1 and 2 (a mixed Choir earns nothing, so no hedge). `crowd`: 4 (allies are rivals) | Choir pays 1: no gain (`core-validation.md`). V44's Reaping by lean | `crowd` is V44's coalition crowding, listed in the vision as a patch; it caused herding |
| H | **The end score**: each token × the Days its side won (now); only your majority color (`majority`); only the side that won more Days (`winner`); (your Light − Dark tokens) × (Light − Dark Days) (`net`, can sink) | `majority`: 2, a single side that can change when tokens move. `winner`: the original "faction victory makes you eligible". `net`: the vision's "hidden stake that can sink" | Tokens scoring 2: more readable | `net` puts losses back (Robert wants rewarding, not punishing) |

Two **better versions** were added, from the risks above:
- **A Choir Offer counts 2** (like a token), so the cost buys a real push (`rWeight2`).
- **Offer from the hand (facedown) or the Choir (face up)** (`rBoth`), keeping the trusted-not-watched Offer while adding the costly one.
