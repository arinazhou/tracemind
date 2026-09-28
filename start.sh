#!/usr/bin/env bash
# Production-style: build the web app once, then one process serves UI + API on :8000.
set -euo pipefail
cd "$(dirname "$0")"

[ -d .venv ] || python3 -m venv .venv
.venv/bin/pip install -q -r server/requirements.txt
(cd web && { [ -d node_modules ] || npm install; } && npm run build)
cd server && exec ../.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
