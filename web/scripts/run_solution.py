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


class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
"""



def build_tree(arr):
    """LeetCode level-order list -> TreeNode."""
    TreeNode = ns["TreeNode"]
    if not arr or arr[0] is None:
        return None
    root = TreeNode(arr[0])
    queue, i = [root], 1
    while queue and i < len(arr):
        node = queue.pop(0)
        for side in ("left", "right"):
            if i < len(arr) and arr[i] is not None:
                child = TreeNode(arr[i])
                setattr(node, side, child)
                queue.append(child)
            i += 1
    return root


def convert(arg):
    if isinstance(arg, dict) and "__tree__" in arg:
        return build_tree(arg["__tree__"])
    return arg


src = open(sys.argv[1]).read()
ns: dict = {}
exec(PRELUDE + src, ns)
sol = ns["Solution"]()
method = next(getattr(sol, m) for m in type(sol).__dict__ if not m.startswith("_") and callable(getattr(sol, m)))
for line in sys.stdin:
    if line.strip():
        print(json.dumps(method(*map(convert, json.loads(line))), separators=(",", ":")))
