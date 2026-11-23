---
name: route
description: Decide which model tier does a piece of work and hand it off. Use before delegating any task to a subagent, when planning a multi-step build, when a subagent fails or returns blocked, or when the user asks which model should do something. Covers the tier rules, the brief format, escalation and de-escalation, and budget stops.
---

# Route

The lead (this session) plans, routes, integrates and reports. It never delegates the final review or the merge, and it stays on one model for the whole session. Tiers are reached through the pinned agents, not by switching the session model.

The aim is the lowest cost per completed task. Use the cheapest tier that can do the job and move up on a failure signal, never by default.

## Rules (first match wins)

| # | If the task is | Route | 
|---|---|---|
| 0 | Producible or checkable by a command that already exists or takes minutes to write (codemod, formatter, linter, validator, census script). Writing new product code or new tests, or porting a script to a new repo, is not rule 0 | Run the command. No model |
| 1 | Small, and you already hold the context (about five tool calls or fewer) | Do it inline |
| 2 | Many similar items to read, extract or classify, or a search across code you have not read | `extractor` (in batches for many items), results validated by script, a sample checked by `reviewer` |
| 3 | Well specified, acceptance is a command, low blast radius | `builder` |
| 4 | High blast radius, ambiguous, cross-cutting, or a bug with no reproduction | `engineer` |
| 5 | Ready to merge, or a standalone request to verify or review work | Tests, lint, types and schema checks first. `reviewer` only for high blast radius, a diff over about 300 lines, or verifying a sample against sources |
| 6 | Direction-setting synthesis, design with no existing pattern, or a decision that is costly to reverse | `sage` |

A new product, or a build that starts from an idea rather than an existing repo, is not routed piece by piece: run the `kickoff` skill, which routes its own stages.

Before using the table, check `references/escalation.md` if the task arrives from a failed or blocked subagent: the escalation target there wins.

High blast radius means auth, data access rules, migrations, money, secrets, or a public contract. It overrides rule 3 even when the spec is complete: a fully specified payment handler still goes to `engineer`. When a task spans two rules, split it: let the higher tier produce the plan and the acceptance checks, then give the execution to the lower tier.

Rule 1 exists because a subagent starts cold and pays for its own prefix. Below roughly 30k tokens of work, delegation costs more than it saves, unless the work would flood your context with reading.

## The Fable gate

`sage` runs only when one of these is true, and the brief must say which on a line of its own:

`FABLE-JUSTIFICATION: synthesis | novel-design | failed-twice | irreversible`

Give it compact, verified inputs and a length limit. It never reads raw corpora and never implements. The hook rejects a call without the line, including Workflow scripts that pass a Fable model, and posts a notice after the third consult in a session. It does not ration consults.

## Handing off

Every brief follows `references/brief-template.md` (read it the first time you delegate in a session). The essentials: a first line of `TASK: <id> | ROUTE: <rule> | ESCALATED-FROM: <agent or none>`, static content before variable content, file paths instead of pasted content, acceptance as commands, and a required `STATUS:` line in the return. Keep a brief under about 2,000 tokens and ask for a return under 300 words.

Run independent tasks in parallel on disjoint files. For more than about five similar items, use a Workflow script so the dispatch costs no lead tokens.

## Clean up after a merge

Merging an agent's worktree branch is not done until its worktree and branch are gone: `git worktree remove <path>`, then `git branch -d <branch>`, in the same step. When a pull request merges, run `scripts/repo-hygiene.sh` and tell the owner which remote branches to delete (cloud sessions cannot). Read `references/hygiene.md`.

## Escalation and stops

Read `references/escalation.md` when a subagent returns `failed` or `blocked`, when a validator rejects a batch, or when a budget stop fires. In short: one escalation per task, with the failure evidence and not the transcript; then stop and report to the owner.

## Budget and limits

Nothing here caps legitimate work. Heavy tasks get the tier and the turns they need; the controls exist to catch waste and to keep the owner informed.

- **Spend is logged and reported, not blocked.** The hook in `.claude/hooks/ledger.py` reads spend from the transcripts before each delegation and posts a notice to you at each step (`.claude/budget.json`). It writes nothing; `ledger.py report` rebuilds `ledger/`. Pass the figure on in your next update.
- **There is no spend ceiling.** For an unattended headless run use `claude -p --max-budget-usd N`.
- **Turn caps are runaway guards.** An agent that hits its cap while making progress is resumed once with its context (see `references/escalation.md`). That is not an escalation.
- **The Fable gate is always on.** It asks for a reason, it does not ration use.
- **The lead's context is the largest cost.** In measured runs the lead took 61 percent of spend, mostly re-reading its own context. At a phase boundary, or when the hook posts a lead-context notice and the step is done, hand off to a fresh session through `docs/HANDOFF.md`: read `references/handoff.md`. `/compact` is the fallback when no handoff is possible.
- **Scale by parallelism and tier, not by cutting scope.** If the work is large, split it across disjoint files and run agents side by side.

Check spend with `python3 .claude/hooks/ledger.py report`. If the hook is not active in a session, run `ledger.py scan` after each phase.

## Checking the policy

`references/routing-cases.md` holds sample tasks with expected routes. After editing the rules above, re-run the cases against a cheap model and fix any rule that a case exposes as unclear.
