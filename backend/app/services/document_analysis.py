from pathlib import Path

from app.services.common import base_result, finding


def analyze_document(path: Path) -> dict:
    result = base_result("document", "Plain text, pypdf, or python-docx")
    result["limitations"].append(
        "Text extraction reads characters embedded in the file. It does not decide whether the statements are true, and it does not identify an author."
    )
    result["unavailable"].append(
        {
            "name": "authorship or deception classifier",
            "reason": "No text classifier is loaded. Extracted text is provided for human comparison only.",
        }
    )
    suffix = path.suffix.lower()
    try:
        if suffix == ".txt":
            text = path.read_text(encoding="utf-8", errors="replace")
            engine = "UTF-8 text read"
        elif suffix == ".pdf":
            from pypdf import PdfReader

            reader = PdfReader(str(path))
            text = "\n".join((page.extract_text() or "") for page in reader.pages)
            engine = f"pypdf ({len(reader.pages)} page(s))"
            result["measurements"]["pages"] = len(reader.pages)
        elif suffix == ".docx":
            from docx import Document

            document = Document(str(path))
            text = "\n".join(paragraph.text for paragraph in document.paragraphs)
            engine = "python-docx"
        else:
            result["status"] = "unavailable"
            result["findings"].append(
                finding("This document type is not extracted", f"{suffix or 'unknown'} is outside txt, pdf, and docx.", "extension", "review")
            )
            return result
    except Exception as exc:
        result["status"] = "error"
        result["findings"].append(finding("Text extraction failed", str(exc), suffix, "review"))
        return result

    cleaned = text.replace("\x00", "")
    result["engine"] = engine
    result["measurements"].update(
        {
            "characters": len(cleaned),
            "excerpt": cleaned[:8000],
        }
    )
    if cleaned.strip():
        result["findings"].append(
            finding(
                "Text was extracted",
                f"{len(cleaned)} characters are available for comparison with other evidence. The excerpt stored for the workspace is capped at 8,000 characters.",
                engine,
            )
        )
    else:
        result["findings"].append(
            finding(
                "No text was extracted",
                "The file opened, but no characters were returned. A scanned PDF without a text layer would look like this. OCR is not enabled.",
                engine,
                "review",
            )
        )
    return result
