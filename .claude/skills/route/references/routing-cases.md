# Routing cases

Sample tasks with the expected first route. Use them to test the rules in `SKILL.md`: give a model the skill and the task column only, and compare its answers to the expected column. Allowed answers: `script`, `inline`, `extractor`, `builder`, `engineer`, `reviewer`, `sage`, `gates-only`, `kickoff`.

| # | Task | Expected |
|---|---|---|
| 1 | Rename the config key `apiUrl` to `baseUrl` in 40 files; the test suite covers every use | script |
| 2 | You just merged a change and need to add one line to the decisions log about it | inline |
| 3 | Fix a one-line off-by-one bug; the failing test and the file are already open in your context | inline |
| 4 | Find where invite tokens are validated across a codebase you have not read yet | extractor |
| 5 | Assess 100 open-source repos against a fixed ten-field schema | extractor |
| 6 | Gather pricing, positioning and feature lists for 20 competitors into a fixed schema | extractor |
| 7 | Write unit tests for a pure date-formatting function from an exact written spec | builder |
| 8 | Port an existing dead-code check script into a new repo; done when the script and its tests pass | builder |
| 9 | Build a settings screen from a precise spec that names every field, token and state | builder |
| 10 | Add a row-level-security policy and migration that lets members of a shared group read each other's events | engineer |
| 11 | An end-to-end test fails about one run in five and nobody has reproduced it | engineer |
| 12 | A builder has failed acceptance twice on a time zone bug | engineer |
| 13 | A 600-line diff touching the auth flow has passed tests and lint and is ready to merge | reviewer |
| 14 | A 40-line docs-only diff has passed the link checker and is ready to merge | gates-only |
| 15 | Choose the data model and sync architecture for a new offline-first product; nothing like it exists in the codebase | sage |
| 16 | Propose a name and positioning for a new product from an already-gathered table of prior art and trademark conflicts | sage |
| 17 | The engineer has tried two fixes for a data-corruption bug; both failed against the same check | sage |
| 18 | Verify a 15-item sample of extracted records against their source files and report an error rate | reviewer |
| 19 | Reformat every Markdown file to the repo's line-length rule | script |
| 20 | Implement a payment webhook handler from a written spec | engineer |
| 21 | Turn a one-paragraph idea for a new habit-tracking app into a working repository with a plan | kickoff |
