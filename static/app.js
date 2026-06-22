const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

let currentWorkflowPayload = null;
let currentUploadedFileName = "";
let uploadInProgress = false;

const homeRoot = document.getElementById("home-root");
const workflowShell = document.getElementById("workflow-shell");
const openWorkflowBtn = document.getElementById("open-workflow-btn");
const backHomeBtn = document.getElementById("back-home-btn");
const fileInput = document.getElementById("file-input");
const statusMessage = document.getElementById("status-message");
const emptyState = document.getElementById("empty-state");
const viewerRoot = document.getElementById("viewer-root");
const importWarnings = document.getElementById("importWarnings");
const exportHtmlBtn = document.getElementById("export-html-btn");
const excelDropZone = document.getElementById("excel-drop-zone");

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderImportWarnings(warnings) {
  if (!importWarnings) return;
  if (!warnings || warnings.length === 0) {
    importWarnings.classList.add("hidden");
    importWarnings.innerHTML = "";
    return;
  }
  importWarnings.classList.remove("hidden");
  importWarnings.innerHTML =
    "<h3>Advarsler fra import</h3><ul>" +
    warnings.map((w) => "<li>" + escapeHtml(w) + "</li>").join("") +
    "</ul>";
}

function clearImportWarnings() {
  renderImportWarnings([]);
}

function setExportEnabled(enabled) {
  if (!exportHtmlBtn) return;
  exportHtmlBtn.disabled = !enabled;
  exportHtmlBtn.classList.toggle("hidden", !enabled);
}

function clearWorkflowData() {
  currentWorkflowPayload = null;
  currentUploadedFileName = "";
  setExportEnabled(false);
}

function setStatus(message, type = "idle") {
  statusMessage.textContent = message;
  statusMessage.className = "status-msg" + (type !== "idle" ? " " + type : "");
}

function showHome() {
  homeRoot.classList.remove("hidden");
  workflowShell.classList.add("hidden");
}

function showWorkflow() {
  homeRoot.classList.add("hidden");
  workflowShell.classList.remove("hidden");
}

function resetInitialUiState() {
  if (homeRoot) homeRoot.classList.remove("hidden");
  if (workflowShell) workflowShell.classList.add("hidden");
  if (emptyState) emptyState.classList.remove("hidden");
  if (viewerRoot) viewerRoot.classList.add("hidden");
  clearImportWarnings();
  clearWorkflowData();
  if (statusMessage) {
    setStatus("Vælg eller træk Excel-outputfilen fra NTI Vault Dump Config.");
  }
}

function isAllowedExcelFile(file) {
  const name = file.name.toLowerCase();
  return name.endsWith(".xlsx") || name.endsWith(".xlsm");
}

function validateFileBeforeUpload(file) {
  if (!isAllowedExcelFile(file)) {
    return "Kun Excel-filer (.xlsx, .xlsm) understøttes.";
  }
  if (file.size === 0) {
    return "Filen er tom. Vælg en gyldig Vault Excel-eksport.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "Filen er for stor. Maksimal filstørrelse er 25 MB.";
  }
  return null;
}

function formatApiError(payload) {
  const detail = payload?.detail;
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((item) => (typeof item === "string" ? item : item?.msg || ""))
      .filter(Boolean)
      .join(" ");
  }
  return "Upload fejlede. Kontrollér at filen er en gyldig Vault Excel-eksport.";
}

function setDropZoneActive(active) {
  if (!excelDropZone) return;
  excelDropZone.classList.toggle("drag-over", active);
}

function handleSelectedFiles(files) {
  if (!files || files.length === 0) {
    setStatus("Ingen gyldig fil blev modtaget.", "error");
    clearImportWarnings();
    clearWorkflowData();
    return;
  }

  if (files.length !== 1) {
    setStatus("Vælg eller træk én Excel-fil ind ad gangen.", "error");
    clearImportWarnings();
    clearWorkflowData();
    return;
  }

  uploadFile(files[0]);
}

function parseDownloadFilename(contentDisposition) {
  if (!contentDisposition) return "NTI_Workflow_export.html";
  const match = contentDisposition.match(/filename="([^"]+)"/i);
  return match ? match[1] : "NTI_Workflow_export.html";
}

async function exportWorkflowHtml() {
  if (!currentWorkflowPayload) return;

  const viewerContext =
    typeof window.getWorkflowViewerContext === "function"
      ? window.getWorkflowViewerContext()
      : null;
  const selectedLifeCycle =
    viewerContext?.selectedLifeCycle ||
    currentWorkflowPayload.lifecycleDefinitions?.[0] ||
    "";

  setStatus("Eksporterer HTML...", "loading");

  try {
    const response = await fetch("/api/export/html", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payload: currentWorkflowPayload,
        sourceFileName: currentUploadedFileName,
        selectedLifeCycle,
        viewerContext,
      }),
    });

    if (!response.ok) {
      const payload = await response.json();
      throw new Error(formatApiError(payload));
    }

    const blob = await response.blob();
    const filename = parseDownloadFilename(
      response.headers.get("Content-Disposition"),
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    setStatus(`Eksporteret ${filename}.`, "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function uploadFile(file) {
  if (uploadInProgress) return;

  const validationError = validateFileBeforeUpload(file);
  if (validationError) {
    setStatus(validationError, "error");
    clearImportWarnings();
    clearWorkflowData();
    fileInput.value = "";
    excelDropZone?.classList.remove("uploading");
    return;
  }

  uploadInProgress = true;
  clearImportWarnings();
  clearWorkflowData();
  excelDropZone?.classList.add("uploading");
  setStatus(`Uploader ${file.name}...`, "loading");

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(formatApiError(payload));
    }

    emptyState.classList.add("hidden");
    viewerRoot.classList.remove("hidden");
    currentWorkflowPayload = payload;
    currentUploadedFileName = file.name;
    setExportEnabled(true);
    initWorkflowViewer(payload);
    renderImportWarnings(payload.meta?.warnings || []);

    const warnings = payload.meta?.warnings?.length ?? 0;
    const warningText = warnings > 0 ? ` (${warnings} advarsler)` : "";
    setStatus(
      `Indlæst ${payload.meta.transitionCount} transitions fra ${file.name}${warningText}.`,
      "success",
    );
  } catch (error) {
    setStatus(error.message, "error");
    clearImportWarnings();
    clearWorkflowData();
    emptyState.classList.remove("hidden");
    viewerRoot.classList.add("hidden");
  } finally {
    fileInput.value = "";
    excelDropZone?.classList.remove("uploading");
    setDropZoneActive(false);
    uploadInProgress = false;
  }
}

openWorkflowBtn.addEventListener("click", () => {
  showWorkflow();
});

backHomeBtn.addEventListener("click", () => {
  showHome();
});

["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
  document.addEventListener(eventName, (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
});

if (excelDropZone) {
  excelDropZone.addEventListener("dragenter", () => {
    setDropZoneActive(true);
  });

  excelDropZone.addEventListener("dragover", () => {
    setDropZoneActive(true);
  });

  excelDropZone.addEventListener("dragleave", (event) => {
    if (!excelDropZone.contains(event.relatedTarget)) {
      setDropZoneActive(false);
    }
  });

  excelDropZone.addEventListener("drop", (event) => {
    setDropZoneActive(false);
    handleSelectedFiles(event.dataTransfer?.files);
  });

  excelDropZone.addEventListener("click", () => {
    fileInput.click();
  });

  excelDropZone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInput.click();
    }
  });
}

fileInput.addEventListener("change", (event) => {
  handleSelectedFiles(event.target.files);
});

if (exportHtmlBtn) {
  exportHtmlBtn.addEventListener("click", exportWorkflowHtml);
}

resetInitialUiState();
