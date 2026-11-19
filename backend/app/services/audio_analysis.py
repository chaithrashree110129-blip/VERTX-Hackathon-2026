import subprocess
from pathlib import Path

import numpy as np

from app.services.common import CLASSIFIER_REASON, WHISPER_REASON, base_result, finding, unavailable


def ffmpeg_exe() -> str | None:
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return None


def convert_to_wav(source: Path, dest: Path) -> None:
    exe = ffmpeg_exe()
    if not exe:
        raise RuntimeError("The bundled ffmpeg binary from imageio-ffmpeg is unavailable.")
    dest.parent.mkdir(parents=True, exist_ok=True)
    proc = subprocess.run(
        [exe, "-y", "-i", str(source), "-vn", "-ac", "1", "-ar", "16000", "-f", "wav", str(dest)],
        capture_output=True,
    )
    if proc.returncode != 0 or not dest.exists():
        tail = proc.stderr.decode("utf-8", errors="replace")[-400:]
        raise RuntimeError(tail or "ffmpeg could not decode this audio.")


def read_wav(path: Path) -> tuple[np.ndarray, int]:
    import wave

    with wave.open(str(path), "rb") as handle:
        rate = handle.getframerate()
        channels = handle.getnchannels()
        width = handle.getsampwidth()
        frames = handle.readframes(handle.getnframes())
    if width != 2:
        raise RuntimeError(f"Expected 16-bit PCM, found sample width {width}.")
    samples = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0
    if channels > 1:
        samples = samples.reshape(-1, channels).mean(axis=1)
    return samples, rate


def analyze_audio(path: Path, artifact_dir: Path, source_label: str = "uploaded audio") -> dict:
    result = base_result("audio", "NumPy STFT + autocorrelation pitch + bundled ffmpeg")
    result["unavailable"].append(unavailable("deepfake classifier", CLASSIFIER_REASON))
    result["unavailable"].append(unavailable("whisper transcription", WHISPER_REASON))
    result["limitations"].extend(
        [
            "Pitch, loudness, and spectral flux are acoustic measurements. They do not identify a speaker and they do not prove synthesis.",
            "An abrupt spectral change can be a splice, a consonant, applause, or a breath. A person must review the audio.",
            "Analysis uses at most the first 180 seconds.",
        ]
    )
    artifact_dir.mkdir(parents=True, exist_ok=True)
    wav_path = artifact_dir / "decoded.wav"
    try:
        if path.suffix.lower() == ".wav":
            samples, rate = read_wav(path)
        else:
            convert_to_wav(path, wav_path)
            samples, rate = read_wav(wav_path)
    except Exception as exc:
        result["status"] = "error"
        result["findings"].append(
            finding("Audio could not be decoded", str(exc), "ffmpeg / wave", "review")
        )
        return result

    limit = rate * 180
    truncated = len(samples) > limit
    if truncated:
        samples = samples[:limit]
    duration = len(samples) / rate if rate else 0.0
    rms = float(np.sqrt(np.mean(samples**2))) if len(samples) else 0.0
    peak = float(np.max(np.abs(samples))) if len(samples) else 0.0
    envelope = _envelope(samples, 480)
    spectrogram, centroid, segments = _spectral(samples, rate)
    pitch = _pitch(samples, rate)
    result["measurements"] = {
        "source": source_label,
        "sample_rate": rate,
        "duration_s": round(duration, 3),
        "truncated": truncated,
        "rms": round(rms, 5),
        "peak": round(peak, 5),
        "spectral_centroid_hz": None if centroid is None else round(centroid, 2),
        "pitch_hz_median": None if pitch is None else round(pitch, 2),
        "waveform": [round(float(v), 4) for v in envelope],
        "spectrogram": spectrogram,
        "segments": segments,
    }
    result["findings"].append(
        finding(
            "Acoustic measurements completed",
            (
                f"Duration {duration:.2f}s, RMS {rms:.4f}, peak {peak:.4f}. "
                f"Median spectral centroid {result['measurements']['spectral_centroid_hz']} Hz. "
                f"Median voiced pitch {result['measurements']['pitch_hz_median']} Hz."
            ),
            "STFT and autocorrelation on the decoded waveform",
        )
    )
    if segments:
        result["findings"].append(
            finding(
                "Abrupt spectral changes were marked",
                f"{len(segments)} timestamp(s) exceeded 3 standard deviations of spectral flux. Review them in the player. This is not a deepfake label.",
                "Frame-to-frame spectral flux",
                "review",
            )
        )
    else:
        result["findings"].append(
            finding(
                "No spectral-flux outlier was marked",
                "No frame exceeded the 3-standard-deviation flux threshold. Absence of an outlier is not proof the audio is authentic.",
                "Frame-to-frame spectral flux",
            )
        )
    return result


def _envelope(samples: np.ndarray, bins: int) -> np.ndarray:
    if len(samples) == 0:
        return np.zeros(bins)
    edges = np.linspace(0, len(samples), bins + 1).astype(int)
    values = np.zeros(bins)
    for index in range(bins):
        chunk = samples[edges[index] : edges[index + 1]]
        if len(chunk):
            values[index] = np.max(np.abs(chunk))
    return values


def _spectral(samples: np.ndarray, rate: int):
    n_fft = 1024
    hop = 512
    if len(samples) < n_fft:
        samples = np.pad(samples, (0, n_fft - len(samples)))
    window = np.hanning(n_fft)
    frames = []
    for start in range(0, len(samples) - n_fft + 1, hop):
        chunk = samples[start : start + n_fft] * window
        frames.append(np.abs(np.fft.rfft(chunk)))
    if not frames:
        return [], None, []
    matrix = np.stack(frames, axis=1)
    freqs = np.fft.rfftfreq(n_fft, d=1 / rate)
    centroid = float((freqs[:, None] * matrix).sum() / (matrix.sum() + 1e-9))
    flux = np.sqrt(np.sum(np.diff(matrix, axis=1) ** 2, axis=0)) if matrix.shape[1] > 2 else np.array([])
    segments = []
    if len(flux) > 8:
        score = (flux - flux.mean()) / (flux.std() + 1e-9)
        hits = np.where(score > 3)[0]
        groups = []
        for hit in hits.tolist():
            if not groups or hit - groups[-1][1] > 4:
                groups.append([hit, hit])
            else:
                groups[-1][1] = hit
        for start, end in groups[:8]:
            start_s = (start + 1) * hop / rate
            end_s = (end + 2) * hop / rate
            segments.append(
                {
                    "start_s": round(float(start_s), 3),
                    "end_s": round(float(end_s), 3),
                    "reason": "Spectral flux is more than 3 standard deviations above the file mean.",
                }
            )
    preview = _resize(np.log1p(matrix), 64, 96)
    peak = float(preview.max()) or 1.0
    preview = preview / peak
    data = [[round(float(value), 3) for value in row] for row in preview]
    return data, centroid, segments


def _resize(grid: np.ndarray, rows: int, cols: int) -> np.ndarray:
    ys = np.linspace(0, grid.shape[0] - 1, rows).astype(int)
    xs = np.linspace(0, grid.shape[1] - 1, min(cols, grid.shape[1])).astype(int)
    sample = grid[ys][:, xs]
    if sample.shape[1] < cols:
        sample = np.pad(sample, ((0, 0), (0, cols - sample.shape[1])))
    return sample


def _pitch(samples: np.ndarray, rate: int) -> float | None:
    window = int(0.04 * rate)
    hop = int(0.02 * rate)
    if window < 32 or len(samples) < window:
        return None
    pitches = []
    for start in range(0, len(samples) - window, hop):
        chunk = samples[start : start + window]
        if float(np.sqrt(np.mean(chunk**2))) < 0.02:
            continue
        corr = np.correlate(chunk, chunk, mode="full")
        corr = corr[len(corr) // 2 :]
        low = max(1, int(rate / 400))
        high = min(len(corr) - 1, int(rate / 70))
        if high <= low:
            continue
        lag = low + int(np.argmax(corr[low:high]))
        if corr[lag] <= 0:
            continue
        pitches.append(rate / lag)
    if not pitches:
        return None
    return float(np.median(pitches))
