"""The Code Visualizer's tracer: anything that runs must trace."""

import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("pytrace", ROOT / "web/src/lab/pytrace.py")
pytrace = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pytrace)


def trace(code, **kw):
    return json.loads(pytrace.trace_json(json.dumps({"code": code, **kw})))


def top_vars(step):
    return step["stack"][-1]["vars"]


def test_plain_script_traces_top_level_code():
    out = trace("total = 0\nfor i in range(3):\n    total += i\nprint(total)\n", script=True)
    assert out["ok"] and out["stdout"] == "3\n"
    assert {s["line"] for s in out["steps"]} == {1, 2, 3, 4}
    assert top_vars(out["steps"][-1])["total"]["r"] == "3"


def test_print_output_is_attributed_to_the_step_that_printed():
    out = trace("print('a')\nx = 1\nprint('b')\n", script=True)
    offsets = [(s["line"], s["out"]) for s in out["steps"]]
    assert offsets == [(1, 2), (2, 2), (3, 4)]


def test_input_reads_stdin_and_reports_running_out():
    ok = trace("a = int(input())\nb = int(input())\nprint(a + b)\n", script=True, stdin="2\n5\n")
    assert ok["ok"] and ok["stdout"] == "7\n"
    short = trace("a = input()\nb = input()\n", script=True, stdin="only\n")
    assert not short["ok"] and "stdin" in short["error"]


def test_recursion_called_from_top_level():
    out = trace("def f(n):\n    return 1 if n <= 1 else n * f(n - 1)\n\nprint(f(4))\n", script=True)
    deepest = max(out["steps"], key=lambda s: len(s["stack"]))
    assert [fr["fn"] for fr in deepest["stack"]] == ["main", "f", "f", "f", "f"]
    assert out["stdout"] == "24\n"


def test_user_objects_show_fields_and_class_bodies_are_skipped():
    code = "class Box:\n    def __init__(self):\n        self.items = []\n\nb = Box()\nb.items.append(7)\n"
    out = trace(code, script=True)
    assert "Box" not in {fr["fn"] for s in out["steps"] for fr in s["stack"]}
    box = top_vars(out["steps"][-1])["b"]
    assert box["cls"] == "Box" and box["v"][0][1]["v"][0]["r"] == "7"


def test_imports_and_prelude_helpers_are_hidden():
    out = trace("import heapq\nfrom collections import Counter\nc = Counter('aab')\n", script=True)
    assert list(top_vars(out["steps"][-1])) == ["c"]


def test_infinite_loop_is_cut_off():
    out = trace("i = 0\nwhile True:\n    i += 1\n", script=True)
    assert out["truncated"] and len(out["steps"]) == pytrace.MAX_STEPS


def test_solution_mode_still_works():
    out = trace("class Solution:\n    def f(self, nums):\n        return sum(nums)\n", args="[1, 2, 3]")
    assert out["ok"] and out["result"]["r"] == "6"
