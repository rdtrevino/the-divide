# Brief template

Fill every section. Put the sections in this order: the parts that are the same across a batch come first so the prefix caches, and the item-specific part comes last.

```
TASK: <short id> | ROUTE: <rule number> | ESCALATED-FROM: <agent or none>
FABLE-JUSTIFICATION: <only for sage: synthesis | novel-design | failed-twice | irreversible>

## Goal
One or two sentences in the owner's terms, and why it matters.

## Inputs
Paths to read. No pasted file content. Name the one rule from CLAUDE.md that applies, if any.

## You own
Files or directories this task may create or change.

## Do not touch
Shared contracts, other agents' files, anything outside "You own".

## Contracts
Types, schemas, function signatures or output paths to build against, by name.

## Acceptance
Commands that must pass, exactly as they will be run. For extraction: the validator command and the schema path.

## Budget
Turn cap is set by the agent. State any tighter limit here (items, files, words).

## Return
First line: STATUS: done | blocked | failed
Then, in at most 300 words:
- Changed: files created or changed
- Evidence: the acceptance commands and their real output (trimmed)
- Decisions: choices you made that the brief left open
- Open: questions or follow-ups, or "none"

## This item
The variable part: the specific item, batch or file list.
```

## Notes

- `STATUS: blocked` means the brief was wrong or incomplete and no work should be trusted. `STATUS: failed` means the work was attempted and acceptance did not pass.
- The ledger reads the `TASK:` line and the `STATUS:` line, so keep their format exact.
- Subagents may write data files (JSON, code in their worktree) but the harness refuses prose report files from them. Ask for a prose deliverable as the final message between `----- BEGIN <file> -----` and `----- END <file> -----` markers, then save it with a script so it is not retyped.
- For a batch of similar items, keep everything above "This item" byte-identical across the batch.
