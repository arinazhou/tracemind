from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from . import db
from .analyzer import analyze

Status = Literal["todo", "learning", "solved", "review"]
WEB_DIST = Path(__file__).resolve().parents[2] / "web" / "dist"


@asynccontextmanager
async def lifespan(_: FastAPI):
    db.init()
    yield


app = FastAPI(title="Tracemind API", lifespan=lifespan)


class EntryPatch(BaseModel):
    status: Status | None = None
    notes: str | None = Field(default=None, max_length=100_000)
    solution: str | None = Field(default=None, max_length=50_000)


class AnalyzeRequest(BaseModel):
    code: str = Field(max_length=50_000)


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/progress")
def list_progress():
    return db.all_progress()


@app.get("/api/progress/{num}")
def get_progress(num: int):
    entry = db.get_entry(num)
    if entry is None:
        raise HTTPException(404, "No progress for this problem yet")
    return entry


@app.put("/api/progress/{num}")
def put_progress(num: int, patch: EntryPatch):
    return db.update_entry(num, patch.model_dump(exclude_none=True))


@app.post("/api/progress/import")
def import_progress(entries: dict[int, dict]):
    return {"imported": db.import_entries(entries)}


@app.get("/api/activity")
def activity(tz_offset: int = 0):
    return db.activity_by_day(tz_offset)


@app.post("/api/analyze")
def analyze_code(req: AnalyzeRequest):
    return analyze(req.code)


# Serve the built frontend when it exists, so one process runs the whole app.
if WEB_DIST.exists():
    app.mount("/assets", StaticFiles(directory=WEB_DIST / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str):
        return FileResponse(WEB_DIST / "index.html")
