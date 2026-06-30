# NTI for Vault Client Viewer — implementation report

## 1. Formål

Tilføje en separat, frontend-only viewer til **NTI for Vault Client** JSON-konfigurationer på `/vault-client/`, uafhængig af NTI for Vault Job Viewer.

## 2. Afgrænsning

- Ingen ændring af Workflow Viewer eller Vault Job Viewer-funktionalitet.
- Ingen backend-upload eller parsing på serveren.
- JSON indlæses kun i browseren via `FileReader` + `JSON.parse`.
- Ingen database, login eller permanent lagring af brugerdata.
- Første version viser generisk top-level modulstruktur — ingen modul-specifik specialvisning.

## 3. Nye filer

| Fil | Beskrivelse |
|-----|-------------|
| `static/vault-client/index.html` | Upload-shell + modul-browser |
| `static/vault-client/vault-client.css` | Viewer-layout (split panel, tabeller) |
| `static/vault-client/vault-client.js` | Frontend parsing og rendering |
| `samples/fixture-vault-client-config.json` | Anonymiseret sample/fixture |
| `tests/test_vault_client.py` | Route, assets, fixture, regression |
| `tests/test_vault_client_i18n.py` | `vaultClient.*` i18n på tværs af locales |
| `scripts/sync_vault_client_i18n.py` | Sync af vaultClient-keys og fixture |
| `docs/vault-client-viewer-report.md` | Denne rapport |

## 4. Ændrede eksisterende filer

| Fil | Ændring |
|-----|---------|
| `app/routes/pages.py` | Ny route `GET /vault-client/` |
| `static/index.html` | Nyt forsidekort med i18n |
| `static/app-shell.js` | Locale-link til `/vault-client/` |
| `static/i18n/*.json` (13) | `home.vaultClientViewer.*` + `vaultClient.*` |
| `tests/test_home_i18n.py` | Nye home-keys i strukturtest |
| `docs/openapi-contract.json` | Dokumenterer ny HTML-route |

## 5. Anonymisering af sample-json

Baseret på vedhæftede `NTI FOR VAULT Client.json`:

- GUID'er erstattet med `00000000-0000-0000-0000-000000000001`
- `Name` / `DisplayName` / `Description` sat til generiske sample-værdier
- `Version` sat til `1.0.0-sample`
- Store `Icon` base64-strenge fjernet (`null`)
- Lange lister trimmet til max 3 elementer per niveau
- Stier med `Path` i nøglen generaliseret til `$/Sample/Path`
- Meget lange strenge erstattet med `sample-value`

## 6. Top-level moduler i første version

Vieweren viser alle top-level nøgler hvis værdi er objekt eller array (metadata som `Version`, `Name`, `Id` m.fl. udelades).

Understøttede moduler fra sample inkluderer bl.a.:

- `JobQueuer`
- `UsesFilter`
- `DesignRepresentation`
- `WorkFolder`
- `General`
- `QuickProject`
- `QuickNew`
- `DataCard`
- `LifeCycleChangeBehavior`
- `AssignItemToFileBehavior`
- `Extension`
- `CommandsConfiguration`
- `FolderToFolderFileSynchronization`
- `NumberReserve`

## 7. Hvad første version ikke gør

- Ingen server-side upload eller API-kald med JSON-indhold
- Ingen modul-specifik editor eller validering
- Ingen oversættelse af JSON-nøgler eller konfigurationsdata
- Ingen specialvisning for alle nested felter
- Ingen sammenligning mellem konfigurationer

## 8. Testresultat

```text
318 passed (inkl. nye vault-client tests)
git diff --check: ren
```

## 9. Manuel test

Udført mod `http://127.0.0.1:8000/` med:

- `/vault-client/?lang=da-DK`
- `/vault-client/?lang=en-GB`

Bekræftet: nyt forsidekort, upload-stil matcher Workflow/Vault Job, dansk/engelsk UI, `.json`-valg, modulliste og detaljepanel, søgning.

## 10. Kendte næste trin

- Modul-specifik visning (fx `CommandsConfiguration`, `JobQueuer`)
- Eksport af valgt modul som JSON
- Dybere navigation i nested strukturer
- Evt. sammenligning af to Client-konfigurationer

## 11. Git-status

Se `git status --short` efter implementering.

## Visual alignment with Vault Job Viewer

- Vault Client Viewer efter JSON-load er ændret til viewer-shell med tabbar, venstre modulpanel og højre detaljepanel.
- Nested JSON vises nu i læsbare blokke i stedet for smalle tabelkolonner.
- Layout, borders, fontstørrelser og tabelheaders er justeret for at matche Vault Job Viewer bedre.
- Funktionalitet er uændret: frontend-only FileReader + JSON.parse.

## Readable module rendering

- Tilføjet læsbare specialvisninger for centrale Client-moduler.
- `AssignmentToFileBehavior` / `AssignItemToFileBehavior` viser nu handlinger og restriktioner som sektioner.
- `DataCard` viser nu cards/tabs som læsbare tabeller.
- `QuickProject`, `QuickNew`, `General`, `NumberReserve` og `CommandsConfiguration` har settings-overblik med tabeller hvor muligt.
- Rå JSON er flyttet til sekundær `<details>`-visning nederst i modulpanelet.
- JSON keys og data oversættes ikke.

## JobQueuer reference rendering

`JobQueuer` er implementeret som en dialog-inspireret, read-only referencevisning, der er tænkt som mønster for fremtidige moduludvidelser.

Principper:

- Modul-header med titel og hjælpetekst (i18n `vaultClient.jobQueuer.title` / `helpText`).
- Read-only værktøjslinje (Tilføj, Fjern, Flyt op/ned, Eksportér/Importér liste). Alle knapper er `disabled` med tooltip (`vaultClient.jobQueuer.readonlyTooltip`); de ændrer ikke data.
- Liste over job queuers med kolonnerne Aktiv, Navn, Beskrivelse og en read-only "Vis"-knap. Rækker kan vælges for at se detaljer.
- Detalje-panel for valgt job queuer: Navn, Beskrivelse, Aktiv, Id, Er pulldown, Tilføj til toolbars (chips) og Understøttede entities (chips).
- Sub-tabs: "Jobs" (Aktiv, Navn, Beskrivelse, Prioritet) og "User job parameters" (Navn, Beskrivelse, Værdi).
- "Vis/Skjul teknisk info"-toggle med JSON-nøgle, JSON-sti, Id, `DeployAsPulldownMenu` og `EntityClasses[].ClassId`.
- Rå JSON ligger altid kollapset i `<details>` nederst.
- Booleans vises som Ja/Nej (da-DK) og Yes/No (en-GB). UI-labels oversættes; JSON-nøgler og data oversættes ikke.

JSON-stier brugt i visningen:

| UI-felt | JSON-sti |
| --- | --- |
| Job queuers | `JobQueuer.JobQueuerMenuContainers[].JobQueuers[]` |
| Navn | `...JobQueuers[].DisplayName` |
| Beskrivelse | `...JobQueuers[].Description` |
| Aktiv | `...JobQueuers[].IsActive` |
| Id | `...JobQueuers[].Id` |
| Er pulldown | `...JobQueuers[].DeployAsPulldownMenu` |
| Tilføj til toolbars | `...JobQueuers[].Toolbars[].DisplayName` |
| Understøttede entities | `...JobQueuers[].EntityClasses[].ClassId` (fallback: container-niveau) |
| Jobs | `...JobQueuers[].Jobs[]` (DisplayName, Description, IsActive, Priority) |
| User job parameters | `...JobQueuers[].UserJobParameters[]` (DisplayName, Description, Value) |

Bemærkning: Under arbejdet blev en eksisterende fejl i `renderDetail` rettet — `#vc-detail-empty` lå inde i `#vc-detail-body` og blev slettet ved første modul-render, hvorefter en tidlig `return` blokerede modulskift. Tom-tilstanden genskabes nu via `innerHTML`, og guarden afhænger ikke længere af elementet.
