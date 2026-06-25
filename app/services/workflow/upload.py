"""Upload validation and Excel parsing orchestration."""

from __future__ import annotations

from fastapi import UploadFile

from app.core.settings import ALLOWED_UPLOAD_EXTENSIONS, MAX_UPLOAD_BYTES
from app.services.workflow.parser import (
    TransitionParseError,
    parse_result_to_dict,
    parse_transitions_excel,
)


class UploadRejected(Exception):
    def __init__(self, detail: str, status_code: int = 400) -> None:
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


class WorkbookParseRejected(Exception):
    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail


async def parse_uploaded_workbook(file: UploadFile) -> dict:
    if not file.filename:
        raise UploadRejected("Ingen fil modtaget.")

    if not file.filename.lower().endswith(ALLOWED_UPLOAD_EXTENSIONS):
        raise UploadRejected("Kun Excel-filer (.xlsx, .xlsm) understøttes.")

    content = await file.read()
    if not content:
        raise UploadRejected("Filen er tom. Vælg en gyldig Vault Excel-eksport.")

    if len(content) > MAX_UPLOAD_BYTES:
        raise UploadRejected("Filen er for stor. Maksimal filstørrelse er 25 MB.")

    try:
        result = parse_transitions_excel(content)
    except TransitionParseError as exc:
        raise WorkbookParseRejected(str(exc)) from exc

    return parse_result_to_dict(result)
