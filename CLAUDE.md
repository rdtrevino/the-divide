# The Divide: working notes for Claude

**The heart of the game is `design/vision.md`.** Read it before any design, testing, balance or rules work, and measure every proposal against it. Robert's instruction: always point back to the vision.

In short: every card played should be a choice between helping yourself and helping a side you can never be sure is yours (a public-goods dilemma with uncertain, shifting allegiance), played on one shared, contested Altar. When writing up research or proposals:

- Say which principle in `design/vision.md` each change serves, and run it through "The test for any new rule" at the end of that file.
- Prefer changes to the core over patches (caps, catch-ups, tiebreaks). A rule that only fixes a symptom is a sign the core is missing something.
- Bots cannot negotiate, bluff or betray. Say plainly what a simulation can and cannot show, and what needs people.

**`DECISIONS.md`** is the one-line-per-decision index (newest first): add a line whenever something is adopted, rejected or retired, and keep tools and tests lean (remove what a change makes redundant).

**Start with `design/the-game-now.md`**: the current design on one page, how it got here, and its validation against the vision and every earlier version.

The current rules: `rules/The_Divide_Rulebook_v15.md` (card data V45) and the two-page `rules/The_Divide_Quick_Guide.md`. The latest decisions and their evidence: `design/tokens-and-offering.md` (no offering, no harvest; tokens; leftovers) and the "Seven Days" section of `the-game-now.md` (Judgment Day). Card text changes go through `cards/changes/*.json` and `cards/tools/apply_changes.py`, never by hand.

How to test: core rule variants with the engine's strong bot (`game/tools/sim/core.ts` and `exploits.ts`, variants in `variants.ts`, flags in the engine's `rules.ts`; `design/core-validation.md`); the lab (`game/tools/lab`, fast, abstract cards) for quick core ideas, though its bots barely hedge, so it misses what strong engine play shows; the engine simulators (`game/tools/sim`: `exp45.ts` card and Celestial balance, `skill45.ts`, `card-value.ts` for what a card's ability is worth, `baseline.ts` for the Stats page) for the real 69 cards. The engine has three bots: the fast heuristic (`bots.ts`), the strong Monte Carlo bot (`mc.ts`), and the learned bot (`learned.ts`, the site's bots; `HYBRID` adds a small search and beats the strong bot). The learned bot has the current rules built in: after a rule or card change, retrain it (`game/tools/distill/README.md`); test new rule ideas with the strong bot and the lab. Long runs use every core (`game/tools/par.ts`; `WORKERS=1` for one) with the same results; `game/tools/sim/bench-bots.ts` checks bot speed and that a change keeps every move the same. The bot plan (strong, fast, human-like) is `design/bots.md`. Robert's working style: brainstorm widely (not only his ideas), test with strong bots, report plainly with tables, then implement what he approves.

Where things are: the rules in `rules/`, card data in `cards/`, standing decisions in `design/design-decisions.md`, the rework proposals and their evidence in `design/rework-proposal.md`, `design/ground-up.md` and `design/allegiance-tokens.md` and its simpler refinement `design/tide-track.md` (the current front-runner), the rework simulator in `game/tools/lab/` (see its README), the online game in `game/`.

<!-- jumpstart:begin (managed by rdtrevino/jumpstart scripts/install.sh; edit there, not here) -->
## Model routing (Jumpstart kit)

Route every task with the `route` skill: the cheapest tier that does it well. A new product, or any build from an idea, starts with `/kickoff` in the Jumpstart repo, never ad hoc. A `docs/HANDOFF.md` belongs to its own repository: in a session with several repositories, follow only the handoff of the one you were asked to work in, and delete it in the commit that finishes its task. A command can do it: run it. Small and already in context: do it yourself. Many similar items to read: `extractor` (Sonnet). Well specified with a check as acceptance: `builder` (Sonnet). High blast radius (auth, data access, migrations, money, secrets, public contracts), ambiguity or a bug with no reproduction: `engineer` (Opus), then `reviewer` (Opus) for risky or large changes. Direction-setting synthesis, novel design, Opus failing twice or an irreversible decision: `sage` (Fable) with a `FABLE-JUSTIFICATION:` line. Escalate on failure signals, never by default; limits guard against waste, never against work. Spend: `python3 .claude/hooks/ledger.py report`.
<!-- jumpstart:end -->
