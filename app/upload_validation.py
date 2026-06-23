"""Shared upload filename validation."""

from __future__ import annotations


def is_supported_excel_filename(filename: str | None) -> bool:
    if not filename or not isinstance(filename, str):
        return False

    return filename.strip().lower().endswith(".xlsx")
