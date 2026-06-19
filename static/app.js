const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

const homeRoot = document.getElementById("home-root");
const workflowShell = document.getElementById("workflow-shell");
const openWorkflowBtn = document.getElementById("open-workflow-btn");
const backHomeBtn = document.getElementById("back-home-btn");
const fileInput = document.getElementById("file-input");
const statusMessage = document.getElementById("status-message");
const emptyState = document.getElementById("empty-state");
const viewerRoot = document.getElementById("viewer-root");
const importWarnings = document.getElementById("importWarnings");

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

async function uploadFile(file) {
  const validationError = validateFileBeforeUpload(file);
  if (validationError) {
    setStatus(validationError, "error");
    clearImportWarnings();
    fileInput.value = "";
    return;
  }

  clearImportWarnings();
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
    emptyState.classList.remove("hidden");
    viewerRoot.classList.add("hidden");
  } finally {
    fileInput.value = "";
  }
}

openWorkflowBtn.addEventListener("click", () => {
  showWorkflow();
});

backHomeBtn.addEventListener("click", () => {
  showHome();
});

fileInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (file) uploadFile(file);
});
