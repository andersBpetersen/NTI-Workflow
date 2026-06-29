# Forside i18n — fuldførelsesrapport

**Dato:** 2026-06-29  
**Branch:** `refactor/app-shell-workflow-split`  
**Baseline commit:** `a6ed0c8`  
**Version:** `0.7.2` (ucommitted)

**Bemærk:** Working tree var ikke rent ved opstart (0.7.2-patch + tidligere arbejde). Kun forsiden/app shell er ændret i denne opgave.

## 1. Hvad fejlen var

Ved valg af f.eks. **Polski** blev sproglisten opdateret, men forsiden viste fortsat engelsk (`Language`, `Coming soon`, `Open Workflow Viewer` osv.).

## 2. Årsag

**Primær årsag: F** — Keys fandtes i locale-filerne, men værdierne var **engelske fallback-tekster** i de fleste sprog.

Ikke årsag:

| Kode | Beskrivelse | Status |
|------|-------------|--------|
| A | Hardkodet i `index.html` | Nej — `data-i18n` var på plads |
| B | Hardkodet i `app-shell.js` | Nej |
| C | `data-i18n` mangler | Nej |
| D | Key mangler | Nej |
| E | Key mangler i locales | Nej |
| G | Label opdateres ikke | Nej — `applyTranslations()` virker |
| H | Event opdaterer ikke shell | Nej — `bindLocaleSelect` → `setLocale` virker |
| I | Forkert normalisering | Nej |

HTML-fallbacktekster (`Language`, `Coming soon`) er bevidst i `index.html` som no-JS-fallback og overskrives af `applyTranslations()`.

## 3. Audit-tabel (før rettelse)

| Synlig tekst | Fil | Nuværende i18n-key | Hardkodet | Findes i en-GB | Findes i alle locales | Skal rettes |
|--------------|-----|-------------------|-----------|----------------|----------------------|-------------|
| NTI Workflow (topbar) | `index.html` | `home.title` | fallback | Ja | Ja | Nej (produktnavn) |
| Version chip | `app-shell.js` | — | `v{version}` fra API | — | — | Nej |
| Language (label) | `index.html` | `language.label` | fallback | Ja | Ja | **Ja — værdier** |
| NTI Workflow (h1) | `index.html` | `home.title` | fallback | Ja | Ja | Nej |
| Undertitel | `index.html` | `home.intro` | fallback | Ja | Ja | **Ja — værdier** |
| Workflow Viewer (titel) | `index.html` | `home.workflowViewer.title` | fallback | Ja | Ja | Nej |
| Workflow beskrivelse | `index.html` | `home.workflowViewer.description` | fallback | Ja | Ja | **Ja — værdier** |
| Open Workflow Viewer | `index.html` | `home.workflowViewer.open` | fallback | Ja | Ja | **Ja — værdier** |
| Lifecycle Compare | `index.html` | `home.lifecycleCompare.title` | fallback | Ja | Ja | Nej |
| Lifecycle beskrivelse | `index.html` | `home.lifecycleCompare.description` | fallback | Ja | Ja | **Ja — værdier** |
| Coming soon (lifecycle) | `index.html` | `home.lifecycleCompare.comingSoon` | fallback | Ja | Ja | **Ja — værdier** |
| NTI for Vault Config | `index.html` | `home.vaultConfigViewer.title` | fallback | Ja | Ja | Nej |
| Vault Config beskrivelse | `index.html` | `home.vaultConfigViewer.description` | fallback | Ja | Ja | **Ja — værdier** |
| Open Vault Config Viewer | `index.html` | `home.vaultConfigViewer.open` | fallback | Ja | Ja | **Ja — værdier** |
| Vault Config Tools | `index.html` | `home.vaultConfigTools.title` | fallback | Ja | Ja | Nej |
| Vault Tools beskrivelse | `index.html` | `home.vaultConfigTools.description` | fallback | Ja | Ja | **Ja — værdier** |
| Coming soon (tools) | `index.html` | `home.vaultConfigTools.comingSoon` | fallback | Ja | Ja | **Ja — værdier** |
| Select aria-label | `index.html` | `data-i18n-aria-label` | fallback | Ja | Ja | **Ja — værdier** |

## 4. Løsning

- Opdateret **alle 13** locale-filer med reelle home-oversættelser via `scripts/sync_home_locale_translations.py`
- Tilføjet `data-i18n-aria-label="language.label"` på sprogvælgeren
- Udvidet `tests/test_home_i18n.py` med struktur-, UTF-8- og oversættelsestests

`app-shell.js` krævede ingen ændringer — den kalder allerede `initI18n()`, `bindLocaleSelect()` og opdaterer modullinks ved `nti:locale-changed`.

## 5. Forsidetekster nu i18n-styrede

| Key | Element |
|-----|---------|
| `language.label` | Label ved dropdown + aria-label |
| `home.title` | Topbar + h1 |
| `home.intro` | Undertitel |
| `home.workflowViewer.*` | Workflow-kort |
| `home.lifecycleCompare.*` | Lifecycle Compare-kort |
| `home.vaultConfigViewer.*` | Vault Config-kort |
| `home.vaultConfigTools.*` | Vault Config Tools-kort |

Produktnavne bevares uændrede.

## 6. Opdaterede locale-filer

`static/i18n/cs-CZ.json`, `da-DK.json`, `de-DE.json`, `en-GB.json`, `es-ES.json`, `fi-FI.json`, `fr-FR.json`, `it-IT.json`, `nl-NL.json`, `no-NO.json`, `pl-PL.json`, `pt-BR.json`, `sv-SE.json`

## 7. Manuel test

Server: `uvicorn app.main:app` på **`http://127.0.0.1:8000/`** (ikke `localhost:8000` hvis gammel proces kører parallelt).

**Gennemført 2026-06-29:** Alle 13 sprog testet i browser via `setLocale()` + dropdown `change`-event + refresh-persistens.

| Locale | Native label | Sproglabel | Undertitel (uddrag) | Workflow-knap | Coming soon | Vault-knap | OK |
|--------|--------------|------------|---------------------|---------------|-------------|------------|-----|
| cs-CZ | Čeština | Jazyk | Interní nástroje… | Otevřít Workflow Viewer | Již brzy | Otevřít Vault Config Viewer | ✅ |
| da-DK | Dansk | Sprog | Interne værktøjer… | Åbn Workflow Viewer | Kommer senere | Åbn Vault Config Viewer | ✅ |
| de-DE | Deutsch | Sprache | Interne Werkzeuge… | Workflow Viewer öffnen | Demnächst | Vault Config Viewer öffnen | ✅ |
| en-GB | English | Language | Internal tools… | Open Workflow Viewer | Coming soon | Open Vault Config Viewer | ✅ |
| es-ES | Español | Idioma | Herramientas internas… | Abrir Workflow Viewer | Próximamente | Abrir Vault Config Viewer | ✅ |
| fi-FI | Suomi | Kieli | Sisäiset työkalut… | Avaa Workflow Viewer | Tulossa myöhemmin | Avaa Vault Config Viewer | ✅ |
| fr-FR | Français | Langue | Outils internes… | Ouvrir Workflow Viewer | Bientôt disponible | Ouvrir Vault Config Viewer | ✅ |
| it-IT | Italiano | Lingua | Strumenti interni… | Apri Workflow Viewer | Prossimamente | Apri Vault Config Viewer | ✅ |
| nl-NL | Nederlands | Taal | Interne tools… | Workflow Viewer openen | Binnenkort | Vault Config Viewer openen | ✅ |
| no-NO | Norsk | Språk | Interne verktøy… | Åpne Workflow Viewer | Kommer snart | Åpne Vault Config Viewer | ✅ |
| pl-PL | Polski | Język | Wewnętrzne narzędzia… | Otwórz Workflow Viewer | Wkrótce | Otwórz Vault Config Viewer | ✅ |
| pt-BR | Português (Brasil) | Idioma | Ferramentas internas… | Abrir Workflow Viewer | Em breve | Abrir Vault Config Viewer | ✅ |
| sv-SE | Svenska | Språk | Interna verktyg… | Öppna Workflow Viewer | Kommer snart | Öppna Vault Config Viewer | ✅ |

**Ekstra checks:**

- Dropdown `change`-event (fi-FI): label → `Kieli`, coming soon → `Tulossa myöhemmin` ✅
- Refresh efter `pl-PL`: sprog bevares (`Język`, `Wkrótce`, `Otwórz Workflow Viewer`) ✅
- Version chip: `v0.7.2` fra `/api/version` (uændret på tværs af sprog) ✅
- Produktnavne uændrede: `NTI Workflow`, `Workflow Viewer`, `Lifecycle Compare`, `NTI for Vault Config`, `Vault Config Tools` ✅
- Polske/tegn (ę, ó, ł, ś) og danske (æ, ø, å) vises korrekt i UI ✅

## 8. Testresultat

```
240 passed, 1 warning
git diff --check: ren (kun CRLF-advarsel på vault-config)
```

`tests/test_home_i18n.py`: 50 tests (struktur, prioritetslocales, UTF-8, HTML/app-shell checks).

## 9. Kendte resterende i18n-opgaver (uden for forsiden)

- Workflow Viewer (`static/workflow/`, `viewer.js`)
- Vault Config Viewer intern tekst efter JSON-load
- `nav.backHome` og øvrige viewer/vault-keys i locale-filer (stadig engelsk i mange sprog)

## 10. Ændrede filer (denne opgave)

| Fil | Formål |
|-----|--------|
| `static/i18n/*.json` (13) | Home-oversættelser for alle sprog |
| `static/index.html` | `data-i18n-aria-label` på locale-select |
| `scripts/sync_home_locale_translations.py` | Vedligeholdelses-script |
| `tests/test_home_i18n.py` | Ny/udvidet testsuite |
| `tests/test_i18n_locales.py` | Opdateret select-markup |
| `docs/i18n-home-page-completion-report.md` | Denne rapport |

## 11. Git-status

```
 M .env.example
 M .github/workflows/docker-publish.yml.example
 M CHANGELOG.md
 M DEPLOY.md
 M PUBLISH.md
 M README.md
 M START-DOCKER.md
 M app/core/version.py
 M docker-compose.prod.yml
 M docs/openapi-contract.json
 M docs/user-guides/...
 M static/i18n/*.json (13)
 M static/index.html
 M static/vault-config/index.html
 M tests/test_i18n_locales.py
 D tests/test_release_071.py
 M tests/test_vault_config.py
?? docs/i18n-home-page-completion-report.md
?? docs/i18n-home-page-fix-report.md
?? docs/release-0.7.2-report.md
?? docs/release-checklist-0.7.2.md
?? docs/release-notes-0.7.2.md
?? scripts/sync_home_locale_translations.py
?? scripts/sync_vault_locale_keys.py
?? tests/test_home_i18n.py
?? tests/test_release_072.py
?? tests/test_vault_config_i18n.py
```

Ingen commit, tag eller push udført.
