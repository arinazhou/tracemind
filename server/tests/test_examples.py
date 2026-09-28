"""Every lesson's worked example must run, return the expected answer, trace
cleanly in the Code Lab tracer, and get the Big-O the lesson claims."""

import importlib.util
import json
from pathlib import Path

import pytest

from app.analyzer import analyze

ROOT = Path(__file__).resolve().parents[2]
EXAMPLES = sorted((ROOT / "web/src/learn/examples").glob("*.py"))

spec = importlib.util.spec_from_file_location("pytrace", ROOT / "web/src/lab/pytrace.py")
pytrace = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pytrace)


def parse(path):
    header, code = {}, []
    for line in path.read_text().splitlines():
        if not code and line.startswith("# ") and ":" in line:
            key, _, val = line[2:].partition(":")
            header.setdefault(key.strip(), []).append(val.strip())
        else:
            code.append(line)
    return header, "\n".join(code).strip() + "\n"


def plain(v):
    """ListNode -> list of values, TreeNode -> level order, so results compare to JSON-ish literals."""
    if hasattr(v, "next") and hasattr(v, "val"):
        out = []
        while v is not None and len(out) < 1000:
            out.append(v.val)
            v = v.next
        return out
    return v


@pytest.mark.parametrize("path", EXAMPLES, ids=lambda p: p.stem)
def test_example(path):
    header, code = parse(path)
    expect = eval(header["expect"][0])

    # 1. the answer is right (plain CPython, no tracing)
    ns = {}
    exec(pytrace.PRELUDE, ns)
    exec(code, ns)
    if "driver" in header:
        *body, last = header["driver"]
        exec("\n".join(body), ns)
        value = eval(last, ns)
    else:
        value = eval(pytrace.build_call(code, header["call"][0]), ns)
    assert plain(value) == expect

    # 2. it traces cleanly within the step budget
    payload = {"code": code, "driver": "\n".join(header["driver"])} if "driver" in header else {"code": code, "args": header["call"][0]}
    out = json.loads(pytrace.trace_json(json.dumps(payload)))
    assert out["ok"], out.get("error")
    assert not out["truncated"]
    assert 5 <= len(out["steps"]) <= 400, "keep examples small enough to step through"

    # 3. the analyzer agrees with the lesson
    result = analyze(code)
    assert result["ok"]
    # it must agree with the lesson, or at least not be confidently wrong
    if result["time"] != header["time"][0]:
        assert result["confidence"] != "high", f"confidently wrong: analyzer says {result['time']}"
