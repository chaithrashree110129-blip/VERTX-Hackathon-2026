import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA = ROOT / "data"
MAX_BYTES = int(os.environ.get("TRUTHLENS_MAX_BYTES", str(200 * 1024 * 1024)))


def data_dir() -> Path:
    path = Path(os.environ.get("TRUTHLENS_DATA", DEFAULT_DATA))
    path.mkdir(parents=True, exist_ok=True)
    (path / "evidence").mkdir(exist_ok=True)
    return path
