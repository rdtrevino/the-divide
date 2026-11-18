#!/usr/bin/env bash
# Run experiments in parallel on all cores.  ./run.sh <out.jsonl> <mode> <N> <variant>...
set -euo pipefail
cd "$(dirname "$0")"
out=$1; mode=$2; n=$3; shift 3
printf '%s\n' "$@" | xargs -P "$(nproc)" -I{} ../../node_modules/.bin/tsx exp.ts {} "$mode" "$n" >> "$out"
