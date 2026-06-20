/* VBA add-in viewer – port of NTI_Workflow_Ver_1.xlam HTML output */

let transitions = [];
let stateDefs = [];
let lifecycles = [];
let roles = [];
let permissionRoles = [];

let layoutMode = "auto";
let currentLayout = null;
let largeWorkflowHint = false;

let viewBoxState = { x: 0, y: 0, w: 1600, h: 1220 };
const ZOOM_FACTOR = 0.85;
const EDGE_INSET = 10;

let layoutModeSelect;
let focusSelectedBtn;

let selectedLife = "";
let selectedRole = "Everyone";
let selectedState = "";
let selectedDirection = "all";
let permissionMode = "role";

let svg;
let lifeSelect;
let stateSelect;
let directionSelect;
let roleButtons;
let tableBody;
let permTableBody;
let summary;
let showDeny;
let showNone;
let showJobs;
let showPerms;
let permModeSelect;
let hideUnrelated;

let selectedElement = null;
let detailsPanel;
let zoomInBtn;
let zoomOutBtn;
let zoomResetBtn;

function getAutoLayoutConfig(stateCount, edgeCount) {
  const dense = edgeCount > 40 || stateCount > 8;
  const veryDense = edgeCount > 80 || stateCount > 12;

  if (veryDense) {
    return {
      width: 2200,
      height: 1700,
      centerX: 1100,
      centerY: 850,
      radius: 650,
      nodeRadius: 58,
      fontSize: 13,
      edgeWidthScale: 0.55,
      arrowScale: 0.65,
      arrowSize: 7,
      densityClass: "density-very-dense",
      permissionBoxMode: "hideByDefault",
    };
  }

  if (dense) {
    return {
      width: 1900,
      height: 1450,
      centerX: 950,
      centerY: 725,
      radius: 520,
      nodeRadius: 64,
      fontSize: 14,
      edgeWidthScale: 0.7,
      arrowScale: 0.75,
      arrowSize: 9,
      densityClass: "density-dense",
      permissionBoxMode: "compact",
    };
  }

  return {
    width: 1600,
    height: 1220,
    centerX: 800,
    centerY: 610,
    radius: 350,
    nodeRadius: 78,
    fontSize: 18,
    edgeWidthScale: 1,
    arrowScale: 1,
    arrowSize: 12,
    densityClass: "density-normal",
    permissionBoxMode: "normal",
  };
}

function getManualLayoutConfig(mode) {
  if (mode === "dense") {
    return {
      width: 1800,
      height: 1400,
      centerX: 900,
      centerY: 700,
      radius: 480,
      nodeRadius: 52,
      fontSize: 12,
      edgeWidthScale: 0.55,
      arrowScale: 0.6,
      arrowSize: 7,
      densityClass: "density-very-dense",
      permissionBoxMode: "hideByDefault",
    };
  }
  if (mode === "large") {
    return {
      width: 2600,
      height: 2000,
      centerX: 1300,
      centerY: 1000,
      radius: 800,
      nodeRadius: 72,
      fontSize: 16,
      edgeWidthScale: 0.85,
      arrowScale: 0.9,
      arrowSize: 11,
      densityClass: "density-normal",
      permissionBoxMode: "normal",
    };
  }
  return getAutoLayoutConfig(4, 4);
}

function resolveLayout(stateCount, edgeCount) {
  if (layoutMode === "auto") return getAutoLayoutConfig(stateCount, edgeCount);
  return getManualLayoutConfig(layoutMode);
}

function syncDefaultViewBox(layout) {
  viewBoxState = { x: 0, y: 0, w: layout.width, h: layout.height };
}

function lifeTransitionCount(life) {
  return transitions.filter((t) => t.life === life).length;
}

function applyLargeWorkflowDefaults(hasExportDirection) {
  if (hasExportDirection) {
    largeWorkflowHint = false;
    return;
  }
  const count = lifeTransitionCount(selectedLife);
  if (count > 40) {
    selectedDirection = "connected";
    if (directionSelect) directionSelect.value = "connected";
    largeWorkflowHint = true;
  } else {
    largeWorkflowHint = false;
  }
}

function applyDensePermissionDefaults(initialContext) {
  if (initialContext && initialContext.showPerms != null) return;
  const states = statesForLife(selectedLife);
  const layout = resolveLayout(states.length, lifeTransitionCount(selectedLife));
  if (
    layout.permissionBoxMode === "hideByDefault" ||
    layout.permissionBoxMode === "compact"
  ) {
    if (showPerms) showPerms.checked = false;
  }
}

function buildDirectedPairMap(items) {
  const directed = new Map();
  items.forEach((t) => {
    const key = t.from + "||" + t.to;
    if (!directed.has(key)) directed.set(key, []);
    directed.get(key).push(t);
  });
  return directed;
}

function edgeCurveOffset(t, pairIndex, pairCount, layout, reverseExists) {
  const base =
    layout.densityClass === "density-very-dense"
      ? 150
      : layout.densityClass === "density-dense"
        ? 110
        : 70;

  if (pairCount === 1 && !reverseExists) return 0;

  if (reverseExists && pairCount === 1) {
    return t.from < t.to ? base : -base;
  }

  const spread = base * 0.55;
  const center = (pairCount - 1) / 2;
  let offset = (pairIndex - center) * spread;

  if (reverseExists) {
    offset += t.from < t.to ? base * 0.45 : -base * 0.45;
  }

  return offset;
}

function focusSelectedStateView() {
  selectedDirection = "connected";
  if (directionSelect) directionSelect.value = "connected";
  selectedElement = null;
  window.resetDiagramZoom();
  update();
}

function esc(s) {
  s = String(s == null ? "" : s);
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseSecurity(sec) {
  const out = {};
  String(sec || "")
    .split(";")
    .forEach((p) => {
      p = p.trim();
      const i = p.indexOf(":");
      if (i > 0) {
        out[p.slice(0, i).trim()] = p.slice(i + 1).trim();
      }
    });
  return out;
}

function parseStateSecurity(sec) {
  const out = {};
  String(sec || "")
    .split(";")
    .forEach((block) => {
      block = block.trim();
      const i = block.indexOf(":");
      if (i <= 0) return;
      const role = block.slice(0, i).trim();
      const rest = block.slice(i + 1);
      const perms = {};
      rest.replace(
        /\b(Read|Write|Delete|Download)\s*:\s*(Allow|Deny)\b/gi,
        (_m, p, v) => {
          const key = p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
          perms[key] = v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
          return _m;
        },
      );
      if (role) out[role] = perms;
    });
  return out;
}

function effective(sec, role) {
  const d = parseSecurity(sec);
  if (Object.prototype.hasOwnProperty.call(d, role)) return d[role];
  if (Object.prototype.hasOwnProperty.call(d, "Everyone")) return d.Everyone;
  return "Not specified";
}

function cls(v) {
  return v === "Allow" ? "allow" : v === "Deny" ? "deny" : "none";
}

function permCls(v) {
  return v === "Allow" ? "allow" : v === "Deny" ? "deny" : "none";
}

function permText(v) {
  return v === "Allow" ? "Allow" : v === "Deny" ? "Deny" : "?";
}

function uniq(a) {
  return [...new Set(a.filter((x) => x !== ""))];
}

function statesForLife(life) {
  return uniq(
    transitions
      .filter((t) => t.life === life)
      .flatMap((t) => [t.from, t.to])
      .concat(stateDefs.filter((s) => s.life === life).map((s) => s.state)),
  ).sort();
}

function stateInfo(life, state) {
  return (
    stateDefs.find((s) => s.life === life && s.state === state) || {
      life,
      state,
      stateSecurity: "",
    }
  );
}

function normalizeJobText(text) {
  return String(text || "")
    .trim()
    .replace(/^'+|'+$/g, "");
}

function statePermValue(info, role, perm) {
  const p = info._permissions || (info._permissions = parseStateSecurity(info.stateSecurity || ""));
  return ((p || {})[role] || {})[perm] || "Missing";
}

function permSummary(info, perm) {
  let a = 0;
  let d = 0;
  let m = 0;
  permissionRoles.forEach((r) => {
    const v = statePermValue(info, r, perm);
    if (v === "Allow") a++;
    else if (v === "Deny") d++;
    else m++;
  });
  return { allow: a, deny: d, missing: m };
}

function buildPermissionRoles() {
  const found = [];
  stateDefs.forEach((s) => {
    const p = parseStateSecurity(s.stateSecurity || "");
    Object.keys(p).forEach((r) => {
      if (!found.includes(r)) found.push(r);
    });
  });
  let ordered = roles.filter((r) => found.includes(r));
  if (ordered.includes("Everyone") && ordered.length > 1) {
    ordered = ordered.filter((r) => r !== "Everyone");
  }
  return ordered;
}

function refreshStateSelect() {
  const states = statesForLife(selectedLife);
  if (!states.includes(selectedState)) selectedState = states[0] || "";
  stateSelect.innerHTML = states
    .map((x) => `<option value="${esc(x)}">${esc(x)}</option>`)
    .join("");
  stateSelect.value = selectedState;
}

function filteredItems() {
  let items = transitions.filter((t) => t.life === selectedLife);
  if (selectedDirection === "from") items = items.filter((t) => t.from === selectedState);
  if (selectedDirection === "to") items = items.filter((t) => t.to === selectedState);
  if (selectedDirection === "connected") {
    items = items.filter((t) => t.from === selectedState || t.to === selectedState);
  }
  return items.sort(
    (a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to),
  );
}

function applyViewBox() {
  if (!svg) return;
  svg.setAttribute(
    "viewBox",
    viewBoxState.x + " " + viewBoxState.y + " " + viewBoxState.w + " " + viewBoxState.h,
  );
}

function zoomDiagram(direction) {
  const maxW = currentLayout ? currentLayout.width * 3 : 4800;
  const maxH = currentLayout ? currentLayout.height * 3 : 3660;
  const factor = direction === "in" ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
  const newW = Math.max(400, Math.min(maxW, viewBoxState.w * factor));
  const newH = Math.max(300, Math.min(maxH, viewBoxState.h * factor));
  const centerX = viewBoxState.x + viewBoxState.w / 2;
  const centerY = viewBoxState.y + viewBoxState.h / 2;
  viewBoxState = {
    x: centerX - newW / 2,
    y: centerY - newH / 2,
    w: newW,
    h: newH,
  };
  applyViewBox();
}

window.resetDiagramZoom = function resetDiagramZoom() {
  if (selectedLife) {
    const states = statesForLife(selectedLife);
    currentLayout = resolveLayout(states.length, lifeTransitionCount(selectedLife));
    syncDefaultViewBox(currentLayout);
  } else {
    viewBoxState = { x: 0, y: 0, w: 1600, h: 1220 };
  }
  applyViewBox();
};

function getSelectionContext(items) {
  const ctx = {
    selectedState: null,
    selectedTransitionId: null,
    relatedStates: new Set(),
    highlightedEdges: new Set(),
    selectedEdge: null,
  };
  if (!selectedElement) return ctx;

  if (selectedElement.type === "state") {
    ctx.selectedState = selectedElement.state;
    items.forEach((t) => {
      if (t.from === selectedElement.state || t.to === selectedElement.state) {
        ctx.highlightedEdges.add(String(t.id));
        ctx.relatedStates.add(t.from);
        ctx.relatedStates.add(t.to);
      }
    });
  } else if (selectedElement.type === "transition") {
    ctx.selectedTransitionId = String(selectedElement.id);
    const match = items.find((t) => String(t.id) === ctx.selectedTransitionId);
    if (match) {
      ctx.selectedEdge = ctx.selectedTransitionId;
      ctx.relatedStates.add(match.from);
      ctx.relatedStates.add(match.to);
    }
  }
  return ctx;
}

function selectState(stateName) {
  selectedElement = { type: "state", state: stateName };
  update();
}

function selectTransition(transitionId) {
  selectedElement = { type: "transition", id: String(transitionId) };
  update();
}

function clearSelection() {
  selectedElement = null;
  update();
}

function renderTransitionListItem(t) {
  const result = effective(t.security, selectedRole);
  const job = normalizeJobText(t.customJob || "");
  return (
    "<li><b>" +
    esc(t.id) +
    "</b>: " +
    esc(t.from) +
    " \u2192 " +
    esc(t.to) +
    ' \u2014 <span class="' +
    cls(result) +
    '">' +
    esc(result) +
    "</span>" +
    (job ? ' \u2014 <span class="jobCell">' + esc(job) + "</span>" : "") +
    "</li>"
  );
}

function renderStateDetails(stateName) {
  const info = stateInfo(selectedLife, stateName);
  const items = transitions.filter((t) => t.life === selectedLife);
  const incoming = items.filter((t) => t.to === stateName);
  const outgoing = items.filter((t) => t.from === stateName);
  const perms = ["Read", "Write", "Delete", "Download"];

  let html =
    "<h3>State</h3><dl>" +
    "<dt>Type</dt><dd>State</dd>" +
    "<dt>State</dt><dd>" +
    esc(stateName) +
    "</dd>" +
    "<dt>LifecycleDefinition</dt><dd>" +
    esc(selectedLife) +
    "</dd>" +
    "<dt>Valgt rolle</dt><dd>" +
    esc(selectedRole) +
    "</dd></dl>" +
    "<h3>State permissions</h3><dl>";

  perms.forEach((perm) => {
    const v = statePermValue(info, selectedRole, perm);
    html +=
      "<dt>" +
      esc(perm) +
      '</dt><dd><span class="' +
      permCls(v) +
      '">' +
      esc(permText(v)) +
      "</span></dd>";
  });

  html +=
    "</dl><h3>Indgående transitions</h3>" +
    (incoming.length
      ? "<ul>" + incoming.map(renderTransitionListItem).join("") + "</ul>"
      : "<p class=\"details-placeholder\">Ingen</p>") +
    "<h3>Udgående transitions</h3>" +
    (outgoing.length
      ? "<ul>" + outgoing.map(renderTransitionListItem).join("") + "</ul>"
      : "<p class=\"details-placeholder\">Ingen</p>");

  return html;
}

function renderTransitionDetails(transitionId) {
  const t = transitions.find(
    (item) => item.life === selectedLife && String(item.id) === String(transitionId),
  );
  if (!t) {
    return "<p class=\"details-placeholder\">Transition ikke fundet.</p>";
  }

  const result = effective(t.security, selectedRole);
  const job = normalizeJobText(t.customJob || "");
  const rowIndex = t.rowIndex != null && t.rowIndex !== "" ? String(t.rowIndex) : "-";

  return (
    "<h3>Transition</h3><dl>" +
    "<dt>Type</dt><dd>Transition</dd>" +
    "<dt>Id</dt><dd>" +
    esc(t.id) +
    "</dd>" +
    "<dt>LifecycleDefinition</dt><dd>" +
    esc(t.life) +
    "</dd>" +
    "<dt>Fra state</dt><dd>" +
    esc(t.from) +
    "</dd>" +
    "<dt>Til state</dt><dd>" +
    esc(t.to) +
    "</dd>" +
    "<dt>Valgt rolle</dt><dd>" +
    esc(selectedRole) +
    "</dd>" +
    "<dt>Resultat</dt><dd><span class=\"" +
    cls(result) +
    '">' +
    esc(result) +
    "</span></dd>" +
    "<dt>Custom JobTypes</dt><dd>" +
    (job ? '<span class="jobCell">' + esc(job) + "</span>" : "-") +
    "</dd>" +
    "<dt>Security</dt><dd>" +
    esc(t.security || "-") +
    "</dd>" +
    "<dt>Excel-række</dt><dd>" +
    esc(rowIndex) +
    "</dd></dl>"
  );
}

function renderDetailsPanel() {
  if (!detailsPanel) return;
  if (!selectedElement) {
    detailsPanel.innerHTML =
      '<p class="details-placeholder">Klik på en state eller transition for at se detaljer.</p>';
    return;
  }
  if (selectedElement.type === "state") {
    detailsPanel.innerHTML = renderStateDetails(selectedElement.state);
  } else {
    detailsPanel.innerHTML = renderTransitionDetails(selectedElement.id);
  }
}

function addJobLabel(pathId, text, hidden) {
  if (!text || !showJobs.checked) return;
  const label = normalizeJobText(text);
  if (!label) return;
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("class", "jobLabel" + (hidden ? " hidden" : ""));
  const titleText = label.length > 52 ? label.slice(0, 49) + "..." : label;
  const halo = document.createElementNS("http://www.w3.org/2000/svg", "text");
  halo.setAttribute("class", "halo");
  halo.setAttribute("text-anchor", "middle");
  const haloPath = document.createElementNS("http://www.w3.org/2000/svg", "textPath");
  haloPath.setAttribute("href", "#" + pathId);
  haloPath.setAttribute("startOffset", "68%");
  haloPath.textContent = titleText;
  halo.appendChild(haloPath);
  const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
  textEl.setAttribute("class", "label");
  textEl.setAttribute("text-anchor", "middle");
  const textPath = document.createElementNS("http://www.w3.org/2000/svg", "textPath");
  textPath.setAttribute("href", "#" + pathId);
  textPath.setAttribute("startOffset", "68%");
  textPath.textContent = titleText;
  textEl.appendChild(textPath);
  g.appendChild(halo);
  g.appendChild(textEl);
  const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
  title.textContent = label;
  g.appendChild(title);
  svg.appendChild(g);
}

function addSvgText(g, txt, x, y, clsName, anchor = "start") {
  const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
  t.setAttribute("x", x);
  t.setAttribute("y", y);
  t.setAttribute("class", clsName);
  t.setAttribute("text-anchor", anchor);
  t.textContent = txt;
  g.appendChild(t);
  return t;
}

function addPill(g, x, y, w, text, pillClass, textClass) {
  const r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  r.setAttribute("x", x);
  r.setAttribute("y", y - 13);
  r.setAttribute("width", w);
  r.setAttribute("height", 18);
  r.setAttribute("class", "pill " + pillClass);
  g.appendChild(r);
  addSvgText(g, text, x + w / 2, y, "permTxt " + textClass, "middle");
}

function addPermissionBox(state, p, hidden, layout) {
  if (!showPerms.checked) return;
  const info = stateInfo(selectedLife, state);
  const cx = layout.centerX;
  const cy = layout.centerY;
  const W = layout.width;
  const H = layout.height;
  const nodeR = layout.nodeRadius;
  let ux = (p.x - cx) / (Math.hypot(p.x - cx, p.y - cy) || 1);
  let uy = (p.y - cy) / (Math.hypot(p.x - cx, p.y - cy) || 1);
  const boxW = 236;
  const boxH = permissionMode === "summary" ? 120 : 126;
  const gap = 34;
  const projection = Math.abs(ux) * (boxW / 2) + Math.abs(uy) * (boxH / 2);
  let boxCx = p.x + ux * (nodeR + gap + projection);
  let boxCy = p.y + uy * (nodeR + gap + projection);
  let bx = boxCx - boxW / 2;
  let by = boxCy - boxH / 2;
  bx = Math.max(18, Math.min(W - boxW - 18, bx));
  by = Math.max(18, Math.min(H - boxH - 18, by));
  boxCx = bx + boxW / 2;
  boxCy = by + boxH / 2;
  const dx = boxCx - p.x;
  const dy = boxCy - p.y;
  const dl = Math.hypot(dx, dy) || 1;
  const vx = dx / dl;
  const vy = dy / dl;
  const x1 = p.x + vx * (nodeR + 5);
  const y1 = p.y + vy * (nodeR + 5);
  const edgeScale =
    1 /
    Math.max(
      Math.abs((p.x - boxCx) / (boxW / 2)),
      Math.abs((p.y - boxCy) / (boxH / 2)),
      0.0001,
    );
  const x2 = boxCx + (p.x - boxCx) * edgeScale;
  const y2 = boxCy + (p.y - boxCy) * edgeScale;
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("class", "permConnector" + (hidden ? " hidden" : ""));
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
  svg.appendChild(line);
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("class", "permBox" + (hidden ? " hidden" : ""));
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", bx);
  rect.setAttribute("y", by);
  rect.setAttribute("width", boxW);
  rect.setAttribute("height", boxH);
  g.appendChild(rect);
  addSvgText(
    g,
    state.length > 23 ? state.slice(0, 20) + "..." : state,
    bx + 12,
    by + 20,
    "title",
  );
  const perms = ["Read", "Write", "Delete", "Download"];
  if (permissionMode === "role") {
    addSvgText(
      g,
      selectedRole.length > 25 ? selectedRole.slice(0, 22) + "..." : selectedRole,
      bx + 12,
      by + 38,
      "missingTxt",
    );
    perms.forEach((perm, i) => {
      const y = by + 58 + i * 16;
      const v = statePermValue(info, selectedRole, perm);
      addSvgText(g, perm, bx + 12, y, "rowLabel");
      addPill(
        g,
        bx + 103,
        y,
        86,
        permText(v),
        v === "Allow" ? "pillAllow" : v === "Deny" ? "pillDeny" : "pillMissing",
        v === "Allow" ? "allowTxt" : v === "Deny" ? "denyTxt" : "missingTxt",
      );
    });
  } else {
    perms.forEach((perm, i) => {
      const y = by + 43 + i * 18;
      const s = permSummary(info, perm);
      addSvgText(g, perm === "Download" ? "DL" : perm[0], bx + 12, y, "rowLabel");
      addSvgText(g, s.allow + "\u2713", bx + 52, y, "permTxt allowTxt");
      addSvgText(g, s.deny + "\u2715", bx + 102, y, "permTxt denyTxt");
      addSvgText(g, s.missing + "?", bx + 152, y, "permTxt missingTxt");
    });
  }
  svg.appendChild(g);
}

function pointAlong(from, toward, distance) {
  const dx = toward.x - from.x;
  const dy = toward.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  return {
    x: from.x + (dx / len) * distance,
    y: from.y + (dy / len) * distance,
  };
}

function shortenQuadEndpoints(p1, control, p2, nodeRadius) {
  const inset = nodeRadius + EDGE_INSET;
  return {
    start: pointAlong(p1, control, inset),
    control,
    end: pointAlong(p2, control, inset),
  };
}

function diagramDefs(layout) {
  const sz = layout.arrowSize || 12;
  const refX = Math.round(sz * 0.83);
  const refY = Math.round(sz * 0.33);
  const pathH = Math.round(sz * 0.67);
  const pathW = Math.round(sz * 0.92);
  return (
    '<defs>' +
    '<filter id="boxShadow" x="-20%" y="-20%" width="140%" height="140%">' +
    '<feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000" flood-opacity="0.15"/>' +
    "</filter>" +
    '<marker id="arrow-allow" markerWidth="' +
    sz +
    '" markerHeight="' +
    sz +
    '" refX="' +
    refX +
    '" refY="' +
    refY +
    '" orient="auto">' +
    '<path d="M0,0 L0,' +
    pathH +
    " L" +
    pathW +
    "," +
    refY +
    ' z" fill="#1b7f4a"></path></marker>' +
    '<marker id="arrow-deny" markerWidth="' +
    sz +
    '" markerHeight="' +
    sz +
    '" refX="' +
    refX +
    '" refY="' +
    refY +
    '" orient="auto">' +
    '<path d="M0,0 L0,' +
    pathH +
    " L" +
    pathW +
    "," +
    refY +
    ' z" fill="#b91c1c"></path></marker>' +
    '<marker id="arrow-none" markerWidth="' +
    sz +
    '" markerHeight="' +
    sz +
    '" refX="' +
    refX +
    '" refY="' +
    refY +
    '" orient="auto">' +
    '<path d="M0,0 L0,' +
    pathH +
    " L" +
    pathW +
    "," +
    refY +
    ' z" fill="#6b7280"></path></marker>' +
    "</defs>"
  );
}

function renderDiagram(items) {
  const states = statesForLife(selectedLife);
  const edgeCount = lifeTransitionCount(selectedLife);
  const layout = resolveLayout(states.length, edgeCount);
  currentLayout = layout;

  svg.classList.remove("density-normal", "density-dense", "density-very-dense");
  svg.classList.add(layout.densityClass);

  svg.innerHTML = diagramDefs(layout);
  applyViewBox();

  const cx = layout.centerX;
  const cy = layout.centerY;
  const R = layout.radius;
  const nodeRadius = layout.nodeRadius;
  const fontSize = layout.fontSize;

  const sel = getSelectionContext(items);
  const pos = {};
  states.forEach((s, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / states.length;
    pos[s] = { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });

  const directedPairs = buildDirectedPairMap(items);
  const undirectedPair = new Set(items.map((t) => t.from + "||" + t.to));
  const allowFrom = new Set();
  const allowTo = new Set();
  const denyTo = new Set();
  const visibleStates = new Set();

  items.forEach((t) => {
    const p1 = pos[t.from];
    const p2 = pos[t.to];
    if (!p1 || !p2) return;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy) || 1;
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    const dirKey = t.from + "||" + t.to;
    const group = directedPairs.get(dirKey) || [t];
    const pairIndex = group.findIndex((x) => x.id === t.id);
    const pairCount = group.length;
    const reverseExists = undirectedPair.has(t.to + "||" + t.from);
    const off = edgeCurveOffset(t, pairIndex, pairCount, layout, reverseExists);
    const qx = mx - (dy / len) * off;
    const qy = my + (dx / len) * off;
    const control = { x: qx, y: qy };
    const v = effective(t.security, selectedRole);
    const c = cls(v);
    const hide =
      (c === "deny" && !showDeny.checked) || (c === "none" && !showNone.checked);
    if (!hide) {
      visibleStates.add(t.from);
      visibleStates.add(t.to);
    }
    if (c === "allow") {
      allowFrom.add(t.from);
      allowTo.add(t.to);
    }
    if (c === "deny") denyTo.add(t.to);

    const pts = shortenQuadEndpoints(p1, control, p2, nodeRadius);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const pathId =
      "edge-" + selectedLife.replace(/[^a-z0-9]+/gi, "-") + "-" + t.id;
    let edgeClass = "edge " + c + (hide ? " hidden" : "");
    const tid = String(t.id);
    if (sel.selectedEdge === tid) edgeClass += " selectedEdge";
    else if (sel.highlightedEdges.has(tid)) edgeClass += " highlightedEdge";
    else if (selectedElement && !hide) edgeClass += " dimmedEdge";
    path.setAttribute("id", pathId);
    path.setAttribute("class", edgeClass);
    path.setAttribute(
      "d",
      "M " +
        pts.start.x +
        "," +
        pts.start.y +
        " Q " +
        pts.control.x +
        "," +
        pts.control.y +
        " " +
        pts.end.x +
        "," +
        pts.end.y,
    );
    path.setAttribute("marker-end", "url(#arrow-" + c + ")");
    path.innerHTML =
      "<title>" +
      esc(t.id) +
      ": " +
      esc(t.from) +
      " -> " +
      esc(t.to) +
      " | " +
      esc(v) +
      " | " +
      esc(t.security) +
      " | Job: " +
      esc(normalizeJobText(t.customJob || "")) +
      "</title>";
    path.addEventListener("click", (event) => {
      event.stopPropagation();
      selectTransition(t.id);
    });
    svg.appendChild(path);
    addJobLabel(pathId, t.customJob, hide);
  });

  states.forEach((s) => {
    const p = pos[s];
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    let nc = "node";
    if (s === selectedState && selectedDirection !== "all") nc += " selectedState";
    const unrelated =
      selectedDirection !== "all" && !visibleStates.has(s) && s !== selectedState;
    if (unrelated) nc += hideUnrelated.checked ? " hiddenNode" : " unrelated";
    if (allowFrom.has(s)) nc += " activeFrom";
    if (allowTo.has(s)) nc += " activeTo";
    else if (denyTo.has(s)) nc += " deniedTo";
    if (sel.selectedState === s) nc += " selectedNode";
    else if (sel.relatedStates.has(s)) nc += " relatedNode";
    else if (selectedElement) nc += " dimmedNode";
    g.setAttribute("class", nc);
    g.innerHTML =
      '<circle cx="' +
      p.x +
      '" cy="' +
      p.y +
      '" r="' +
      nodeRadius +
      '"></circle><text x="' +
      p.x +
      '" y="' +
      (p.y + Math.round(fontSize * 0.35)) +
      '" text-anchor="middle" style="font-size:' +
      fontSize +
      'px">' +
      esc(s) +
      "</text>";
    g.addEventListener("click", (event) => {
      event.stopPropagation();
      selectState(s);
    });
    svg.appendChild(g);
    addPermissionBox(s, p, unrelated && hideUnrelated.checked, layout);
  });

  svg.onclick = () => {
    if (selectedElement) clearSelection();
  };
}

function directionText() {
  if (selectedDirection === "from") return "fra " + selectedState;
  if (selectedDirection === "to") return "til " + selectedState;
  if (selectedDirection === "connected") return "til/fra " + selectedState;
  return "alle transitions";
}

function tdPerm(v) {
  const c = permCls(v);
  return '<td class="permCell ' + c + '">' + esc(permText(v)) + "</td>";
}

function renderPermissionTable() {
  const states = stateDefs
    .filter((s) => s.life === selectedLife)
    .sort((a, b) => a.state.localeCompare(b.state));
  const rows = [];
  states.forEach((s) => {
    permissionRoles.forEach((r) => {
      const info = s;
      rows.push(
        "<tr><td>" +
          esc(s.state) +
          "</td><td>" +
          esc(r) +
          "</td>" +
          tdPerm(statePermValue(info, r, "Read")) +
          tdPerm(statePermValue(info, r, "Write")) +
          tdPerm(statePermValue(info, r, "Delete")) +
          tdPerm(statePermValue(info, r, "Download")) +
          "</tr>",
      );
    });
  });
  permTableBody.innerHTML = rows.join("");
}

function update() {
  document.querySelectorAll(".roleBtn").forEach((b) => {
    b.classList.toggle("active", b.textContent === selectedRole);
  });
  permissionMode = permModeSelect.value;
  const items = filteredItems();
  let ac = 0;
  let dc = 0;
  let nc = 0;
  let jc = 0;
  items.forEach((t) => {
    const c = cls(effective(t.security, selectedRole));
    if (c === "allow") ac++;
    else if (c === "deny") dc++;
    else nc++;
    if (t.customJob) jc++;
  });
  summary.innerHTML =
    "<b>" +
    esc(selectedLife) +
    "</b> / <b>" +
    esc(selectedRole) +
    "</b> / <b>" +
    esc(directionText()) +
    "</b>: " +
    ac +
    " Allow, " +
    dc +
    " Deny, " +
    nc +
    " ikke specificeret, " +
    jc +
    " Custom Job. State permissions: " +
    (showPerms.checked
      ? permissionMode === "role"
        ? "for valgt rolle"
        : "summering"
      : "skjult") +
    "." +
    (largeWorkflowHint && selectedDirection === "connected"
      ? ' <span class="layout-hint">Stor lifecycle: Starter med "Til/fra valgt state" for bedre overblik. Vælg "Alle transitions" for komplet graf.</span>'
      : "");
  renderDiagram(items);
  const order = { allow: 0, deny: 1, none: 2 };
  tableBody.innerHTML = items
    .slice()
    .sort(
      (a, b) =>
        order[cls(effective(a.security, selectedRole))] -
          order[cls(effective(b.security, selectedRole))] ||
        a.from.localeCompare(b.from) ||
        a.to.localeCompare(b.to),
    )
    .map((t) => {
      const v = effective(t.security, selectedRole);
      const c = cls(v);
      return (
        "<tr><td>" +
        esc(t.id) +
        "</td><td>" +
        esc(t.from) +
        "</td><td>" +
        esc(t.to) +
        "</td><td class=\"" +
        c +
        "\">" +
        esc(v) +
        "</td><td class=\"jobCell\">" +
        esc(normalizeJobText(t.customJob || "")) +
        "</td><td>" +
        esc(t.security) +
        "</td></tr>"
      );
    })
    .join("");
  renderPermissionTable();
  renderDetailsPanel();
}

function bindControls() {
  lifeSelect.onchange = () => {
    selectedLife = lifeSelect.value;
    selectedElement = null;
    refreshStateSelect();
    applyLargeWorkflowDefaults(false);
    applyDensePermissionDefaults(null);
    window.resetDiagramZoom();
    update();
  };
  stateSelect.onchange = () => {
    selectedState = stateSelect.value;
    update();
  };
  directionSelect.onchange = () => {
    selectedDirection = directionSelect.value;
    selectedElement = null;
    update();
  };
  showDeny.onchange = update;
  showNone.onchange = update;
  showJobs.onchange = update;
  showPerms.onchange = update;
  permModeSelect.onchange = () => {
    permissionMode = permModeSelect.value;
    update();
  };
  hideUnrelated.onchange = update;
  if (layoutModeSelect) {
    layoutModeSelect.onchange = () => {
      layoutMode = layoutModeSelect.value;
      const states = statesForLife(selectedLife);
      currentLayout = resolveLayout(states.length, lifeTransitionCount(selectedLife));
      syncDefaultViewBox(currentLayout);
      applyViewBox();
      update();
    };
  }
  if (focusSelectedBtn) focusSelectedBtn.onclick = focusSelectedStateView;
  if (zoomInBtn) zoomInBtn.onclick = () => zoomDiagram("in");
  if (zoomOutBtn) zoomOutBtn.onclick = () => zoomDiagram("out");
  if (zoomResetBtn) zoomResetBtn.onclick = () => window.resetDiagramZoom();
}

function setupViewer(initialContext) {
  permissionRoles = buildPermissionRoles();
  lifecycles = uniq(
    transitions.map((t) => t.life).concat(stateDefs.map((s) => s.life)),
  );
  roles = uniq(roles);
  if (!roles.includes("Everyone")) roles.push("Everyone");

  lifeSelect.innerHTML = lifecycles
    .map((x) => `<option value="${esc(x)}">${esc(x)}</option>`)
    .join("");
  if (!selectedLife || !lifecycles.includes(selectedLife)) {
    selectedLife = lifecycles[0] || "";
  }
  lifeSelect.value = selectedLife;
  refreshStateSelect();

  roleButtons.innerHTML = "";
  roles.forEach((r) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "roleBtn";
    b.textContent = r;
    b.onclick = () => {
      selectedRole = r;
      update();
    };
    roleButtons.appendChild(b);
  });

  if (!selectedRole || !roles.includes(selectedRole)) {
    selectedRole = roles[0] || "Everyone";
  }

  if (initialContext) {
    if (initialContext.selectedDirection && directionSelect) {
      selectedDirection = initialContext.selectedDirection;
      directionSelect.value = selectedDirection;
    }
    if (initialContext.layoutMode && layoutModeSelect) {
      layoutMode = initialContext.layoutMode;
      layoutModeSelect.value = layoutMode;
    }
    if (initialContext.permissionMode && permModeSelect) {
      permissionMode = initialContext.permissionMode;
      permModeSelect.value = permissionMode;
    }
    if (showDeny && initialContext.showDeny != null) {
      showDeny.checked = initialContext.showDeny;
    }
    if (showNone && initialContext.showNone != null) {
      showNone.checked = initialContext.showNone;
    }
    if (showJobs && initialContext.showJobs != null) {
      showJobs.checked = initialContext.showJobs;
    }
    if (showPerms && initialContext.showPerms != null) {
      showPerms.checked = initialContext.showPerms;
    }
    if (hideUnrelated && initialContext.hideUnrelated != null) {
      hideUnrelated.checked = initialContext.hideUnrelated;
    }
  }

  applyLargeWorkflowDefaults(initialContext && initialContext.selectedDirection);
  applyDensePermissionDefaults(initialContext);

  bindControls();
  const initStates = statesForLife(selectedLife);
  currentLayout = resolveLayout(initStates.length, lifeTransitionCount(selectedLife));
  syncDefaultViewBox(currentLayout);
  applyViewBox();
  update();
}

function apiToViewerData(payload) {
  return {
    transitions: (payload.edges || []).map((e) => ({
      id: String(e.id),
      life: e.lifecycleDefinition,
      from: e.fromState,
      to: e.toState,
      security: e.security || "",
      customJob: e.customJob || "",
      rowIndex: e.rowIndex != null ? e.rowIndex : null,
    })),
    stateDefs: (payload.stateDefinitions || []).map((s) => ({
      id: String(s.id),
      life: s.lifecycleDefinition,
      state: s.state,
      stateSecurity: s.security || "",
    })),
    lifecycles: payload.lifecycleDefinitions || [],
    roles: payload.roles || ["Everyone"],
  };
}

window.initWorkflowViewer = function initWorkflowViewer(apiPayload, initialContext) {
  svg = document.getElementById("diagram");
  lifeSelect = document.getElementById("lifeSelect");
  stateSelect = document.getElementById("stateSelect");
  directionSelect = document.getElementById("directionSelect");
  roleButtons = document.getElementById("roleButtons");
  tableBody = document.getElementById("transitionTable");
  permTableBody = document.getElementById("permissionTable");
  summary = document.getElementById("selectedSummary");
  showDeny = document.getElementById("showDeny");
  showNone = document.getElementById("showNone");
  showJobs = document.getElementById("showJobs");
  showPerms = document.getElementById("showPerms");
  permModeSelect = document.getElementById("permModeSelect");
  hideUnrelated = document.getElementById("hideUnrelated");
  layoutModeSelect = document.getElementById("layoutModeSelect");
  focusSelectedBtn = document.getElementById("focus-selected-btn");
  detailsPanel = document.getElementById("details-panel");
  zoomInBtn = document.getElementById("zoom-in-btn");
  zoomOutBtn = document.getElementById("zoom-out-btn");
  zoomResetBtn = document.getElementById("zoom-reset-btn");

  selectedElement = null;

  const data = apiToViewerData(apiPayload);
  transitions = data.transitions;
  stateDefs = data.stateDefs;
  lifecycles = data.lifecycles;
  roles = data.roles;
  selectedDirection = "all";
  permissionMode = "role";
  layoutMode = "auto";
  largeWorkflowHint = false;

  if (initialContext) {
    if (initialContext.selectedLifeCycle) {
      selectedLife = initialContext.selectedLifeCycle;
    }
    if (initialContext.selectedRole) {
      selectedRole = initialContext.selectedRole;
    }
    if (initialContext.selectedState) {
      selectedState = initialContext.selectedState;
    }
    if (initialContext.selectedDirection) {
      selectedDirection = initialContext.selectedDirection;
    }
    if (initialContext.permissionMode) {
      permissionMode = initialContext.permissionMode;
    }
    if (initialContext.layoutMode) {
      layoutMode = initialContext.layoutMode;
    }
  }

  setupViewer(initialContext);
};

window.getWorkflowViewerContext = function getWorkflowViewerContext() {
  return {
    selectedLifeCycle: selectedLife,
    selectedRole,
    selectedState,
    selectedDirection,
    showDeny: showDeny ? showDeny.checked : true,
    showNone: showNone ? showNone.checked : false,
    showJobs: showJobs ? showJobs.checked : true,
    showPerms: showPerms ? showPerms.checked : true,
    permissionMode: permModeSelect ? permModeSelect.value : "role",
    hideUnrelated: hideUnrelated ? hideUnrelated.checked : true,
    layoutMode: layoutModeSelect ? layoutModeSelect.value : layoutMode,
  };
};
