# Escalation, de-escalation and stops

## Escalate on these signals only

| From | To | Signal | What to pass up |
|---|---|---|---|
| `builder` | `engineer` | Acceptance failed twice; the turn cap was hit; files outside its ownership were touched; it returned blocked on an engineering question | The original brief, the failing command output, the diff so far |
| `engineer` | `sage` | Two failed fixes against the same check; no root cause after a reproduction | The reproduction, what was tried, ranked hypotheses. Ask for a diagnosis and a plan, which `engineer` then implements |
| `extractor` batch | `extractor` on the next model up, or `reviewer` for the failing items | The validator rejected the batch twice; the verified sample shows more than 10 percent of fields wrong | The schema, the validator output, the failing items only |
| Lead inline | `engineer` | You have spent more than about ten tool calls on what looked small | A brief written from what you learned |

A turn cap is a runaway guard, not a verdict. If an agent stops at its cap and its work shows progress (files written, checks moving toward green), resume it once with its context and a short note to batch its tool calls and finish. Escalate only if it stops at the cap a second time or was going in circles.

A `blocked` return caused by a gap in the brief is not an escalation. Fix the brief and re-run at the same tier.

Pass evidence, never a transcript. Mark the new brief `ESCALATED-FROM: <agent>` so the ledger can count it.

## De-escalate deliberately

- Any plan from `engineer` or `sage` that comes with acceptance checks is executed by `builder`.
- When the ledger shows a task class passing first time at least nine times in ten at one tier, try the tier below on the next one.
- A failed cheap attempt costs about half an attempt at the tier above. Trying the cheaper tier first pays whenever it succeeds more than about six times in ten.
- Lower effort before lowering the tier when the work is knowledge or research. Published runs show medium matching high there.

## Stop and report to the owner when

1. A task has failed after one escalation.
2. Two consecutive batches fail validation, or the verified sample exceeds the error threshold after a re-run.
3. Acceptance can only pass by weakening a test or widening scope.

Spend notices are information, not stops.

A stop report says what was completed, what it cost, what failed with the evidence, and the options with a recommendation. Do not retry upward on your own after a stop.
