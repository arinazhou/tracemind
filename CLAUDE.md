# Tracemind

Full-stack LeetCode visualizer: `web/` (React + TS + Vite) and `server/` (FastAPI + SQLite).

- Run: `./dev.sh` (API :8000, web :5173 proxies `/api`).
- Verify before finishing any change:
  - `.venv/bin/pytest server`
  - `cd web && npx tsc -p . && npm run check`
- Structure: `web/src/learn/` holds the curriculum: 20 interview patterns (`patterns/*.ts`),
  CS 225 data-structure pages (`dataStructures.ts`), and one runnable worked example per
  pattern (`examples/*.py`, verified by `server/tests/test_examples.py`).
- Code Lab: `web/src/lab/pytrace.py` traces any Python solution (Pyodide in a module Web Worker).
- Solutions are **Python**; hand-made animations are TypeScript tracers in `web/src/animations/`.
  New animations follow `.claude/skills/animate/SKILL.md` (one step per executed line,
  final step carries `result`, verified against real Python by `npm run check`).
- Design: light pastel palette defined as tokens in `web/src/styles.css`. Reuse the
  tokens and tone classes (`t-active`, `t-visited`, …), not new colors.
- No paid APIs or services. Keep the AI features free (Claude Code skills, local analysis).
