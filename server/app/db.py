"""SQLite storage. One file, stdlib only — nothing to migrate or host."""

import os
import sqlite3
import time
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path(os.environ.get("TRACEMIND_DB", Path(__file__).resolve().parent.parent / "tracemind.db"))

SCHEMA = """
CREATE TABLE IF NOT EXISTS progress (
    num          INTEGER PRIMARY KEY,
    status       TEXT    NOT NULL DEFAULT 'todo',
    notes        TEXT    NOT NULL DEFAULT '',
    solution     TEXT    NOT NULL DEFAULT '',
    solved_at    TEXT    NOT NULL DEFAULT '',
    updated_at   INTEGER NOT NULL DEFAULT 0,
    solved_count INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS activity (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    num   INTEGER NOT NULL,
    kind  TEXT    NOT NULL,
    value TEXT    NOT NULL DEFAULT '',
    at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS activity_at ON activity(at);
"""

FIELDS = ("status", "notes", "solution", "updated_at", "solved_count")


@contextmanager
def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init() -> None:
    with connect() as c:
        c.executescript(SCHEMA)
        cols = {r["name"] for r in c.execute("PRAGMA table_info(progress)")}
        if "solved_at" not in cols:  # databases created before the tracker had dates
            c.execute("ALTER TABLE progress ADD COLUMN solved_at TEXT NOT NULL DEFAULT ''")


def now_ms() -> int:
    return int(time.time() * 1000)


def row_to_entry(r: sqlite3.Row) -> dict:
    return {
        "status": r["status"],
        "notes": r["notes"],
        "solution": r["solution"],
        "solvedAt": r["solved_at"],
        "updatedAt": r["updated_at"],
        "solvedCount": r["solved_count"],
    }


def all_progress() -> dict[int, dict]:
    with connect() as c:
        return {r["num"]: row_to_entry(r) for r in c.execute("SELECT * FROM progress")}


def get_entry(num: int) -> dict | None:
    with connect() as c:
        r = c.execute("SELECT * FROM progress WHERE num = ?", (num,)).fetchone()
        return row_to_entry(r) if r else None


def update_entry(num: int, patch: dict) -> dict:
    """Merge a partial update; log status changes and first-time solves."""
    ts = now_ms()
    with connect() as c:
        r = c.execute("SELECT * FROM progress WHERE num = ?", (num,)).fetchone()
        prev = row_to_entry(r) if r else {"status": "todo", "notes": "", "solution": "", "solvedAt": "", "updatedAt": 0, "solvedCount": 0}
        nxt = {**prev, **{k: v for k, v in patch.items() if v is not None}, "updatedAt": ts}
        if patch.get("status") == "solved" and not prev["solvedAt"] and patch.get("solvedAt") is None:
            nxt["solvedAt"] = time.strftime("%Y-%m-%d")
        if patch.get("status") == "todo":
            nxt["solvedAt"] = ""
        if patch.get("status") == "solved" and prev["status"] != "solved":
            nxt["solvedCount"] = prev["solvedCount"] + 1
        c.execute(
            """INSERT INTO progress (num, status, notes, solution, solved_at, updated_at, solved_count)
               VALUES (?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(num) DO UPDATE SET status = excluded.status, notes = excluded.notes,
                 solution = excluded.solution, solved_at = excluded.solved_at,
                 updated_at = excluded.updated_at, solved_count = excluded.solved_count""",
            (num, nxt["status"], nxt["notes"], nxt["solution"], nxt["solvedAt"], nxt["updatedAt"], nxt["solvedCount"]),
        )
        for kind in ("status", "solution"):
            if kind in patch and patch[kind] is not None and patch[kind] != prev[kind]:
                c.execute(
                    "INSERT INTO activity (num, kind, value, at) VALUES (?, ?, ?, ?)",
                    (num, kind, patch[kind] if kind == "status" else "", ts),
                )
    return nxt


def import_entries(entries: dict[int, dict]) -> int:
    """Bulk-merge entries (e.g. from browser storage); newer updatedAt wins."""
    imported = 0
    with connect() as c:
        for num, e in entries.items():
            r = c.execute("SELECT updated_at FROM progress WHERE num = ?", (num,)).fetchone()
            if r and r["updated_at"] >= e.get("updatedAt", 0):
                continue
            c.execute(
                """INSERT OR REPLACE INTO progress (num, status, notes, solution, solved_at, updated_at, solved_count)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (num, e.get("status", "todo"), e.get("notes", ""), e.get("solution", ""), e.get("solvedAt", ""),
                 e.get("updatedAt", 0), e.get("solvedCount", 0)),
            )
            imported += 1
    return imported


def activity_by_day(tz_offset_min: int = 0) -> list[dict]:
    """Count activity events per local calendar day."""
    shift = -tz_offset_min * 60 * 1000  # JS getTimezoneOffset() is minutes *behind* UTC
    with connect() as c:
        rows = c.execute(
            """SELECT date((at + ?) / 1000, 'unixepoch') AS day, COUNT(*) AS n,
                      SUM(kind = 'status' AND value = 'solved') AS solved
               FROM activity GROUP BY day ORDER BY day""",
            (shift,),
        )
        return [{"day": r["day"], "count": r["n"], "solved": r["solved"] or 0} for r in rows]
