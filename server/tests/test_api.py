import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path, monkeypatch):
    from app import db
    monkeypatch.setattr(db, "DB_PATH", tmp_path / "test.db")
    from app.main import app
    with TestClient(app) as c:
        yield c


def test_progress_roundtrip(client):
    assert client.get("/api/progress").json() == {}
    r = client.put("/api/progress/207", json={"status": "solved", "notes": "kahn"})
    assert r.status_code == 200
    e = client.get("/api/progress/207").json()
    assert e["status"] == "solved" and e["notes"] == "kahn" and e["solvedCount"] == 1
    # re-solving after a review counts again; notes-only edits don't
    client.put("/api/progress/207", json={"status": "review"})
    client.put("/api/progress/207", json={"status": "solved"})
    client.put("/api/progress/207", json={"notes": "kahn + cycle check"})
    e = client.get("/api/progress/207").json()
    assert e["solvedCount"] == 2 and e["notes"] == "kahn + cycle check"


def test_done_date(client, tmp_path):
    e = client.put("/api/progress/41", json={"status": "solved"}).json()
    assert len(e["solvedAt"]) == 10                      # stamped with today's date
    e = client.put("/api/progress/41", json={"solvedAt": "2026-09-01"}).json()
    assert e["solvedAt"] == "2026-09-01" and e["status"] == "solved"
    e = client.put("/api/progress/41", json={"status": "todo"}).json()
    assert e["solvedAt"] == ""
    assert client.put("/api/progress/41", json={"solvedAt": "yesterday"}).status_code == 422


def test_migrates_old_database(tmp_path, monkeypatch):
    import sqlite3
    from app import db
    path = tmp_path / "old.db"
    old = sqlite3.connect(path)
    old.execute("CREATE TABLE progress (num INTEGER PRIMARY KEY, status TEXT NOT NULL DEFAULT 'todo', notes TEXT NOT NULL DEFAULT '', solution TEXT NOT NULL DEFAULT '', updated_at INTEGER NOT NULL DEFAULT 0, solved_count INTEGER NOT NULL DEFAULT 0)")
    old.execute("INSERT INTO progress (num, status) VALUES (207, 'solved')")
    old.commit(); old.close()
    monkeypatch.setattr(db, "DB_PATH", path)
    db.init()
    assert db.get_entry(207)["solvedAt"] == "" and db.get_entry(207)["status"] == "solved"


def test_rejects_bad_status(client):
    assert client.put("/api/progress/1", json={"status": "done"}).status_code == 422


def test_activity_counts_status_changes(client):
    client.put("/api/progress/1", json={"status": "learning"})
    client.put("/api/progress/1", json={"status": "solved"})
    days = client.get("/api/activity").json()
    assert sum(d["count"] for d in days) == 2
    assert sum(d["solved"] for d in days) == 1


def test_import_keeps_newer(client):
    client.put("/api/progress/3", json={"notes": "server"})
    r = client.post("/api/progress/import", json={
        "3": {"status": "todo", "notes": "old browser copy", "updatedAt": 1},
        "11": {"status": "solved", "notes": "", "updatedAt": 5, "solvedCount": 1},
    })
    assert r.json() == {"imported": 1}
    assert client.get("/api/progress/3").json()["notes"] == "server"
    assert client.get("/api/progress/11").json()["status"] == "solved"


def test_analyze_endpoint(client):
    r = client.post("/api/analyze", json={"code": "def f(a):\n    return sorted(a)"})
    assert r.json()["time"] == "O(n log n)"
