#!/usr/bin/env bash
# Run core.ts for each variant in every mode, appending one JSON line each to <out>.  ./core.sh <out> <games> <variants...>
set -uo pipefail
cd "$(dirname "$0")"
out=$1; n=$2; shift 2
for v in "$@"; do for m in main4 main3 skill4; do ../../node_modules/.bin/tsx core.ts "$v" "$m" "$n" >> "$out" || echo "{\"variant\":\"$v\",\"mode\":\"$m\",\"error\":true}" >> "$out"; done; done
