(function initVaultClientViewer(global) {
  const META_KEYS = new Set([
    "Version",
    "Name",
    "Description",
    "DisplayName",
    "Id",
    "IsActive",
    "IsChecked",
  ]);

  const STANDARD_ENTITY_FIELDS = ["Name", "DisplayName", "Description", "Id", "IsActive", "IsChecked"];

  const MODULE_RENDERERS = {
    AssignItemToFileBehavior: renderAssignmentToFileBehaviorModule,
    AssignmentToFileBehavior: renderAssignmentToFileBehaviorModule,
    DataCard: renderDataCardModule,
    QuickProject: renderQuickProjectModule,
    QuickNew: renderQuickNewModule,
    General: renderGeneralModule,
    NumberReserve: renderNumberReserveModule,
    CommandsConfiguration: renderCommandsConfigurationModule,
  };

  const state = {
    root: null,
    modules: [],
    selectedModule: null,
    fileName: "",
    filter: "",
  };

  function tvc(key, params = {}) {
    return typeof global.t === "function" ? global.t(`vaultClient.${key}`, params) : key;
  }

  function td(key) {
    return tvc(`detail.${key}`);
  }

  function escapeHtml(value) {
    if (global.NTIShared?.html?.escape) {
      return global.NTIShared.html.escape(value);
    }
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatBoolean(value) {
    return value ? td("yes") : td("no");
  }

  function formatPrimitive(value) {
    if (value === null) return "null";
    if (typeof value === "boolean") return formatBoolean(value);
    if (typeof value === "number") return String(value);
    return String(value);
  }

  function isPrimitive(value) {
    return value === null || ["string", "number", "boolean"].includes(typeof value);
  }

  function isFlatObject(value) {
    return value && typeof value === "object" && !Array.isArray(value) && Object.values(value).every(isPrimitive);
  }

  function getValueType(value) {
    if (value === null) return "null";
    if (Array.isArray(value)) return "array";
    return typeof value;
  }

  function typeLabel(type) {
    const labels = {
      object: td("object"),
      array: td("array"),
      string: td("string"),
      number: td("number"),
      boolean: td("boolean"),
      null: td("null"),
    };
    return labels[type] || type;
  }

  function formatModuleSubtitle(value) {
    const type = getValueType(value);
    const typeName = typeLabel(type);
    if (type === "object") {
      return `${typeName} · ${Object.keys(value).length} ${td("keys")}`;
    }
    if (type === "array") {
      return `${typeName} · ${value.length} ${td("items")}`;
    }
    return typeName;
  }

  function nestedSummary(value) {
    const type = getValueType(value);
    if (type === "object") {
      return `{…} · ${Object.keys(value).length} ${td("keys")}`;
    }
    if (type === "array") {
      return `[…] · ${value.length} ${td("items")}`;
    }
    return td("nestedValue");
  }

  function renderSection(title, bodyHtml) {
    return `<section class="vault-client-section"><div class="vault-client-section-title">${escapeHtml(title)}</div><div class="vault-client-section-body">${bodyHtml}</div></section>`;
  }

  function renderRawJsonDetails(value) {
    return `<div class="vault-client-raw-json"><details><summary>${escapeHtml(td("showRawJson"))}</summary><pre class="vault-client-json-block">${escapeHtml(JSON.stringify(value, null, 2))}</pre></details></div>`;
  }

  function renderCellValue(value) {
    if (typeof value === "boolean") {
      return `<span class="vault-client-bool">${escapeHtml(formatBoolean(value))}</span>`;
    }
    if (isPrimitive(value)) {
      return `<code>${escapeHtml(formatPrimitive(value))}</code>`;
    }
    return `<span class="vault-client-value-summary">${escapeHtml(nestedSummary(value))}</span>`;
  }

  function renderSummaryGrid(entries) {
    const rows = entries
      .map(([label, value]) => {
        return `<div class="vault-client-summary-label">${escapeHtml(label)}</div><div class="vault-client-summary-value">${renderCellValue(value)}</div>`;
      })
      .join("");
    return `<div class="vault-client-summary-grid">${rows}</div>`;
  }

  function renderKeyValueTable(rows) {
    const body = rows
      .map(([key, value]) => {
        return `<tr><th>${escapeHtml(key)}</th><td class="vault-client-value-cell">${renderCellValue(value)}</td></tr>`;
      })
      .join("");
    return `<table class="vault-client-table"><thead><tr><th>${escapeHtml(tvc("tableKey"))}</th><th>${escapeHtml(tvc("tableValue"))}</th></tr></thead><tbody>${body}</tbody></table>`;
  }

  function fieldLabel(fieldKey) {
    const map = {
      Name: td("name"),
      DisplayName: td("displayName"),
      Description: td("description"),
      Id: td("id"),
      IsActive: td("active"),
      IsChecked: td("checked"),
      SystemName: "SystemName",
    };
    return map[fieldKey] || fieldKey;
  }

  function renderEntityTable(items, extraColumns = []) {
    if (!Array.isArray(items) || items.length === 0) {
      return `<p class="vault-client-empty-list">${escapeHtml(td("itemsCount"))}: 0</p>`;
    }

    const columns = [...STANDARD_ENTITY_FIELDS, ...extraColumns].filter((key, index, all) => all.indexOf(key) === index);
    const head = columns.map((key) => `<th>${escapeHtml(fieldLabel(key))}</th>`).join("");
    const body = items
      .map((item) => {
        const cells = columns
          .map((key) => `<td class="vault-client-value-cell">${renderCellValue(item?.[key])}</td>`)
          .join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");

    return `<table class="vault-client-table vault-client-entity-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
  }

  function renderArraySection(key, value) {
    if (!Array.isArray(value)) {
      return "";
    }

    let inner = `<p class="vault-client-array-count">${escapeHtml(key)} · ${escapeHtml(td("itemsCount"))}: ${value.length}</p>`;
    if (value.length === 0) {
      return renderSection(key, inner);
    }

    if (value.every((item) => item && typeof item === "object" && !Array.isArray(item))) {
      const objectKeys = [...new Set(value.flatMap((item) => Object.keys(item)))].slice(0, 10);
      const head = objectKeys.map((col) => `<th>${escapeHtml(col)}</th>`).join("");
      const rows = value
        .slice(0, 50)
        .map((item) => {
          const cells = objectKeys.map((col) => `<td class="vault-client-value-cell">${renderCellValue(item[col])}</td>`).join("");
          return `<tr>${cells}</tr>`;
        })
        .join("");
      inner += `<table class="vault-client-array-table"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
      if (value.length > 50) {
        inner += `<p class="vault-client-truncated">${escapeHtml(nestedSummary(value))}</p>`;
      }
    } else {
      inner += renderKeyValueTable(value.map((item, index) => [String(index), item]));
    }

    return renderSection(key, inner);
  }

  function renderModuleSummary(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return "";
    }

    const summaryFields = ["Name", "DisplayName", "Description", "Id", "IsActive", "IsChecked"].filter(
      (key) => key in value,
    );
    if (summaryFields.length === 0) {
      return "";
    }

    const entries = summaryFields.map((key) => [fieldLabel(key), value[key]]);
    return renderSection(td("summary"), renderSummaryGrid(entries));
  }

  function renderRestrictionsSection(restriction, titleSuffix = "") {
    if (!restriction || typeof restriction !== "object") {
      return "";
    }

    const fields = [
      "RestrictAssignItemToFile",
      "AssignItemToFileRestrictionMessage",
      "AssignItemToFileRestrictionConditionLists",
      "RestrictWhenModelAndDrawingIsNotOneToOne",
      "RestrictWhenModelAndDrawingIsNotOneToOneMessage",
    ].filter((key) => key in restriction);

    if (fields.length === 0) {
      return "";
    }

    const rows = fields.map((key) => [key, restriction[key]]);
    const title = titleSuffix ? `${td("restrictions")} · ${titleSuffix}` : td("restrictions");
    return renderSection(title, renderKeyValueTable(rows));
  }

  function renderAssignmentToFileBehaviorModule(value) {
    const actions =
      value?.AssignItemToFileActions || value?.AssignmentToFileActions || [];
    const sections = [];

    if (Array.isArray(actions) && actions.length > 0) {
      sections.push(renderSection(td("actions"), renderEntityTable(actions)));
      actions.forEach((action) => {
        const restriction =
          action?.AssignItemToFileRestrictionCondition ||
          action?.AssignmentToFileRestrictionCondition;
        const suffix = action?.DisplayName || action?.Name || "";
        const block = renderRestrictionsSection(restriction, suffix);
        if (block) sections.push(block);
      });
    } else {
      sections.push(renderSection(td("actions"), `<p class="vault-client-empty-list">${escapeHtml(td("itemsCount"))}: 0</p>`));
    }

    sections.push(renderRawJsonDetails(value));
    return sections.join("");
  }

  function renderDataCardModule(value) {
    const sections = [];
    sections.push(renderModuleSummary(value));

    const cards = value?.DataCards;
    if (Array.isArray(cards)) {
      const rows = cards.map((card) => {
        const tabs = Array.isArray(card?.Tabs) ? card.Tabs : [];
        const entityClasses = Array.isArray(card?.EntityClasses) ? card.EntityClasses : [];
        return [
          card?.Name,
          card?.DisplayName,
          card?.Description,
          card?.Id,
          card?.IsActive,
          card?.IsChecked,
          tabs.length,
          entityClasses.length,
        ];
      });

      const head = [
        td("name"),
        td("displayName"),
        td("description"),
        td("id"),
        td("active"),
        td("checked"),
        td("tabsCount"),
        td("entityClassesCount"),
      ]
        .map((label) => `<th>${escapeHtml(label)}</th>`)
        .join("");

      const body = rows
        .map((row) => {
          const cells = row.map((cell) => `<td class="vault-client-value-cell">${renderCellValue(cell)}</td>`).join("");
          return `<tr>${cells}</tr>`;
        })
        .join("");

      sections.push(
        renderSection(
          "DataCards",
          `<table class="vault-client-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`,
        ),
      );

      const allTabs = cards.flatMap((card) => {
        const tabs = Array.isArray(card?.Tabs) ? card.Tabs : [];
        return tabs.map((tab) => ({ ...tab, _cardName: card?.Name || card?.DisplayName || "" }));
      });

      if (allTabs.length > 0) {
        const tabColumns = ["Name", "DisplayName", "Description", "SystemName", "IsActive", "IsChecked"].filter(
          (key) => key === "SystemName" ? allTabs.some((tab) => tab?.SystemName != null) : true,
        );
        const tabHead = tabColumns.map((key) => `<th>${escapeHtml(fieldLabel(key))}</th>`).join("");
        const tabRows = allTabs
          .map((tab) => {
            const cells = tabColumns.map((key) => `<td class="vault-client-value-cell">${renderCellValue(tab[key])}</td>`).join("");
            return `<tr>${cells}</tr>`;
          })
          .join("");
        sections.push(
          renderSection(
            td("tabs"),
            `<table class="vault-client-table"><thead><tr>${tabHead}</tr></thead><tbody>${tabRows}</tbody></table>`,
          ),
        );

        const hasDeepTabData = allTabs.some((tab) =>
          Object.entries(tab).some(([key, entry]) => !tabColumns.includes(key) && key !== "_cardName" && !isPrimitive(entry)),
        );
        if (hasDeepTabData) {
          sections.push(renderRawJsonDetails(allTabs));
        }
      }
    }

    const otherKeys = Object.keys(value || {}).filter((key) => key !== "DataCards" && !STANDARD_ENTITY_FIELDS.includes(key));
    otherKeys.forEach((key) => {
      const entry = value[key];
      if (Array.isArray(entry)) {
        sections.push(renderArraySection(key, entry));
      } else if (isFlatObject(entry)) {
        sections.push(renderSection(key, renderKeyValueTable(Object.entries(entry))));
      } else if (entry && typeof entry === "object") {
        sections.push(renderSection(key, `<p class="vault-client-value-summary">${escapeHtml(nestedSummary(entry))}</p>`));
      }
    });

    sections.push(renderRawJsonDetails(value));
    return sections.join("");
  }

  function renderSettingsOverviewModule(value, containerKeys) {
    const sections = [];
    sections.push(renderModuleSummary(value));

    const primitives = Object.entries(value || {}).filter(([, entry]) => isPrimitive(entry));
    if (primitives.length > 0) {
      sections.push(renderSection(td("settings"), renderKeyValueTable(primitives)));
    }

    Object.entries(value || {}).forEach(([key, entry]) => {
      if (isPrimitive(entry)) return;
      if (containerKeys.includes(key) || Array.isArray(entry)) {
        sections.push(renderArraySection(key, entry));
        return;
      }
      if (isFlatObject(entry)) {
        sections.push(renderSection(key, renderKeyValueTable(Object.entries(entry))));
        return;
      }
      if (entry && typeof entry === "object") {
        sections.push(renderSection(key, `<p class="vault-client-value-summary">${escapeHtml(nestedSummary(entry))}</p>`));
      }
    });

    sections.push(renderRawJsonDetails(value));
    return sections.join("");
  }

  function renderQuickProjectModule(value) {
    return renderSettingsOverviewModule(value, ["QuickProjectMenuContainers"]);
  }

  function renderQuickNewModule(value) {
    return renderSettingsOverviewModule(value, ["QuickNewMenuContainers"]);
  }

  function renderGeneralModule(value) {
    const sections = [];
    sections.push(renderModuleSummary(value));

    const primitives = Object.entries(value || {}).filter(([, entry]) => isPrimitive(entry));
    if (primitives.length > 0) {
      sections.push(renderSection(td("settings"), renderKeyValueTable(primitives)));
    }

    Object.entries(value || {}).forEach(([key, entry]) => {
      if (isPrimitive(entry)) return;
      if (Array.isArray(entry)) {
        sections.push(renderArraySection(key, entry));
        return;
      }
      if (isFlatObject(entry)) {
        sections.push(renderSection(key, renderKeyValueTable(Object.entries(entry))));
        return;
      }
      if (entry && typeof entry === "object") {
        const nestedPrimitives = Object.entries(entry).filter(([, nested]) => isPrimitive(nested));
        const nestedComplex = Object.entries(entry).filter(([, nested]) => !isPrimitive(nested));
        let body = "";
        if (nestedPrimitives.length > 0) {
          body += renderKeyValueTable(nestedPrimitives);
        }
        nestedComplex.forEach(([nestedKey, nestedValue]) => {
          body += `<p class="vault-client-subsection-label">${escapeHtml(nestedKey)} · ${escapeHtml(nestedSummary(nestedValue))}</p>`;
        });
        sections.push(renderSection(key, body || `<p class="vault-client-value-summary">${escapeHtml(nestedSummary(entry))}</p>`));
      }
    });

    sections.push(renderRawJsonDetails(value));
    return sections.join("");
  }

  function renderNumberReserveModule(value) {
    return renderSettingsOverviewModule(value, ["NumberReserveMainMenus"]);
  }

  function renderCommandsConfigurationModule(value) {
    const sections = [];
    sections.push(renderModuleSummary(value));

    const commandLists = [
      ["VaultExplorerHiddenCommands", value?.VaultExplorerHiddenCommands],
      ["Commands", value?.Commands],
    ];

    commandLists.forEach(([key, commands]) => {
      if (!Array.isArray(commands)) return;
      sections.push(renderSection(td("commands"), `<p class="vault-client-array-count">${escapeHtml(key)} · ${commands.length}</p>${renderEntityTable(commands)}`));
    });

    Object.entries(value || {}).forEach(([key, entry]) => {
      if (["VaultExplorerHiddenCommands", "Commands"].includes(key)) return;
      if (STANDARD_ENTITY_FIELDS.includes(key) && isPrimitive(entry)) return;
      if (Array.isArray(entry)) {
        sections.push(renderArraySection(key, entry));
      } else if (isFlatObject(entry)) {
        sections.push(renderSection(key, renderKeyValueTable(Object.entries(entry))));
      } else if (isPrimitive(entry)) {
        // included in summary or settings via module summary
      } else if (entry && typeof entry === "object") {
        sections.push(renderSection(key, `<p class="vault-client-value-summary">${escapeHtml(nestedSummary(entry))}</p>`));
      }
    });

    sections.push(renderRawJsonDetails(value));
    return sections.join("");
  }

  function renderGenericModule(value) {
    if (Array.isArray(value)) {
      const sections = [
        renderSection(td("summary"), `<p class="vault-client-array-count">${escapeHtml(td("itemsCount"))}: ${value.length}</p>`),
      ];
      sections.push(renderArraySection(td("items"), value));
      sections.push(renderRawJsonDetails(value));
      return sections.join("");
    }

    const sections = [];
    const complexEntries = [];

    Object.entries(value || {}).forEach(([key, entryValue]) => {
      if (isPrimitive(entryValue)) {
        return;
      }
      complexEntries.push([key, entryValue]);
    });

    const primitives = Object.entries(value || {}).filter(([, entryValue]) => isPrimitive(entryValue));
    if (primitives.length > 0) {
      sections.push(renderSection(td("settings"), renderKeyValueTable(primitives)));
    }

    complexEntries.forEach(([key, entryValue]) => {
      if (Array.isArray(entryValue)) {
        sections.push(renderArraySection(key, entryValue));
        return;
      }
      if (isFlatObject(entryValue)) {
        sections.push(renderSection(key, renderKeyValueTable(Object.entries(entryValue))));
        return;
      }
      sections.push(
        renderSection(
          key,
          `<p class="vault-client-value-summary">${escapeHtml(nestedSummary(entryValue))}</p>`,
        ),
      );
    });

    sections.push(renderRawJsonDetails(value));
    return sections.join("");
  }

  function renderDetail() {
    const header = document.getElementById("vc-detail-header");
    const title = document.getElementById("vc-detail-title");
    const subtitle = document.getElementById("vc-detail-subtitle");
    const body = document.getElementById("vc-detail-body");
    const empty = document.getElementById("vc-detail-empty");
    if (!body || !header || !title || !subtitle || !empty) return;

    if (!state.selectedModule || !state.root) {
      header.classList.add("is-hidden");
      body.innerHTML = "";
      body.appendChild(empty);
      empty.hidden = false;
      empty.textContent = tvc("emptyModule");
      return;
    }

    empty.hidden = true;
    const moduleValue = state.root[state.selectedModule];
    header.classList.remove("is-hidden");
    title.textContent = state.selectedModule;
    subtitle.textContent = formatModuleSubtitle(moduleValue);

    if (isPrimitive(moduleValue)) {
      body.innerHTML = renderSection(
        td("summary"),
        renderKeyValueTable([[state.selectedModule, moduleValue]]),
      );
      return;
    }

    const renderer = MODULE_RENDERERS[state.selectedModule];
    body.innerHTML = renderer ? renderer(moduleValue) : renderGenericModule(moduleValue);
  }

  function isModuleValue(value) {
    return value !== null && (Array.isArray(value) || typeof value === "object");
  }

  function extractRootConfig(parsed) {
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) {
        throw new Error("empty-array");
      }
      return parsed[0];
    }
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
    throw new Error("invalid-root");
  }

  function extractModules(root) {
    return Object.keys(root)
      .filter((key) => !META_KEYS.has(key) && isModuleValue(root[key]))
      .sort((a, b) => a.localeCompare(b));
  }

  function renderModuleList() {
    const list = document.getElementById("vc-module-list");
    const filterEmpty = document.getElementById("vc-filter-empty");
    if (!list) return;

    if (!state.root) {
      list.innerHTML = "";
      if (filterEmpty) filterEmpty.hidden = true;
      return;
    }

    const term = state.filter.trim().toLowerCase();
    const modules = state.modules.filter((name) => !term || name.toLowerCase().includes(term));

    if (filterEmpty) {
      filterEmpty.hidden = modules.length > 0;
      if (!filterEmpty.hidden) {
        filterEmpty.textContent = td("noFilterResults");
      }
    }

    list.innerHTML = modules
      .map((name) => {
        const selected = name === state.selectedModule ? " is-selected" : "";
        return `<button type="button" class="vault-client-module-item${selected}" data-module="${escapeHtml(name)}" role="option" aria-selected="${name === state.selectedModule}">${escapeHtml(name)}</button>`;
      })
      .join("");

    list.querySelectorAll("button[data-module]").forEach((button) => {
      button.addEventListener("click", () => {
        state.selectedModule = button.dataset.module || null;
        renderModuleList();
        renderDetail();
      });
    });
  }

  function updateStatusBar() {
    const bar = document.getElementById("vc-status-bar");
    if (!bar) return;
    if (!state.root) {
      bar.textContent = "";
      return;
    }
    bar.textContent = tvc("statusLoaded", {
      name: state.fileName || "config.json",
      count: state.modules.length,
    });
  }

  function showError(message) {
    const banner = document.getElementById("vc-error-banner");
    if (!banner) return;
    banner.textContent = message;
    banner.hidden = false;
  }

  function clearError() {
    const banner = document.getElementById("vc-error-banner");
    if (!banner) return;
    banner.hidden = true;
    banner.textContent = "";
  }

  function showViewer() {
    document.getElementById("vc-load-screen")?.classList.add("is-hidden");
    document.getElementById("vc-app")?.classList.add("is-visible");
  }

  function loadConfig(root, fileName) {
    state.root = root;
    state.fileName = fileName;
    state.modules = extractModules(root);
    state.selectedModule = state.modules[0] || null;
    state.filter = "";
    const filterInput = document.getElementById("vc-filter-input");
    if (filterInput) filterInput.value = "";
    clearError();
    showViewer();
    renderModuleList();
    renderDetail();
    updateStatusBar();
  }

  function readJsonFile(file) {
    if (!global.NTIShared?.files?.hasExtension(file, [".json"])) {
      showError(tvc("errorJsonOnly"));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ""));
        const root = extractRootConfig(parsed);
        loadConfig(root, file.name);
      } catch (_error) {
        showError(tvc("invalidJson"));
      }
    };
    reader.onerror = () => showError(tvc("invalidJson"));
    reader.readAsText(file);
  }

  function applyVaultClientLocaleTexts() {
    const locale = typeof global.getCurrentLocale === "function" ? global.getCurrentLocale() : "en-GB";
    if (typeof global.applyTranslations === "function") {
      global.applyTranslations();
    }
    const backLink = document.getElementById("back-home-link");
    if (backLink) {
      backLink.href = `/?lang=${encodeURIComponent(locale)}`;
    }
    document.documentElement.lang = locale.split("-")[0];
    renderModuleList();
    renderDetail();
    updateStatusBar();
  }

  function bindFileUi() {
    const fileInput = document.getElementById("vc-file-input");
    const dropZone = document.getElementById("vc-drop-zone");
    if (!fileInput || !dropZone) return;

    global.NTIShared.files.preventDocumentDrop();
    fileInput.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      if (file) readJsonFile(file);
      event.target.value = "";
    });

    global.NTIShared.files.bindDropZone({
      element: dropZone,
      dragOverClass: "is-drag-over",
      clickInput: fileInput,
      onFiles: (files) => {
        const file = files?.[0];
        if (file) readJsonFile(file);
      },
    });

    const filterInput = document.getElementById("vc-filter-input");
    if (filterInput) {
      filterInput.addEventListener("input", (event) => {
        state.filter = event.target.value;
        renderModuleList();
      });
    }
  }

  async function bootstrapVaultClientPage() {
    if (typeof global.initI18n === "function") {
      await global.initI18n();
    }
    if (typeof global.bindLocaleSelect === "function") {
      global.bindLocaleSelect();
    }
    applyVaultClientLocaleTexts();
    bindFileUi();

    const versionChip = document.getElementById("vc-version");
    if (versionChip) {
      try {
        const response = await fetch("/api/version");
        if (response.ok) {
          const payload = await response.json();
          if (payload?.version) versionChip.textContent = `v${payload.version}`;
        }
      } catch (_error) {
        // Optional version badge.
      }
    }
  }

  global.addEventListener("nti:locale-changed", applyVaultClientLocaleTexts);
  document.addEventListener("DOMContentLoaded", bootstrapVaultClientPage);
})(window);
