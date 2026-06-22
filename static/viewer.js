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
let diagramType = "circle";
let diagramTypeSelect;
let workflowViewMode = "all";
let workflowViewModeSelect;
let workflowLayoutOverrides = {};
let workflowTransitionOverrides = {};
let workflowLayoutPanel;
let workflowStateLayoutTable;
let workflowTransitionOverrideTable;
let generateWorkflowLayoutBtn;
let copyWorkflowLayoutJsonBtn;
let pasteWorkflowLayoutJsonBtn;

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

function syncViewerControlState() {
  if (layoutModeSelect) layoutMode = layoutModeSelect.value;
  if (diagramTypeSelect) diagramType = diagramTypeSelect.value;
  if (workflowViewModeSelect) workflowViewMode = workflowViewModeSelect.value;
  syncWorkflowViewModeControlAvailability();
  syncWorkflowLayoutPanelVisibility();
}

function syncWorkflowViewModeControlAvailability() {
  if (!workflowViewModeSelect) return;
  const isWorkflow = getActiveDiagramType() === "workflow";
  workflowViewModeSelect.disabled = !isWorkflow;
  workflowViewModeSelect.closest("label")?.classList.toggle("disabled-control", !isWorkflow);
}

function getActiveDiagramType() {
  return diagramTypeSelect ? diagramTypeSelect.value : diagramType;
}

function resolveCurrentDiagramLayout() {
  if (!selectedLife) return null;
  const states = statesForLife(selectedLife);
  const edgeCount = lifeTransitionCount(selectedLife);
  if (getActiveDiagramType() === "workflow") {
    const items = transitions.filter((t) => t.life === selectedLife);
    const baseLayout = getWorkflowLayoutConfig(states.length, edgeCount);
    const wf = buildWorkflowPositions(states, items, baseLayout);
    return {
      layout: { ...baseLayout, width: wf.width, height: wf.height },
      workflow: wf,
    };
  }
  return {
    layout: resolveLayout(states.length, edgeCount),
    workflow: null,
  };
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

function getWorkflowLayoutConfig(stateCount, edgeCount) {
  const autoDense = edgeCount > 40 || stateCount > 8;
  const autoVeryDense = edgeCount > 80 || stateCount > 12;

  if (layoutMode === "large") {
    return {
      width: 2600,
      height: 1500,
      nodeWidth: 210,
      nodeHeight: 74,
      fontSize: 15,
      columnGap: 320,
      rowGap: 170,
      marginX: 120,
      marginY: 160,
      densityClass: "density-normal",
      arrowSize: 11,
    };
  }
  if (layoutMode === "dense" || autoVeryDense) {
    return {
      width: 2200,
      height: 1300,
      nodeWidth: 165,
      nodeHeight: 62,
      fontSize: 12,
      columnGap: 240,
      rowGap: 130,
      marginX: 90,
      marginY: 130,
      densityClass: "density-very-dense",
      arrowSize: 7,
    };
  }
  if (layoutMode === "normal") {
    return {
      width: 1700,
      height: 950,
      nodeWidth: 200,
      nodeHeight: 72,
      fontSize: 14,
      columnGap: 260,
      rowGap: 140,
      marginX: 100,
      marginY: 120,
      densityClass: "density-normal",
      arrowSize: 10,
    };
  }
  if (autoDense) {
    return {
      width: 2200,
      height: 1350,
      nodeWidth: 185,
      nodeHeight: 68,
      fontSize: 13,
      columnGap: 270,
      rowGap: 145,
      marginX: 100,
      marginY: 140,
      densityClass: "density-dense",
      arrowSize: 9,
    };
  }
  return {
    width: 1700,
    height: 950,
    nodeWidth: 200,
    nodeHeight: 72,
    fontSize: 14,
    columnGap: 260,
    rowGap: 140,
    marginX: 100,
    marginY: 120,
    densityClass: "density-normal",
    arrowSize: 10,
  };
}

function classifyWorkflowState(stateName) {
  const n = String(stateName || "").toLowerCase();
  if (/\bready for obsolete\b/.test(n)) {
    return { columnHint: 4, lane: "bottom", priority: 50 };
  }
  if (/\bobsolete\b/.test(n)) {
    return { columnHint: 5, lane: "bottom", priority: 51 };
  }
  if (/\breject/.test(n)) {
    return { columnHint: 3, lane: "bottom", priority: 40 };
  }
  if (/\bcancel/.test(n)) {
    return { columnHint: 2, lane: "bottom", priority: 41 };
  }
  if (/\bclosed?\b/.test(n)) {
    return { columnHint: 6, lane: "main", priority: 90 };
  }
  if (/\breleased?\b|\bapproved\b|\brd re/.test(n)) {
    return { columnHint: 5, lane: "main", priority: 80 };
  }
  if (
    /\bfor review\b|\bin review\b|\breview\b|\bcheck/.test(n) ||
    /\bapproval\b|\bapprove\b|\bschedule\b|\bready\b|\bpre[- ]release/.test(n)
  ) {
    return { columnHint: 3, lane: "main", priority: 60 };
  }
  if (
    /\bcreate\b|\bcreated\b|\bopen\b|\bimported\b|\bnew\b|\bwork in progress\b|\bwip\b/.test(
      n,
    )
  ) {
    return { columnHint: 1, lane: "main", priority: 10 };
  }
  return null;
}

function syncWorkflowLayoutPanelVisibility() {
  if (!workflowLayoutPanel) return;
  const isWorkflow = getActiveDiagramType() === "workflow";
  workflowLayoutPanel.classList.toggle("hidden", !isWorkflow);
}

function buildAutomaticStateWorkflowMeta(states, items) {
  const meta = {};
  states.forEach((s) => {
    meta[s] = classifyWorkflowState(s);
  });
  for (let pass = 0; pass < 12; pass++) {
    let changed = false;
    states.forEach((s) => {
      if (meta[s]) return;
      const incoming = items.filter((t) => t.to === s);
      const outgoing = items.filter((t) => t.from === s);
      let col = 2;
      if (incoming.length) {
        const cols = incoming
          .map((t) => meta[t.from]?.columnHint)
          .filter((v) => v != null);
        if (cols.length < incoming.length) return;
        col = Math.max(...cols) + 1;
      } else if (outgoing.length) {
        const cols = outgoing
          .map((t) => meta[t.to]?.columnHint)
          .filter((v) => v != null);
        if (cols.length < outgoing.length) return;
        col = Math.min(...cols) - 1;
      }
      col = Math.max(0, Math.min(6, col));
      meta[s] = { columnHint: col, lane: "main", priority: 500 };
      changed = true;
    });
    if (!changed) break;
  }
  states.forEach((s) => {
    if (!meta[s]) {
      meta[s] = { columnHint: 2, lane: "main", priority: 900 };
    }
  });
  return meta;
}

function buildStateWorkflowMeta(states, items) {
  const meta = buildAutomaticStateWorkflowMeta(states, items);
  states.forEach((s) => {
    const override = workflowLayoutOverrides[selectedLife]?.states?.[s];
    if (override) {
      meta[s] = {
        columnHint: Number(override.column),
        lane: override.lane || "main",
        priority: Number(override.order ?? 100),
      };
    }
  });
  return meta;
}

function buildWorkflowPositions(states, items, layout) {
  const meta = buildStateWorkflowMeta(states, items);
  const columns = uniq(states.map((s) => meta[s].columnHint)).sort((a, b) => a - b);
  const columnIndex = {};
  columns.forEach((c, i) => {
    columnIndex[c] = i;
  });

  const groups = {};
  states.forEach((s) => {
    const m = meta[s];
    const key = m.lane + "|" + m.columnHint;
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  });
  Object.keys(groups).forEach((key) => {
    groups[key].sort(
      (a, b) =>
        meta[a].priority - meta[b].priority || a.localeCompare(b, "da"),
    );
  });

  let maxTopRows = 1;
  let maxMainRows = 1;
  let maxBottomRows = 1;
  columns.forEach((col) => {
    const topKey = "top|" + col;
    const mainKey = "main|" + col;
    const bottomKey = "bottom|" + col;
    if (groups[topKey]) maxTopRows = Math.max(maxTopRows, groups[topKey].length);
    if (groups[mainKey]) maxMainRows = Math.max(maxMainRows, groups[mainKey].length);
    if (groups[bottomKey]) {
      maxBottomRows = Math.max(maxBottomRows, groups[bottomKey].length);
    }
  });

  const topLaneHeight =
    maxTopRows * layout.nodeHeight + Math.max(0, maxTopRows - 1) * layout.rowGap;
  const hasTopLane = columns.some((col) => (groups["top|" + col] || []).length > 0);
  const mainBaseY =
    layout.marginY + (hasTopLane ? topLaneHeight + layout.rowGap : 0);
  const mainLaneHeight =
    maxMainRows * layout.nodeHeight + Math.max(0, maxMainRows - 1) * layout.rowGap;
  const bottomBaseY = mainBaseY + mainLaneHeight + layout.rowGap * 2;

  const positions = {};
  let maxX = layout.marginX;
  let maxY = layout.marginY;

  columns.forEach((col) => {
    const x = layout.marginX + columnIndex[col] * (layout.nodeWidth + layout.columnGap);
    ["top", "main", "bottom"].forEach((lane) => {
      const key = lane + "|" + col;
      const list = groups[key] || [];
      let baseY = layout.marginY;
      if (lane === "main") baseY = mainBaseY;
      else if (lane === "bottom") baseY = bottomBaseY;
      list.forEach((state, row) => {
        const y = baseY + row * (layout.nodeHeight + layout.rowGap);
        positions[state] = {
          x,
          y,
          width: layout.nodeWidth,
          height: layout.nodeHeight,
          lane,
          column: col,
        };
        maxX = Math.max(maxX, x + layout.nodeWidth);
        maxY = Math.max(maxY, y + layout.nodeHeight);
      });
    });
  });

  return {
    positions,
    columns,
    lanes: hasTopLane ? ["top", "main", "bottom"] : ["main", "bottom"],
    width: Math.max(layout.width, maxX + layout.marginX),
    height: Math.max(layout.height, maxY + layout.marginY),
  };
}

function splitStateLabel(label, maxCharsPerLine) {
  const words = String(label || "").trim().split(/\s+/);
  if (!words.length) return [""];
  const lines = [];
  let current = words[0];
  for (let i = 1; i < words.length; i++) {
    const next = current + " " + words[i];
    if (next.length <= maxCharsPerLine) current = next;
    else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines.slice(0, 3);
}

function addWorkflowNode(stateName, position, className, layout) {
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("class", className);
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", position.x);
  rect.setAttribute("y", position.y);
  rect.setAttribute("width", position.width);
  rect.setAttribute("height", position.height);
  rect.setAttribute("rx", "6");
  rect.setAttribute("ry", "6");
  g.appendChild(rect);

  const lines = splitStateLabel(stateName, layout.nodeWidth > 180 ? 16 : 14);
  const lineHeight = Math.max(12, layout.fontSize + 2);
  const startY =
    position.y +
    position.height / 2 -
    ((lines.length - 1) * lineHeight) / 2 +
    layout.fontSize * 0.35;
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("x", position.x + position.width / 2);
  text.setAttribute("y", startY);
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("style", "font-size:" + layout.fontSize + "px");
  lines.forEach((line, i) => {
    const tsp = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
    tsp.setAttribute("x", position.x + position.width / 2);
    if (i > 0) tsp.setAttribute("dy", lineHeight);
    tsp.textContent = line;
    text.appendChild(tsp);
  });
  g.appendChild(text);
  g.addEventListener("click", (event) => {
    event.stopPropagation();
    selectState(stateName);
  });
  svg.appendChild(g);
}

function workflowEdgePath(fromPos, toPos, index, layout) {
  const off = 35 + index * 16;
  const sameCol = Math.abs(fromPos.x - toPos.x) < layout.nodeWidth * 0.6;
  const forward = toPos.x > fromPos.x + layout.nodeWidth * 0.25;

  let x1;
  let y1;
  let x2;
  let y2;
  let c1x;
  let c1y;
  let c2x;
  let c2y;

  if (sameCol) {
    x1 = fromPos.x + fromPos.width;
    y1 = fromPos.y + fromPos.height / 2;
    x2 = toPos.x + toPos.width;
    y2 = toPos.y + toPos.height / 2;
    c1x = x1 + off;
    c1y = y1;
    c2x = x2 + off;
    c2y = y2;
  } else if (forward) {
    x1 = fromPos.x + fromPos.width;
    y1 = fromPos.y + fromPos.height / 2;
    x2 = toPos.x;
    y2 = toPos.y + toPos.height / 2;
    const mx = (x1 + x2) / 2;
    c1x = mx;
    c1y = y1;
    c2x = mx;
    c2y = y2;
    if (fromPos.lane !== toPos.lane) {
      if (toPos.lane === "bottom") {
        c1y = y1 + off;
        c2y = y2 - off * 0.5;
      } else {
        c1y = y1 - off * 0.5;
        c2y = y2 + off;
      }
    }
  } else {
    x1 = fromPos.x;
    y1 = fromPos.y + fromPos.height / 2;
    x2 = toPos.x + toPos.width;
    y2 = toPos.y + toPos.height / 2;
    const arcY = Math.min(fromPos.y, toPos.y) - layout.rowGap - index * 20;
    c1x = x1 - off;
    c1y = arcY;
    c2x = x2 + off;
    c2y = arcY;
  }

  return {
    d: "M " + x1 + "," + y1 + " C " + c1x + "," + c1y + " " + c2x + "," + c2y + " " + x2 + "," + y2,
  };
}

function prepareDiagramSurface(layout) {
  currentLayout = layout;
  svg.classList.remove("density-normal", "density-dense", "density-very-dense");
  svg.classList.add(layout.densityClass || "density-normal");
  svg.innerHTML = diagramDefs(layout);
  applyViewBox();
}

function renderDiagram(items) {
  syncViewerControlState();
  if (getActiveDiagramType() === "workflow") {
    renderWorkflowDiagram(items);
  } else {
    renderCircleDiagram(items);
  }
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
  syncViewerControlState();
  const resolved = resolveCurrentDiagramLayout();
  if (resolved) {
    currentLayout = resolved.layout;
    syncDefaultViewBox(resolved.layout);
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

function renderCircleDiagram(items) {
  const layout = resolveCurrentDiagramLayout().layout;
  prepareDiagramSurface(layout);
  const states = statesForLife(selectedLife);

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

function isTransitionHiddenByCheckbox(t) {
  const c = cls(effective(t.security, selectedRole));
  return (c === "deny" && !showDeny.checked) || (c === "none" && !showNone.checked);
}

function isForwardWorkflowTransition(t, positions) {
  const from = positions[t.from];
  const to = positions[t.to];
  if (!from || !to) return true;
  return to.column > from.column;
}

function isExceptionWorkflowTransition(t, positions) {
  const from = positions[t.from];
  const to = positions[t.to];
  if (!from || !to) return false;

  const fromName = String(t.from || "").toLowerCase();
  const toName = String(t.to || "").toLowerCase();

  const backward = to.column <= from.column;
  const bottomLane = from.lane === "bottom" || to.lane === "bottom";
  const exceptionName =
    /reject|cancel|obsolete|quick-change|quick change|re-open|reopen|withdraw/i.test(
      fromName + " " + toName,
    );

  return backward || bottomLane || exceptionName;
}

function isAllowForSelectedRole(t) {
  return cls(effective(t.security, selectedRole)) === "allow";
}

function workflowViewModeText() {
  if (workflowViewMode === "clean") return "Ren workflow";
  if (workflowViewMode === "main") return "Primær rute";
  if (workflowViewMode === "exceptions") return "Retur/afvigelser";
  return "Alle transitions";
}

function buildCleanWorkflowTransitions(items, positions) {
  const seenPairs = new Set();

  return items.filter((t) => {
    const from = positions[t.from];
    const to = positions[t.to];
    if (!from || !to) return false;

    const pairKey = t.from + "||" + t.to;
    if (seenPairs.has(pairKey)) return false;

    const toName = String(t.to || "").toLowerCase();
    const targetIsException = /obsolete|rejected|cancelled|canceled/.test(toName);

    const forward = to.column > from.column;
    const shortEnough = to.column - from.column <= 2;
    const allowed = isAllowForSelectedRole(t);

    if ((forward && shortEnough && allowed) || targetIsException) {
      seenPairs.add(pairKey);
      return true;
    }

    return false;
  });
}

function filterWorkflowItemsForViewMode(items, positions) {
  if (getActiveDiagramType() !== "workflow") return items;

  if (workflowViewMode === "all") {
    return items.filter((t) => getTransitionOverrideRole(t) !== "hidden");
  }

  if (workflowViewMode === "main") {
    if (hasManualPrimaryTransitions()) {
      return items.filter((t) => getTransitionOverrideRole(t) === "primary");
    }
    return items.filter(
      (t) =>
        getTransitionOverrideRole(t) !== "hidden" &&
        isForwardWorkflowTransition(t, positions) &&
        isAllowForSelectedRole(t),
    );
  }

  if (workflowViewMode === "exceptions") {
    return items.filter((t) => {
      if (getTransitionOverrideRole(t) === "hidden") return false;
      const role = getTransitionOverrideRole(t);
      if (role === "secondary") return true;
      return isExceptionWorkflowTransition(t, positions);
    });
  }

  if (workflowViewMode === "clean") {
    const ids = new Set(
      buildCleanWorkflowTransitions(items, positions).map((t) => String(t.id)),
    );
    items.forEach((t) => {
      const role = getTransitionOverrideRole(t);
      if (role === "primary" || role === "secondary") ids.add(String(t.id));
      if (role === "hidden") ids.delete(String(t.id));
    });
    return items.filter((t) => ids.has(String(t.id)));
  }

  return items;
}

function getTransitionOverrideRole(t) {
  return (
    workflowTransitionOverrides[selectedLife]?.transitions?.[String(t.id)]?.role ||
    "auto"
  );
}

function hasManualPrimaryTransitions() {
  const tr = workflowTransitionOverrides[selectedLife]?.transitions;
  if (!tr) return false;
  return Object.values(tr).some((o) => o.role === "primary");
}

function hasManualLayoutOverridesForLife() {
  const st = workflowLayoutOverrides[selectedLife]?.states;
  return !!(st && Object.keys(st).length);
}

function hasManualTransitionOverridesForLife() {
  const tr = workflowTransitionOverrides[selectedLife]?.transitions;
  return !!(tr && Object.keys(tr).length);
}

function ensureLifeLayoutOverrideBucket() {
  if (!workflowLayoutOverrides[selectedLife]) {
    workflowLayoutOverrides[selectedLife] = { states: {} };
  }
  return workflowLayoutOverrides[selectedLife];
}

function ensureLifeTransitionOverrideBucket() {
  if (!workflowTransitionOverrides[selectedLife]) {
    workflowTransitionOverrides[selectedLife] = { transitions: {} };
  }
  return workflowTransitionOverrides[selectedLife];
}

function getStateLayoutOverride(stateName) {
  return workflowLayoutOverrides[selectedLife]?.states?.[stateName] || null;
}

function transitionOverrideLabel(role) {
  if (role === "primary") return "Primær";
  if (role === "secondary") return "Sekundær";
  if (role === "hidden") return "Skjult";
  return "Auto";
}

function onWorkflowLayoutFieldChange(event) {
  const target = event.target;
  const stateName = target.getAttribute("data-state");
  const field = target.getAttribute("data-field");
  if (!stateName || !field) return;
  ensureLifeLayoutOverrideBucket();
  if (!workflowLayoutOverrides[selectedLife].states[stateName]) {
    workflowLayoutOverrides[selectedLife].states[stateName] = {};
  }
  const entry = workflowLayoutOverrides[selectedLife].states[stateName];
  if (field === "column" || field === "order") {
    entry[field] = Number(target.value);
  } else {
    entry[field] = target.value;
  }
  window.resetDiagramZoom();
  update();
}

function onWorkflowTransitionOverrideChange(event) {
  const target = event.target;
  const tid = target.getAttribute("data-transition-id");
  if (!tid) return;
  ensureLifeTransitionOverrideBucket();
  const role = target.value;
  if (role === "auto") {
    delete workflowTransitionOverrides[selectedLife].transitions[tid];
  } else {
    workflowTransitionOverrides[selectedLife].transitions[tid] = { role };
  }
  window.resetDiagramZoom();
  update();
}

function generateWorkflowLayoutFromCurrent() {
  const states = statesForLife(selectedLife);
  const items = transitions.filter((t) => t.life === selectedLife);
  const meta = buildAutomaticStateWorkflowMeta(states, items);
  ensureLifeLayoutOverrideBucket();
  states.forEach((s) => {
    const m = meta[s];
    workflowLayoutOverrides[selectedLife].states[s] = {
      column: m.columnHint,
      lane: m.lane,
      order: m.priority,
    };
  });
  renderWorkflowLayoutPanel();
  window.resetDiagramZoom();
  update();
}

function copyWorkflowLayoutJson() {
  const data = {
    workflowLayoutOverrides,
    workflowTransitionOverrides,
  };
  const text = JSON.stringify(data, null, 2);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {
      window.prompt("Kopiér layout JSON:", text);
    });
  } else {
    window.prompt("Kopiér layout JSON:", text);
  }
}

function pasteWorkflowLayoutJson() {
  const text = window.prompt("Indsæt layout JSON:");
  if (!text || !text.trim()) return;
  try {
    const data = JSON.parse(text);
    if (data.workflowLayoutOverrides && typeof data.workflowLayoutOverrides === "object") {
      workflowLayoutOverrides = data.workflowLayoutOverrides;
    }
    if (
      data.workflowTransitionOverrides &&
      typeof data.workflowTransitionOverrides === "object"
    ) {
      workflowTransitionOverrides = data.workflowTransitionOverrides;
    }
    renderWorkflowLayoutPanel();
    window.resetDiagramZoom();
    update();
  } catch (err) {
    window.alert("Ugyldig JSON: " + err.message);
  }
}

function renderWorkflowLayoutPanel() {
  syncWorkflowLayoutPanelVisibility();
  if (!workflowStateLayoutTable || getActiveDiagramType() !== "workflow") return;

  const states = statesForLife(selectedLife).slice().sort((a, b) => a.localeCompare(b, "da"));
  const items = transitions.filter((t) => t.life === selectedLife);
  const autoMeta = buildAutomaticStateWorkflowMeta(states, items);

  const stateRows = states
    .map((s) => {
      const o = getStateLayoutOverride(s);
      const m = autoMeta[s];
      const column = o ? o.column : m.columnHint;
      const lane = o ? o.lane : m.lane;
      const order = o ? o.order : m.priority;
      const laneOptions = ["top", "main", "bottom"]
        .map(
          (l) =>
            '<option value="' +
            l +
            '"' +
            (lane === l ? " selected" : "") +
            ">" +
            l +
            "</option>",
        )
        .join("");
      return (
        "<tr><td>" +
        esc(s) +
        '</td><td><input type="number" min="0" step="1" data-state="' +
        esc(s) +
        '" data-field="column" value="' +
        esc(column) +
        '"></td><td><select data-state="' +
        esc(s) +
        '" data-field="lane">' +
        laneOptions +
        '</select></td><td><input type="number" min="0" step="1" data-state="' +
        esc(s) +
        '" data-field="order" value="' +
        esc(order) +
        "></td></tr>"
      );
    })
    .join("");

  workflowStateLayoutTable.innerHTML =
    '<div class="tableWrap"><table class="workflow-layout-table"><thead><tr><th>State</th><th>Kolonne</th><th>Lane</th><th>Rækkefølge</th></tr></thead><tbody>' +
    stateRows +
    "</tbody></table></div>";

  if (!workflowTransitionOverrideTable) return;

  const lifeTransitions = items.slice().sort((a, b) =>
    String(a.id).localeCompare(String(b.id), "da", { numeric: true }),
  );

  const transRows = lifeTransitions
    .map((t) => {
      const role = getTransitionOverrideRole(t);
      const v = effective(t.security, selectedRole);
      const options = ["auto", "primary", "secondary", "hidden"]
        .map(
          (r) =>
            '<option value="' +
            r +
            '"' +
            (role === r ? " selected" : "") +
            ">" +
            esc(transitionOverrideLabel(r)) +
            "</option>",
        )
        .join("");
      return (
        "<tr><td>" +
        esc(t.id) +
        "</td><td>" +
        esc(t.from) +
        "</td><td>" +
        esc(t.to) +
        '</td><td class="' +
        cls(v) +
        '">' +
        esc(v) +
        '</td><td><select data-transition-id="' +
        esc(String(t.id)) +
        '">' +
        options +
        "</select></td></tr>"
      );
    })
    .join("");

  workflowTransitionOverrideTable.innerHTML =
    '<h4>Transition-overrides</h4><div class="tableWrap"><table class="workflow-layout-table"><thead><tr><th>Id</th><th>From</th><th>To</th><th>Resultat</th><th>Valg</th></tr></thead><tbody>' +
    transRows +
    "</tbody></table></div>";
}

function renderWorkflowDiagram(items) {
  const resolved = resolveCurrentDiagramLayout();
  const layout = resolved.layout;
  const wf = resolved.workflow;
  prepareDiagramSurface(layout);
  const states = statesForLife(selectedLife);

  const sel = getSelectionContext(items);
  const pos = wf.positions;
  const workflowItems = filterWorkflowItemsForViewMode(items, pos);
  const directedPairs = buildDirectedPairMap(workflowItems);
  const allowFrom = new Set();
  const allowTo = new Set();
  const denyTo = new Set();
  const visibleStates = new Set();
  const suppressWorkflowJobLabels =
    workflowViewMode === "clean" || workflowViewMode === "main";

  workflowItems.forEach((t) => {
    const fromPos = pos[t.from];
    const toPos = pos[t.to];
    if (!fromPos || !toPos) return;
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

    const dirKey = t.from + "||" + t.to;
    const group = directedPairs.get(dirKey) || [t];
    const pairIndex = group.findIndex((x) => x.id === t.id);
    const edgePath = workflowEdgePath(fromPos, toPos, pairIndex, layout);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const pathId =
      "edge-" + selectedLife.replace(/[^a-z0-9]+/gi, "-") + "-" + t.id;
    let edgeClass = "edge " + c + (hide ? " hidden" : "");
    const overrideRole = getTransitionOverrideRole(t);
    if (overrideRole === "primary") edgeClass += " primaryEdge";
    else if (overrideRole === "secondary") edgeClass += " secondaryEdge";
    const tid = String(t.id);
    if (sel.selectedEdge === tid) edgeClass += " selectedEdge";
    else if (sel.highlightedEdges.has(tid)) edgeClass += " highlightedEdge";
    else if (selectedElement && !hide) edgeClass += " dimmedEdge";
    path.setAttribute("id", pathId);
    path.setAttribute("class", edgeClass);
    path.setAttribute("d", edgePath.d);
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
    const hideJobs =
      hide ||
      suppressWorkflowJobLabels ||
      layout.densityClass === "density-very-dense" ||
      !showJobs.checked;
    addJobLabel(pathId, t.customJob, hideJobs);
  });

  states.forEach((s) => {
    const p = pos[s];
    if (!p) return;
    let nc = "node workflowNode";
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
    addWorkflowNode(s, p, nc, layout);
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
  syncViewerControlState();
  permissionMode = permModeSelect.value;
  const items = filteredItems();
  let vac = 0;
  let vdc = 0;
  let vnc = 0;
  let jac = 0;
  let hdc = 0;
  let hnc = 0;
  items.forEach((t) => {
    const c = cls(effective(t.security, selectedRole));
    const hidden = isTransitionHiddenByCheckbox(t);
    if (hidden) {
      if (c === "deny") hdc++;
      else if (c === "none") hnc++;
    } else {
      if (c === "allow") vac++;
      else if (c === "deny") vdc++;
      else vnc++;
      if (t.customJob) jac++;
    }
  });
  let countText =
    "Viser: " +
    vac +
    " Allow, " +
    vdc +
    " Deny, " +
    vnc +
    " ikke specificeret";
  if (jac) countText += ", " + jac + " Custom Job";
  const hiddenParts = [];
  if (hdc) hiddenParts.push(hdc + " Deny");
  if (hnc) hiddenParts.push(hnc + " ikke specificeret");
  if (hiddenParts.length) countText += ". Skjult: " + hiddenParts.join(", ");
  let summaryHeader =
    "<b>" +
    esc(selectedLife) +
    "</b> / <b>" +
    esc(selectedRole) +
    "</b> / <b>" +
    esc(directionText()) +
    "</b>";
  if (getActiveDiagramType() === "workflow") {
    summaryHeader += " / Workflow: <b>" + esc(workflowViewModeText()) + "</b>";
  }
  let summaryTail = "";
  if (getActiveDiagramType() === "workflow") {
    if (hasManualLayoutOverridesForLife() || hasManualTransitionOverridesForLife()) {
      summaryTail += " Manuelt layout aktivt.";
    }
    if (workflowViewMode === "main") {
      summaryTail += hasManualPrimaryTransitions()
        ? " Primær rute: manuel."
        : " Primær rute: auto.";
    }
  }
  summary.innerHTML =
    summaryHeader +
    ": " +
    countText +
    ". State permissions: " +
    (showPerms.checked
      ? permissionMode === "role"
        ? "for valgt rolle"
        : "summering"
      : "skjult") +
    "." +
    summaryTail +
    (largeWorkflowHint && selectedDirection === "connected"
      ? ' <span class="layout-hint">Stor lifecycle: Starter med "Til/fra valgt state" for bedre overblik. Vælg "Alle transitions" for komplet graf.</span>'
      : "") +
    (diagramType === "circle" &&
    (lifeTransitionCount(selectedLife) > 40 ||
      statesForLife(selectedLife).length > 8)
      ? ' <span class="layout-hint">Tip: Prøv Diagramtype = Workflow for et mere klassisk venstre-mod-højre workflow.</span>'
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
  renderWorkflowLayoutPanel();
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
      window.resetDiagramZoom();
      update();
    };
  }
  if (diagramTypeSelect) {
    diagramTypeSelect.onchange = () => {
      diagramType = diagramTypeSelect.value;
      selectedElement = null;
      syncWorkflowViewModeControlAvailability();
      window.resetDiagramZoom();
      update();
    };
  }
  if (workflowViewModeSelect) {
    workflowViewModeSelect.onchange = () => {
      workflowViewMode = workflowViewModeSelect.value;
      selectedElement = null;
      window.resetDiagramZoom();
      update();
    };
  }
  if (focusSelectedBtn) focusSelectedBtn.onclick = focusSelectedStateView;
  if (zoomInBtn) zoomInBtn.onclick = () => zoomDiagram("in");
  if (zoomOutBtn) zoomOutBtn.onclick = () => zoomDiagram("out");
  if (zoomResetBtn) zoomResetBtn.onclick = () => window.resetDiagramZoom();
  if (workflowStateLayoutTable) {
    workflowStateLayoutTable.addEventListener("change", onWorkflowLayoutFieldChange);
    workflowStateLayoutTable.addEventListener("input", onWorkflowLayoutFieldChange);
  }
  if (workflowTransitionOverrideTable) {
    workflowTransitionOverrideTable.addEventListener(
      "change",
      onWorkflowTransitionOverrideChange,
    );
  }
  if (generateWorkflowLayoutBtn) {
    generateWorkflowLayoutBtn.onclick = generateWorkflowLayoutFromCurrent;
  }
  if (copyWorkflowLayoutJsonBtn) {
    copyWorkflowLayoutJsonBtn.onclick = copyWorkflowLayoutJson;
  }
  if (pasteWorkflowLayoutJsonBtn) {
    pasteWorkflowLayoutJsonBtn.onclick = pasteWorkflowLayoutJson;
  }
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
    if (initialContext.diagramType && diagramTypeSelect) {
      diagramType = initialContext.diagramType;
      diagramTypeSelect.value = diagramType;
    }
    if (initialContext.workflowViewMode && workflowViewModeSelect) {
      workflowViewMode = initialContext.workflowViewMode;
      workflowViewModeSelect.value = workflowViewMode;
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

  syncWorkflowViewModeControlAvailability();
  syncWorkflowLayoutPanelVisibility();
  bindControls();
  window.resetDiagramZoom();
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
  diagramTypeSelect = document.getElementById("diagramTypeSelect");
  workflowViewModeSelect = document.getElementById("workflowViewModeSelect");
  workflowLayoutPanel = document.getElementById("workflowLayoutPanel");
  workflowStateLayoutTable = document.getElementById("workflowStateLayoutTable");
  workflowTransitionOverrideTable = document.getElementById(
    "workflowTransitionOverrideTable",
  );
  generateWorkflowLayoutBtn = document.getElementById("generateWorkflowLayoutBtn");
  copyWorkflowLayoutJsonBtn = document.getElementById("copyWorkflowLayoutJsonBtn");
  pasteWorkflowLayoutJsonBtn = document.getElementById("pasteWorkflowLayoutJsonBtn");
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
  diagramType = "circle";
  workflowViewMode = "all";
  workflowLayoutOverrides = {};
  workflowTransitionOverrides = {};
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
    if (initialContext.diagramType) {
      diagramType = initialContext.diagramType;
    }
    if (initialContext.workflowLayoutOverrides) {
      workflowLayoutOverrides = JSON.parse(
        JSON.stringify(initialContext.workflowLayoutOverrides),
      );
    }
    if (initialContext.workflowTransitionOverrides) {
      workflowTransitionOverrides = JSON.parse(
        JSON.stringify(initialContext.workflowTransitionOverrides),
      );
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
    diagramType: diagramTypeSelect ? diagramTypeSelect.value : diagramType,
    workflowViewMode: workflowViewModeSelect
      ? workflowViewModeSelect.value
      : workflowViewMode,
    workflowLayoutOverrides,
    workflowTransitionOverrides,
  };
};
