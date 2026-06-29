const workflowLink = document.getElementById("open-workflow-link");
const vaultConfigLink = document.getElementById("open-vault-config-link");
const vaultClientLink = document.getElementById("open-vault-client-link");
const versionChip = document.getElementById("app-version");

function syncModuleLinks() {
  if (typeof getCurrentLocale !== "function") return;
  const locale = getCurrentLocale() || "en-GB";
  if (workflowLink) {
    workflowLink.href = `/workflow/?lang=${encodeURIComponent(locale)}`;
  }
  if (vaultConfigLink) {
    vaultConfigLink.href = `/vault-config/?lang=${encodeURIComponent(locale)}`;
  }
  if (vaultClientLink) {
    vaultClientLink.href = `/vault-client/?lang=${encodeURIComponent(locale)}`;
  }
}

async function loadVersion() {
  if (!versionChip) return;
  try {
    const response = await fetch("/api/version");
    if (!response.ok) return;
    const payload = await response.json();
    if (payload?.version) {
      versionChip.textContent = `v${payload.version}`;
    }
  } catch (_error) {
    // No-op: version badge is optional UI info.
  }
}

async function bootstrapAppShell() {
  await initI18n();
  bindLocaleSelect();
  syncModuleLinks();
  window.addEventListener("nti:locale-changed", syncModuleLinks);
  await loadVersion();
}

bootstrapAppShell();
