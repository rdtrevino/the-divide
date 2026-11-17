# Offer, Gather, Exalt: making every turn a hard choice

Design brainstorm, November 17, 2026, for Robert's review. Thinking about how people play, not bots (the bots cannot negotiate, split up or betray, so they cannot judge coalition scoring).

## The goal

The Divide is game theory meets engine building:

- **The Altar is the game-theory layer.** Shared, contested, partly hidden. Who wins the Tide, and who shares in it, is decided by alliances, bluffs and betrayals.
- **The Choir is the engine-building layer.** A personal machine that should pay a little early and a lot late.
- **The three actions are the bridge.** Every turn you choose between moving the Altar now and building the machine for later, and each action should do something the other two can't.

## Why the choice is not hard today

1. **The engine maxes out at once.** The Choir starts full (3 cards) and the Reaping caps at 3, so there is nothing to build toward. Building pays about the same per Day early and late.
2. **Exalt costs the same currency it competes with.** Exalt costs 1 Glory and Offer pays 1 Glory: a 2-Glory swing for a Choir card. Almost nobody Exalts (2% of actions).
3. **Most card abilities are tools, not engines.** They manipulate or pay +1 under a condition. Very few produce more the longer you keep them, so a "late game" never arrives.
4. **The Tide rewards herding.** Everyone leaning the same way all score, so there is little reason to form, break or betray alliances.

## The three actions, each with its own job

| Action | Moves | Seen by | Costs | Gives | Its job |
|---|---|---|---|---|---|
| **Offer** | hand → Altar | nobody (facedown) | a hand card | 1 Glory now, and a hidden push on the Tide | Tempo and secret influence |
| **Gather** | Altar ↔ Choir | everyone | nothing | a Choir card from what's there, and a visible change to the Altar | Opportunistic building, open influence |
| **Exalt** | hand ↔ Choir | everyone, but planned in private | 1 Glory and a hand card | exactly the card you want, with nothing lost | Precise refinement |

### Proposed changes that give each action its identity

- **Gather trades with the Altar.** "Take a card from the Altar (or the top of the deck) into your Choir. If your Choir is full, the card you replace goes onto the Altar face up." Every Gather moves the Altar twice: one card leaves, another arrives. You can pick up a Light card and drop a Dark one, building and swinging the Tide in the open. That makes Gather the public counterpart to the hidden Offer.
- **Exalt refines without loss.** "Pay 1 Glory: play a card from your hand into your Choir. If your Choir is full, the card you replace returns to your hand." Nothing is thrown away; the swapped-out card can be Offered tomorrow. That is how a player changes sides cleanly: Exalt a Dark card in, take your Light card back, Offer it later to help your old team, or to keep them guessing.
- **Offer stays as it is:** facedown, 1 Glory. It is the tempo action: strongest early, and later the way to decide who wins the Tide.

## Game theory: your lean is your team

Robert's coalition scoring makes the Altar a real negotiation:

| Choirs leaning with the Tide | Each gains |
|---|---|
| Yours alone | 3 |
| Two | 2 for the stronger lean, 1 for the weaker (a tie: 1 each) |
| Three or more | 0 |
| Leaning against the Tide | lose 1 |

How people will play it:

- **Teams form on their own.** With 3 or 4 players and two colors, someone always shares your side. The pair (or pairs) must cooperate to win the Tide, and they also compete to be the stronger lean. That is coopetition: an ally you must help and beat at the same time.
- **Herding kills everyone's Reaping.** If three lean Dark, a Dark Tide pays nobody. Someone has to defect, and everyone at the table knows it. That is the conversation the game is built for: "If you switch to Light, you'll be alone and get 3 when Light wins."
- **Switching costs little but is visible.** Losing only 1 for being on the wrong side keeps switching cheap. Changing your Choir is public, so a switch is a statement; a facedown Offer against your own team is the hidden betrayal.
- **The size of your lean still matters:** it decides who gets 2 in a pair, and it makes you hard to overtake.

**Risk:** in a 3-player game the pair usually out-Offers the lone player. Watch whether the lone player can ever win the Tide; if not, the lone player could add 1 to the Tide's Light or Dark total for their color (a "lone voice" counts double).

## Engine building: cards that pay more later

With rank scoring, the Reaping pays for being on the right team, not for a big lean. So the engine has to come from the Choir's abilities. Three kinds of engine cards would give the late game a shape.

1. **Families (set collection).** The deck already has natural families:
   - **Archangels:** Michael, Gabriel, Raphael, Uriel, Raguel, Ithuriel.
   - **Princes of Hell:** Mammon, Leviathan, Beelzebub, Asmadai, Azazel, Moloch, Belial, Abaddon.
   - **Mysteries** (Neutral): Urim, Shroud, Nephilim, Firmament and others.

   A few cards per family pay for each other: "At the Reaping: gain 1 Glory for each other Archangel in your Choir." Two family cards pay 1 a Day; three pay 2 each, so 4 to 6 a Day. That takes Days to assemble, and Exalt is how you finish a set. A clear late-game plan.
2. **Stores (Glory that accumulates).** "At each Reaping, put 1 Glory from the Pot on this card. On your turn you may take all of it; then discard this card." A savings account: cash in early for a little, or wait for a lot, while rivals try to remove it from your Choir.
3. **Growth cards.** "At the Reaping: gain 1 Glory if this is Day 4 or later; 2 if Day 7 or later." Weak early, strong late; worth Exalting early only if you expect a long game.

Balance target: by Day 5 or 6, a good engine makes about 2 Glory a Day, against 1 for an Offer and 1 to 3 for the Tide. Early on, Offers and the Tide are better, so the arc runs from tempo, to building, to cashing in.

## The Choir

- **Start with 2 random cards, limit 4** (or 3). The empty places are the first things to build, and the random pair still points each player somewhere different.
- With 4 places, a family of 3 plus one tool or Store is a complete engine, so the late game has a shape.

## What a turn feels like (Day 5, 4 players)

Ada leans Dark: Mammon and Beelzebub (two Princes) and Absolution. Ben also leans Dark; Cy and Dee lean Light. The Altar shows two Light First Fruits and one Dark.

- **Offer** a Dark card: +1 Glory now, and helps Dark win the Tide. But if Dark wins, Ben might be the stronger lean and take the 2.
- **Gather** the face-up Leviathan (a third Prince) and drop Absolution onto the Altar: +1 more Glory every Reaping from now on, but it takes a Dark card off the Altar today.
- **Exalt** Asmadai from her hand (also a Prince), and Absolution returns to her hand: costs 1 Glory, same engine gain, and today's Altar is untouched.
- Or switch: Exalt a Light card, return Mammon to hand, become the third Light lean. That kills the Light Tide's payout for Cy and Dee unless one of them switches, a threat worth discussing at the table.

Every option is good, and the best one depends on the Day, the score and what the others will do.

## Rules this replaces or simplifies

- The Reaping cap (rank scoring has fixed amounts).
- Glory equal to your lean (rank scoring).
- Exalt discarding a card (it returns to hand).
- Gather discarding a card (it goes onto the Altar).
- Probably the endgame bonus, since the engines are the late game.

## Open questions for Robert

1. Gather's replaced card going onto the Altar, and Exalt's returning to hand: yes?
2. Families, Stores, growth cards: which kinds of engine cards, and roughly how many (my guess: 12 to 18 of the 66)?
3. Losing 1 for leaning against the Tide (cheap switching) or more?
4. Choir limit 3 or 4?

## How to test it

Bots cannot play coalitions, so the test is people:

1. Build these as a **playtest mode** on the site: rank scoring, Gather trades with the Altar, Exalt returns to hand, starting Choir 2, limit 4, no Seed.
2. Add a first batch of engine cards: one family pair (say Archangels and Princes, 4 or 5 cards each) and two Stores.
3. Play 5 to 10 games with friends. Watch: how often each action is taken, how often a Choir switches sides, how often 3 or more share a side, who wins with what, and how long games run.
