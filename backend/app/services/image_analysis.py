from pathlib import Path

import numpy as np
from PIL import Image, ExifTags

from app.services.common import CLASSIFIER_REASON, MEDIAPIPE_REASON, base_result, finding, unavailable

try:
    import cv2
except Exception:  # pragma: no cover
    cv2 = None


def _exif(image: Image.Image) -> dict:
    raw = {}
    try:
        exif = image.getexif()
    except Exception:
        return raw
    if not exif:
        return raw
    for key, value in exif.items():
        name = ExifTags.TAGS.get(key, str(key))
        if name in {"MakerNote", "UserComment", "PrintImageMatching"}:
            continue
        text = str(value)
        if len(text) > 180:
            text = text[:177] + "..."
        raw[str(name)] = text
        if len(raw) >= 24:
            break
    return raw


def _cascade(name: str):
    if cv2 is None or not hasattr(cv2, "data"):
        return None
    path = Path(cv2.data.haarcascades) / name
    if not path.exists():
        return None
    cascade = cv2.CascadeClassifier(str(path))
    if cascade.empty():
        return None
    return cascade


def _boxes(cascade, gray, scale=1.1, neighbors=4, min_size=(12, 12)):
    if cascade is None:
        return []
    found = cascade.detectMultiScale(gray, scaleFactor=scale, minNeighbors=neighbors, minSize=min_size)
    boxes = []
    for x, y, w, h in found:
        boxes.append({"x": int(x), "y": int(y), "w": int(w), "h": int(h)})
    return boxes


def analyze_image(path: Path, artifact_dir: Path) -> dict:
    result = base_result("image", "Pillow + NumPy FFT + OpenCV Haar")
    result["unavailable"].append(unavailable("deepfake classifier", CLASSIFIER_REASON))
    result["unavailable"].append(unavailable("mediapipe facial mesh", MEDIAPIPE_REASON))
    result["limitations"].extend(
        [
            "Error Level Analysis only describes JPEG recompression differences. A bright ELA region is not proof of forgery.",
            "A high-frequency FFT ratio describes energy distribution. It is not an authenticity score.",
            "A detected face rectangle does not identify a person and does not prove the image is real or synthetic.",
        ]
    )
    artifact_dir.mkdir(parents=True, exist_ok=True)
    with Image.open(path) as image:
        image.load()
        mode = image.mode
        fmt = image.format or path.suffix.lstrip(".").upper()
        exif = _exif(image)
        rgb = image.convert("RGB")
    width, height = rgb.size
    result["measurements"] = {
        "width": width,
        "height": height,
        "mode": mode,
        "format": fmt,
        "exif": exif,
    }
    if exif:
        result["findings"].append(
            finding(
                "Embedded metadata is present",
                f"{len(exif)} EXIF fields were read. Metadata can be incomplete or edited, so it is context, not proof of origin.",
                "Pillow EXIF",
            )
        )
    else:
        result["findings"].append(
            finding(
                "No EXIF metadata was read",
                "The file has no readable EXIF block. Missing metadata is common for screenshots and exports. It is not evidence of manipulation.",
                "Pillow EXIF",
            )
        )

    if path.suffix.lower() in {".jpg", ".jpeg"} or fmt == "JPEG":
        ela = _ela(rgb, artifact_dir)
        result["measurements"]["ela"] = ela["stats"]
        result["artifacts"].append({"name": "ela.png", "label": "Error Level Analysis residual"})
        result["findings"].append(
            finding(
                "JPEG Error Level Analysis was computed",
                (
                    f"Mean residual {ela['stats']['mean']:.2f}, 98th percentile {ela['stats']['p98']:.2f}, "
                    f"max {ela['stats']['max']:.2f}. {len(ela['stats']['hotspots'])} high-residual regions are marked for review."
                ),
                "Re-save at JPEG quality 90 and subtract",
                "review" if ela["stats"]["hotspots"] else "info",
            )
        )
    else:
        result["measurements"]["ela"] = {"applicable": False, "reason": "ELA is only computed for JPEG files."}
        result["findings"].append(
            finding(
                "Error Level Analysis was not applied",
                "This file is not a JPEG. Recompressing a PNG to invent an ELA image would create a misleading artifact, so it was skipped.",
                "File format",
            )
        )

    grid, ratio = _spectrum(rgb, artifact_dir)
    result["measurements"]["frequency"] = {"high_band_ratio": ratio, "grid": grid}
    result["artifacts"].append({"name": "spectrum.png", "label": "Log-magnitude FFT"})
    result["findings"].append(
        finding(
            "Frequency spectrum was measured",
            f"Energy outside the central quarter of the FFT is {ratio:.3f} of the total log-magnitude energy.",
            "2D FFT of the luminance image",
        )
    )

    faces, eyes, smiles, note = _faces(rgb)
    result["measurements"]["faces"] = faces
    result["measurements"]["eyes"] = eyes
    result["measurements"]["smiles"] = smiles
    if note:
        result["limitations"].append(note)
    result["findings"].append(
        finding(
            "Face cascade result",
            f"Haar frontal-face cascade returned {len(faces)} rectangle(s), eye cascade {len(eyes)}, smile cascade {len(smiles)}.",
            "OpenCV Haar cascades" if cv2 is not None else "OpenCV unavailable",
        )
    )
    return result


def _ela(rgb: Image.Image, artifact_dir: Path) -> dict:
    import io

    buffer = io.BytesIO()
    rgb.save(buffer, format="JPEG", quality=90)
    buffer.seek(0)
    resaved = Image.open(buffer).convert("RGB")
    original = np.asarray(rgb, dtype=np.float32)
    compared = np.asarray(resaved, dtype=np.float32)
    diff = np.mean(np.abs(original - compared), axis=2)
    peak = float(diff.max()) if diff.size else 0.0
    scale = 255.0 / peak if peak > 0 else 1.0
    vis = np.clip(diff * scale, 0, 255).astype(np.uint8)
    Image.fromarray(vis, mode="L").save(artifact_dir / "ela.png")
    p98 = float(np.quantile(diff, 0.98)) if diff.size else 0.0
    hotspots = []
    if cv2 is not None and peak > 0:
        mask = (diff >= p98).astype(np.uint8) * 255
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        boxes = []
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            if w * h < 36:
                continue
            boxes.append({"x": int(x), "y": int(y), "w": int(w), "h": int(h), "area": int(w * h)})
        boxes.sort(key=lambda item: item["area"], reverse=True)
        hotspots = boxes[:6]
    return {
        "stats": {
            "applicable": True,
            "mean": round(float(diff.mean()) if diff.size else 0.0, 4),
            "max": round(peak, 4),
            "p98": round(p98, 4),
            "hotspots": hotspots,
            "note": "The preview is stretched to full contrast so weak residuals stay visible. Brightness is not a probability.",
        }
    }


def _spectrum(rgb: Image.Image, artifact_dir: Path):
    gray = rgb.convert("L")
    gray.thumbnail((256, 256))
    values = np.asarray(gray, dtype=np.float32)
    spectrum = np.fft.fftshift(np.fft.fft2(values))
    magnitude = np.log1p(np.abs(spectrum))
    total = float(magnitude.sum()) + 1e-9
    yy, xx = np.ogrid[: magnitude.shape[0], : magnitude.shape[1]]
    cy, cx = magnitude.shape[0] / 2, magnitude.shape[1] / 2
    radius = min(magnitude.shape) * 0.25
    center = ((yy - cy) ** 2 + (xx - cx) ** 2) <= radius**2
    high = float(magnitude[~center].sum()) / total
    norm = magnitude - magnitude.min()
    peak = float(norm.max()) or 1.0
    vis = np.clip(norm / peak * 255, 0, 255).astype(np.uint8)
    Image.fromarray(vis, mode="L").save(artifact_dir / "spectrum.png")
    small = _downsample(norm / peak, 48, 48)
    return small, round(high, 4)


def _downsample(grid: np.ndarray, rows: int, cols: int):
    ys = np.linspace(0, grid.shape[0] - 1, rows).astype(int)
    xs = np.linspace(0, grid.shape[1] - 1, cols).astype(int)
    sample = grid[ys][:, xs]
    return [[round(float(value), 3) for value in row] for row in sample]


def _faces(rgb: Image.Image):
    if cv2 is None:
        return [], [], [], "OpenCV is not importable, so no face rectangle was searched."
    array = np.asarray(rgb)
    gray = cv2.cvtColor(array, cv2.COLOR_RGB2GRAY)
    face_cascade = _cascade("haarcascade_frontalface_default.xml")
    eye_cascade = _cascade("haarcascade_eye.xml")
    smile_cascade = _cascade("haarcascade_smile.xml")
    if face_cascade is None:
        return [], [], [], "The Haar cascade files were not found in this OpenCV build."
    faces = _boxes(face_cascade, gray, 1.1, 5, (40, 40))
    eyes = []
    smiles = []
    for face in faces:
        roi = gray[face["y"] : face["y"] + face["h"], face["x"] : face["x"] + face["w"]]
        for eye in _boxes(eye_cascade, roi, 1.1, 6, (8, 8)):
            eyes.append(
                {"x": face["x"] + eye["x"], "y": face["y"] + eye["y"], "w": eye["w"], "h": eye["h"]}
            )
        mouth_top = face["y"] + int(face["h"] * 0.55)
        mouth = gray[mouth_top : face["y"] + face["h"], face["x"] : face["x"] + face["w"]]
        for smile in _boxes(smile_cascade, mouth, 1.3, 12, (12, 8)):
            smiles.append(
                {
                    "x": face["x"] + smile["x"],
                    "y": mouth_top + smile["y"],
                    "w": smile["w"],
                    "h": smile["h"],
                }
            )
    return faces, eyes, smiles, ""
