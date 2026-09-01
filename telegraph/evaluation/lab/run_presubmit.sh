#!/usr/bin/env bash
set -euo pipefail

WASM="${1:-}"
if [[ -z "$WASM" ]]; then
  echo "usage: bash telegraph/evaluation/lab/run_presubmit.sh path/to/candidate.wasm" >&2
  exit 2
fi

python3 "$(dirname "$0")/generate_shadow_corpus.py" --rounds 12
exec python3 "$(dirname "$0")/presubmit_lab.py" --strict --json --out presubmit-report.json "$WASM"
