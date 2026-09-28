#!/usr/bin/env bash
# Start the API (port 8000) and the web app (port 5173) together. Ctrl+C stops both.
set -euo pipefail
cd "$(dirname "$0")"

[ -d .venv ] || python3 -m venv .venv
.venv/bin/pip install -q -r server/requirements.txt
[ -d web/node_modules ] || (cd web && npm install)

trap 'kill 0' EXIT
(cd server && ../.venv/bin/uvicorn app.main:app --reload --port 8000) &
(cd web && npm run dev)
