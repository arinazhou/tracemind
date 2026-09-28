# Tracemind

Full-stack LeetCode visualizer: `web/` (React + TS + Vite) and `server/` (FastAPI + SQLite).

- Run: `./dev.sh` (API :8000, web :5173 proxies `/api`).
- Verify before finishing any change:
  - `.venv/bin/pytest server`
  - `cd web && npx tsc -p . && npm run check`
- Solutions are **Python**; animations are TypeScript tracers in `web/src/animations/`.
  New animations follow `.claude/skills/animate/SKILL.md` (one step per executed line,
  final step carries `result`, verified against real Python by `npm run check`).
- Design: light pastel palette defined as tokens in `web/src/styles.css`. Reuse the
  tokens and tone classes (`t-active`, `t-visited`, …), not new colors.
- No paid APIs or services. Keep the AI features free (Claude Code skills, local analysis).
