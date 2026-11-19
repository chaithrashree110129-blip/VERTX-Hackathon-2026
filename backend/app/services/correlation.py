import re

from app.services.common import WHISPER_REASON


def _tokens(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9']{4,}", text.lower()))


def correlate(investigation: dict, evidence: list[dict]) -> dict:
    nodes = [
        {
            "id": investigation["id"],
            "kind": "investigation",
            "label": investigation["title"],
        }
    ]
    edges = []
    findings = []
    limitations = [
        "Edges mean the files were submitted in the same investigation, or that one file was derived from another, unless a finding says otherwise.",
        "TruthLens does not identify a culprit and does not decide criminal responsibility.",
        WHISPER_REASON + " Spoken words were therefore not compared with document text.",
    ]
    by_hash: dict[str, list[dict]] = {}
    for item in evidence:
        nodes.append(
            {
                "id": item["id"],
                "kind": item["kind"],
                "label": item["filename"],
                "sha256": item["sha256"],
            }
        )
        edges.append(
            {
                "source": investigation["id"],
                "target": item["id"],
                "relation": "collected",
                "note": "Submitted in this investigation.",
            }
        )
        by_hash.setdefault(item["sha256"], []).append(item)
        analysis = item.get("analysis") or {}
        measurements = analysis.get("measurements") or {}
        embedded = measurements.get("embedded_audio")
        if item["kind"] == "video" and embedded and embedded.get("status") == "completed":
            derived = f"{item['id']}:audio"
            nodes.append(
                {
                    "id": derived,
                    "kind": "audio",
                    "label": f"Audio decoded from {item['filename']}",
                    "derived": True,
                }
            )
            edges.append(
                {
                    "source": item["id"],
                    "target": derived,
                    "relation": "contains",
                    "note": "Waveform decoded from the video container. This does not prove the picture and sound were recorded together.",
                }
            )

    for group in by_hash.values():
        if len(group) < 2:
            continue
        names = ", ".join(item["filename"] for item in group)
        findings.append(
            {
                "title": "Identical file bytes",
                "detail": f"These items share one SHA-256 digest: {names}.",
                "kind": "support",
            }
        )
        for left, right in zip(group, group[1:]):
            edges.append(
                {
                    "source": left["id"],
                    "target": right["id"],
                    "relation": "identical-bytes",
                    "note": "SHA-256 hashes match.",
                }
            )

    videos = [item for item in evidence if item["kind"] == "video"]
    audios = [item for item in evidence if item["kind"] == "audio"]
    for video in videos:
        v_audio = ((video.get("analysis") or {}).get("measurements") or {}).get("embedded_audio") or {}
        v_dur = (v_audio.get("measurements") or {}).get("duration_s")
        for audio in audios:
            a_dur = ((audio.get("analysis") or {}).get("measurements") or {}).get("duration_s")
            if v_dur is None or a_dur is None:
                continue
            delta = abs(float(v_dur) - float(a_dur))
            edges.append(
                {
                    "source": video["id"],
                    "target": audio["id"],
                    "relation": "duration-compared",
                    "note": f"Decoded video audio is {v_dur}s and the separate audio file is {a_dur}s.",
                }
            )
            if delta > 1:
                findings.append(
                    {
                        "title": "Audio durations differ",
                        "detail": (
                            f"{video['filename']} decoded to {v_dur:.2f}s and {audio['filename']} is {a_dur:.2f}s. "
                            "They may be different recordings. A duration gap is not proof of tampering."
                        ),
                        "kind": "inconsistency",
                    }
                )
            else:
                findings.append(
                    {
                        "title": "Decoded durations are close",
                        "detail": (
                            f"{video['filename']} and {audio['filename']} differ by {delta:.2f}s. "
                            "Close duration is not proof they are the same recording."
                        ),
                        "kind": "support",
                    }
                )

    documents = []
    for item in evidence:
        if item["kind"] != "document":
            continue
        excerpt = ((item.get("analysis") or {}).get("measurements") or {}).get("excerpt") or ""
        if excerpt.strip():
            documents.append((item, _tokens(excerpt)))
    for index, (left, left_tokens) in enumerate(documents):
        for right, right_tokens in documents[index + 1 :]:
            union = left_tokens | right_tokens
            if not union or len(left_tokens) < 12 or len(right_tokens) < 12:
                continue
            overlap = len(left_tokens & right_tokens) / len(union)
            edges.append(
                {
                    "source": left["id"],
                    "target": right["id"],
                    "relation": "text-overlap",
                    "note": f"Jaccard overlap of extracted words is {overlap:.2f}.",
                }
            )
            findings.append(
                {
                    "title": "Document wording was compared",
                    "detail": (
                        f"{left['filename']} and {right['filename']} share a Jaccard overlap of {overlap:.2f} "
                        "on words of four or more characters. Low overlap can simply mean the documents discuss different subjects."
                    ),
                    "kind": "support" if overlap >= 0.2 else "inconsistency",
                }
            )

    if any(item["kind"] == "audio" or item["kind"] == "video" for item in evidence) and documents:
        findings.append(
            {
                "title": "Speech was not compared with the documents",
                "detail": "A transcript is required before spoken words can be checked against extracted text. Whisper is not installed, so that comparison was not run.",
                "kind": "unavailable",
            }
        )

    if not findings:
        findings.append(
            {
                "title": "No cross-file contradiction was measured",
                "detail": "The graph shows how the submitted files relate. Add another modality, or run analysis, before expecting a comparison.",
                "kind": "support",
            }
        )

    return {
        "nodes": nodes,
        "edges": edges,
        "findings": findings,
        "limitations": limitations,
    }
