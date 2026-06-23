"""Tests for upload filename validation."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.upload_validation import is_supported_excel_filename


@pytest.mark.parametrize(
    "filename",
    [
        "workflow.xlsx",
        "WORKFLOW.XLSX",
        "Vault.Config.Dump.xlsx",
    ],
)
def test_is_supported_excel_filename_accepts_xlsx(filename: str) -> None:
    assert is_supported_excel_filename(filename) is True


@pytest.mark.parametrize(
    "filename",
    [
        "workflow.xlsm",
        "workflow.xls",
        "workflow.xlsb",
        "workflow.csv",
        "workflow.xlsx.exe",
        "workflow",
        "",
        None,
    ],
)
def test_is_supported_excel_filename_rejects_other_types(filename: str | None) -> None:
    assert is_supported_excel_filename(filename) is False


@pytest.mark.parametrize(
    ("filename", "content_type"),
    [
        ("workflow.xlsm", "application/vnd.ms-excel.sheet.macroEnabled.12"),
        ("workflow.xls", "application/vnd.ms-excel"),
        ("workflow.xlsb", "application/vnd.ms-excel.sheet.binary.macroEnabled.12"),
        ("workflow.csv", "text/csv"),
        ("workflow.xlsx.exe", "application/octet-stream"),
        ("workflow", "application/octet-stream"),
    ],
)
def test_upload_rejects_non_xlsx_files(
    client: TestClient,
    filename: str,
    content_type: str,
) -> None:
    response = client.post(
        "/api/upload",
        files={"file": (filename, b"dummy", content_type)},
    )

    assert response.status_code == 400
    detail = response.json()["detail"]
    if isinstance(detail, dict):
        assert detail.get("code") == "invalid_file_type"
        assert ".xlsx" in detail.get("message", "")
    else:
        assert ".xlsx" in detail


def test_upload_accepts_uppercase_xlsx_extension(client: TestClient) -> None:
    from io import BytesIO

    from openpyxl import Workbook

    workbook = Workbook()
    workbook.active.title = "WrongSheet"
    buffer = BytesIO()
    workbook.save(buffer)

    response = client.post(
        "/api/upload",
        files={
            "file": (
                "WORKFLOW.XLSX",
                buffer.getvalue(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
        },
    )

    assert response.status_code == 422
    assert "LifeCycleDefinitionTransitions" in response.json()["detail"]
