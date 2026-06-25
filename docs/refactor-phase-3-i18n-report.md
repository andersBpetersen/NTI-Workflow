# Fase 3 – Slutrapport: Konsolidering af i18n-modulet

Dato: 2026-06-25  
Opgave: Fase 3 – konsolidering af i18n-modulet (én autoritativ locale-fil pr. locale, ens nøglestruktur, fælles fallback, fælles locale på alle moduler, oprydning af legacy locale-filer).

---

## 1. Aktiv branch

`refactor/app-shell-workflow-split`

Seneste commit ved opstart af Fase 3: `a5707d2 v0.6.6: Dobbelt så store pilespidser i workflowdiagrammet.`

---

## 2. Autoritative locales

Runtime bruger følgende 13 autoritative locale-filer i `static/i18n/`:

| Locale-kode | Fil |
|-------------|-----|
| `cs-CZ` | `cs-CZ.json` |
| `da-DK` | `da-DK.json` |
| `de-DE` | `de-DE.json` |
| `en-GB` | `en-GB.json` |
| `es-ES` | `es-ES.json` |
| `fi-FI` | `fi-FI.json` |
| `fr-FR` | `fr-FR.json` |
| `it-IT` | `it-IT.json` |
| `nl-NL` | `nl-NL.json` |
| `no-NO` | `no-NO.json` |
| `pl-PL` | `pl-PL.json` |
| `pt-BR` | `pt-BR.json` |
| `sv-SE` | `sv-SE.json` |

Locale-koder er runtime-identifikatorer og registreres i `SUPPORTED_LOCALES` i `static/i18n.js`.

---

## 3. Slettede legacy-filer

Følgende legacy/basisfiler blev fjernet efter sammenligning og bekræftelse af, at autoritative filer dækker runtime og tests:

- `static/i18n/da.json`
- `static/i18n/de.json`
- `static/i18n/en.json`
- `static/i18n/es.json`
- `static/i18n/fi.json`
- `static/i18n/fr.json`
- `static/i18n/is.json`
- `static/i18n/it.json`
- `static/i18n/nb.json`
- `static/i18n/nl.json`
- `static/i18n/sv.json`

---

## 4. Beholdte legacy-filer og hvorfor

Ingen legacy-filer beholdes med aktiv runtime-rolle. Alle erstattes af de autoritative locale-filer nævnt i punkt 2.

---

## 5. Islandsk beslutning

Islandsk understøttes ikke længere som separat locale i Fase 3.

- `is.json` er fjernet.
- `is-IS` er ikke tilføjet til `SUPPORTED_LOCALES`.
- Referencer til islandsk er fjernet fra HTML-sprogvælgere og registry.

Beslutningen er dokumenteret i `docs/i18n.md`.

---

## 6. Norsk beslutning

Norsk er konsolideret til én canonical locale: **`no-NO`**.

- `no-NO.json` er den autoritative norske fil.
- `nb.json` er fjernet.
- `nb`, `nn` og `no` normaliseres til `no-NO` i `normalizeLocale()`.

Valget følger projektets eksisterende brug af `no-NO` i registry og HTML.

---

## 7. Canonical key source

`static/i18n/en-GB.json` er canonical key source.

Alle øvrige autoritative locale-filer valideres mod samme key-struktur via `tests/test_i18n_locales.py`.

---

## 8. Fallback-regler

Fallback-kæden i `static/i18n.js` (`t()` / `getTranslationValueForLocale()`):

1. Valgt locale
2. Normaliseret basissprogsmatch
3. `en-GB`
4. Læsevenlig standardtekst udledt fra key-navn (`englishReadableFallback()`)

I development logges manglende keys med `console.warn(...)`. Brugeren ser ikke rå keys i production.

---

## 9. Normaliseringsregler

Centraliseret i `normalizeLocale()` i `static/i18n.js`:

| Input | Normaliseret til |
|-------|------------------|
| `da` | `da-DK` |
| `en` | `en-GB` |
| `en-US` | `en-GB` |
| `de` | `de-DE` |
| `pt` | `pt-BR` |
| `pt-PT` | `pt-BR` |
| `nb` | `no-NO` |
| `nn` | `no-NO` |
| `no` | `no-NO` |
| `cs` | `cs-CZ` |
| `es` | `es-ES` |
| `fi` | `fi-FI` |
| `fr` | `fr-FR` |
| `it` | `it-IT` |
| `nl` | `nl-NL` |
| `pl` | `pl-PL` |
| `sv` | `sv-SE` |
| Ukendt locale | `en-GB` |

Ingen modul har separat locale-normalisering.

---

## 10. localStorage-key

Én fælles key: **`nti.locale`**

- Bruges af forsiden, Workflow Viewer og Vault Config Viewer.
- Migration fra gamle keys (`ntiWorkflow.locale`, `locale`) læses én gang ved init og skriver til `nti.locale` uden aggressiv sletning af gamle keys.

---

## 11. Locale-event

Ét fælles event: **`nti:locale-changed`**

Payload:

```javascript
{ locale: "pt-BR" }
```

Alle moduler reagerer uden manuel refresh:

- Forsiden (`app-shell.js`) opdaterer modul-links.
- Workflow Viewer (`workflow-controller.js`) opdaterer navigation og status.
- Vault Config Viewer (`applyVaultLocaleTexts()` via event listener).

---

## 12. Ændrede filer

| Fil | Ændring |
|-----|---------|
| `.gitignore` | Tilføjet `review-export/` |
| `README.md` | Link til `docs/i18n.md` |
| `static/i18n.js` | Ét registry, central normalisering/fallback, dynamisk sprogvælger, migration |
| `static/index.html` | Dynamisk localeSelect, Vault-kort via i18n-keys |
| `static/workflow/index.html` | Dynamisk localeSelect (ingen hardkodede options) |
| `static/vault-config/index.html` | Fælles i18n.js, fjernet VAULT_TEXT, event-baseret locale-skift |
| `static/i18n/*.json` (13 autoritative) | Tilføjet `home.vaultConfigViewer.*` og `vault.*` keys |
| `tests/test_i18n_locales.py` | Udvidet validering af registry, keys, normalisering og wiring |

Filer fra Fase 1–2 (uændret i Fase 3 scope, men del af samlet working tree):

- `app/main.py`
- `static/app.js`
- `static/viewer.css`
- `static/viewer.js`

---

## 13. Nye filer

| Fil | Formål |
|-----|--------|
| `docs/i18n.md` | Løbende i18n-dokumentation |
| `docs/refactor-phase-3-i18n-report.md` | Denne slutrapport |
| `static/i18n.js` | Fælles i18n-runtime (ny i working tree) |
| `static/i18n/*.json` | 13 autoritative locale-filer (nye i working tree) |
| `static/app-shell.js` / `static/app-shell.css` | App shell (Fase 1–2) |
| `static/workflow/` | Workflow-side (Fase 1–2) |
| `static/vault-config/` | Vault Config-side (Fase 1–2) |
| `tests/test_i18n_locales.py` | i18n-tests |
| `tests/test_routes_split.py` | Route-tests (Fase 1–2) |
| `tests/test_vault_config.py` | Vault Config-tests (Fase 1–2) |

---

## 14. Fjernede filer

Legacy locale-filer (se punkt 3):

- `da.json`, `de.json`, `en.json`, `es.json`, `fi.json`, `fr.json`, `is.json`, `it.json`, `nb.json`, `nl.json`, `sv.json`

Parallelt Vault-i18n-system i `static/vault-config/index.html`:

- `VAULT_TEXT`-registry og lokal `normalizeLocale()` / `resolveVaultLocale()` fjernet fra runtime.

---

## 15. Testresultat

Kørt:

```powershell
pytest tests/test_i18n_locales.py tests/test_routes_split.py tests/test_vault_config.py
```

Resultat: **23 passed, 0 failed**

Dækker bl.a.:

- Registry-filer findes og parses
- `en-GB` er canonical
- Ens key-struktur og ingen tomme/rå værdier
- Normaliseringsregler i runtime
- `nti.locale` og `nti:locale-changed`
- Ingen hardkodede locale-lister i HTML
- pt-BR: "Português (Brasil)", "Idioma", "Voltar ao início", "Selecionar arquivo Excel"
- Vault Config bruger fælles i18n
- Locale bevares mellem `/` og `/workflow/`

---

## 16. Manuel test

Ikke fuldt gennemført i browser under Fase 3-implementeringen. Anbefalet kontrol:

**Forside**

- [ ] Vælg dansk, engelsk og pt-BR – alle synlige tekster skifter
- [ ] Vault-kort og Workflow-kort viser oversatte tekster

**Workflow (`/workflow/`)**

- [ ] Åbnes fra forsiden med bevaret locale
- [ ] Upload virker
- [ ] Tilbageknap bevarer locale

**Vault Config (`/vault-config/`)**

- [ ] Åbnes fra forsiden med bevaret locale
- [ ] JSON indlæses, containere/processorer vises
- [ ] Tilbageknap bevarer locale

**Refresh**

- [ ] Aktiv locale bevares på alle sider

**Browserkonsol**

- [ ] Ingen JavaScript-fejl
- [ ] Manglende keys giver kun development-warning

---

## 17. Kendte manglende oversættelser

- Nye Vault Config-keys (`vault.*`, `home.vaultConfigViewer.*`) er fuldt oversat i **da-DK**, **en-GB** og **pt-BR**.
- Øvrige autoritative locales har engelske fallback-værdier for de nye Vault-keys indtil lokale oversættelser tilføjes.
- Vault Config Viewer har fortsat hardkodede engelske/danske tekster i dybere UI (toolbar-knapper, modaler, tomme tilstande i render-funktioner) – disse falder tilbage via `en-GB` for de keys, der er koblet til i18n; resten er uændret read-only UI-tekst fra standalone-vieweren.

---

## 18. Bekræftelse på uændret Workflow-logik

Bekræftet. Fase 3 har **ikke** ændret:

- Workflow-parseren (`app/parser.py`)
- Diagramlogik (`static/viewer.js` – kun i18n-relaterede tekstkald, ingen ændring af graf/algoritme)
- Backend-API-kontrakter (`/api/upload`, `/api/export/html`)
- Routes (`/`, `/workflow/`, `/vault-config/`)

---

## 19. Bekræftelse på uændret Vault Config-logik

Bekræftet. Fase 3 har **ikke** ændret:

- JSON-parsing (`readFile`, array-root-normalisering, `JobProcessor.JobProcessorContainers`)
- Rendering af containere, processorer, detaljer og modaler
- Read-only UI-adfærd

Kun i18n-kobling (fælles `i18n.js`, `nti.locale`, `nti:locale-changed`) og synlige top-level tekster er opdateret.

---

## 20. git status --short

Ved afslutning af Fase 3 (før commit):

```
 M .gitignore
 M README.md
 M app/main.py
 M static/app.js
 M static/index.html
 M static/viewer.css
 M static/viewer.js
?? app/core/
?? docs/
?? samples/fixture-vault-job-config.json
?? static/app-shell.css
?? static/app-shell.js
?? static/i18n.js
?? static/i18n/
?? static/vault-config/
?? static/workflow/
?? tests/test_i18n_locales.py
?? tests/test_routes_split.py
?? tests/test_vault_config.py
```

Ingen staged ændringer. Ingen commit udført automatisk.

---

## Acceptkriterier (Fase 3)

| # | Kriterium | Status |
|---|-----------|--------|
| 1 | Ét locale-registry | Opfyldt |
| 2 | Én autoritativ fil pr. locale | Opfyldt |
| 3 | `en-GB` er canonical fallback | Opfyldt |
| 4 | Legacy-dubletter fjernet/dokumenteret | Opfyldt |
| 5 | Ens key-struktur | Opfyldt (testet) |
| 6 | `nti.locale` er eneste aktive storage-key | Opfyldt |
| 7 | Forside, Workflow og Vault Config deler locale | Opfyldt |
| 8 | Locale skifter uden refresh | Opfyldt (event-baseret) |
| 9 | Locale bevares ved navigation og refresh | Opfyldt (query + localStorage) |
| 10 | Rå keys vises ikke i production | Opfyldt |
| 11 | pt-BR viser "Português (Brasil)" | Opfyldt |
| 12 | Workflow-logik uændret | Opfyldt |
| 13 | Vault Config-logik uændret | Opfyldt |
| 14 | Routes uændrede | Opfyldt |
| 15 | Tests grønne | Opfyldt (23/23) |
| 16 | Browserkonsol uden nye fejl | Ikke fuldt manuelt verificeret |
| 17 | `review-export/` ignoreret | Opfyldt (`.gitignore`) |
| 18 | Ingen staged ændringer oprettet automatisk | Opfyldt |
