# Repo hygiene after a merge

Stale branches and agent worktrees pile up unless the merge step also cleans up. The lead does this, not a subagent.

## After merging an agent's branch
1. `git worktree remove <path>` (refuses a dirty tree, which is the safety net; look at what is uncommitted before forcing anything).
2. `git branch -d <branch>` (never `-D`: if `-d` refuses, the branch is not merged and the work is still needed).

## When a pull request merges
1. Run `scripts/repo-hygiene.sh`. It lists merged local and remote branches, merged worktrees under `.claude/worktrees/`, and whether the default branch is `main`.
2. Run `scripts/repo-hygiene.sh --apply` to remove merged worktrees and merged local branches. It never touches remote branches or the current branch.
3. Remote deletion from cloud sessions is blocked by the git proxy. Tell the owner which `origin/` branches are merged and give the branches page the script prints. With "Automatically delete head branches" on (Settings > General > Pull Requests) this is rarely needed.

Do not run `--apply` while agents are running: a fresh agent worktree has no commits of its own yet, so it reads as merged, and a clean one would be removed under the agent.

A squash-merged branch is not seen as merged by git, so it appears in neither list; check the pull request and delete it by hand.

`scripts/check.sh` fails while a merged worktree remains under `.claude/worktrees/`.
