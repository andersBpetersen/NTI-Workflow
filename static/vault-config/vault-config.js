const MAX_JSON_BYTES = 50 * 1024 * 1024;
const DEBUG_LOGGING = false;

const state = {
  config: null,
  containers: [],
  sourceFileName: "",
  selectedContainerIndex: -1,
  selectedProcessorIndex: -1,
  showInactiveContainers: true,
  showInactiveProcessors: true,
};

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  els.fileInput = document.getElementById("file-input");
  els.loadBtn = document.getElementById("load-btn");
  els.dropPanel = document.getElementById("drop-panel");
  els.statusBar = document.getElementById("status-bar");
  els.configSummary = document.getElementById("config-summary");
  els.layout = document.getElementById("layout");
  els.containerList = document.getElementById("container-list");
  els.processorList = document.getElementById("processor-list");
  els.details = document.getElementById("details");
  els.showInactiveContainers = document.getElementById("show-inactive-containers");
  els.showInactiveProcessors = document.getElementById("show-inactive-processors");

  els.loadBtn.addEventListener("click", () => els.fileInput.click());
  els.fileInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) loadFile(file);
    event.target.value = "";
  });

  els.showInactiveContainers?.addEventListener("change", () => {
    state.showInactiveContainers = els.showInactiveContainers.checked;
    renderContainerList();
  });

  els.showInactiveProcessors?.addEventListener("change", () => {
    state.showInactiveProcessors = els.showInactiveProcessors.checked;
    renderProcessorList();
  });

  ["dragenter", "dragover", "dragleave", "drop"].forEach((name) => {
    document.addEventListener(name, (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  });

  if (els.dropPanel) {
    els.dropPanel.addEventListener("dragenter", () => els.dropPanel.classList.add("drag-over"));
    els.dropPanel.addEventListener("dragover", () => els.dropPanel.classList.add("drag-over"));
    els.dropPanel.addEventListener("dragleave", (event) => {
      if (!els.dropPanel.contains(event.relatedTarget)) {
        els.dropPanel.classList.remove("drag-over");
      }
    });
    els.dropPanel.addEventListener("drop", (event) => {
      els.dropPanel.classList.remove("drag-over");
      handleDroppedFiles(event.dataTransfer?.files);
    });
    els.dropPanel.addEventListener("click", () => els.fileInput.click());
  }

  setStatus("Klar — indlæs en konfigurationsfil for at begynde.");
});

function setStatus(message, type = "idle") {
  els.statusBar.textContent = message;
  els.statusBar.className = "status-bar" + (type === "error" ? " error" : type === "loaded" ? " loaded" : "");
}

function isSupportedJsonFile(file) {
  if (!file || typeof file.name !== "string") return false;
  return file.name.toLowerCase().endsWith(".json");
}

function handleDroppedFiles(files) {
  if (!files || files.length === 0) {
    setStatus("Ingen gyldig fil blev modtaget.", "error");
    return;
  }
  if (files.length !== 1) {
    setStatus("Træk præcis én JSON-fil ind ad gangen.", "error");
    return;
  }
  loadFile(files[0]);
}

function loadFile(file) {
  if (!isSupportedJsonFile(file)) {
    setStatus("Kun .json-filer understøttes.", "error");
    return;
  }
  if (file.size > MAX_JSON_BYTES) {
    setStatus("Filen er for stor. Maksimal filstørrelse er 50 MB.", "error");
    return;
  }

  setStatus(`Indlæser ${file.name}...`);
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result ?? ""));
      const normalized = normalizeConfig(parsed, file.name);
      applyConfig(normalized);
      setStatus(`Indlæst: ${file.name}`, "loaded");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message) {
        setStatus(message, "error");
      } else {
        setStatus("JSON-filen kunne ikke læses.", "error");
      }
      resetView();
    }
  };
  reader.onerror = () => setStatus("JSON-filen kunne ikke læses.", "error");
  reader.readAsText(file);
}

function resetView() {
  state.config = null;
  state.containers = [];
  state.sourceFileName = "";
  state.selectedContainerIndex = -1;
  state.selectedProcessorIndex = -1;
  els.configSummary.classList.add("hidden");
  els.layout.classList.add("hidden");
  els.dropPanel.classList.remove("hidden");
  els.details.innerHTML = '<p class="details-placeholder">Vælg en jobprocessor for at se detaljer.</p>';
  els.containerList.innerHTML = "";
  els.processorList.innerHTML = "";
}

function normalizeConfig(parsed, fileName) {
  let config;

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      throw new Error("Konfigurationsfilen indeholder et tomt array.");
    }
    config = parsed[0];
  } else {
    config = parsed;
  }

  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new Error("JSON-filen kunne læses, men konfigurationen har et ugyldigt format.");
  }

  const containersCandidate = config?.JobProcessor?.JobProcessorContainers;
  if (!Array.isArray(containersCandidate)) {
    throw new Error(
      "JSON-filen kunne læses, men indeholder ikke JobProcessor.JobProcessorContainers.",
    );
  }

  if (DEBUG_LOGGING) {
    console.log("Parsed root:", parsed);
    console.log("Normalized config:", config);
    console.log("Containers:", containersCandidate);
  }

  return {
    config,
    containers: containersCandidate,
    sourceFileName: fileName,
  };
}

function applyConfig(normalized) {
  state.config = normalized.config;
  state.containers = normalized.containers;
  state.sourceFileName = normalized.sourceFileName;
  state.selectedContainerIndex = state.containers.length ? 0 : -1;
  state.selectedProcessorIndex = -1;

  els.dropPanel.classList.add("hidden");
  els.layout.classList.remove("hidden");
  renderSummary();
  renderContainerList();
  renderProcessorList();
  renderDetails();
}

function renderSummary() {
  const name = String(
    state.config?.DisplayName ||
      state.config?.Name ||
      state.config?.Description ||
      state.sourceFileName ||
      "Ukendt konfiguration",
  );
  const version = String(state.config?.Version ?? "Ukendt");
  const totalContainers = state.containers.length;
  const withProcessors = state.containers.filter((container) => {
    const processors = container?.JobProcessors;
    return Array.isArray(processors) && processors.length > 0;
  }).length;
  const activeProcessors = state.containers.reduce((count, container) => {
    const processors = getProcessors(container);
    return count + processors.filter((processor) => isProcessorActive(processor)).length;
  }, 0);

  els.configSummary.innerHTML =
    "<strong>" +
    escapeHtml(name) +
    "</strong>" +
    "Version " +
    escapeHtml(version) +
    "<br>" +
    escapeHtml(String(totalContainers)) +
    " containere · " +
    escapeHtml(String(withProcessors)) +
    " med processorer · " +
    escapeHtml(String(activeProcessors)) +
    " aktive processorer";
  els.configSummary.classList.remove("hidden");
}

function getProcessors(container) {
  if (!container || typeof container !== "object") return [];
  const list = container.JobProcessors || container.jobProcessors || [];
  return Array.isArray(list) ? list : [];
}

function isProcessorActive(processor) {
  if (!processor || typeof processor !== "object") return false;
  if (Object.prototype.hasOwnProperty.call(processor, "IsActive")) {
    return processor.IsActive !== false;
  }
  if (Object.prototype.hasOwnProperty.call(processor, "isActive")) {
    return processor.isActive !== false;
  }
  if (Object.prototype.hasOwnProperty.call(processor, "Active")) {
    return processor.Active !== false;
  }
  if (Object.prototype.hasOwnProperty.call(processor, "active")) {
    return processor.active !== false;
  }
  return true;
}

function containerHasVisibleProcessors(container) {
  return getProcessors(container).some(
    (processor) => state.showInactiveProcessors || isProcessorActive(processor),
  );
}

function renderContainerList() {
  els.containerList.innerHTML = "";
  state.containers.forEach((container, index) => {
    const processors = getProcessors(container);
    const activeCount = processors.filter((p) => isProcessorActive(p)).length;
    const hasVisible = containerHasVisibleProcessors(container);
    if (!state.showInactiveContainers && processors.length && !hasVisible) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className =
      "list-item" + (index === state.selectedContainerIndex ? " selected" : "");
    const label = String(container?.Name || container?.name || `Container ${index + 1}`);
    button.innerHTML =
      escapeHtml(label) +
      '<span class="meta">' +
      escapeHtml(String(processors.length)) +
      " processorer · " +
      escapeHtml(String(activeCount)) +
      " aktive</span>";
    button.addEventListener("click", () => {
      state.selectedContainerIndex = index;
      state.selectedProcessorIndex = -1;
      renderContainerList();
      renderProcessorList();
      renderDetails();
    });
    els.containerList.appendChild(button);
  });
}

function renderProcessorList() {
  els.processorList.innerHTML = "";
  const container = state.containers[state.selectedContainerIndex];
  if (!container) {
    els.processorList.innerHTML =
      '<p class="details-placeholder">Vælg en container</p>';
    return;
  }

  const processors = getProcessors(container);
  processors.forEach((processor, index) => {
    if (!state.showInactiveProcessors && !isProcessorActive(processor)) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className =
      "list-item" + (index === state.selectedProcessorIndex ? " selected" : "");
    const label = String(
      processor?.Name || processor?.JobName || processor?.name || `Processor ${index + 1}`,
    );
    const badge = isProcessorActive(processor)
      ? '<span class="badge active">Aktiv</span>'
      : '<span class="badge inactive">Inaktiv</span>';
    button.innerHTML = escapeHtml(label) + " " + badge;
    button.addEventListener("click", () => {
      state.selectedProcessorIndex = index;
      renderProcessorList();
      renderDetails();
    });
    els.processorList.appendChild(button);
  });

  if (!els.processorList.children.length) {
    els.processorList.innerHTML =
      '<p class="details-placeholder">Ingen processorer i denne container</p>';
  }
}

function renderDetails() {
  const container = state.containers[state.selectedContainerIndex];
  const processors = container ? getProcessors(container) : [];
  const processor = processors[state.selectedProcessorIndex];

  if (!processor) {
    els.details.innerHTML =
      '<p class="details-placeholder">Vælg en jobprocessor for at se detaljer.</p>';
    return;
  }

  const title = String(processor.Name || processor.JobName || processor.name || "Processor");
  let html = "<h2>" + escapeHtml(title) + "</h2>";
  html += renderKeyValueSection("Generelt", [
    ["Navn", title],
    ["Aktiv", isProcessorActive(processor) ? "Ja" : "Nej"],
    ["TargetFolderPathScheme", processor.TargetFolderPathScheme || "-"],
    ["NamingScheme", processor.NamingScheme || "-"],
  ]);

  html += renderArraySection("Conditions", processor.Conditions, formatCondition);
  html += renderArraySection("Jobs", processor.Jobs, formatJob);
  html += renderArraySection("FileJobs", processor.FileJobs, formatJob);
  html += renderArraySection("ExportedFileJobs", processor.ExportedFileJobs, formatJob);
  html += renderCopyProperties(processor.CopyProperties);
  html += renderSetProperties(processor.SetProperties);
  html += renderRawSection("Rå processor-data", processor);

  els.details.innerHTML = html;
}

function renderKeyValueSection(title, rows) {
  let html = "<h3>" + escapeHtml(title) + "</h3><table class='data-table'><tbody>";
  rows.forEach(([key, value]) => {
    html +=
      "<tr><th>" +
      escapeHtml(String(key)) +
      "</th><td>" +
      escapeHtml(String(value ?? "-")) +
      "</td></tr>";
  });
  html += "</tbody></table>";
  return html;
}

function renderArraySection(title, items, formatter) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) {
    return "<h3>" + escapeHtml(title) + "</h3><p class='details-placeholder'>Ingen</p>";
  }

  let html = "<h3>" + escapeHtml(title) + "</h3><table class='data-table'><thead><tr>";
  const sample = formatter(list[0]);
  sample.headers.forEach((header) => {
    html += "<th>" + escapeHtml(header) + "</th>";
  });
  html += "</tr></thead><tbody>";
  list.forEach((item) => {
    const row = formatter(item);
    html += "<tr>";
    row.cells.forEach((cell) => {
      html += "<td>" + escapeHtml(String(cell ?? "-")) + "</td>";
    });
    html += "</tr>";
  });
  html += "</tbody></table>";
  return html;
}

function formatJob(job) {
  if (!job || typeof job !== "object") {
    return { headers: ["Værdi"], cells: [String(job)] };
  }
  return {
    headers: ["JobName", "JobType", "Parameter"],
    cells: [
      job.JobName || job.Name || job.name || "-",
      job.JobType || job.Type || "-",
      job.Parameter || job.parameter || "-",
    ],
  };
}

function formatCondition(condition) {
  if (!condition || typeof condition !== "object") {
    return { headers: ["Værdi"], cells: [String(condition)] };
  }
  return {
    headers: ["Type", "Detaljer"],
    cells: [
      condition.Type || condition.type || "-",
      condition.Value || condition.Expression || JSON.stringify(condition),
    ],
  };
}

function renderCopyProperties(items) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) {
    return "<h3>CopyProperties</h3><p class='details-placeholder'>Ingen</p>";
  }
  let html =
    "<h3>CopyProperties</h3><table class='data-table'><thead><tr><th>Fra</th><th>Til</th></tr></thead><tbody>";
  list.forEach((item) => {
    html +=
      "<tr><td>" +
      escapeHtml(copyPropSource(item)) +
      "</td><td>" +
      escapeHtml(copyPropTarget(item)) +
      "</td></tr>";
  });
  html += "</tbody></table>";
  return html;
}

function copyPropSource(item) {
  if (!item || typeof item !== "object") return "-";
  return item.FromPropertyDefinition ?? item.SourcePropertyDefinition ?? "-";
}

function copyPropTarget(item) {
  if (!item || typeof item !== "object") return "-";
  return item.ToPropertyDefinition ?? item.TargetPropertyDefinition ?? "-";
}

function renderSetProperties(items) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) {
    return "<h3>SetProperties</h3><p class='details-placeholder'>Ingen</p>";
  }
  let html =
    "<h3>SetProperties</h3><table class='data-table'><thead><tr><th>Property</th><th>Værdi</th></tr></thead><tbody>";
  list.forEach((item) => {
    html +=
      "<tr><td>" +
      escapeHtml(String(item?.PropertyDefinition || item?.Property || "-")) +
      "</td><td>" +
      escapeHtml(String(setPropValue(item))) +
      "</td></tr>";
  });
  html += "</tbody></table>";
  return html;
}

function setPropValue(item) {
  if (!item || typeof item !== "object") return "-";
  return item.PropertyValue ?? item.Value ?? "-";
}

function renderRawSection(title, value) {
  return (
    "<h3>" +
    escapeHtml(title) +
    '</h3><pre class="json-block">' +
    escapeHtml(JSON.stringify(value, null, 2)) +
    "</pre>"
  );
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

window.isSupportedJsonFile = isSupportedJsonFile;
