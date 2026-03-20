#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

PYTHON_BIN="$(pwd)/.venv/bin/python"
if [ ! -x "$PYTHON_BIN" ]; then
  echo "Missing backend venv Python at $PYTHON_BIN" >&2
  echo "Create it with: python3 -m venv .venv && ./.venv/bin/pip install -r requirements.txt" >&2
  exit 1
fi

exec "$PYTHON_BIN" -m uvicorn server:app --host 0.0.0.0 --port 8089
