# Tracemind

**See your code think.** A LeetCode interview-prep workspace for students who
are also taking a data structures course (UIUC CS 225): learn the interview
patterns, look up the data structures underneath them, and paste your own
Python to watch it run and get its Big-O.

**Live: [arinazhou.github.io/tracemind](https://arinazhou.github.io/tracemind/)**

## What's inside

**Learn: 20 interview patterns** (the main track). Hash maps, two pointers,
sliding window, prefix sum, binary search, intervals, stacks, linked lists,
heaps, DFS, BFS, backtracking, topological sort, union-find, weighted graphs,
DP, greedy, trie, cyclic sort, matrices. Each lesson has:
the signals that identify it · the idea · fill-in templates · a worked example
you can step through · complexity · strategies & pitfalls · its CS 225
connection · a staged practice list (easy → medium → hard) with hints.
210 LeetCode problems in total.

**Data structures: the CS 225 reference.** Short pages for arrays, linked
lists, stacks & queues, trees & BSTs (a full interactive lesson), balanced
trees, heaps, hash tables, disjoint sets and graphs: the Python toolkit,
operation costs, the key CS 225 ideas, links to the CS 225 lecture slides,
and which interview patterns use each one.

**Code Visualizer: if it runs, it visualizes.** Paste any Python (a plain
script, your own classes, or a LeetCode solution) and step through it line by
line: every variable, arrays with index pointers, dicts, sets, stacks, queues,
grids, trees and linked lists (pointer variables like `slow`, `node` drawn onto
the structure), your own objects by their fields, the call stack, and `print`
output as it appears. Three ways to run: the whole file as a script (with a
stdin box for `input()`), call a function with arguments, or driver code.
Notes read like a debugger: "`while left < right` is True", "`pal.append('bob')`".
⚡ Big-O runs a static analyzer that explains time/space per line and admits
when it is guessing.

**Tracker.** Done ✓, the date you finished, a one-line note, and the
LeetCode link for every problem.

## Run it

| | Hosted (GitHub Pages) | Local (`./dev.sh`) |
|---|---|---|
| Setup | none | Python 3.11+ and Node 20+ |
| Progress | this browser; **Back up / Restore** in the sidebar | SQLite on your machine (browser cache when offline) |
| Visualizer & Big-O | Python via Pyodide (WebAssembly) in a Web Worker | same |

```bash
./dev.sh      # API on :8000 + web app on http://localhost:5173
./start.sh    # build once, serve everything from http://localhost:8000
```

No accounts, API keys, or paid services.

## Architecture

```
web/src/learn/          the curriculum (plain data)
  patterns/*.ts         20 pattern lessons: templates, tips, staged problems
  dataStructures.ts     CS 225 reference pages
  examples/*.py         one runnable worked example per pattern
web/src/lab/
  pytrace.py            sys.settrace tracer: any solution -> steps + snapshots
  pyWorker.ts           Pyodide in a module Web Worker (timeouts can't freeze the page)
  traceToSteps.ts       snapshots -> the same panels the hand-made animations use
web/src/animations/     hand-made tracers for 13 problems (graph layouts, bars, ...)
server/app/
  analyzer.py           AST-based Big-O estimator (also runs in the browser)
  main.py, db.py        FastAPI + SQLite progress API; serves web/dist in production
```

## Tests (all run in CI before every deploy)

```bash
.venv/bin/pytest server     # analyzer, API, and every worked example:
                            #   correct answer, traces cleanly, analyzer agrees
                            #   (or is not confidently wrong)
cd web && npx tsc -p .      # typecheck
cd web && npm run check     # every hand-made animation vs. the real Python
```

References: [Hello Interview](https://www.hellointerview.com/learn/code) (pattern
curriculum) and UIUC CS 225's
[lectures](https://courses.grainger.illinois.edu/cs225/sp2024/pages/lectures.html)
(data structures).
