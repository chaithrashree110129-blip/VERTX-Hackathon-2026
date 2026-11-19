from pathlib import Path

import numpy as np

from app.services.audio_analysis import analyze_audio
from app.services.common import base_result, finding

try:
    import cv2
except Exception:  # pragma: no cover
    cv2 = None


def analyze_video(path: Path, artifact_dir: Path) -> dict:
    result = base_result("video", "OpenCV frame sampling + mean absolute difference")
    result["limitations"].extend(
        [
            "Inter-frame difference measures motion and scene change. A peak is not a deepfake timestamp.",
            "Frames are sampled, not every frame in the file. Short flashes between samples are not visible here.",
            "Facial consistency across time requires a landmark model. MediaPipe is not installed, so that comparison was not made.",
        ]
    )
    result["unavailable"].append(
        {
            "name": "deepfake classifier",
            "reason": "No video deepfake model is loaded. Frame-difference is not a substitute score.",
        }
    )
    if cv2 is None:
        result["status"] = "unavailable"
        result["findings"].append(finding("OpenCV is unavailable", "Video frames were not read.", "import cv2", "review"))
        return result

    artifact_dir.mkdir(parents=True, exist_ok=True)
    capture = cv2.VideoCapture(str(path))
    if not capture.isOpened():
        result["status"] = "error"
        result["findings"].append(
            finding(
                "Video could not be opened",
                "OpenCV could not decode this file. The bytes are still hashed and stored.",
                "cv2.VideoCapture",
                "review",
            )
        )
        return result

    fps = float(capture.get(cv2.CAP_PROP_FPS) or 0)
    frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
    duration = frame_count / fps if fps and frame_count else None
    indexes = _sample_indexes(frame_count)
    samples = []
    previous = None
    for index in indexes:
        capture.set(cv2.CAP_PROP_POS_FRAMES, index)
        ok, frame = capture.read()
        if not ok or frame is None:
            continue
        time_s = index / fps if fps else None
        name = f"frame_{index:06d}.jpg"
        cv2.imwrite(str(artifact_dir / name), frame, [int(cv2.IMWRITE_JPEG_QUALITY), 72])
        small = cv2.resize(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY), (160, 90))
        mad = None
        if previous is not None:
            mad = float(np.mean(np.abs(small.astype(np.float32) - previous)))
        previous = small.astype(np.float32)
        samples.append(
            {
                "index": int(index),
                "time_s": None if time_s is None else round(time_s, 3),
                "mad": None if mad is None else round(mad, 4),
                "artifact": name,
            }
        )
    capture.release()

    mads = [item["mad"] for item in samples if item["mad"] is not None]
    peaks = []
    if len(mads) >= 4:
        mean = float(np.mean(mads))
        std = float(np.std(mads))
        threshold = mean + 2 * std
        for item in samples:
            if item["mad"] is not None and item["mad"] >= threshold:
                peaks.append(
                    {
                        "time_s": item["time_s"],
                        "index": item["index"],
                        "mad": item["mad"],
                        "note": "Inter-frame difference is more than 2 standard deviations above the sampled mean. This can be a cut, motion, or a lighting change.",
                    }
                )
    result["measurements"] = {
        "width": width,
        "height": height,
        "fps": round(fps, 3) if fps else None,
        "frame_count": frame_count,
        "duration_s": None if duration is None else round(duration, 3),
        "samples": samples,
        "peaks": peaks,
    }
    result["artifacts"] = [{"name": item["artifact"], "label": f"Frame {item['index']}"} for item in samples]
    result["findings"].append(
        finding(
            "Frames were sampled",
            f"{len(samples)} frames saved from {frame_count or 'an unknown number of'} frames at {fps or 0:.2f} fps.",
            "OpenCV seek and JPEG preview",
        )
    )
    if peaks:
        result["findings"].append(
            finding(
                "Large frame-to-frame changes were marked",
                f"{len(peaks)} sampled step(s) exceeded mean + 2 standard deviations. Open the timestamp and inspect the frame. This is not an authenticity verdict.",
                "Mean absolute difference of grayscale frames",
                "review",
            )
        )

    audio_dir = artifact_dir / "audio"
    try:
        audio = analyze_audio(path, audio_dir, source_label="audio decoded from video")
        result["measurements"]["embedded_audio"] = audio
        if audio["status"] == "completed":
            result["findings"].append(
                finding(
                    "An audio track was decoded from the video",
                    f"Decoded duration {audio['measurements'].get('duration_s')} seconds. Playback and the spectrogram use this measurement.",
                    "imageio-ffmpeg",
                )
            )
        else:
            result["findings"].append(
                finding(
                    "No audio track was measured",
                    "ffmpeg did not return a usable waveform for this video.",
                    "imageio-ffmpeg",
                    "info",
                )
            )
    except Exception as exc:
        result["measurements"]["embedded_audio"] = None
        result["limitations"].append(f"Embedded audio was not measured: {exc}")
    return result


def _sample_indexes(frame_count: int) -> list[int]:
    if frame_count <= 1:
        return [0]
    count = min(12, frame_count)
    if frame_count <= count:
        return list(range(frame_count))
    raw = np.linspace(0, frame_count - 1, count)
    return sorted({int(value) for value in raw})
