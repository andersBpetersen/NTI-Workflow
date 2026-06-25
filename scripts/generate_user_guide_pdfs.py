#!/usr/bin/env python3
"""Generate NTI Workflow user guide PDFs from Markdown sources."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Iterable

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    PageTemplate,
    Paragraph,
    Preformatted,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents

ROOT = Path(__file__).resolve().parent.parent
GUIDES_DIR = ROOT / "docs" / "user-guides"
DEFAULT_OUTPUT_DIR = GUIDES_DIR / "pdf"

FONT_CANDIDATES = {
    "regular": [
        Path(r"C:\Windows\Fonts\arial.ttf"),
        Path(r"C:\Windows\Fonts\segoeui.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    ],
    "bold": [
        Path(r"C:\Windows\Fonts\arialbd.ttf"),
        Path(r"C:\Windows\Fonts\segoeb.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    ],
    "mono": [
        Path(r"C:\Windows\Fonts\consola.ttf"),
        Path(r"C:\Windows\Fonts\cour.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"),
    ],
}

SECRET_PATTERNS = [
    re.compile(r"ghp_[A-Za-z0-9]{20,}"),
    re.compile(r"github_pat_[A-Za-z0-9_]{20,}"),
    re.compile(r"password\s*=\s*\S+", re.IGNORECASE),
    re.compile(r"token\s*=\s*\S+", re.IGNORECASE),
]


@dataclass
class GuideSpec:
    slug: str
    title: str
    subtitle: str
    markdown_name: str
    pdf_name: str


GUIDES: list[GuideSpec] = [
    GuideSpec(
        slug="programbeskrivelse",
        title="NTI Workflow",
        subtitle="Programbeskrivelse og teknisk overblik",
        markdown_name="NTI-Workflow-Programbeskrivelse.md",
        pdf_name="NTI-Workflow-Programbeskrivelse.pdf",
    ),
    GuideSpec(
        slug="github-gendannelse",
        title="NTI Workflow",
        subtitle="Gendannelse og download fra GitHub",
        markdown_name="NTI-Workflow-GitHub-Gendannelse.md",
        pdf_name="NTI-Workflow-GitHub-Gendannelse.pdf",
    ),
]


@dataclass
class BuildContext:
    version: str
    generated_on: str
    branch: str
    commit: str
    release_tag: str
    remote_url: str
    fonts: dict[str, str] = field(default_factory=dict)
    styles: dict[str, ParagraphStyle] = field(default_factory=dict)


def _first_existing(paths: Iterable[Path]) -> Path:
    for path in paths:
        if path.is_file():
            return path
    raise FileNotFoundError(
        "Ingen passende Unicode-font fundet. Installér Arial/DejaVu Sans eller tilsvarende."
    )


def register_fonts() -> dict[str, str]:
    regular = _first_existing(FONT_CANDIDATES["regular"])
    bold = _first_existing(FONT_CANDIDATES["bold"])
    mono = _first_existing(FONT_CANDIDATES["mono"])
    pdfmetrics.registerFont(TTFont("NTI-Regular", str(regular)))
    pdfmetrics.registerFont(TTFont("NTI-Bold", str(bold)))
    pdfmetrics.registerFont(TTFont("NTI-Mono", str(mono)))
    return {
        "regular": regular.name,
        "bold": bold.name,
        "mono": mono.name,
    }


def read_app_version() -> str:
    version_file = ROOT / "app" / "core" / "version.py"
    match = re.search(r'APP_VERSION\s*=\s*"([^"]+)"', version_file.read_text(encoding="utf-8"))
    if not match:
        raise RuntimeError("Kunne ikke læse APP_VERSION fra app/core/version.py")
    return match.group(1)


def git_value(args: list[str], default: str = "ukendt") -> str:
    try:
        result = subprocess.run(
            ["git", *args],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
        return result.stdout.strip() or default
    except (subprocess.CalledProcessError, FileNotFoundError):
        return default


def sanitize_remote_url(url: str) -> str:
    if "@" in url and "://" in url:
        return "<REPOSITORY-URL>"
    return url


def build_context() -> BuildContext:
    fonts = register_fonts()
    version = read_app_version()
    generated_on = date.today().isoformat()
    branch = git_value(["branch", "--show-current"])
    commit = git_value(["rev-parse", "--short", "HEAD"])
    release_tag = git_value(["describe", "--tags", "--abbrev=0"], default=f"v{version}")
    remote = sanitize_remote_url(git_value(["remote", "get-url", "origin"]))
    ctx = BuildContext(
        version=version,
        generated_on=generated_on,
        branch=branch,
        commit=commit,
        release_tag=release_tag,
        remote_url=remote,
        fonts=fonts,
    )
    ctx.styles = make_styles(ctx)
    return ctx


def make_styles(ctx: BuildContext) -> dict[str, ParagraphStyle]:
    return {
        "title": ParagraphStyle(
            "GuideTitle",
            fontName="NTI-Bold",
            fontSize=24,
            leading=30,
            alignment=TA_CENTER,
            spaceAfter=8,
        ),
        "subtitle": ParagraphStyle(
            "GuideSubtitle",
            fontName="NTI-Regular",
            fontSize=14,
            leading=18,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#333333"),
            spaceAfter=18,
        ),
        "meta": ParagraphStyle(
            "GuideMeta",
            fontName="NTI-Regular",
            fontSize=10,
            leading=14,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#555555"),
            spaceAfter=6,
        ),
        "h1": ParagraphStyle(
            "Heading1",
            fontName="NTI-Bold",
            fontSize=16,
            leading=20,
            spaceBefore=14,
            spaceAfter=8,
            textColor=colors.HexColor("#1a365d"),
        ),
        "h2": ParagraphStyle(
            "Heading2",
            fontName="NTI-Bold",
            fontSize=13,
            leading=17,
            spaceBefore=10,
            spaceAfter=6,
            textColor=colors.HexColor("#2c5282"),
        ),
        "h3": ParagraphStyle(
            "Heading3",
            fontName="NTI-Bold",
            fontSize=11.5,
            leading=15,
            spaceBefore=8,
            spaceAfter=4,
            textColor=colors.HexColor("#2d3748"),
        ),
        "body": ParagraphStyle(
            "Body",
            fontName="NTI-Regular",
            fontSize=10.5,
            leading=14,
            alignment=TA_JUSTIFY,
            spaceAfter=6,
        ),
        "bullet": ParagraphStyle(
            "Bullet",
            fontName="NTI-Regular",
            fontSize=10.5,
            leading=14,
            leftIndent=12,
            spaceAfter=3,
        ),
        "code": ParagraphStyle(
            "CodeBlock",
            fontName="NTI-Mono",
            fontSize=8.5,
            leading=11,
            backColor=colors.HexColor("#f4f4f4"),
            borderColor=colors.HexColor("#cccccc"),
            borderWidth=0.5,
            borderPadding=6,
            leftIndent=6,
            rightIndent=6,
            spaceBefore=4,
            spaceAfter=8,
        ),
        "warning": ParagraphStyle(
            "Warning",
            fontName="NTI-Regular",
            fontSize=10,
            leading=14,
            backColor=colors.HexColor("#fff3cd"),
            borderColor=colors.HexColor("#ffcc00"),
            borderWidth=1,
            borderPadding=8,
            leftIndent=4,
            rightIndent=4,
            spaceBefore=6,
            spaceAfter=8,
        ),
        "toc": ParagraphStyle(
            "TOCHeading",
            fontName="NTI-Bold",
            fontSize=14,
            leading=18,
            spaceAfter=10,
        ),
        "toc_entry": ParagraphStyle(
            "TOCEntry",
            fontName="NTI-Regular",
            fontSize=10,
            leading=14,
            leftIndent=12,
            spaceAfter=2,
        ),
    }


def escape_xml(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def inline_format(text: str) -> str:
    text = escape_xml(text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"`([^`]+)`", r'<font name="NTI-Mono">\1</font>', text)
    return text


def parse_table_row(line: str) -> list[str]:
    cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
    return cells


def is_table_separator(line: str) -> bool:
    return bool(re.match(r"^\s*\|?[\s:-]+\|[\s|:-]+\|?\s*$", line))


def build_table(rows: list[list[str]], styles: dict[str, ParagraphStyle]) -> Table:
    data = [
        [Paragraph(inline_format(cell), styles["body"]) for cell in row]
        for row in rows
    ]
    table = Table(data, colWidths=[None] * len(rows[0]), repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e8eef5")),
                ("FONTNAME", (0, 0), (-1, 0), "NTI-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#b0b8c4")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return table


def architecture_diagram_flowable() -> Table:
    rows = [
        ["Browser", ""],
        ["", "App shell"],
        ["", "Workflow Viewer"],
        ["", "Vault Config Viewer"],
        ["FastAPI", ""],
        ["", "Page routes"],
        ["", "System routes"],
        ["", "Workflow API"],
        ["", "Parser service"],
        ["", "HTML export service"],
    ]
    data = [[Paragraph(f"<b>{escape_xml(left)}</b>", ParagraphStyle("d", fontName="NTI-Bold", fontSize=10)) if left else "",
             Paragraph(escape_xml(right), ParagraphStyle("d2", fontName="NTI-Regular", fontSize=10, leftIndent=18)) if right else ""]
            for left, right in rows]
    table = Table(data, colWidths=[4.5 * cm, 10 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#4a5568")),
                ("LINEBEFORE", (1, 0), (1, -1), 0.5, colors.HexColor("#cbd5e0")),
                ("BACKGROUND", (0, 0), (0, 3), colors.HexColor("#ebf8ff")),
                ("BACKGROUND", (0, 4), (0, -1), colors.HexColor("#f0fff4")),
                ("BACKGROUND", (1, 0), (1, -1), colors.white),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return table


class GuideDocTemplate(BaseDocTemplate):
    def __init__(self, filename: str, ctx: BuildContext, guide: GuideSpec, **kwargs):
        self.ctx = ctx
        self.guide = guide
        self._toc = TableOfContents()
        self._toc.levelStyles = [
            ctx.styles["toc_entry"],
            ParagraphStyle("toc2", parent=ctx.styles["toc_entry"], leftIndent=24),
            ParagraphStyle("toc3", parent=ctx.styles["toc_entry"], leftIndent=36),
        ]
        super().__init__(filename, **kwargs)
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="normal")
        template = PageTemplate(id="main", frames=[frame], onPage=self._draw_page)
        self.addPageTemplates([template])

    def _draw_page(self, canv: canvas.Canvas, doc: BaseDocTemplate) -> None:
        canv.saveState()
        canv.setFont("NTI-Regular", 8)
        canv.setFillColor(colors.HexColor("#666666"))
        header = f"{self.guide.title} — v{self.ctx.version}"
        canv.drawString(self.leftMargin, A4[1] - 12 * mm, header)
        canv.drawRightString(A4[0] - self.rightMargin, 10 * mm, f"Side {canv.getPageNumber()}")
        canv.restoreState()

    def afterFlowable(self, flowable) -> None:
        if isinstance(flowable, Paragraph):
            style_name = flowable.style.name
            if style_name in {"Heading1", "Heading2", "Heading3"}:
                level = {"Heading1": 0, "Heading2": 1, "Heading3": 2}[style_name]
                text = flowable.getPlainText()
                key = re.sub(r"[^a-zA-Z0-9]", "", text)[:48] or "section"
                self.canv.bookmarkPage(key)
                self.canv.addOutlineEntry(text, key, level=level, closed=False)
                self.notify("TOCEntry", (level, text, self.page))


def title_page(guide: GuideSpec, ctx: BuildContext) -> list:
    return [
        Spacer(1, 4 * cm),
        Paragraph(escape_xml(guide.title), ctx.styles["title"]),
        Paragraph(escape_xml(guide.subtitle), ctx.styles["subtitle"]),
        Spacer(1, 0.5 * cm),
        Paragraph(f"Version {escape_xml(ctx.version)}", ctx.styles["meta"]),
        Paragraph(f"Genereret {escape_xml(ctx.generated_on)}", ctx.styles["meta"]),
        Paragraph(f"Branch: {escape_xml(ctx.branch)}", ctx.styles["meta"]),
        Paragraph(f"Release-tag: {escape_xml(ctx.release_tag)}", ctx.styles["meta"]),
        Paragraph(f"Commit: {escape_xml(ctx.commit)}", ctx.styles["meta"]),
        PageBreak(),
        Paragraph("Indholdsfortegnelse", ctx.styles["toc"]),
        Spacer(1, 0.2 * cm),
    ]


def markdown_to_flowables(markdown_text: str, ctx: BuildContext) -> list:
    lines = markdown_text.splitlines()
    # Skip duplicate title/metadata block already shown on title page.
    start = 0
    if lines and lines[0].startswith("# "):
        start = 1
        while start < len(lines) and lines[start].strip() != "---":
            start += 1
        if start < len(lines) and lines[start].strip() == "---":
            start += 1
    lines = lines[start:]
    flowables: list = []
    i = 0
    in_code = False
    code_lang = ""
    code_lines: list[str] = []
    table_rows: list[list[str]] = []

    def flush_table() -> None:
        nonlocal table_rows
        if table_rows:
            flowables.append(build_table(table_rows, ctx.styles))
            flowables.append(Spacer(1, 0.15 * cm))
            table_rows = []

    while i < len(lines):
        line = lines[i]

        if line.strip() == "<!-- ARCHITECTURE_DIAGRAM -->":
            flush_table()
            flowables.append(architecture_diagram_flowable())
            flowables.append(Spacer(1, 0.2 * cm))
            i += 1
            continue

        if line.strip().startswith("```"):
            flush_table()
            if not in_code:
                in_code = True
                code_lang = line.strip().removeprefix("```").strip()
                code_lines = []
            else:
                label = f"# {code_lang}\n" if code_lang else ""
                flowables.append(
                    Preformatted(
                        label + "\n".join(code_lines),
                        ctx.styles["code"],
                    )
                )
                in_code = False
                code_lang = ""
                code_lines = []
            i += 1
            continue

        if in_code:
            code_lines.append(line)
            i += 1
            continue

        if "|" in line and line.strip().startswith("|"):
            if is_table_separator(line):
                i += 1
                continue
            flush_table() if not table_rows else None
            table_rows.append(parse_table_row(line))
            i += 1
            if i < len(lines) and not (lines[i].strip().startswith("|")):
                flush_table()
            continue
        else:
            flush_table()

        stripped = line.strip()
        if not stripped:
            i += 1
            continue
        if stripped == "---":
            flowables.append(Spacer(1, 0.15 * cm))
            i += 1
            continue

        if stripped.startswith("> "):
            warning_lines = []
            while i < len(lines) and lines[i].strip().startswith("> "):
                warning_lines.append(lines[i].strip()[2:].strip())
                i += 1
            text = " ".join(warning_lines)
            if text.lower().startswith("**advarsel:**"):
                text = text.replace("**Advarsel:**", "ADVARSEL:", 1).replace("**advarsel:**", "ADVARSEL:", 1)
            flowables.append(
                Paragraph(
                    f"<b>ADVARSEL:</b> {inline_format(text.replace('ADVARSEL:', '').strip())}",
                    ctx.styles["warning"],
                )
            )
            continue

        heading = re.match(r"^(#{1,4})\s+(.*)$", stripped)
        if heading:
            marks = len(heading.group(1))
            style_key = {2: "h1", 3: "h2", 4: "h3"}.get(marks, "h1")
            text = heading.group(2).strip()
            para = Paragraph(inline_format(text), ctx.styles[style_key])
            flowables.append(para)
            i += 1
            continue

        if re.match(r"^[-*]\s+", stripped):
            items = []
            while i < len(lines) and re.match(r"^[-*]\s+", lines[i].strip()):
                item_text = re.sub(r"^[-*]\s+", "", lines[i].strip())
                items.append(ListItem(Paragraph(inline_format(item_text), ctx.styles["bullet"])))
                i += 1
            flowables.append(ListFlowable(items, bulletType="bullet", leftIndent=14))
            continue

        if re.match(r"^\d+\.\s+", stripped):
            items = []
            while i < len(lines) and re.match(r"^\d+\.\s+", lines[i].strip()):
                item_text = re.sub(r"^\d+\.\s+", "", lines[i].strip())
                items.append(ListItem(Paragraph(inline_format(item_text), ctx.styles["bullet"])))
                i += 1
            flowables.append(ListFlowable(items, bulletType="1", leftIndent=14))
            continue

        para_lines = [stripped]
        i += 1
        while i < len(lines):
            nxt = lines[i].strip()
            if (
                not nxt
                or nxt.startswith("#")
                or nxt.startswith("```")
                or nxt.startswith("|")
                or nxt.startswith(">")
                or nxt == "---"
                or re.match(r"^[-*]\s+", nxt)
                or re.match(r"^\d+\.\s+", nxt)
                or nxt == "<!-- ARCHITECTURE_DIAGRAM -->"
            ):
                break
            para_lines.append(nxt)
            i += 1
        flowables.append(Paragraph(inline_format(" ".join(para_lines)), ctx.styles["body"]))

    flush_table()
    if in_code and code_lines:
        flowables.append(Preformatted("\n".join(code_lines), ctx.styles["code"]))
    return flowables


def generate_pdf(guide: GuideSpec, ctx: BuildContext, output_dir: Path) -> Path:
    source = GUIDES_DIR / guide.markdown_name
    if not source.is_file():
        raise FileNotFoundError(f"Manglende kildedokument: {source}")

    markdown_text = source.read_text(encoding="utf-8")
    for pattern in SECRET_PATTERNS:
        if pattern.search(markdown_text):
            raise RuntimeError(f"Potentielt secret fundet i {source.name}")

    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / guide.pdf_name

    doc = GuideDocTemplate(
        str(output_path),
        ctx,
        guide,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2.2 * cm,
        bottomMargin=2 * cm,
        title=guide.subtitle,
        author="NTI Workflow",
        subject=guide.subtitle,
        creator=f"NTI Workflow v{ctx.version}",
        keywords=[ctx.version, guide.slug, "user-guide"],
    )

    story: list = title_page(guide, ctx)
    story.append(doc._toc)
    story.append(PageBreak())
    story.extend(markdown_to_flowables(markdown_text, ctx))

    doc.multiBuild(story)
    return output_path


def count_pdf_pages(pdf_path: Path) -> int:
    content = pdf_path.read_bytes()
    return len(re.findall(rb"/Type\s*/Page\b", content))


def generate_all(output_dir: Path) -> dict[str, Path]:
    ctx = build_context()
    results: dict[str, Path] = {}
    for guide in GUIDES:
        results[guide.slug] = generate_pdf(guide, ctx, output_dir)
    return results


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Generér NTI Workflow brugervejlednings-PDF'er.")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help="Mappe til PDF-output (standard: docs/user-guides/pdf)",
    )
    args = parser.parse_args(argv)
    try:
        results = generate_all(args.output_dir.resolve())
    except Exception as exc:
        print(f"FEJL: {exc}", file=sys.stderr)
        return 1

    for slug, path in results.items():
        pages = count_pdf_pages(path)
        size_kb = path.stat().st_size / 1024
        print(f"OK  {slug}: {path} ({pages} sider, {size_kb:.1f} KB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
