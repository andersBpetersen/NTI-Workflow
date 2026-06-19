const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

const homeRoot = document.getElementById("home-root");
const workflowShell = document.getElementById("workflow-shell");
const openWorkflowBtn = document.getElementById("open-workflow-btn");
const backHomeBtn = document.getElementById("back-home-btn");
const fileInput = document.getElementById("file-input");
const statusMessage = document.getElementById("status-message");
const emptyState = document.getElementById("empty-state");
const viewerRoot = document.getElementById("viewer-root");

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
    return "Filen er tom.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "Filen er for stor. Maksimal filstørrelse er 25 MB.";
  }
  return null;
}

async function uploadFile(file) {
  const validationError = validateFileBeforeUpload(file);
  if (validationError) {
    setStatus(validationError, "error");
    fileInput.value = "";
    return;
  }

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
      throw new Error(payload.detail || "Upload fejlede.");
    }

    emptyState.classList.add("hidden");
    viewerRoot.classList.remove("hidden");
    initWorkflowViewer(payload);

    const warnings = payload.meta?.warnings?.length ?? 0;
    const warningText = warnings > 0 ? ` (${warnings} advarsler)` : "";
    setStatus(
      `Indlæst ${payload.meta.transitionCount} transitions fra ${file.name}${warningText}.`,
      "success",
    );
  } catch (error) {
    setStatus(error.message, "error");
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
