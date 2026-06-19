/* VBA add-in viewer – port of NTI_Workflow_Ver_1.xlam HTML output */

let transitions = [];
let stateDefs = [];
let lifecycles = [];
let roles = [];
let permissionRoles = [];

const W = 1600;
const H = 1220;
const cx = W / 2;
const cy = H / 2;
const R = 350;

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

function addPermissionBox(state, p, hidden) {
  if (!showPerms.checked) return;
  const info = stateInfo(selectedLife, state);
  let ux = (p.x - cx) / (Math.hypot(p.x - cx, p.y - cy) || 1);
  let uy = (p.y - cy) / (Math.hypot(p.x - cx, p.y - cy) || 1);
  const boxW = 236;
  const boxH = permissionMode === "summary" ? 120 : 126;
  const nodeR = 78;
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

const NODE_RADIUS = 78;
const EDGE_INSET = 10;

function pointAlong(from, toward, distance) {
  const dx = toward.x - from.x;
  const dy = toward.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  return {
    x: from.x + (dx / len) * distance,
    y: from.y + (dy / len) * distance,
  };
}

function shortenQuadEndpoints(p1, control, p2) {
  const inset = NODE_RADIUS + EDGE_INSET;
  return {
    start: pointAlong(p1, control, inset),
    control,
    end: pointAlong(p2, control, inset),
  };
}

function diagramDefs() {
  return (
    '<defs>' +
    '<filter id="boxShadow" x="-20%" y="-20%" width="140%" height="140%">' +
    '<feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000" flood-opacity="0.15"/>' +
    "</filter>" +
    '<marker id="arrow-allow" markerWidth="12" markerHeight="12" refX="10" refY="4" orient="auto">' +
    '<path d="M0,0 L0,8 L11,4 z" fill="#1b7f4a"></path></marker>' +
    '<marker id="arrow-deny" markerWidth="12" markerHeight="12" refX="10" refY="4" orient="auto">' +
    '<path d="M0,0 L0,8 L11,4 z" fill="#b91c1c"></path></marker>' +
    '<marker id="arrow-none" markerWidth="12" markerHeight="12" refX="10" refY="4" orient="auto">' +
    '<path d="M0,0 L0,8 L11,4 z" fill="#6b7280"></path></marker>' +
    "</defs>"
  );
}

function renderDiagram(items) {
  svg.innerHTML = diagramDefs();
  const states = statesForLife(selectedLife);
  const pos = {};
  states.forEach((s, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / states.length;
    pos[s] = { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });
  const pair = new Set(items.map((t) => t.from + "||" + t.to));
  const allowFrom = new Set();
  const allowTo = new Set();
  const denyTo = new Set();
  const visibleStates = new Set();

  items.forEach((t) => {
    const p1 = pos[t.from];
    const p2 = pos[t.to];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy) || 1;
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    const rev = pair.has(t.to + "||" + t.from);
    const off = rev ? (t.from < t.to ? 70 : -70) : 0;
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

    const pts = shortenQuadEndpoints(p1, control, p2);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const pathId =
      "edge-" + selectedLife.replace(/[^a-z0-9]+/gi, "-") + "-" + t.id;
    path.setAttribute("id", pathId);
    path.setAttribute("class", "edge " + c + (hide ? " hidden" : ""));
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
    g.setAttribute("class", nc);
    g.innerHTML =
      '<circle cx="' +
      p.x +
      '" cy="' +
      p.y +
      '" r="78"></circle><text x="' +
      p.x +
      '" y="' +
      (p.y + 6) +
      '" text-anchor="middle">' +
      esc(s) +
      "</text>";
    svg.appendChild(g);
    addPermissionBox(s, p, unrelated && hideUnrelated.checked);
  });
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
    ".";
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
}

function bindControls() {
  lifeSelect.onchange = () => {
    selectedLife = lifeSelect.value;
    refreshStateSelect();
    update();
  };
  stateSelect.onchange = () => {
    selectedState = stateSelect.value;
    update();
  };
  directionSelect.onchange = () => {
    selectedDirection = directionSelect.value;
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
}

function setupViewer() {
  permissionRoles = buildPermissionRoles();
  lifecycles = uniq(
    transitions.map((t) => t.life).concat(stateDefs.map((s) => s.life)),
  );
  roles = uniq(roles);
  if (!roles.includes("Everyone")) roles.push("Everyone");

  lifeSelect.innerHTML = lifecycles
    .map((x) => `<option value="${esc(x)}">${esc(x)}</option>`)
    .join("");
  selectedLife = lifecycles[0] || "";
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

  bindControls();
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

window.initWorkflowViewer = function initWorkflowViewer(apiPayload) {
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

  const data = apiToViewerData(apiPayload);
  transitions = data.transitions;
  stateDefs = data.stateDefs;
  lifecycles = data.lifecycles;
  roles = data.roles;
  selectedDirection = "all";
  permissionMode = "role";

  setupViewer();
};
