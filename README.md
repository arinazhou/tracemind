# Tracemind

**See your code think.** An algorithm lab for LeetCode prep: track progress by
pattern, replay solutions line by line, and get an explained Big-O for your own
Python, both measured and statically analyzed.

**Live: [arinazhou.github.io/tracemind](https://arinazhou.github.io/tracemind/)**

## Two ways to run it

| | Hosted (GitHub Pages) | Local (`./dev.sh`) |
|---|---|---|
| Setup | none, just open the link | Python 3.11+ and Node 20+ |
| Progress | saved in your browser; **Back up / Restore** in the sidebar | SQLite on your machine, cached in the browser offline |
| Complexity analyzer | `analyzer.py` running in the browser via Pyodide | the same `analyzer.py` on the FastAPI server |
| `/animate` in Claude Code | — | yes |

```bash
./dev.sh      # API on :8000 + web app on http://localhost:5173 (hot reload)
./start.sh    # build once, serve everything from http://localhost:8000
```

No accounts, API keys, or paid services. Every push to `main` runs the full
test suite in GitHub Actions and redeploys the site only if it passes.

## Features

- **Pattern tracker**: 125 problems in 17 patterns (Hello Interview's order
  combined with Emma Zhang's chapters), with status, notes, a LeetCode link for
  each problem, an activity heatmap, and a streak count.
- **Step-through animations**: one step per executed line, like a debugger, with
  graph, grid, array/bar, queue/stack, and hash-map views. Try your own input.
- **Measured complexity**: each animation's tracer runs on random inputs of
  growing size. The charts plot the real step and memory counts against the
  fitted Big-O curve, and a heat map shows the hottest lines.
- **Complexity analyzer** (*My solution* tab): paste your Python and a static
  analyzer walks the AST to estimate time and space. It explains the estimate
  line by line and lowers its confidence when it has to guess. One Python file
  serves both the FastAPI server and the hosted site (via Pyodide/WebAssembly).
- **`/animate <num>`** (Claude Code): generates an animation from your saved
  solution, then checks it against the real Python code before registering it.

## Architecture

```
web/      React + TypeScript + Vite
  src/engine/        step-trace format (types.ts) and tracer helpers
  src/animations/    one tracer per problem; index.ts registers them
  src/data/          catalog (problems/categories) and progress sync
  scripts/           check-tracers.ts: validates tracers against real Python
server/   FastAPI + SQLite (stdlib sqlite3, one file: server/tracemind.db)
  app/analyzer.py    AST-based Big-O estimator
  app/main.py        REST API; also serves web/dist in production
.claude/skills/animate/   the /animate workflow for Claude Code
```

The core idea is that **an animation is data**. A tracer re-runs the algorithm
and records `{line, note, panels}` for each executed line. The UI, the
complexity charts, and the heat map are all derived from that recording, so
adding a problem means writing one file, which an AI assistant can also write.
`npm run check` then keeps it honest by running the actual Python solution on
the same inputs and comparing the return values.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/progress` | all progress entries |
| GET/PUT | `/api/progress/{num}` | one problem: status, notes, solution |
| POST | `/api/progress/import` | merge browser-cached entries (newer wins) |
| GET | `/api/activity?tz_offset=` | per-day activity for the heatmap |
| POST | `/api/analyze` | static Big-O analysis of Python code |

The web app works offline: edits are cached in the browser and merged into the
server the next time it connects.

## Development

```bash
.venv/bin/pytest server           # analyzer + API tests
cd web && npx tsc -p .            # typecheck
cd web && npm run check           # every tracer vs. real Python
```

Backups: copy `server/tracemind.db`. That file is all your data.
