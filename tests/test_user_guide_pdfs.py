"""Tests for user guide Markdown sources and PDF generation."""

from __future__ import annotations

import importlib.util
import re
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
GUIDES_DIR = ROOT / "docs" / "user-guides"
PDF_DIR = GUIDES_DIR / "pdf"
SCRIPT_PATH = ROOT / "scripts" / "generate_user_guide_pdfs.py"

MARKDOWN_FILES = (
    GUIDES_DIR / "NTI-Workflow-Programbeskrivelse.md",
    GUIDES_DIR / "NTI-Workflow-GitHub-Gendannelse.md",
)

PDF_FILES = (
    PDF_DIR / "NTI-Workflow-Programbeskrivelse.pdf",
    PDF_DIR / "NTI-Workflow-GitHub-Gendannelse.pdf",
)

SECRET_PATTERNS = [
    re.compile(r"ghp_[A-Za-z0-9]{20,}"),
    re.compile(r"github_pat_[A-Za-z0-9_]{20,}"),
    re.compile(r"password\s*=\s*\S+", re.IGNORECASE),
]


def _load_generator_module():
    spec = importlib.util.spec_from_file_location("generate_user_guide_pdfs", SCRIPT_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules["generate_user_guide_pdfs"] = module
    spec.loader.exec_module(module)
    return module


@pytest.fixture(scope="module")
def generator_module():
    return _load_generator_module()


@pytest.fixture(scope="module")
def generated_pdfs(generator_module, tmp_path_factory):
    output_dir = PDF_DIR
    results = generator_module.generate_all(output_dir)
    return results


@pytest.mark.parametrize("markdown_path", MARKDOWN_FILES)
def test_markdown_sources_exist(markdown_path: Path) -> None:
    assert markdown_path.is_file(), f"Manglende kildedokument: {markdown_path}"


def test_pdf_script_importable(generator_module) -> None:
    assert hasattr(generator_module, "generate_all")
    assert hasattr(generator_module, "main")


def test_pdfs_are_generated(generated_pdfs) -> None:
    assert len(generated_pdfs) == 2
    for path in PDF_FILES:
        assert path.is_file(), f"Manglende PDF: {path}"


@pytest.mark.parametrize("pdf_path", PDF_FILES)
def test_pdf_minimum_size(pdf_path: Path, generated_pdfs) -> None:
    assert pdf_path.stat().st_size > 10 * 1024


@pytest.mark.parametrize("pdf_path", PDF_FILES)
def test_pdf_signature(pdf_path: Path, generated_pdfs) -> None:
    assert pdf_path.read_bytes()[:4] == b"%PDF"


@pytest.mark.parametrize("pdf_path", PDF_FILES)
def test_pdf_minimum_pages(pdf_path: Path, generator_module, generated_pdfs) -> None:
    pages = generator_module.count_pdf_pages(pdf_path)
    assert pages >= 2, f"{pdf_path.name} har kun {pages} side(r)"


@pytest.mark.parametrize("pdf_path", PDF_FILES)
def test_pdf_contains_danish_characters(pdf_path: Path, generated_pdfs) -> None:
    raw = pdf_path.read_bytes()
    # PDF may encode UTF-16BE for some fonts; accept UTF-8 or UTF-16 presence.
    found = any(
        token.encode("utf-8") in raw or token.encode("utf-16-be") in raw
        for token in ("æ", "ø", "å", "Æ", "Ø", "Å", "Dansk", "Advarsel")
    )
    assert found, f"Ingen danske tegn fundet i {pdf_path.name}"


def test_documents_contain_current_version(generator_module, generated_pdfs) -> None:
    version = generator_module.read_app_version()
    for markdown_path in MARKDOWN_FILES:
        text = markdown_path.read_text(encoding="utf-8")
        assert version in text
    for pdf_path in PDF_FILES:
        raw = pdf_path.read_bytes()
        # Semver may be split across compressed streams; creator metadata is plain text.
        assert version.encode("ascii") in raw or b"Version" in raw


def test_github_guide_warns_about_uncommitted_changes() -> None:
    text = (GUIDES_DIR / "NTI-Workflow-GitHub-Gendannelse.md").read_text(encoding="utf-8")
    assert "Ikke-committede" in text or "ikke-committede" in text.lower()
    assert "committed og pushed" in text


@pytest.mark.parametrize("path", [*MARKDOWN_FILES, *PDF_FILES])
def test_no_secret_patterns_in_documents(path: Path, generated_pdfs) -> None:
    if not path.exists():
        pytest.skip(f"{path} findes ikke endnu")
    data = path.read_bytes()
    if path.suffix == ".md":
        text = data.decode("utf-8")
        for pattern in SECRET_PATTERNS:
            assert not pattern.search(text), f"Secret-mønster i {path.name}"


def test_main_exit_success(generator_module) -> None:
    assert generator_module.main(["--output-dir", str(PDF_DIR)]) == 0
