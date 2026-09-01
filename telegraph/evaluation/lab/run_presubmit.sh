#!/usr/bin/env bash
set -euo pipefail

WASM="${1:-}"
if [[ -z "$WASM" ]]; then
  echo "usage: bash telegraph/evaluation/lab/run_presubmit.sh path/to/veridex-track2-final.wasm" >&2
  exit 2
fi

LAB_DIR="$(cd "$(dirname "$0")" && pwd)"
export PYTHONUNBUFFERED=1
exec python3 "$LAB_DIR/track2_doctor.py" \
  --existing-wasm \
  --wasm "$WASM" \
  --rounds "${TRACK2_LAB_ROUNDS:-2}" \
  --deep-rounds "${TRACK2_LAB_DEEP_ROUNDS:-8}" \
  --max-iterations "${TRACK2_LAB_MAX_ITERATIONS:-2}" \
  --json
