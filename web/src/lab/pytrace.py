"""Trace any LeetCode-style Python solution, line by line.

Runs the user's code under sys.settrace and records, after every executed
line, a JSON-safe snapshot of each frame's variables. Linked nodes (TreeNode,
ListNode) are serialized by object identity, so the UI can draw a variable
like `node` or `slow` as a pointer into the structure it belongs to.

Runs unchanged in CPython (tests) and in the browser via Pyodide.
"""

import io
import json
import sys
import traceback
from collections import OrderedDict, deque

MAX_STEPS = 1500
MAX_ITEMS = 60
FILE = "<solution>"

PRELUDE = '''
from typing import *
from collections import *
import collections, heapq, math, bisect, itertools, functools, string
from functools import cache, lru_cache
from math import inf


class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def tree(values):
    """tree([3, 9, 20, None, None, 15, 7]) -> TreeNode (LeetCode level order)."""
    if not values or values[0] is None:
        return None
    root = TreeNode(values[0])
    queue, i = [root], 1
    while queue and i < len(values):
        node = queue.pop(0)
        for side in ("left", "right"):
            if i < len(values) and values[i] is not None:
                child = TreeNode(values[i])
                setattr(node, side, child)
                queue.append(child)
            i += 1
    return root


def linked(values, pos=-1):
    """linked([1, 2, 3]) -> ListNode head. pos >= 0 makes the tail point back (a cycle)."""
    dummy = ListNode()
    tail, nodes = dummy, []
    for v in values:
        tail.next = ListNode(v)
        tail = tail.next
        nodes.append(tail)
    if 0 <= pos < len(nodes):
        tail.next = nodes[pos]
    return dummy.next
'''


class _Stop(Exception):
    pass


def _is_tree(o):
    return hasattr(o, "val") and hasattr(o, "left") and hasattr(o, "right")


def _is_list_node(o):
    return hasattr(o, "val") and hasattr(o, "next") and not _is_tree(o)


def _prim(v):
    if isinstance(v, float) and v in (float("inf"), float("-inf")):
        return "∞" if v > 0 else "-∞"
    if isinstance(v, str):
        return repr(v) if len(v) <= 40 else repr(v[:37]) + "…"
    return repr(v)


class Snapshot:
    """Serializes one moment. Linked nodes are shared across the whole snapshot."""

    def __init__(self):
        self.structs = {}  # id -> serialized tree / linked list (by its root / head)
        self.owner = {}  # id(node) -> (struct id, position) for pointer lookup

    def value(self, v, depth=0):
        if v is None or isinstance(v, (bool, int, float, str)):
            return {"t": "prim", "r": _prim(v)}
        if _is_tree(v) or _is_list_node(v):
            return {"t": "ref", "id": id(v)}
        if depth >= 2:
            return {"t": "prim", "r": _short(v)}
        if isinstance(v, deque):
            return {"t": "deque", "v": [self.value(x, depth + 1) for x in list(v)[:MAX_ITEMS]]}
        if isinstance(v, (list, tuple)):
            items = list(v)[:MAX_ITEMS]
            if items and all(isinstance(r, list) for r in items) and len({len(r) for r in items}) == 1 and all(
                    not isinstance(x, (list, dict, set)) for r in items for x in r):
                return {"t": "grid", "v": [[_prim(x) for x in r[:MAX_ITEMS]] for r in items]}
            return {"t": "list" if isinstance(v, list) else "tuple", "v": [self.value(x, depth + 1) for x in items]}
        if isinstance(v, dict):
            return {"t": "dict", "v": [[self.value(k, 2), self.value(x, depth + 1)] for k, x in list(v.items())[:MAX_ITEMS]]}
        if isinstance(v, (set, frozenset)):
            try:
                items = sorted(v)
            except TypeError:
                items = list(v)
            return {"t": "set", "v": [self.value(x, 2) for x in items[:MAX_ITEMS]]}
        return {"t": "prim", "r": _short(v)}

    def collect(self, frames_locals):
        """Find every linked structure reachable from locals and serialize it once, from its root."""
        seen = {}
        children = set()

        def visit(node):
            stack = [node]
            while stack:
                n = stack.pop()
                if n is None or id(n) in seen:
                    continue
                seen[id(n)] = n
                nxt = [n.left, n.right] if _is_tree(n) else [n.next]
                for c in nxt:
                    if c is not None:
                        children.add(id(c))
                        stack.append(c)

        def scan(v, depth=0):
            if _is_tree(v) or _is_list_node(v):
                visit(v)
            elif depth < 2 and isinstance(v, (list, tuple, deque)):
                for x in list(v)[:MAX_ITEMS]:
                    scan(x, depth + 1)
            elif depth < 2 and isinstance(v, dict):
                for x in list(v.values())[:MAX_ITEMS]:
                    scan(x, depth + 1)

        for loc in frames_locals:
            for v in loc.values():
                scan(v)
        roots = [n for i, n in seen.items() if i not in children]
        # a cycle has no root: start from any node on it
        covered = set()
        for r in roots:
            covered |= self._members(r)
        for i, n in seen.items():
            if i not in covered:
                roots.append(n)
                covered |= self._members(n)
        for r in roots:
            if _is_tree(r):
                self._tree(r)
            else:
                self._linked(r)

    def _members(self, root):
        out, stack = set(), [root]
        while stack:
            n = stack.pop()
            if n is None or id(n) in out:
                continue
            out.add(id(n))
            stack.extend([n.left, n.right] if _is_tree(n) else [n.next])
        return out

    def _tree(self, root):
        sid = id(root)
        if sid in self.structs:
            return
        nodes = []

        def ser(n):
            if n is None:
                return None
            idx = len(nodes)
            nodes.append(None)
            self.owner.setdefault(id(n), (sid, idx))
            nodes[idx] = {"id": id(n), "v": _prim(n.val), "l": ser(n.left), "r": ser(n.right)}
            return idx

        ser(root)
        self.structs[sid] = {"kind": "tree", "nodes": nodes}

    def _linked(self, head):
        sid = id(head)
        vals, pos, cycle_to = [], {}, None
        n = head
        while n is not None and len(vals) < MAX_ITEMS:
            if id(n) in pos:
                cycle_to = pos[id(n)]
                break
            pos[id(n)] = len(vals)
            self.owner.setdefault(id(n), (sid, len(vals)))
            vals.append(_prim(n.val))
            n = n.next
        self.structs[sid] = {"kind": "linked", "vals": vals, "cycle": cycle_to}


def _short(v):
    r = repr(v)
    return r if len(r) <= 40 else r[:37] + "…"


def _frames(frame):
    out = []
    while frame is not None:
        if frame.f_code.co_filename == FILE:
            out.append(frame)
        frame = frame.f_back
    return list(reversed(out))


def _visible_locals(frame):
    loc = {}
    for k, v in frame.f_locals.items():
        if k.startswith("__") or callable(v) and not isinstance(v, (list, dict, set, deque)):
            continue
        if type(v).__module__ == "builtins" and isinstance(v, type):
            continue
        if k == "self":
            state = {f"self.{a}": x for a, x in getattr(v, "__dict__", {}).items()}
            loc.update(state)
            continue
        loc[k] = v
    return loc


def _snapshot(frames):
    snap = Snapshot()
    locs = [_visible_locals(f) for f in frames]
    snap.collect(locs)
    stack = []
    for f, loc in zip(frames, locs):
        stack.append({
            "fn": f.f_code.co_name,
            "vars": OrderedDict((k, snap.value(v)) for k, v in loc.items()),
        })
    refs = {str(k): list(v) for k, v in snap.owner.items()}
    return stack, {str(k): v for k, v in snap.structs.items()}, refs


def run(code, call, driver=False):
    """Execute `code`, then trace `call` (an expression, or statements when driver=True)."""
    ns = {"__name__": "__solution__"}
    out = io.StringIO()
    result = {"ok": True, "steps": [], "stdout": "", "truncated": False}
    steps = result["steps"]
    pending = {}  # frame id -> line that is executing (emitted when the next event arrives)
    real_stdout = sys.stdout

    def emit(frame, line, event, extra=None):
        if len(steps) >= MAX_STEPS:
            result["truncated"] = True
            raise _Stop()
        stack, structs, refs = _snapshot(_frames(frame))
        step = {"line": line, "event": event, "stack": stack, "structs": structs, "refs": refs}
        if extra:
            step.update(extra)
        steps.append(step)

    def tracer(frame, event, arg):
        # skip library code, and generator/lambda internals (<genexpr>, <lambda>)
        if frame.f_code.co_filename != FILE or frame.f_code.co_name.startswith("<"):
            return None
        key = id(frame)
        if event == "call":
            caller = frame.f_back
            if caller is not None and caller.f_code.co_filename == FILE and id(caller) in pending:
                emit(caller, pending[id(caller)], "call", {"callee": frame.f_code.co_name})
            return tracer
        if key in pending:
            if event == "return":
                emit(frame, pending.pop(key), "return", {"ret": Snapshot().value(arg) if not (_is_tree(arg) or _is_list_node(arg)) else {"t": "prim", "r": f"<{type(arg).__name__} {_prim(arg.val)}>"}})
                return tracer
            emit(frame, pending[key], "line")
        if event == "line":
            pending[key] = frame.f_lineno
        elif event == "exception":
            exc = arg[1]
            emit(frame, frame.f_lineno, "exception", {"error": f"{type(exc).__name__}: {exc}"})
        return tracer

    try:
        exec(compile(PRELUDE, "<prelude>", "exec"), ns)
        exec(compile(code, FILE, "exec"), ns)
    except SyntaxError as e:
        return {"ok": False, "error": f"Syntax error on line {e.lineno}: {e.msg}"}
    except Exception as e:  # noqa: BLE001 - report anything the definitions raise
        return {"ok": False, "error": f"{type(e).__name__}: {e}"}

    sys.stdout = out
    sys.settrace(tracer)
    try:
        if driver:
            lines = call.strip().splitlines()
            body, last = "\n".join(lines[:-1]), lines[-1] if lines else "None"
            exec(compile(body, "<call>", "exec"), ns)
            value = eval(compile(last, "<call>", "eval"), ns)
        else:
            value = eval(compile(call, "<call>", "eval"), ns)
        snap = Snapshot()
        snap.collect([{"result": value}])
        result["result"] = snap.value(value)
        result["resultStructs"] = {str(k): v for k, v in snap.structs.items()}
        result["resultRefs"] = {str(k): list(v) for k, v in snap.owner.items()}
    except _Stop:
        pass
    except Exception as e:  # noqa: BLE001 - user code errors are part of the output
        tb = [f for f in traceback.extract_tb(e.__traceback__) if f.filename == FILE]
        where = f" (line {tb[-1].lineno})" if tb else ""
        result["ok"] = False
        result["error"] = f"{type(e).__name__}: {e}{where}"
    finally:
        sys.settrace(None)
        sys.stdout = real_stdout
    result["stdout"] = out.getvalue()[:4000]
    return result


def entry_point(code):
    """Name and parameters of the method to call: first public method of the first class, else first function."""
    import ast
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return None
    for node in tree.body:
        if isinstance(node, ast.ClassDef):
            for m in node.body:
                if isinstance(m, ast.FunctionDef) and not m.name.startswith("_"):
                    return {"cls": node.name, "fn": m.name, "params": [a.arg for a in m.args.args if a.arg != "self"]}
    for node in tree.body:
        if isinstance(node, ast.FunctionDef):
            return {"cls": None, "fn": node.name, "params": [a.arg for a in node.args.args]}
    return None


def build_call(code, args):
    ep = entry_point(code)
    if ep is None:
        return None
    target = f"{ep['cls']}().{ep['fn']}" if ep["cls"] else ep["fn"]
    return f"{target}({args})"


def trace_json(payload):
    """Browser entry point: payload = {"code", "args"} or {"code", "driver"}."""
    p = json.loads(payload)
    try:
        compile(p["code"], FILE, "exec")
    except SyntaxError as e:
        return json.dumps({"ok": False, "error": f"Syntax error on line {e.lineno}: {e.msg}"})
    if p.get("driver"):
        return json.dumps(run(p["code"], p["driver"], driver=True))
    call = build_call(p["code"], p.get("args", ""))
    if call is None:
        return json.dumps({"ok": False, "error": "No class or function found to call."})
    out = run(p["code"], call)
    out["call"] = call
    return json.dumps(out)


def entry_json(code):
    return json.dumps(entry_point(code))
