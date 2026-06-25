const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const EXCEL_EXTENSIONS = [".xlsx"];

let currentWorkflowPayload = null;
let currentUploadedFileName = "";
let uploadInProgress = false;

const fileInput = document.getElementById("file-input");
const statusMessage = document.getElementById("status-message");
const emptyState = document.getElementById("empty-state");
const viewerRoot = document.getElementById("viewer-root");
const importWarnings = document.getElementById("importWarnings");
const exportHtmlBtn = document.getElementById("export-html-btn");
const excelDropZone = document.getElementById("excel-drop-zone");
const backHomeLink = document.getElementById("back-home-link");
const vaultConfigLink = document.getElementById("open-vault-config-link");
const versionChip = document.getElementById("app-version");

function escapeHtml(text) {
  return window.NTIShared.html.escape(text);
}

function renderImportWarnings(warnings) {  if (!importWarnings) return;
  if (!warnings || warnings.length === 0) {
    importWarnings.classList.add("hidden");
    importWarnings.innerHTML = "";
    return;
  }
  importWarnings.classList.remove("hidden");
  importWarnings.innerHTML =
    "<h3>" +
    escapeHtml(t("upload.warningsTitle")) +
    "</h3><ul>" +
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
  if (!statusMessage) return;
  statusMessage.textContent = message;
  statusMessage.className = "status-msg" + (type !== "idle" ? " " + type : "");
}

function resetInitialUiState() {
  if (emptyState) emptyState.classList.remove("hidden");
  if (viewerRoot) viewerRoot.classList.add("hidden");
  clearImportWarnings();
  clearWorkflowData();
  setStatus(t("upload.status.chooseOrDrop"));
}

function isSupportedExcelFile(file) {
  return window.NTIShared.files.hasExtension(file, EXCEL_EXTENSIONS);
}

function validateFileBeforeUpload(file) {
  if (!isSupportedExcelFile(file)) return t("upload.error.invalidFileType");
  if (!file || file.size === 0) return t("upload.error.emptyFile");
  if (!window.NTIShared.files.validateSize(file, MAX_UPLOAD_BYTES)) {
    return t("upload.error.fileTooLarge");
  }
  return null;
}
function formatApiError(payload) {
  if (typeof window.translateApiError === "function") return translateApiError(payload);
  const detail = payload?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  return t("upload.error.failed");
}

function setDropZoneActive(active) {
  if (!excelDropZone) return;
  excelDropZone.classList.toggle("is-drag-over", active);
}

function handleSelectedFiles(files) {
  if (!files || files.length === 0) {
    setStatus(t("upload.error.noFile"), "error");
    clearImportWarnings();
    clearWorkflowData();
    return;
  }
  if (files.length !== 1) {
    setStatus(t("upload.error.oneFileOnly"), "error");
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
  setStatus(t("export.exporting"), "loading");
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
    const filename = parseDownloadFilename(response.headers.get("Content-Disposition"));
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    setStatus(t("export.success", { filename }), "success");
  } catch (error) {
    setStatus(error.message || t("export.failed"), "error");
  }
}

async function uploadFile(file) {
  if (uploadInProgress) return;
  const validationError = validateFileBeforeUpload(file);
  if (validationError) {
    setStatus(validationError, "error");
    clearImportWarnings();
    clearWorkflowData();
    if (fileInput) fileInput.value = "";
    excelDropZone?.classList.remove("uploading");
    return;
  }
  uploadInProgress = true;
  clearImportWarnings();
  clearWorkflowData();
  excelDropZone?.classList.add("uploading");
  setStatus(t("upload.status.uploading", { filename: file.name }), "loading");
  const formData = new FormData();
  formData.append("file", file);
  try {
    const response = await fetch("/api/upload", { method: "POST", body: formData });
    const payload = await response.json();
    if (!response.ok) throw new Error(formatApiError(payload));
    emptyState?.classList.add("hidden");
    viewerRoot?.classList.remove("hidden");
    currentWorkflowPayload = payload;
    currentUploadedFileName = file.name;
    setExportEnabled(true);
    initWorkflowViewer(payload);
    renderImportWarnings(payload.meta?.warnings || []);
    const warnings = payload.meta?.warnings?.length ?? 0;
    const warningText = warnings > 0 ? t("upload.status.warningsSuffix", { count: warnings }) : "";
    setStatus(
      t("upload.status.success", {
        count: payload.meta.transitionCount,
        filename: file.name,
        warnings: warningText,
      }),
      "success",
    );
  } catch (error) {
    setStatus(error.message || t("upload.error.unexpected"), "error");
    clearImportWarnings();
    clearWorkflowData();
    emptyState?.classList.remove("hidden");
    viewerRoot?.classList.add("hidden");
  } finally {
    if (fileInput) fileInput.value = "";
    excelDropZone?.classList.remove("uploading");
    setDropZoneActive(false);
    uploadInProgress = false;
  }
}

function syncLocaleLinks() {
  if (typeof getCurrentLocale !== "function") return;
  const locale = getCurrentLocale() || "en-GB";
  if (backHomeLink) backHomeLink.href = `/?lang=${encodeURIComponent(locale)}`;
  if (vaultConfigLink) vaultConfigLink.href = `/vault-config/?lang=${encodeURIComponent(locale)}`;
}

async function loadVersion() {
  if (!versionChip) return;
  try {
    const response = await fetch("/api/version");
    if (!response.ok) return;
    const payload = await response.json();
    if (payload?.version) versionChip.textContent = `v${payload.version}`;
  } catch (_error) {
    // No-op: badge stays hidden when unavailable.
  }
}

function bindUploadUi() {
  window.NTIShared.files.preventDocumentDrop();
  if (excelDropZone) {
    window.NTIShared.files.bindDropZone({
      element: excelDropZone,
      dragOverClass: "is-drag-over",
      clickInput: fileInput,
      onFiles: (files) => handleSelectedFiles(files),
    });
  }
  fileInput?.addEventListener("change", (event) => {
    handleSelectedFiles(event.target.files);
  });
  exportHtmlBtn?.addEventListener("click", exportWorkflowHtml);
}
async function bootstrapWorkflowPage() {
  await initI18n();
  bindLocaleSelect();
  syncLocaleLinks();
  window.addEventListener("nti:locale-changed", syncLocaleLinks);
  bindUploadUi();
  resetInitialUiState();
  await loadVersion();
}

bootstrapWorkflowPage();

window.isSupportedExcelFile = isSupportedExcelFile;
