#!/usr/bin/env bash
# Repo hygiene: report, and with --apply remove, what a merged pull request leaves behind.
#
#   scripts/repo-hygiene.sh            report only
#   scripts/repo-hygiene.sh --apply    remove merged agent worktrees (.claude/worktrees/) and merged local branches
#
# Reports: whether the default branch is main; local and remote branches merged into the default branch; worktrees
# under .claude/worktrees/ whose branch is merged. --apply deletes with `git worktree remove` and `git branch -d`
# only (never -D, never the current branch, never a dirty worktree). Remote branches are never deleted here: the
# git proxy in cloud sessions blocks it, so the script prints the branches page to delete them by hand.
# Needs bash and git only. A failed network call never aborts it. A branch merged by squash is not seen as merged.
set -uo pipefail
APPLY=0
case "${1:-}" in
  "") ;;
  --apply) APPLY=1 ;;
  *) echo "usage: repo-hygiene.sh [--apply]" >&2; exit 1 ;;
esac
git rev-parse --git-dir >/dev/null 2>&1 || { echo "not a git repo" >&2; exit 1; }
TOP="$(git rev-parse --show-toplevel)"
CUR="$(git symbolic-ref --short -q HEAD || true)"

git remote set-head origin -a >/dev/null 2>&1 || true
HEADREF="$(git symbolic-ref --short -q refs/remotes/origin/HEAD 2>/dev/null || true)"   # origin/main
DEFAULT="${HEADREF#origin/}"
BASE=""
if [ -n "$DEFAULT" ]; then
  echo "default branch: $DEFAULT$([ "$DEFAULT" = main ] || echo " (expected main)")"
  if git rev-parse -q --verify "refs/remotes/origin/$DEFAULT" >/dev/null; then BASE="origin/$DEFAULT"; else BASE="$DEFAULT"; fi
else
  echo "default branch: not_accessible"
  for b in main master; do
    if git rev-parse -q --verify "refs/heads/$b" >/dev/null; then DEFAULT="$b"; BASE="$b"; break; fi
  done
fi
if [ -z "$BASE" ]; then echo "no default branch to compare against; nothing to report"; exit 0; fi

merged_local=()
while IFS= read -r b; do
  if [ -n "$b" ] && [ "$b" != "$DEFAULT" ] && [ "$b" != "$CUR" ]; then merged_local+=("$b"); fi
done < <(git for-each-ref --merged "$BASE" --format='%(refname:short)' refs/heads)

echo "merged local branches: ${#merged_local[@]}"
for b in "${merged_local[@]}"; do echo "  $b"; done

merged_remote=()
while IFS= read -r r; do
  case "$r" in origin/HEAD|origin|"origin/$DEFAULT"|"") continue ;; esac
  merged_remote+=("$r")
done < <(git for-each-ref --merged "$BASE" --format='%(refname:short)' refs/remotes/origin)
echo "merged remote branches: ${#merged_remote[@]}"
for r in "${merged_remote[@]}"; do echo "  $r"; done

is_merged() { local x; for x in "${merged_local[@]}"; do [ "$x" = "$1" ] && return 0; done; return 1; }

wt_paths=(); wt_branches=()
path=""
while IFS= read -r line; do
  case "$line" in
    "worktree "*) path="${line#worktree }" ;;
    "branch "*)
      br="${line#branch refs/heads/}"
      case "$path" in
        */.claude/worktrees/*)
          if [ "$path" != "$TOP" ] && is_merged "$br"; then wt_paths+=("$path"); wt_branches+=("$br"); fi ;;
      esac ;;
  esac
done < <(git worktree list --porcelain)
echo "merged agent worktrees: ${#wt_paths[@]}"
for i in "${!wt_paths[@]}"; do echo "  ${wt_paths[$i]} (${wt_branches[$i]})"; done

if [ "$APPLY" -eq 1 ]; then
  for i in "${!wt_paths[@]}"; do
    if git worktree remove "${wt_paths[$i]}" >/dev/null 2>&1; then echo "removed worktree ${wt_paths[$i]}"
    else echo "kept worktree ${wt_paths[$i]} (uncommitted changes or locked)"; fi
  done
  git worktree prune >/dev/null 2>&1 || true
  for b in "${merged_local[@]}"; do
    if git branch -d "$b" >/dev/null 2>&1; then echo "deleted branch $b"; else echo "kept branch $b (checked out elsewhere or not fully merged)"; fi
  done
fi

if git cat-file -e "$BASE:docs/HANDOFF.md" 2>/dev/null; then
  echo "stale handoff: docs/HANDOFF.md is on $DEFAULT; delete it if its task is done (route skill, references/handoff.md)"
fi

url="$(git config --get remote.origin.url 2>/dev/null || true)"
if [ -n "$url" ]; then
  p="${url%/}"; p="${p%.git}"
  case "$p" in *://*) p="${p#*://}"; p="${p#*/}" ;; *:*) p="${p#*:}" ;; esac
  repo="${p##*/}"; rest="${p%/*}"; owner="${rest##*/}"
  if [ -n "$owner" ] && [ -n "$repo" ] && [ "$rest" != "$p" ]; then
    if [ "${#merged_remote[@]}" -gt 0 ]; then
      echo "remote branches are never deleted here; delete the merged ones at:"
    else
      echo "remote branches page:"
    fi
    echo "  https://github.com/$owner/$repo/branches"
  else echo "remote branches page: not_accessible"; fi
else
  echo "remote branches page: not_accessible"
fi
exit 0
