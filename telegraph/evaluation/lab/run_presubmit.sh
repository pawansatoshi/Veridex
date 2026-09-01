#!/usr/bin/env bash
set -euo pipefail

WASM="${1:-}"
if [[ -z "$WASM" ]]; then
  echo "usage: bash telegraph/evaluation/lab/run_presubmit.sh path/to/veridex-track2-final.wasm" >&2
  exit 2
fi

LAB_DIR="$(cd "$(dirname "$0")" && pwd)"
python3 "$LAB_DIR/generate_shadow_corpus_v2.py" --rounds 16 --out "$LAB_DIR/shadow_corpus.generated.json"
exec python3 "$LAB_DIR/presubmit_lab.py" --strict --json --rounds 1 \
  --corpus "$LAB_DIR/shadow_corpus.generated.json" \
  --out "presubmit-report.json" "$WASM"
