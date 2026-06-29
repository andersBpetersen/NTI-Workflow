# Upload-sider i18n — rapport

**Dato:** 2026-06-29  
**Branch:** `refactor/app-shell-workflow-split`  
**Baseline commit:** `a6ed0c8`  
**Working tree:** ikke rent ved opstart (0.7.2 + forsideredigeringer)

## 1. Hvad fejlen var

Workflow Viewer upload/topbar var delvist oversat (f.eks. italiensk), mens Vault Config upload/topbar viste engelsk (`Back to home`, `Language`, `Load Config` osv.) ved samme sprogvalg.

## 2. Årsag

| Kode | Beskrivelse | Status |
|------|-------------|--------|
| A | Hardkodede engelske tekster i Vault HTML | Delvist — HTML havde `data-i18n`, men engelske fallback |
| B | Keys findes men bruges ikke | Nej — `applyVaultLocaleTexts()` kalder `applyTranslations()` |
| C | Eget lokalt tekstsystem | Nej — bruger `i18n.js` |
| D | Keys mangler / engelske værdier i locales | **Ja — primær årsag** |
| E | Sprogskift opdaterer ikke upload | Nej — event virker |
| F | Forskellige key-navne unødvendigt | **Ja** — Vault brugte `vault.backHome` / `vault.languageLabel` i stedet for `nav.backHome` / `language.label` |

**Konklusion:** **D + F** — Vault upload-keys havde engelske fallback-værdier i de fleste locale-filer, og Vault topbar brugte duplikerede keys frem for de fælles keys Workflow allerede bruger.

## 3. Audit-tabel (før rettelse)

| Side | Synlig tekst | Fil | Nuværende key | Hardkodet | Alle locales | Skal rettes |
|------|--------------|-----|---------------|-----------|--------------|-------------|
| Workflow | Back to home | `workflow/index.html` | `nav.backHome` | fallback | delvist EN | pl-PL, cs-CZ |
| Workflow | Language | `workflow/index.html` | `language.label` | fallback | ja | nej |
| Workflow | Choose Excel file | `workflow/index.html` | `upload.chooseFile` | fallback | delvist EN | pl-PL, cs-CZ |
| Workflow | Dropzone titel | `workflow/index.html` | `upload.dropTitle` | fallback | delvist EN | pl-PL, cs-CZ |
| Workflow | Supported .xlsx | `workflow/index.html` | `upload.supportedTypes` | fallback | delvist EN | pl-PL, cs-CZ |
| Vault | Back to home | `vault-config/index.html` | `vault.backHome` | fallback | delvist EN | **ja — key + værdier** |
| Vault | Language | `vault-config/index.html` | `vault.languageLabel` | fallback | delvist EN | **ja — key + værdier** |
| Vault | Load Config | `vault-config/index.html` | `vault.loadConfig` | fallback | EN i de fleste | **ja — værdier** |
| Vault | Dropzone titel | `vault-config/index.html` | `vault.dropTitle` | fallback | EN i de fleste | **ja — værdier** |
| Vault | Dropzone hjælp | `vault-config/index.html` | `vault.dropSubtitle` | fallback | EN i de fleste | **ja — værdier** |
| Vault | Supported .json | `vault-config/index.html` | `vault.supportedTypes` | fallback | EN i de fleste | **ja — værdier** |

## 4. Løsning

1. **Vault Config HTML** — ensret topbar med Workflow:
   - `nav.backHome` i stedet for `vault.backHome`
   - `language.label` i stedet for `vault.languageLabel`
   - `data-i18n-aria-label="language.label"` på sprogvælger
2. **Workflow HTML** — `data-i18n-aria-label` på sprogvælger
3. **`scripts/sync_upload_locale_translations.py`** — upload/topbar-oversættelser for alle 13 locales (`nav`, `upload`, `vault.loadConfig/dropTitle/dropSubtitle/supportedTypes/ariaLabel`)
4. **`tests/test_upload_page_i18n.py`** — ny testsuite

Intern Vault Config-viewer efter JSON-load er **ikke** ændret.

## 5. Manuel test (127.0.0.1:8001)

| Sprog | Workflow back | Workflow lang | Vault load | Vault drop |
|-------|---------------|---------------|------------|------------|
| English | Back to home | Language | Load Config | Drag an NTI for Vault Job JSON file here |
| Dansk | Tilbage til forsiden | Sprog | Indlæs konfiguration | Træk en NTI for Vault Job JSON-fil hertil |
| Italiano | Torna alla home | Lingua | Carica configurazione | Trascina qui un file JSON NTI for Vault Job |
| Polski | Wróć do strony głównej | Język | Wczytaj konfigurację | Przeciągnij tutaj plik JSON NTI for Vault Job |

Sprogskift uden reload: ✅  
Refresh bevarer sprog: ✅ (localStorage `nti.locale`)  
Excel/JSON accept uændret: ✅

## 6. Testresultat

```
279 passed, 1 warning
git diff --check: ren
```

## 7. Opdaterede locale-filer

Alle 13: `static/i18n/cs-CZ.json` … `sv-SE.json`

## 8. Kendte resterende i18n-opgaver

- Intern Vault Config-viewer efter JSON-load (`data-vault-i18n`-området)
- Workflow Viewer diagram/kontroller/tabel (under `#viewer-root`)
- `upload.status.*` og fejltekster i workflow (ikke del af denne opgave)

## 9. Ændrede filer

| Fil | Formål |
|-----|--------|
| `static/vault-config/index.html` | Fælles `nav`/`language` keys på upload/topbar |
| `static/workflow/index.html` | `data-i18n-aria-label` på locale-select |
| `static/i18n/*.json` (13) | Upload/topbar-oversættelser |
| `scripts/sync_upload_locale_translations.py` | Vedligeholdelses-script |
| `tests/test_upload_page_i18n.py` | Ny testsuite |
| `tests/test_i18n_locales.py` | Opdateret select-markup forventning |

## 10. Git-status

Se `git status --short` — ingen commit udført.
