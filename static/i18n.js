const LOCALE_STORAGE_KEY = "nti.locale";
const DEFAULT_LOCALE = "en-GB";
const LOCALE_CHANGED_EVENT = "nti:locale-changed";
const DEV_MODE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const SUPPORTED_LOCALES = {
  "cs-CZ": { file: "cs-CZ.json", label: "Čeština" },
  "da-DK": { file: "da-DK.json", label: "Dansk" },
  "de-DE": { file: "de-DE.json", label: "Deutsch" },
  "en-GB": { file: "en-GB.json", label: "English" },
  "es-ES": { file: "es-ES.json", label: "Español" },
  "fi-FI": { file: "fi-FI.json", label: "Suomi" },
  "fr-FR": { file: "fr-FR.json", label: "Français" },
  "it-IT": { file: "it-IT.json", label: "Italiano" },
  "nl-NL": { file: "nl-NL.json", label: "Nederlands" },
  "no-NO": { file: "no-NO.json", label: "Norsk" },
  "pl-PL": { file: "pl-PL.json", label: "Polski" },
  "pt-BR": { file: "pt-BR.json", label: "Português (Brasil)" },
  "sv-SE": { file: "sv-SE.json", label: "Svenska" },
};

const translations = {};
let currentLocale = DEFAULT_LOCALE;
let currentLanguage = "en";

const errorKeyByCode = {
  no_file: "upload.error.noFileReceived",
  empty_file: "upload.error.emptyFile",
  invalid_file_type: "upload.error.invalidFileType",
  required_sheet_missing: "upload.error.requiredSheetMissing",
  parse_failed: "upload.error.parseFailed",
  file_too_large: "upload.error.fileTooLarge",
};

const errorKeyByMessage = [
  { pattern: /ingen fil modtaget|no file received/i, key: "upload.error.noFileReceived" },
  { pattern: /filen er tom|file is empty/i, key: "upload.error.emptyFile" },
  { pattern: /\.xlsx|excel-filer|excel files/i, key: "upload.error.invalidFileType" },
  { pattern: /lifeCycleDefinitionTransitions|mangler arket/i, key: "upload.error.requiredSheetMissing" },
  { pattern: /for stor|too large/i, key: "upload.error.fileTooLarge" },
  { pattern: /parse|pars/i, key: "upload.error.parseFailed" },
];

function getNestedTranslation(source, key) {
  if (!source || !key) return null;
  return key.split(".").reduce((value, part) => {
    if (value == null || typeof value !== "object") return null;
    return Object.prototype.hasOwnProperty.call(value, part) ? value[part] : null;
  }, source);
}

function mergeEmbeddedTranslations() {
  if (window.NTI_TRANSLATIONS && typeof window.NTI_TRANSLATIONS === "object") {
    Object.assign(translations, window.NTI_TRANSLATIONS);
  }
}

async function loadTranslationFile(fileName) {
  if (translations[fileName]) return translations[fileName];

  mergeEmbeddedTranslations();
  if (translations[fileName]) return translations[fileName];

  try {
    const response = await fetch(`/static/i18n/${fileName}`);
    if (!response.ok) {
      throw new Error(`Could not load locale file: ${fileName}`);
    }
    translations[fileName] = await response.json();
    return translations[fileName];
  } catch (error) {
    console.warn(error);
    return null;
  }
}

function normalizeLocale(value) {
  const clean = String(value || "").trim().replace("_", "-");
  if (!clean) return DEFAULT_LOCALE;

  const [langRaw, regionRaw] = clean.split("-");
  const lang = String(langRaw || "").toLowerCase();
  const region = String(regionRaw || "").toUpperCase();
  const normalized = region ? `${lang}-${region}` : lang;

  if (SUPPORTED_LOCALES[normalized]) return normalized;

  const explicitMap = {
    cs: "cs-CZ",
    da: "da-DK",
    de: "de-DE",
    en: "en-GB",
    "en-US": "en-GB",
    es: "es-ES",
    fi: "fi-FI",
    fr: "fr-FR",
    it: "it-IT",
    nl: "nl-NL",
    nb: "no-NO",
    nn: "no-NO",
    no: "no-NO",
    pl: "pl-PL",
    pt: "pt-BR",
    "pt-PT": "pt-BR",
    sv: "sv-SE",
  };

  if (explicitMap[normalized]) return explicitMap[normalized];
  if (explicitMap[lang]) return explicitMap[lang];
  return DEFAULT_LOCALE;
}

function localeFallbackChain(locale) {
  const normalized = normalizeLocale(locale);
  const chain = [normalized];
  const base = normalized.split("-")[0];
  const baseResolved = normalizeLocale(base);
  chain.push(baseResolved);
  chain.push(DEFAULT_LOCALE);
  return [...new Set(chain)];
}

function getTranslationValueForLocale(locale, key) {
  const chain = localeFallbackChain(locale);
  for (const candidate of chain) {
    const localeConfig = SUPPORTED_LOCALES[candidate];
    if (!localeConfig) continue;
    const value = getNestedTranslation(translations[localeConfig.file], key);
    if (value != null) return value;
  }
  return null;
}

function englishReadableFallback(key) {
  const leaf = String(key).split(".").pop() || "text";
  return leaf
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (m) => m.toUpperCase());
}

function t(key, params = {}) {
  let value = getTranslationValueForLocale(currentLocale, key);
  if (value == null) {
    if (DEV_MODE) {
      console.warn(`Missing translation key "${key}" for locale ${currentLocale}`);
    }
    value = englishReadableFallback(key);
  }

  Object.entries(params).forEach(([name, replacement]) => {
    value = String(value).replaceAll(`{${name}}`, String(replacement));
  });

  return value;
}

function resolveInitialLocale() {
  const queryLocale = new URLSearchParams(window.location.search).get("lang");
  if (queryLocale) return normalizeLocale(queryLocale);

  const contextLocale = window.EXPORTED_VIEWER_CONTEXT?.locale;
  if (contextLocale) return normalizeLocale(contextLocale);

  const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (saved) return normalizeLocale(saved);

  const browserLocales = Array.isArray(navigator.languages)
    ? navigator.languages
    : [navigator.language];

  for (const browserLocale of browserLocales) {
    const fallbackChain = localeFallbackChain(browserLocale);
    for (const candidate of fallbackChain) {
      if (SUPPORTED_LOCALES[candidate]) return candidate;
    }
  }

  return DEFAULT_LOCALE;
}

function applyTranslations(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  root.querySelectorAll("[data-i18n-html]").forEach((element) => {
    element.innerHTML = t(element.dataset.i18nHtml);
  });

  root.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
  });

  root.querySelectorAll("[data-i18n-title]").forEach((element) => {
    element.setAttribute("title", t(element.dataset.i18nTitle));
  });

  root.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
  });
}

function syncLocaleSelect() {
  const localeSelect = document.getElementById("localeSelect");
  if (!localeSelect) return;
  const options = Object.entries(SUPPORTED_LOCALES)
    .map(([localeCode, localeInfo]) => `<option value="${localeCode}">${localeInfo.label}</option>`)
    .join("");
  if (localeSelect.innerHTML !== options) {
    localeSelect.innerHTML = options;
  }
  localeSelect.setAttribute("aria-label", t("language.label"));
  if (localeSelect.value !== currentLocale) {
    localeSelect.value = currentLocale;
  }
}

function translateApiError(payload) {
  const detail = payload?.detail;
  if (detail && typeof detail === "object" && !Array.isArray(detail)) {
    const code = detail.code;
    if (code && errorKeyByCode[code]) {
      return t(errorKeyByCode[code]);
    }
    if (detail.message) {
      return translateErrorMessage(String(detail.message));
    }
  }

  if (typeof detail === "string" && detail.trim()) {
    return translateErrorMessage(detail);
  }

  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((item) =>
        typeof item === "string" ? translateErrorMessage(item) : item?.msg || "",
      )
      .filter(Boolean)
      .join(" ");
  }

  return t("upload.error.failed");
}

function translateErrorMessage(message) {
  for (const entry of errorKeyByMessage) {
    if (entry.pattern.test(message)) {
      return t(entry.key);
    }
  }
  return message;
}

function formatNumber(value) {
  try {
    return new Intl.NumberFormat(currentLocale).format(value);
  } catch (_error) {
    return String(value);
  }
}

function formatDateTime(value) {
  try {
    return new Intl.DateTimeFormat(currentLocale).format(value);
  } catch (_error) {
    return String(value);
  }
}

async function setLocale(selectedLocale, options = {}) {
  currentLocale = normalizeLocale(selectedLocale);
  currentLanguage = currentLocale.split("-")[0];

  if (!options.skipStorage) {
    localStorage.setItem(LOCALE_STORAGE_KEY, currentLocale);
  }

  const requiredFiles = localeFallbackChain(currentLocale)
    .filter((candidate) => SUPPORTED_LOCALES[candidate])
    .map((candidate) => SUPPORTED_LOCALES[candidate].file);
  for (const fileName of [...new Set(requiredFiles)]) {
    if (!translations[fileName]) {
      await loadTranslationFile(fileName);
    }
  }

  document.documentElement.lang = currentLanguage;
  applyTranslations();
  syncLocaleSelect();
  window.dispatchEvent(new CustomEvent(LOCALE_CHANGED_EVENT, { detail: { locale: currentLocale } }));

  if (!options.skipRerender && typeof window.rerenderTranslatedContent === "function") {
    window.rerenderTranslatedContent();
  }
}

async function initI18n() {
  mergeEmbeddedTranslations();
  await loadTranslationFile(SUPPORTED_LOCALES[DEFAULT_LOCALE].file);

  const legacyLocale =
    localStorage.getItem("ntiWorkflow.locale") ||
    localStorage.getItem("locale");
  if (legacyLocale && !localStorage.getItem(LOCALE_STORAGE_KEY)) {
    localStorage.setItem(LOCALE_STORAGE_KEY, normalizeLocale(legacyLocale));
  }

  currentLocale = resolveInitialLocale();
  currentLanguage = currentLocale.split("-")[0];
  await setLocale(currentLocale, { skipStorage: true, skipRerender: true });
}

function bindLocaleSelect() {
  const localeSelect = document.getElementById("localeSelect");
  if (!localeSelect || localeSelect.dataset.bound === "true") {
    return;
  }

  localeSelect.dataset.bound = "true";
  localeSelect.addEventListener("change", async () => {
    await setLocale(localeSelect.value);
  });
}

window.t = t;
window.initI18n = initI18n;
window.bindLocaleSelect = bindLocaleSelect;
window.applyTranslations = applyTranslations;
window.translateApiError = translateApiError;
window.formatNumber = formatNumber;
window.formatDateTime = formatDateTime;
window.getCurrentLocale = function getCurrentLocale() {
  return currentLocale;
};
window.NTI_I18N = {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  LOCALE_CHANGED_EVENT,
  normalizeLocale,
  localeFallbackChain,
  resolveInitialLocale,
  getNestedTranslation,
  errorKeyByCode,
};
