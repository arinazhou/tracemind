---
name: animate
description: Generate a step-by-step Tracemind animation (a tracer) for a LeetCode problem from the user's saved Python solution, register it, and verify it against the real Python code. Use when the user runs /animate <number> or asks to animate/visualize a problem in Tracemind.
argument-hint: <leetcode number>
---

# /animate — turn a Python solution into a Tracemind animation

An animation is a **tracer**: TypeScript that re-runs the algorithm and records
one `Step` per executed Python line. The UI, complexity charts, and heat map are
all derived from it, so the tracer is the only file you write.

## 1. Gather inputs

- Problem: find `$ARGUMENTS` in `web/src/data/catalog.ts` (title, slug, category).
  If it's missing, add it to the best-fitting category first.
- Solution, in this order:
  1. The user's saved code: `curl -s localhost:8000/api/progress/$ARGUMENTS` → `.solution`
     (if the server is down: `sqlite3 server/tracemind.db "select solution from progress where num=$ARGUMENTS"`).
  2. Otherwise ask the user to paste it into the **My solution** tab, or offer to
     write a clean standard solution and save it there.
- **Keep the user's code verbatim.** Only append `#@label` tags. If the code has
  a bug, stop and tell them, and don't animate a wrong answer.

## 2. Pick a template

Read the closest existing tracer before writing, and copy its structure:

| Pattern | Template | Panels |
|---|---|---|
| graph BFS / topo sort | `courseSchedule.ts` | graph + array + list(queue) + map |
| grid BFS/DFS | `numberOfIslands.ts` | grid + list(queue) + vars |
| two pointers | `containerWithMostWater.ts` | array(bars, pointers, window) + vars |
| sliding window + hashmap | `longestSubstring.ts` | array(window) + map + vars |
| monotonic stack | `dailyTemperatures.ts` | array(bars) + array + list(stack) |

Panel types live in `web/src/engine/types.ts`. Trees and linked lists: draw them
with the `graph` panel (x/y in 0..1) until dedicated panels exist.

## 3. Rules the tracer must follow

- Tag every executable line with `#@name`; use `L.name`, never raw line numbers.
- **One step per executed line, in real execution order**, like a debugger:
  - loop headers step on every iteration **and** once more on the exit check;
  - `if` lines step whether true or false (the note says which);
  - lines with no visual change (e.g. `taken = 0`) still get a step.
- Notes are one or two plain-English sentences on **why**, not just what
  ("Move left inward. The shorter wall is the bottleneck.").
- Tones: `active` = current, `visited` = queued/on stack, `warn` = being checked,
  `match` = found/unlocked, `done` = finished, `dim` = out of play.
- Mark structures the algorithm allocates with `aux: true` (they drive the
  space chart). Don't mark the input.
- The **final step passes the return value** as `result` (4th arg of `t.step`).
- `pyArgs(input)` returns the positional args for the Python method.
- `generate(n)` makes a random valid input whose size matches
  `complexity.sizeLabel` (e.g. for a grid, ≈ n cells). Keep it valid:
  a DAG when a DAG is required, sorted when sorted input is required.
- `complexity`: Big-O strings, growth classes, and 2–4 `why` bullets that point
  at the code ("each index is pushed once and popped at most once").
- Keep the example input small enough to follow (≈ 30–120 steps).

## 4. Register and verify

1. Add it to `ANIMATIONS` in `web/src/animations/index.ts`.
2. Run `cd web && npx tsc -p . && npm run check -- $ARGUMENTS`.
   The check runs the **real Python** on the example plus random inputs and
   compares its return values to the tracer's `result`. Fix until it prints ✓
   with no `warn:` lines (a warning means some line was never stepped on the
   example, so either step it or choose an example that reaches it).
3. Tell the user the deep link: `http://localhost:5173/#/p/$ARGUMENTS`.
