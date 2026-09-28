#!/usr/bin/env bash
# Start the API (port 8000) and the web app (port 5173) together. Ctrl+C stops both.
set -euo pipefail
cd "$(dirname "$0")"

for port in 8000 5173; do
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $port is already in use (another ./dev.sh still running?):"
    lsof -nP -iTCP:"$port" -sTCP:LISTEN | awk 'NR>1 {print "  " $1 "  pid " $2}'
    echo "Stop it with: kill <pid>   then run ./dev.sh again."
    exit 1
  fi
done

[ -d .venv ] || python3 -m venv .venv
.venv/bin/pip install -q --disable-pip-version-check -r server/requirements.txt
[ -d web/node_modules ] || (cd web && npm install)

trap 'kill 0' EXIT
(cd server && ../.venv/bin/uvicorn app.main:app --reload --port 8000) &
(cd web && npm run dev)
