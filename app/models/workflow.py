"""Pydantic models for Workflow API requests."""

from __future__ import annotations

from pydantic import BaseModel


class ViewerContext(BaseModel):
    selectedLifeCycle: str | None = None
    selectedRole: str | None = None
    selectedState: str | None = None
    selectedDirection: str | None = None
    showAllow: bool | None = None
    showDeny: bool | None = None
    showNone: bool | None = None
    showJobs: bool | None = None
    showPerms: bool | None = None
    permissionMode: str | None = None
    hideUnrelated: bool | None = None
    layoutMode: str | None = None


class ExportHtmlRequest(BaseModel):
    payload: dict
    sourceFileName: str | None = None
    selectedLifeCycle: str | None = None
    title: str | None = None
    viewerContext: ViewerContext | None = None
