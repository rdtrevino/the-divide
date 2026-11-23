# Handoff

The lead's growing context is the largest cost. Instead of carrying it forward, the lead writes a short file and the next phase runs in a fresh session that reads only that file.

## When

- At a phase boundary: a plan approved, a milestone merged, a kickoff stage group done.
- When the hook posts a lead-context notice and the current step is finished.
- Never mid-task. Finish the step, then hand off.

## The file

Write `docs/HANDOFF.md`, overwriting the last one. Target under 1,500 tokens.

```markdown
# Handoff

## Goal
<the owner's words, verbatim>

## Done so far
- <one line each: what, path, commit sha>

## Decisions
- <path to the docs/DECISIONS.md entry; do not restate it>

## Next step
TASK: <id> | ROUTE: <rule> | ESCALATED-FROM: none
<a brief in the format of references/brief-template.md, ready to run>

## Open questions for the owner
- <question and the default being assumed>

## Read first
- <at most five paths>
```

## Continue

1. Commit and push the handoff first, so the fresh session can see it.
2. In a cloud session (the `create_session` tool from claude-code-remote is available), start the next phase yourself: `create_session` on the same environment, repository and branch, with the prompt "Read docs/HANDOFF.md in <owner/repo>, then continue with the route skill." Name the repository: a session can hold several, each with its own handoff. Tell the owner the new session's link, then stop.
3. Elsewhere, tell the owner in one line: run /clear and send "continue from docs/HANDOFF.md".

## Starting from a handoff

A session that begins by reading `docs/HANDOFF.md` reads only the paths under "Read first" before acting. It does not re-read the old transcript, the plan or the ledger unless the next step names them. Run the Next step brief with the route skill.

If the session holds more than one repository, use the handoff of the repository the prompt names, or else the one the session was started on. Never pick between handoffs by date, and never act on another repository's handoff.

## Finishing

A handoff lives only while its task is open. The commit that completes the Next step deletes `docs/HANDOFF.md` (or overwrites it with the following phase). A handoff on the default branch after its pull request merges is stale, and the next session will follow it; `scripts/repo-hygiene.sh` reports one.
