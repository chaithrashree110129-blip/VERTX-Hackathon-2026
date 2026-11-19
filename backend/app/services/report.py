import io
from xml.sax.saxutils import escape

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


INK = HexColor("#2A1419")
GOLD = HexColor("#8C6A32")
GRAPHITE = HexColor("#202326")
MUTED = HexColor("#5C584F")


def build_report(investigation: dict, evidence: list[dict], correlation: dict | None) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
        title=f"TruthLens {investigation['id']}",
    )
    styles = getSampleStyleSheet()
    title = ParagraphStyle("TLTitle", parent=styles["Title"], textColor=INK, alignment=TA_LEFT, fontSize=18, spaceAfter=4)
    h = ParagraphStyle("TLH", parent=styles["Heading2"], textColor=GOLD, fontSize=12, spaceBefore=10, spaceAfter=4)
    body = ParagraphStyle("TLB", parent=styles["BodyText"], textColor=GRAPHITE, fontSize=9, leading=12)
    small = ParagraphStyle("TLS", parent=body, textColor=MUTED, fontSize=8, leading=11)
    story = [
        Paragraph("TruthLens forensic worksheet", title),
        Paragraph(escape(investigation["title"]), h),
        Paragraph(
            f"Investigation {escape(investigation['id'])} · Investigator {escape(investigation['investigator_name'])} · Opened {escape(investigation['created_at'])}",
            small,
        ),
        Spacer(1, 6),
        Paragraph(
            "This worksheet assists a human reviewer. It does not determine whether a person created a forgery, and it does not assign criminal responsibility. "
            "Numbers below are measurements from the listed engines. Where a detector is unavailable, the report says so instead of estimating a score.",
            body,
        ),
    ]
    story.append(Paragraph("Evidence inventory", h))
    rows = [["File", "Kind", "Bytes", "SHA-256"]]
    for item in evidence:
        rows.append(
            [
                Paragraph(escape(item["filename"]), small),
                item["kind"],
                f"{item['size_bytes']:,}",
                Paragraph(escape(item["sha256"]), small),
            ]
        )
    if len(rows) == 1:
        story.append(Paragraph("No evidence was stored.", body))
    else:
        table = Table(rows, colWidths=[45 * mm, 22 * mm, 22 * mm, 85 * mm])
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), INK),
                    ("TEXTCOLOR", (0, 0), (-1, 0), white),
                    ("FONTNAME", (0, 0), (-1, 0), "Times-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ("BACKGROUND", (0, 1), (-1, -1), HexColor("#FBF8F2")),
                    ("GRID", (0, 0), (-1, -1), 0.3, HexColor("#C6A66B")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 4),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ]
            )
        )
        story.append(table)

    for item in evidence:
        analysis = item.get("analysis")
        story.append(Paragraph(escape(f"{item['kind'].title()} · {item['filename']}"), h))
        if not analysis:
            story.append(Paragraph("Analysis has not been run for this file.", body))
            continue
        story.append(Paragraph(f"Engine: {escape(str(analysis.get('engine', '')))} · Status: {escape(str(analysis.get('status', '')))}", small))
        for entry in analysis.get("findings") or []:
            story.append(
                Paragraph(
                    f"<b>{escape(entry.get('title', ''))}</b> ({escape(entry.get('severity', 'info'))}): {escape(entry.get('detail', ''))}",
                    body,
                )
            )
        for entry in analysis.get("unavailable") or []:
            story.append(Paragraph(f"Unavailable — {escape(entry.get('name', ''))}: {escape(entry.get('reason', ''))}", small))
        for entry in analysis.get("limitations") or []:
            story.append(Paragraph(f"Limitation: {escape(entry)}", small))

    story.append(Paragraph("Multimodal correlation", h))
    if not correlation:
        story.append(Paragraph("Correlation has not been run.", body))
    else:
        for entry in correlation.get("findings") or []:
            story.append(
                Paragraph(
                    f"<b>{escape(entry.get('title', ''))}</b> [{escape(entry.get('kind', ''))}]: {escape(entry.get('detail', ''))}",
                    body,
                )
            )
        for entry in correlation.get("limitations") or []:
            story.append(Paragraph(f"Limitation: {escape(entry)}", small))

    story.append(Paragraph("Human review", h))
    story.append(
        Paragraph(
            "Review every flagged timestamp, ELA region, and hash in the original file. Do not treat a missing detector as a negative finding. "
            "Record the reviewer’s name, the files they opened, and any conclusion outside this automatically generated worksheet.",
            body,
        )
    )
    doc.build(story)
    return buffer.getvalue()
