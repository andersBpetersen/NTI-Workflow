const LOCALE_STORAGE_KEY = "ntiWorkflow.locale";

const supportedLocales = {
  "da-DK": { countryLabel: "Danmark", language: "da" },
  "pt-BR": { countryLabel: "Brasil", language: "pt-BR" },
  "de-DE": { countryLabel: "Deutschland", language: "de" },
  "fr-FR": { countryLabel: "France", language: "fr" },
  "es-ES": { countryLabel: "España", language: "es" },
  "en-IE": { countryLabel: "Ireland", language: "en" },
  "is-IS": { countryLabel: "Ísland", language: "is" },
  "it-IT": { countryLabel: "Italia", language: "it" },
  "nl-NL": { countryLabel: "Nederland", language: "nl" },
  "nb-NO": { countryLabel: "Norge", language: "nb" },
  "fi-FI": { countryLabel: "Suomi", language: "fi" },
  "sv-SE": { countryLabel: "Sverige", language: "sv" },
  "en-GB": { countryLabel: "UK", language: "en" },
};

const translations = {};
let currentLocale = "en-GB";
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

async function loadTranslationFile(language) {
  if (translations[language]) {
    return translations[language];
  }

  mergeEmbeddedTranslations();
  if (translations[language]) {
    return translations[language];
  }

  try {
    const response = await fetch(`/static/i18n/${language}.json`);
    if (!response.ok) {
      throw new Error(`Could not load language: ${language}`);
    }
    translations[language] = await response.json();
    return translations[language];
  } catch (error) {
    console.warn(error);
    return null;
  }
}

function t(key, params = {}) {
  let value =
    getNestedTranslation(translations[currentLanguage], key) ??
    getNestedTranslation(translations.en, key) ??
    key;

  Object.entries(params).forEach(([name, replacement]) => {
    value = String(value).replaceAll(`{${name}}`, String(replacement));
  });

  return value;
}

function resolveInitialLocale() {
  const contextLocale = window.EXPORTED_VIEWER_CONTEXT?.locale;
  if (contextLocale && supportedLocales[contextLocale]) {
    return contextLocale;
  }

  const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (saved && supportedLocales[saved]) {
    return saved;
  }

  const browserLocales = Array.isArray(navigator.languages)
    ? navigator.languages
    : [navigator.language];

  for (const browserLocale of browserLocales) {
    if (browserLocale && supportedLocales[browserLocale]) {
      return browserLocale;
    }
  }

  for (const browserLocale of browserLocales) {
    const languageCode = String(browserLocale || "")
      .split("-")[0]
      .toLowerCase();

    const preferredByLanguage = {
      en: "en-GB",
      no: "nb-NO",
      nb: "nb-NO",
      nn: "nb-NO",
      pt: "pt-BR",
      de: "de-DE",
    };

    if (preferredByLanguage[languageCode]) {
      return preferredByLanguage[languageCode];
    }

    const match = Object.entries(supportedLocales).find(([, config]) => {
      const lang = String(config.language).toLowerCase();
      return lang === languageCode || lang.split("-")[0] === languageCode;
    });

    if (match) {
      return match[0];
    }
  }

  return "en-GB";
}

function applyTranslations(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  root.querySelectorAll("[data-i18n-html]").forEach((element) => {
    element.innerHTML = t(element.dataset.i18nHtml);
  });

  root.querySelectorAll("option[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
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
  if (!supportedLocales[selectedLocale]) {
    return;
  }

  currentLocale = selectedLocale;
  currentLanguage = supportedLocales[currentLocale].language;

  if (!options.skipStorage) {
    localStorage.setItem(LOCALE_STORAGE_KEY, selectedLocale);
  }

  if (currentLanguage !== "en" && !translations[currentLanguage]) {
    await loadTranslationFile(currentLanguage);
  }

  document.documentElement.lang = currentLanguage;
  applyTranslations();
  syncLocaleSelect();

  if (!options.skipRerender && typeof window.rerenderTranslatedContent === "function") {
    window.rerenderTranslatedContent();
  }
}

async function initI18n() {
  mergeEmbeddedTranslations();
  await loadTranslationFile("en");

  currentLocale = resolveInitialLocale();
  currentLanguage = supportedLocales[currentLocale]?.language || "en";

  if (currentLanguage !== "en") {
    await loadTranslationFile(currentLanguage);
  }

  document.documentElement.lang = currentLanguage;
  applyTranslations();
  syncLocaleSelect();
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
  supportedLocales,
  resolveInitialLocale,
  getNestedTranslation,
  LOCALE_STORAGE_KEY,
  errorKeyByCode,
};
