"""Run a LeetCode-style Python solution on JSON args; print the JSON result.

Usage: python3 run_solution.py <code_file>   (args JSON array on stdin, one line per case)
"""
import json
import sys

PRELUDE = """
from typing import *
from collections import *
import collections, heapq, math, bisect, itertools, functools
from functools import cache, lru_cache
"""

src = open(sys.argv[1]).read()
ns: dict = {}
exec(PRELUDE + src, ns)
sol = ns["Solution"]()
method = next(getattr(sol, m) for m in type(sol).__dict__ if not m.startswith("_") and callable(getattr(sol, m)))
for line in sys.stdin:
    if line.strip():
        print(json.dumps(method(*json.loads(line)), separators=(",", ":")))
