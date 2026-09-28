"""Static Big-O estimator for LeetCode-style Python solutions.

No model, no API — it walks the AST and recognizes the patterns interview
solutions are built from: loops over inputs, constant-size loops (grid
directions), BFS/worklist loops, amortized monotonic stacks, binary-search
halving, sorting and heap calls, memoized vs. branching recursion, and
visited-marking traversals. Every conclusion is recorded as a line-level
finding so the UI can show *why*, and anything that fell back to a guess
lowers the confidence instead of pretending.
"""

from __future__ import annotations

import ast
from collections import Counter
from dataclasses import dataclass, field

# ---------------------------------------------------------------- cost algebra


@dataclass(frozen=True)
class Cost:
    poly: tuple[tuple[str, int], ...] = ()  # e.g. (("m", 1), ("n", 1))
    log: int = 0
    exp: str | None = None  # "2ⁿ", "n · 2ⁿ", "n · n!"
    graph: bool = False  # V + E

    @staticmethod
    def of(sym: str = "n", log: int = 0) -> Cost:
        return Cost(poly=((sym, 1),), log=log)

    @property
    def degree(self) -> int:
        return sum(p for _, p in self.poly)

    def key(self):
        return (self.exp is not None, self.degree, self.log, self.graph)

    def __mul__(self, other: Cost) -> Cost:
        c = Counter(dict(self.poly))
        c.update(dict(other.poly))
        return Cost(tuple(sorted(c.items())), self.log + other.log, self.exp or other.exp, self.graph or other.graph)

    def __str__(self) -> str:
        if self.exp:
            return f"O({self.exp})"
        if self.graph and self.degree <= 1:
            return "O((V + E) log V)" if self.log else "O(V + E)"
        poly = " · ".join(sym if p == 1 else f"{sym}{'²³⁴'[p - 2] if p <= 4 else '^' + str(p)}" for sym, p in self.poly)
        log = "" if not self.log else "log n" if self.log == 1 else f"log^{self.log} n"
        body = " ".join(x for x in (poly, log) if x)
        return f"O({body})" if body else "O(1)"


ONE = Cost()
N = Cost.of("n")
LOG = Cost(log=1)


def cmax(*costs: Cost) -> Cost:
    return max(costs, key=Cost.key, default=ONE)


# ---------------------------------------------------------------- findings


@dataclass
class Finding:
    line: int
    cost: str
    message: str


@dataclass
class Report:
    time: Cost = ONE
    space: Cost = ONE
    findings: list[Finding] = field(default_factory=list)
    guesses: int = 0

    def note(self, node: ast.AST, cost: Cost, msg: str):
        self.findings.append(Finding(getattr(node, "lineno", 0), str(cost), msg))


# ---------------------------------------------------------------- helpers

WORKLIST_NAMES = {"queue", "q", "dq", "stack", "st", "heap", "pq", "frontier", "todo", "bfs"}
ROW_NAMES = {"rows", "m", "row", "r_len", "nrows", "height", "h"}
COL_NAMES = {"cols", "n_cols", "col", "c_len", "ncols", "width", "w"}
CONTAINERS = {"list", "dict", "set", "deque", "defaultdict", "Counter", "OrderedDict"}


def names_in(node: ast.AST) -> set[str]:
    return {n.id for n in ast.walk(node) if isinstance(n, ast.Name)}


def call_name(node: ast.AST) -> str | None:
    if isinstance(node, ast.Call):
        f = node.func
        if isinstance(f, ast.Name):
            return f.id
        if isinstance(f, ast.Attribute):
            return f.attr
    return None


def is_const(node: ast.AST, consts: set[str]) -> bool:
    """Literal, or built only from literals / names bound to literals."""
    if isinstance(node, ast.Constant):
        return True
    if isinstance(node, (ast.Tuple, ast.List, ast.Set)):
        return all(is_const(e, consts) for e in node.elts)
    if isinstance(node, ast.Name):
        return node.id in consts
    if isinstance(node, ast.UnaryOp):
        return is_const(node.operand, consts)
    if isinstance(node, ast.BinOp):
        return is_const(node.left, consts) and is_const(node.right, consts)
    return False


def size_symbol(node: ast.AST) -> str:
    """Guess which input dimension an expression measures: m (rows) or n."""
    ids = names_in(node)
    src = ast.unparse(node)
    if ids & COL_NAMES or "[0])" in src:
        return "n"
    if ids & ROW_NAMES:
        return "m"
    if isinstance(node, ast.Call) and call_name(node) == "len" and node.args:
        arg = node.args[0]
        if isinstance(arg, ast.Name) and arg.id in {"grid", "matrix", "board", "mat"}:
            return "m"
    return "n"


def halves(body: list[ast.stmt]) -> bool:
    """Binary-search style: mid = (lo + hi) // 2, x //= 2, x >>= 1, ..."""
    for n in ast.walk(ast.Module(body=body, type_ignores=[])):
        if isinstance(n, ast.AugAssign) and isinstance(n.op, (ast.FloorDiv, ast.RShift, ast.Div)):
            return True
        if isinstance(n, ast.BinOp) and isinstance(n.op, (ast.FloorDiv, ast.RShift)):
            if isinstance(n.right, ast.Constant) and n.right.value in (1, 2):
                return True
    return False


def pops_in(body: list[ast.stmt]) -> bool:
    return any(call_name(n) in {"pop", "popleft", "heappop"} for s in body for n in ast.walk(s))


def mutates_marker(body: list[ast.stmt]) -> bool:
    """Marks nodes visited: `grid[r][c] = ...`, `visited.add(...)`, `seen[x] = True`."""
    for n in ast.walk(ast.Module(body=body, type_ignores=[])):
        if isinstance(n, ast.Assign) and any(isinstance(t, ast.Subscript) for t in n.targets):
            return True
        if call_name(n) == "add":
            return True
    return False


def swaps_in_place(body: list[ast.stmt]) -> bool:
    """`a[i], a[j] = a[j], a[i]`: a tuple swap between two slots of the same list."""
    for n in ast.walk(ast.Module(body=body, type_ignores=[])):
        if isinstance(n, ast.Assign) and len(n.targets) == 1 and isinstance(n.targets[0], ast.Tuple):
            elts = n.targets[0].elts
            if len(elts) == 2 and all(isinstance(e, ast.Subscript) for e in elts):
                return True
    return False


def pushes_heap(body: list[ast.stmt]) -> bool:
    return any(call_name(n) in {"heappush", "heappushpop", "heapreplace"} for s in body for n in ast.walk(s))


# ---------------------------------------------------------------- analysis


class FunctionAnalyzer:
    def __init__(self, fn: ast.FunctionDef, module: ModuleInfo, report: Report):
        self.fn = fn
        self.mod = module
        self.r = report
        self.consts: set[str] = set()
        self.worklists: set[str] = set()
        self.containers: set[str] = set()  # names bound to growable containers
        self.list_names: set[str] = set()
        self.params = {a.arg for a in fn.args.args if a.arg != "self"}
        self.in_worklist = False
        self.self_calls = 0
        self.space = ONE

    # -- entry
    def run(self) -> tuple[Cost, Cost]:
        t = self.block(self.fn.body, ONE)
        return t, self.space

    def block(self, body: list[ast.stmt], mult: Cost) -> Cost:
        return cmax(*(self.stmt(s, mult) for s in body)) if body else ONE

    # -- statements
    def stmt(self, s: ast.stmt, mult: Cost) -> Cost:
        if isinstance(s, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            return ONE  # nested helpers are analysed on their own
        if isinstance(s, ast.For):
            return self.for_loop(s, mult)
        if isinstance(s, ast.While):
            return self.while_loop(s, mult)
        if isinstance(s, ast.If):
            return cmax(self.expr_cost(s.test, mult, s), self.block(s.body, mult), self.block(s.orelse, mult))
        if isinstance(s, (ast.With, ast.Try)):
            parts = [self.block(getattr(s, "body", []), mult)]
            for h in getattr(s, "handlers", []):
                parts.append(self.block(h.body, mult))
            return cmax(*parts)
        if isinstance(s, (ast.Assign, ast.AnnAssign, ast.AugAssign)):
            self.track_assign(s, mult)
        return self.expr_cost(s, mult, s)

    def track_assign(self, s: ast.stmt, mult: Cost):
        targets = s.targets if isinstance(s, ast.Assign) else [s.target]
        value = s.value
        if value is None:
            return
        names = [t.id for t in targets if isinstance(t, ast.Name)]
        empty_container = isinstance(value, (ast.List, ast.Set, ast.Dict)) and not getattr(value, "elts", getattr(value, "keys", None))
        if is_const(value, self.consts) and not empty_container:
            self.consts.update(names)
            return
        if call_name(value) == "deque" or (isinstance(value, ast.List) and any(n in WORKLIST_NAMES for n in names)):
            self.worklists.update(names)
        if isinstance(value, (ast.List, ast.Dict, ast.Set)) or call_name(value) in CONTAINERS:
            self.containers.update(names)
        if isinstance(value, (ast.List, ast.ListComp)) or call_name(value) == "list":
            self.list_names.update(names)
        size = self.alloc_size(value)
        if size.key() > ONE.key():
            self.space = cmax(self.space, size)
            self.r.note(s, size, f"allocates {ast.unparse(targets[0])}: {size} extra space")

    def alloc_size(self, v: ast.AST) -> Cost:
        """Size of a freshly allocated structure."""
        if isinstance(v, ast.BinOp) and isinstance(v.op, ast.Mult):
            seq, k = (v.left, v.right) if isinstance(v.left, (ast.List, ast.Constant)) else (v.right, v.left)
            if isinstance(seq, (ast.List, ast.Constant)) and not is_const(k, self.consts):
                return Cost.of(size_symbol(k))
        if isinstance(v, (ast.ListComp, ast.SetComp, ast.DictComp, ast.GeneratorExp)):
            inner = v.elt if not isinstance(v, ast.DictComp) else v.value
            c = ONE
            for g in v.generators:
                if not is_const(g.iter, self.consts):
                    c = c * Cost.of(self.iter_symbol(g.iter))
            return c * self.alloc_size(inner)
        if call_name(v) in {"list", "set", "sorted", "Counter", "dict", "deque"} and v.args:
            if not is_const(v.args[0], self.consts):
                return Cost.of(self.iter_symbol(v.args[0]))
        return ONE

    def iter_symbol(self, it: ast.AST) -> str:
        if isinstance(it, ast.Call) and call_name(it) == "range" and it.args:
            return size_symbol(it.args[-1] if len(it.args) == 1 else it.args[1])
        return size_symbol(it)

    # -- loops
    def for_loop(self, s: ast.For, mult: Cost) -> Cost:
        it = s.iter
        src = ast.unparse(it)
        if is_const(it, self.consts) or (
            isinstance(it, ast.Call) and call_name(it) == "range" and all(is_const(a, self.consts) for a in it.args)
        ):
            factor, why = ONE, "constant-size loop (e.g. 4 directions): O(1) per visit"
        elif self.in_worklist and isinstance(it, ast.Subscript):
            factor, why = Cost(graph=True), f"neighbors of the popped node: each edge is scanned once overall → amortized O(E)"
        else:
            factor = Cost.of(self.iter_symbol(it))
            why = f"loops over {src}"
        inner = mult * factor
        self.r.note(s, inner, why)
        body = self.block(s.body, inner)
        # growing a container inside a loop grows space with the loop
        self.container_growth(s.body, inner)
        return cmax(inner, body)

    def while_loop(self, s: ast.While, mult: Cost) -> Cost:
        test_names = names_in(s.test)
        worklist = test_names & (self.worklists | WORKLIST_NAMES)
        if worklist and pops_in(s.body):
            stack_like = any(n in {"stack", "st"} for n in worklist) or not any(
                n in self.worklists for n in worklist) and "stack" in ast.unparse(s.test)
            if mult.key() > ONE.key() and (stack_like or isinstance(s.test, ast.BoolOp)):
                # `while stack and ...: stack.pop()` inside a for — every element is pushed/popped once
                self.r.note(s, mult, "amortized: each element is pushed once and popped at most once, "
                                     "so this inner loop adds O(n) in total, not per iteration")
                factor = ONE
                prev = self.in_worklist
                body = self.block(s.body, mult)
                self.in_worklist = prev
                return cmax(mult, body)
            if mult.key() > ONE.key() and mutates_marker(s.body):
                # BFS launched from inside a scan, marking before enqueueing: across *all*
                # launches each cell enters the queue once, so the scan's cost bounds it
                self.r.note(s, mult, "amortized: cells are marked before they're enqueued, so all BFS runs "
                                     "together touch each cell once — no extra factor")
                prev = self.in_worklist
                self.in_worklist = True
                body = self.block(s.body, mult)
                self.in_worklist = prev
                return cmax(mult, body)
            factor = N * (LOG if pushes_heap(s.body) else ONE)
            name = next(iter(worklist))
            msg = f"worklist loop on `{name}`: each item is added and removed once"
            if pushes_heap(s.body):
                msg += "; heap push/pop costs O(log n) each"
            self.space = cmax(self.space, N)
            prev = self.in_worklist
            self.in_worklist = True
            inner = mult * factor
            self.r.note(s, inner, msg)
            body = self.block(s.body, inner)
            self.in_worklist = prev
            return cmax(inner, body)
        if swaps_in_place(s.body) and any(isinstance(n, ast.Continue) for b in s.body for n in ast.walk(b)):
            inner = mult * N
            self.r.note(s, inner, "cyclic sort: each swap puts one value into its final slot and it's never moved again, "
                                  "so swaps + index steps ≤ 2n — amortized O(n) even though `continue` revisits slots")
            return cmax(inner, self.block(s.body, inner))
        if halves(s.body):
            inner = mult * LOG
            self.r.note(s, inner, "search space halves every iteration → O(log n) iterations")
            return cmax(inner, self.block(s.body, inner))
        if isinstance(s.test, ast.Compare) and len(test_names) >= 2:
            inner = mult * N
            self.r.note(s, inner, "two pointers moving toward each other: at most n steps")
            return cmax(inner, self.block(s.body, inner))
        self.r.guesses += 1
        inner = mult * N
        self.r.note(s, inner, "while loop — assumed to run O(n) times (couldn't prove a tighter bound)")
        return cmax(inner, self.block(s.body, inner))

    def container_growth(self, body: list[ast.stmt], mult: Cost):
        for n in ast.walk(ast.Module(body=body, type_ignores=[])):
            grows = (
                call_name(n) in {"append", "add", "appendleft", "heappush", "extend"}
                or (isinstance(n, ast.Assign) and any(isinstance(t, ast.Subscript) for t in n.targets)
                    and any(isinstance(t, ast.Subscript) and isinstance(t.value, ast.Name)
                            and t.value.id in self.containers - self.list_names for t in n.targets))
            )
            if grows and mult.key() > ONE.key():
                sp = Cost(poly=mult.poly, graph=mult.graph)
                if sp.key() > self.space.key():
                    self.space = sp
                    self.r.note(n, sp, "container grows inside the loop → up to one entry per iteration")
                return

    # -- expressions
    def expr_cost(self, node: ast.AST, mult: Cost, stmt: ast.stmt) -> Cost:
        worst = mult
        for n in ast.walk(node):
            name = call_name(n)
            extra = None
            if name in {"sorted", "sort"}:
                extra = Cost(poly=(("n", 1),), log=1), "sorting: O(n log n)"
            elif name in {"heappush", "heappop", "heappushpop", "heapreplace"}:
                extra = LOG, "heap operation: O(log n)"
            elif name == "heapify":
                extra = N, "heapify: O(n)"
            elif name in {"insert"} or (name == "pop" and n.args and not (
                    isinstance(n.args[0], ast.UnaryOp) or (isinstance(n.args[0], ast.Constant) and n.args[0].value == -1))):
                extra = N, "list insert/pop at the front shifts every element: O(n)"
            elif name in {"index", "count"} or (name in {"sum", "min", "max", "any", "all"} and n.args
                                                and not is_const(n.args[0], self.consts) and len(n.args) == 1
                                                and not isinstance(n.args[0], ast.Constant)):
                extra = N, f"{name}() scans the whole collection: O(n)"
            elif isinstance(n, ast.Compare) and any(isinstance(op, (ast.In, ast.NotIn)) for op in n.ops):
                right = n.comparators[0]
                if isinstance(right, ast.Name) and right.id in self.list_names:
                    extra = N, f"`in` on a list is a linear scan — use a set for O(1)"
            elif isinstance(n, ast.Subscript) and isinstance(n.slice, ast.Slice) and mult.key() > ONE.key():
                extra = N, "slicing copies: O(k) per slice"
            elif isinstance(n, ast.Call) and name in self.mod.functions:
                callee = self.mod.functions[name]
                if callee is self.fn:
                    self.self_calls += 1
                    continue
                c_time, amortized = self.mod.summary(name)
                if amortized:
                    # visited-marking traversal: total work across all calls is bounded
                    self.mod.amortized_total = cmax(self.mod.amortized_total, c_time)
                    continue
                extra = c_time, f"calls {name}(): {c_time} per call"
            if extra:
                cost = mult * extra[0]
                self.r.note(stmt, cost, extra[1] + (f" × {mult} iterations" if mult.key() > ONE.key() else ""))
                worst = cmax(worst, cost)
        return worst


class ModuleInfo:
    def __init__(self, tree: ast.Module, report: Report):
        self.report = report
        self.functions: dict[str, ast.FunctionDef] = {}
        for n in ast.walk(tree):
            if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)) and n.name not in self.functions:
                self.functions[n.name] = n
        self.cache: dict[str, tuple[Cost, bool]] = {}
        self.amortized_total = ONE

    def summary(self, name: str) -> tuple[Cost, bool]:
        """(time cost of one top-level call, whether it's an amortized traversal)."""
        if name in self.cache:
            return self.cache[name]
        self.cache[name] = (ONE, False)  # recursion guard
        fn = self.functions[name]
        fa = FunctionAnalyzer(fn, self, self.report)
        body, space = fa.run()
        result = recursion_cost(fn, fa, body, self.report)
        self.cache[name] = result[:2]
        self.report.space = cmax(self.report.space, space, result[2])
        return result[:2]


def memoized(fn: ast.FunctionDef) -> bool:
    for d in fn.decorator_list:
        src = ast.unparse(d)
        if "cache" in src:
            return True
    src = ast.unparse(fn)
    return "memo" in src or "dp[" in src and " in dp" in src


def marks_visited(fn: ast.FunctionDef) -> bool:
    src = ast.unparse(fn)
    return any(k in src for k in ("visited", "seen", "= '#'", '= "#"', "= '0'", '= "0"', "= 0\n", ".add("))


def recursion_cost(fn: ast.FunctionDef, fa: FunctionAnalyzer, body: Cost, r: Report) -> tuple[Cost, bool, Cost]:
    """Returns (time, amortized?, stack space)."""
    k = fa.self_calls
    if k == 0:
        return body, False, ONE
    src = ast.unparse(fn)
    params = [a.arg for a in fn.args.args if a.arg != "self"]
    if memoized(fn):
        states = Cost(poly=(("n", max(1, len([p for p in params if p not in {"memo"}]))),))
        total = states * body
        r.note(fn, total, f"memoized recursion: {states} distinct states × {body} work each")
        return total, False, N
    if ".left" in src or ".right" in src:
        r.note(fn, N, "tree recursion: every node is visited once → O(n); call stack is O(h) (h = tree height, n worst case)")
        return N * body, False, N
    if marks_visited(fn):
        grid = any(p in {"r", "c", "i", "j", "row", "col", "x", "y"} for p in params) and len(params) >= 2
        total = Cost(poly=(("m", 1), ("n", 1))) if grid else Cost(graph=True)
        r.note(fn, total, "DFS with visited marking: each cell/node is expanded once overall, however many times it's called")
        return total, True, total
    if halves(fn.body) or "mid" in src:
        t = Cost(poly=(("n", 1),), log=1) if k >= 2 else LOG
        r.note(fn, t, "divide and conquer on halves")
        return t, False, LOG
    in_loop = any(isinstance(n, (ast.For, ast.While)) and any(
        isinstance(c, ast.Call) and call_name(c) == fn.name for c in ast.walk(n)) for n in ast.walk(fn))
    if in_loop:
        perm = "used" in src or "remove" in src or "not in path" in src or "permut" in src
        exp = "n · n!" if perm else "n · 2ⁿ"
        r.note(fn, Cost(exp=exp), f"backtracking: branches in a loop at every level → O({exp}) (explores the full solution space)")
        return Cost(exp=exp), False, N
    if k >= 2:
        r.note(fn, Cost(exp="2ⁿ"), f"{k} recursive calls per level without memoization → O(2ⁿ). Add @cache to make it polynomial")
        return Cost(exp="2ⁿ"), False, N
    r.note(fn, N * body, "single recursive call per level → depth n")
    return N * body, False, N


def entry_function(tree: ast.Module) -> ast.FunctionDef | None:
    for n in tree.body:
        if isinstance(n, ast.ClassDef):
            for m in n.body:
                if isinstance(m, ast.FunctionDef) and not m.name.startswith("_"):
                    return m
    for n in tree.body:
        if isinstance(n, ast.FunctionDef):
            return n
    return None


def analyze(code: str) -> dict:
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return {"ok": False, "error": f"Syntax error on line {e.lineno}: {e.msg}"}
    fn = entry_function(tree)
    if fn is None:
        return {"ok": False, "error": "No function found. Paste a `class Solution` or a def."}

    report = Report()
    mod = ModuleInfo(tree, report)
    time, _ = mod.summary(fn.name)
    time = cmax(time, mod.amortized_total)
    report.time = time
    if report.space.key() == ONE.key():
        report.findings.append(Finding(fn.lineno, "O(1)", "only a fixed number of variables — no structure grows with the input"))

    confidence = "high" if report.guesses == 0 else "medium" if report.guesses == 1 else "low"
    findings = sorted({(f.line, f.message): f for f in report.findings}.values(), key=lambda f: f.line)
    return {
        "ok": True,
        "function": fn.name,
        "time": str(report.time),
        "space": str(report.space),
        "confidence": confidence,
        "findings": [f.__dict__ for f in findings],
    }
