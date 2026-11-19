from pathlib import Path

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"}
VIDEO_EXT = {".mp4", ".webm", ".mov", ".avi", ".mkv"}
AUDIO_EXT = {".wav", ".mp3", ".m4a", ".flac", ".ogg", ".aac"}
DOC_EXT = {".txt", ".pdf", ".docx"}


def kind_for(filename: str) -> str | None:
    ext = Path(filename).suffix.lower()
    if ext in IMAGE_EXT:
        return "image"
    if ext in VIDEO_EXT:
        return "video"
    if ext in AUDIO_EXT:
        return "audio"
    if ext in DOC_EXT:
        return "document"
    return None


def base_result(module: str, engine: str) -> dict:
    return {
        "module": module,
        "status": "completed",
        "engine": engine,
        "limitations": [],
        "unavailable": [],
        "measurements": {},
        "findings": [],
        "artifacts": [],
    }


def finding(title: str, detail: str, basis: str, severity: str = "info") -> dict:
    return {"title": title, "detail": detail, "basis": basis, "severity": severity}


def unavailable(name: str, reason: str) -> dict:
    return {"name": name, "reason": reason}


CLASSIFIER_REASON = (
    "No deepfake classifier is loaded. Set TRUTHLENS_HF_MODEL only if that model is already "
    "installed locally. TruthLens does not download or invent a model score."
)
WHISPER_REASON = (
    "Whisper is not installed in this environment, so TruthLens did not transcribe speech."
)
MEDIAPIPE_REASON = (
    "MediaPipe is not installed. Face and eye rectangles, when present, come from OpenCV Haar cascades. "
    "They are not a 468-point facial mesh and they do not measure authenticity."
)
