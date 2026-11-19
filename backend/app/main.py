import mimetypes
from pathlib import Path

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel, Field

from app.config import MAX_BYTES, data_dir
from app.db import connect, dumps, init_db, loads, new_id, utcnow
from app.security import hash_passphrase, investigator_from_token, new_token, verify_passphrase
from app.services.audio_analysis import analyze_audio, ffmpeg_exe
from app.services.common import kind_for
from app.services.correlation import correlate
from app.services.document_analysis import analyze_document
from app.services.image_analysis import analyze_image
from app.services.report import build_report
from app.services.video_analysis import analyze_video

import cv2
from PIL import Image

app = FastAPI(title="TruthLens", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    init_db()


class EnterIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    passphrase: str = Field(min_length=4, max_length=200)


class InvestigationIn(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    modules: list[str] = Field(default_factory=lambda: ["image", "video", "audio", "document"])


class AnalyzeIn(BaseModel):
    modules: list[str] = Field(default_factory=lambda: ["image", "video", "audio", "document"])


from fastapi import Header, Request


def token_from_request(authorization: str | None, access_token: str | None) -> str | None:
    if authorization and authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1].strip()
    return access_token


def user_dep(request: Request, authorization: str | None = Header(default=None), access_token: str | None = None):
    token = token_from_request(authorization, access_token)
    with connect() as conn:
        user = investigator_from_token(conn, token)
    if not user:
        raise HTTPException(status_code=401, detail="Sign in again to continue this investigation.")
    return user


def owned_investigation(conn, investigation_id: str, user_id: str):
    row = conn.execute(
        "SELECT * FROM investigations WHERE id = ? AND investigator_id = ?",
        (investigation_id, user_id),
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="That investigation was not found.")
    return dict(row)


def evidence_rows(conn, investigation_id: str) -> list[dict]:
    rows = conn.execute(
        "SELECT * FROM evidence WHERE investigation_id = ? ORDER BY created_at",
        (investigation_id,),
    ).fetchall()
    items = []
    for row in rows:
        item = dict(row)
        analysis = conn.execute("SELECT payload_json FROM analyses WHERE evidence_id = ?", (item["id"],)).fetchone()
        item["analysis"] = loads(analysis["payload_json"]) if analysis else None
        items.append(item)
    return items


def public_investigation(conn, row: dict) -> dict:
    correlation = conn.execute(
        "SELECT payload_json FROM correlations WHERE investigation_id = ?",
        (row["id"],),
    ).fetchone()
    investigator = conn.execute("SELECT name FROM investigators WHERE id = ?", (row["investigator_id"],)).fetchone()
    return {
        "id": row["id"],
        "title": row["title"],
        "created_at": row["created_at"],
        "modules": loads(row["modules_json"]) or [],
        "investigator_name": investigator["name"] if investigator else "",
        "evidence": evidence_rows(conn, row["id"]),
        "correlation": loads(correlation["payload_json"]) if correlation else None,
    }


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "truthlens"}


@app.get("/api/capabilities")
def capabilities():
    whisper = False
    try:
        import whisper  # type: ignore

        whisper = True
        del whisper
    except Exception:
        whisper = False
    mediapipe = False
    try:
        import mediapipe  # type: ignore

        mediapipe = True
        del mediapipe
    except Exception:
        mediapipe = False
    return {
        "api": {"available": True, "detail": "FastAPI is responding."},
        "opencv": {"available": True, "detail": f"OpenCV {cv2.__version__} is imported."},
        "pillow": {"available": True, "detail": f"Pillow {Image.__version__} is imported."},
        "ffmpeg": {
            "available": ffmpeg_exe() is not None,
            "detail": "Bundled imageio-ffmpeg binary." if ffmpeg_exe() else "ffmpeg binary was not found.",
        },
        "deepfake_classifier": {
            "available": False,
            "detail": "No Hugging Face detector is configured. TruthLens will not invent a detection percentage.",
        },
        "whisper": {
            "available": whisper,
            "detail": "Whisper can transcribe." if whisper else "Whisper is not installed, so transcription is unavailable.",
        },
        "mediapipe": {
            "available": mediapipe,
            "detail": "MediaPipe is available." if mediapipe else "MediaPipe is not installed. Face rectangles use Haar cascades when OpenCV provides them.",
        },
    }


@app.post("/api/auth/enter")
def enter(body: EnterIn):
    name = body.name.strip()
    with connect() as conn:
        existing = conn.execute("SELECT * FROM investigators WHERE name = ?", (name,)).fetchone()
        if existing is None:
            investigator_id = new_id("inv")
            conn.execute(
                "INSERT INTO investigators (id, name, passphrase_hash, created_at) VALUES (?, ?, ?, ?)",
                (investigator_id, name, hash_passphrase(body.passphrase), utcnow()),
            )
            created = True
        else:
            if not verify_passphrase(body.passphrase, existing["passphrase_hash"]):
                raise HTTPException(status_code=401, detail="That passphrase does not match this investigator name.")
            investigator_id = existing["id"]
            created = False
        token = new_token()
        conn.execute(
            "INSERT INTO sessions (token, investigator_id, created_at) VALUES (?, ?, ?)",
            (token, investigator_id, utcnow()),
        )
        row = conn.execute("SELECT id, name, created_at FROM investigators WHERE id = ?", (investigator_id,)).fetchone()
    return {"token": token, "created": created, "investigator": dict(row)}


@app.get("/api/me")
def me(user=Depends(user_dep)):
    return user


@app.post("/api/investigations")
def create_investigation(body: InvestigationIn, user=Depends(user_dep)):
    allowed = {"image", "video", "audio", "document"}
    modules = [item for item in body.modules if item in allowed] or ["image", "video", "audio", "document"]
    investigation_id = new_id("case")
    with connect() as conn:
        conn.execute(
            "INSERT INTO investigations (id, investigator_id, title, modules_json, created_at) VALUES (?, ?, ?, ?, ?)",
            (investigation_id, user["id"], body.title.strip(), dumps(modules), utcnow()),
        )
        row = conn.execute("SELECT * FROM investigations WHERE id = ?", (investigation_id,)).fetchone()
        payload = public_investigation(conn, dict(row))
    return payload


@app.get("/api/investigations")
def list_investigations(user=Depends(user_dep)):
    with connect() as conn:
        rows = conn.execute(
            "SELECT id, title, created_at FROM investigations WHERE investigator_id = ? ORDER BY created_at DESC",
            (user["id"],),
        ).fetchall()
    return [dict(row) for row in rows]


@app.get("/api/investigations/{investigation_id}")
def get_investigation(investigation_id: str, user=Depends(user_dep)):
    with connect() as conn:
        row = owned_investigation(conn, investigation_id, user["id"])
        return public_investigation(conn, row)


@app.post("/api/investigations/{investigation_id}/evidence")
async def upload_evidence(investigation_id: str, file: UploadFile = File(...), user=Depends(user_dep)):
    kind = kind_for(file.filename or "")
    if not kind:
        raise HTTPException(status_code=400, detail="Use an image, video, audio, PDF, DOCX, or text file.")
    evidence_id = new_id("ev")
    ext = Path(file.filename or "file").suffix.lower()[:12]
    folder = data_dir() / "evidence" / evidence_id
    folder.mkdir(parents=True, exist_ok=True)
    stored_name = f"original{ext}"
    dest = folder / stored_name
    import hashlib

    digest = hashlib.sha256()
    size = 0
    try:
        with dest.open("wb") as handle:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                size += len(chunk)
                if size > MAX_BYTES:
                    raise HTTPException(status_code=413, detail="That file is larger than 200 MB.")
                digest.update(chunk)
                handle.write(chunk)
    except HTTPException:
        dest.unlink(missing_ok=True)
        raise
    mime = file.content_type or mimetypes.guess_type(file.filename or "")[0]
    with connect() as conn:
        owned_investigation(conn, investigation_id, user["id"])
        conn.execute(
            """
            INSERT INTO evidence (id, investigation_id, kind, filename, stored_name, sha256, size_bytes, mime, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                evidence_id,
                investigation_id,
                kind,
                Path(file.filename or stored_name).name,
                stored_name,
                digest.hexdigest(),
                size,
                mime,
                utcnow(),
            ),
        )
        row = conn.execute("SELECT * FROM evidence WHERE id = ?", (evidence_id,)).fetchone()
    return dict(row)


def run_analysis(item: dict) -> dict:
    path = data_dir() / "evidence" / item["id"] / item["stored_name"]
    artifacts = data_dir() / "evidence" / item["id"] / "artifacts"
    if item["kind"] == "image":
        return analyze_image(path, artifacts)
    if item["kind"] == "video":
        return analyze_video(path, artifacts)
    if item["kind"] == "audio":
        return analyze_audio(path, artifacts)
    if item["kind"] == "document":
        return analyze_document(path)
    return {"module": item["kind"], "status": "unavailable", "findings": [], "limitations": ["Unknown evidence kind."], "unavailable": [], "measurements": {}, "artifacts": [], "engine": "none"}


@app.post("/api/investigations/{investigation_id}/analyze")
def analyze(investigation_id: str, body: AnalyzeIn, user=Depends(user_dep)):
    selected = set(body.modules)
    results = []
    with connect() as conn:
        row = owned_investigation(conn, investigation_id, user["id"])
        items = evidence_rows(conn, investigation_id)
        for item in items:
            if item["kind"] not in selected:
                continue
            payload = run_analysis(item)
            conn.execute(
                """
                INSERT INTO analyses (evidence_id, payload_json, updated_at) VALUES (?, ?, ?)
                ON CONFLICT(evidence_id) DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at
                """,
                (item["id"], dumps(payload), utcnow()),
            )
            item["analysis"] = payload
            results.append({"evidence_id": item["id"], "status": payload.get("status")})
        refreshed = evidence_rows(conn, investigation_id)
        correlation = correlate(public_investigation(conn, row), refreshed)
        conn.execute(
            """
            INSERT INTO correlations (investigation_id, payload_json, updated_at) VALUES (?, ?, ?)
            ON CONFLICT(investigation_id) DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at
            """,
            (investigation_id, dumps(correlation), utcnow()),
        )
    return {"results": results}


@app.post("/api/investigations/{investigation_id}/correlate")
def recorrelate(investigation_id: str, user=Depends(user_dep)):
    with connect() as conn:
        row = owned_investigation(conn, investigation_id, user["id"])
        payload = correlate(public_investigation(conn, row), evidence_rows(conn, investigation_id))
        conn.execute(
            """
            INSERT INTO correlations (investigation_id, payload_json, updated_at) VALUES (?, ?, ?)
            ON CONFLICT(investigation_id) DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at
            """,
            (investigation_id, dumps(payload), utcnow()),
        )
    return payload


@app.get("/api/investigations/{investigation_id}/report.pdf")
def report(investigation_id: str, user=Depends(user_dep)):
    with connect() as conn:
        row = owned_investigation(conn, investigation_id, user["id"])
        full = public_investigation(conn, row)
    pdf = build_report(full, full["evidence"], full["correlation"])
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="TruthLens-{investigation_id}.pdf"'},
    )


def owned_evidence(conn, evidence_id: str, user_id: str):
    row = conn.execute(
        """
        SELECT e.*, i.investigator_id
        FROM evidence e
        JOIN investigations i ON i.id = e.investigation_id
        WHERE e.id = ? AND i.investigator_id = ?
        """,
        (evidence_id, user_id),
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="That evidence file was not found.")
    return dict(row)


@app.get("/api/evidence/{evidence_id}/file")
def evidence_file(evidence_id: str, user=Depends(user_dep)):
    with connect() as conn:
        item = owned_evidence(conn, evidence_id, user["id"])
    path = data_dir() / "evidence" / item["id"] / item["stored_name"]
    return FileResponse(path, filename=item["filename"], media_type=item["mime"] or "application/octet-stream")


@app.get("/api/evidence/{evidence_id}/artifact/{name}")
def artifact(evidence_id: str, name: str, user=Depends(user_dep)):
    if "/" in name or "\\" in name or ".." in name:
        raise HTTPException(status_code=400, detail="That artifact name is not valid.")
    with connect() as conn:
        item = owned_evidence(conn, evidence_id, user["id"])
    path = data_dir() / "evidence" / item["id"] / "artifacts" / name
    if not path.exists() or not path.is_file():
        nested = data_dir() / "evidence" / item["id"] / "artifacts" / "audio" / name
        path = nested if nested.exists() else path
    if not path.exists():
        raise HTTPException(status_code=404, detail="That preview has not been generated.")
    return FileResponse(path)
