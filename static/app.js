const fileInput = document.getElementById("file-input");
const statusMessage = document.getElementById("status-message");
const emptyState = document.getElementById("empty-state");
const viewerRoot = document.getElementById("viewer-root");

function setStatus(message, type = "idle") {
  statusMessage.textContent = message;
  statusMessage.className = "status-msg" + (type !== "idle" ? " " + type : "");
}

async function uploadFile(file) {
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
  }
}

fileInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (file) uploadFile(file);
});
