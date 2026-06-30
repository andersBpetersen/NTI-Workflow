# NTI for Vault Client — Dialog til JSON mapping

> Analyse- og designdokument. Indeholder **ingen** kodeændringer.
> Formålet er at forstå sammenhængen mellem den rigtige NTI for Vault Client-dialogboks
> og strukturen i Client JSON, så vi senere kan designe en bedre viewer.

## 1. Formål

Lave en mapping mellem NTI for Vault Client-dialogboksens UI og Client JSON-strukturen,
så vi senere kan designe en bedre webviewer (`/vault-client/`).

Dokumentet skal:

- Beskrive den kendte dialogstruktur.
- Beskrive de kendte JSON top-level keys og deres struktur i fixturen.
- Foreslå en mapping mellem dialogområder og JSON-paths med et sikkerhedsniveau.
- Foreslå hvilke felter der bør være primære vs. sekundære i vieweren.
- Fastlægge oversættelsesregler (hvad må oversættes, hvad må ikke).
- Foreslå en fremtidig viewer-struktur, modulprioritering og næste lille kodefase.

## 2. Afgrænsning

- Dette er **kun analyse og dokumentation**.
- Ingen ændringer af kode, HTML, CSS, JavaScript, tests, i18n, sample fixture, routes,
  backend, release/version.
- Ingen commit, tag eller push.
- Eneste fil der oprettes/opdateres: `docs/vault-client-dialog-json-mapping.md`.
- Mappingen er baseret på den anonymiserede sample fixture og kendte observationer fra
  dialogen. Hvor data mangler i fixturen, er det markeret eksplicit.

## 3. Kilder

| Kilde | Sti / beskrivelse | Status |
|-------|-------------------|--------|
| Anonymiseret fixture | `samples/fixture-vault-client-config.json` | Tilgængelig — primær analysekilde |
| Eksisterende prototype (JS) | `static/vault-client/vault-client.js` | Tilgængelig — har allerede specialvisninger |
| Eksisterende prototype (CSS) | `static/vault-client/vault-client.css` | Tilgængelig |
| Eksisterende prototype (HTML) | `static/vault-client/index.html` | Tilgængelig |
| Eksisterende rapport | `docs/vault-client-viewer-report.md` | Tilgængelig |
| Skærmbilleder fra NTI for Vault Client | Ikke til stede som filer i repo | Beskrives ud fra kendte observationer |
| Original kilde-JSON | `C:\GitHub\NTI FOR VAULT CLIENT\NTI FOR VAULT Client.json` (uden for repo) | Anvendt tidligere til at generere fixturen |

> Bemærk: Skærmbilleder forelå ikke som filer under denne analyse. Dialogbeskrivelser nedenfor
> bygger på de kendte observationer beskrevet i opgaven samt strukturen i fixturen.

## 4. Aktuel Git-status

- Branch: `refactor/app-shell-workflow-split`
- Seneste commits:
  - `77ee8dd` Add Vault Client viewer
  - `eeb01a6` Align upload page styling
  - `a9d3ba3` Complete i18n coverage for home and upload pages in 0.7.2
  - `a6ed0c8` Add Danish user guide PDFs for program overview and GitHub recovery.
  - `9e48efb` Release 0.7.1: fix Danish UTF-8 and unify file dropzones
  - `7865183` Release version 0.7.0

Working tree indeholder **ucommittede ændringer fra de seneste Client Viewer-forsøg**
(readable module rendering + JobQueuer dialog-visning). Disse er **ikke** ændret af denne
analyseopgave og dokumenteres kun:

```text
 M docs/vault-client-viewer-report.md
 M static/vault-client/vault-client.css
 M static/vault-client/vault-client.js
 M static/i18n/cs-CZ.json
 M static/i18n/da-DK.json
 M static/i18n/de-DE.json
 M static/i18n/en-GB.json
 M static/i18n/es-ES.json
 M static/i18n/fi-FI.json
 M static/i18n/fr-FR.json
 M static/i18n/it-IT.json
 M static/i18n/nl-NL.json
 M static/i18n/no-NO.json
 M static/i18n/pl-PL.json
 M static/i18n/pt-BR.json
 M static/i18n/sv-SE.json
 M tests/test_vault_client.py
 M tests/test_vault_client_i18n.py
 M docs/user-guides/pdf/NTI-Workflow-GitHub-Gendannelse.pdf       (binær, urelateret)
 M docs/user-guides/pdf/NTI-Workflow-Programbeskrivelse.pdf       (binær, urelateret)
?? ChatGPT/                                                        (untracked, urelateret)
```

> De to PDF-filer og `ChatGPT/`-mappen er urelaterede til Vault Client og er ikke rørt her.
> Der er **ikke** udført oprydning, restore, stage eller commit.

## 5. Kendt dialogstruktur fra NTI for Vault Client

Den fysiske NTI for Vault Client-konfigurationsdialog er observeret med følgende generelle
opbygning:

```text
Venstre navigation (settings/modul-liste):
  - General Settings
  - Advanced Publish / Document Presets / Multi Publish (publish-relateret)
  - Number Generator
  - Job queuer
  - m.fl.

Hovedpanel (højre side):
  - Gruppe/panel-overskrifter
  - Tabeller (lister af items)
  - Toolbar-knapper over tabeller
  - Detailfelter (labels + input)
  - Underfaner i detailvisning

Dialog-bundlinje (i original klient, ikke relevant for read-only viewer):
  - OK / Cancel / Apply
```

Generelle dialog-byggeklodser, der går igen på tværs af moduler:

- **Liste + toolbar**: Add, Remove, Move up, Move down, Export list, Import list.
- **Tabel**: typisk kolonner Active, Name, Description, Edit.
- **Detailpanel**: Name, Description, Active, Id samt modulspecifikke felter.
- **Underfaner**: fx Jobs / User job parameters under en valgt entry.
- **Entitetsvælger**: Supported entities (FILE / FLDR / CO ...).

### JobQueuer (observeret dialogstruktur)

```text
Job queuer
- Toolbar:
  - Add
  - Remove
  - Move up
  - Move down
  - Export list
  - Import list
- Tabel:
  - Active
  - Name
  - Description
  - Edit
- Detail:
  - Name
  - Description
  - Active
  - Id
  - Is pulldown
  - Add to toolbars
  - Supported entities
- Underfaner:
  - Job queuers
  - Jobs
  - User job parameters
```

For øvrige dialogområder beskrives kun det, der sikkert kan udledes af fixturen.
Alt usikkert er flyttet til afsnit 14 (Åbne spørgsmål).

## 6. Kendte JSON top-level keys

Top-level keys i `samples/fixture-vault-client-config.json` (objektet er pakket i et array `[ { ... } ]`):

| JSON top-level key | Type | Antal elementer/keys | Sandsynligt dialogområde | Kommentar |
|--------------------|------|----------------------|---------------------------|-----------|
| `Version` | string | `1.0.0-sample` | (metadata) | Anonymiseret versionsstreng |
| `JobQueuer` | object | 1 key (`JobQueuerMenuContainers`) | Job queuer | Containers → JobQueuers → Jobs/UserJobParameters |
| `UsesFilter` | object | 1 key (`UsesFilterMenuContainers`, len=2) | Uses/Where used-filter | Samme container-mønster som JobQueuer |
| `DesignRepresentation` | object | 1 key (`DesignRepresentationCollectorMenuContainers`, len=0) | Design Representation | Tom i sample |
| `WorkFolder` | object | 1 key (`WorkFolderSynchronizations`, len=0) | Work Folder Manager | Tom i sample |
| `General` | object | 26 keys (22 primitive) | General Settings | Mange flade flag + `Advanced` (dybt nested) |
| `QuickProject` | object | 1 key (`QuickProjectMenuContainers`, len=0) | Quick Project | Tom i sample |
| `QuickNew` | object | 1 key (`QuickNewMenuContainers`, len=0) | Quick New | Tom i sample |
| `DataCard` | object | 7 keys (`DataCards` + entity-felter) | Data Card / Tabs | `DataCards[]` med Tabs + EntityClasses |
| `LifeCycleChangeBehavior` | object | 1 key (`LifeCycleChangeActions`, len=1) | Lifecycle Change | Meget dyb action-struktur |
| `AssignItemToFileBehavior` | object | 1 key (`AssignItemToFileActions`) | Assign item to file | Se note om alias nedenfor |
| `Extension` | object | 1 key (`Extensions`, len=3) | Extensions | Hver extension har DrawingListTemplates m.m. |
| `CommandsConfiguration` | object | 7 keys (`VaultExplorerHiddenCommands` + entity-felter) | Commands | Hidden commands-liste (tom i sample) |
| `FolderToFolderFileSynchronization` | object | 2 keys (begge len=0) | Folder/file sync | Begge containers tomme i sample |
| `NumberReserve` | object | 1 key (`NumberReserveMainMenus`, len=0) | Number Generator | Tom i sample |
| `Name` / `DisplayName` / `Description` / `Id` / `IsActive` / `IsChecked` | primitive | — | (modul-metadata på rod) | Filtreres fra modullisten af `META_KEYS` |

### Note om `AssignItemToFileBehavior` vs `AssignmentToFileBehavior`

- I sample fixturen findes **kun** `AssignItemToFileBehavior` (med listen `AssignItemToFileActions`
  og restriktionsobjektet `AssignItemToFileRestrictionCondition`).
- `AssignmentToFileBehavior` / `AssignmentToFileActions` / `AssignmentToFileRestrictionCondition`
  optræder **ikke** i denne fixture.
- Den eksisterende prototype håndterer begge stavemåder som **alias** for samme renderer
  (defensivt), men kun `AssignItemToFileBehavior` er bekræftet i data.
- Konklusion: Behandl `AssignItemToFileBehavior` som den autoritative key. `AssignmentToFileBehavior`
  er en mulig variant fra andre/ældre konfigurationer og skal bekræftes (se afsnit 14).

## 7. Foreløbig mapping: dialogområder til JSON

| Dialogområde | Mulig JSON key/path | Sikkerhed | Webvisning bør være | Noter |
|--------------|---------------------|-----------|---------------------|-------|
| Job queuer | `JobQueuer.JobQueuerMenuContainers[].JobQueuers[]` | Høj | Liste + detail + underfaner (B/D) | Struktur observeret i både dialog og JSON |
| Jobs (under queuer) | `...JobQueuers[].Jobs[]` | Høj | Tabel (C) | Active/Name/Description/Priority |
| User job parameters | `...JobQueuers[].UserJobParameters[]` | Middel | Tabel (C) | Tom i sample — kolonner kendt, data ej |
| Supported entities | `...JobQueuerMenuContainers[].EntityClasses[]` | Høj | Chips/komma-liste | `ClassId` = FILE/FLDR/CO |
| Add to toolbars | `...JobQueuerMenuContainers[].Toolbars[]` | Middel | Chips | Tom i de fleste containere |
| Is pulldown | `...JobQueuerMenuContainers[].DeployAsPulldownMenu` | Middel | Boolean (Ja/Nej) | UI siger "Is pulldown", JSON siger "DeployAsPulldownMenu" |
| General Settings | `General.*` (flade flag) | Høj | Settings panel (A) | 22 primitive flag + `Advanced` |
| General → Impersonation | `General.Advanced.ImpersonationUser` | Lav | Sekundær/teknisk | Dyb VaultUser-struktur |
| Data Card | `DataCard.DataCards[]` | Middel | Tabel + tabs (C/D) | Tabs + EntityClasses pr. card |
| Data Card tabs | `DataCard.DataCards[].Tabs[]` | Middel | Tabel (C) | Columns/ConditionLists dybt nested |
| Number Generator | `NumberReserve.NumberReserveMainMenus[]` | Middel | Settings + schemes/rules (A/C) | UI-navn ≠ JSON-navn; tom i sample |
| Commands | `CommandsConfiguration.VaultExplorerHiddenCommands[]` | Middel | Tabel (C) | Tom i sample |
| Quick Project | `QuickProject.QuickProjectMenuContainers[]` | Lav | Settings + liste (A/B) | Tom i sample |
| Quick New | `QuickNew.QuickNewMenuContainers[]` | Lav | Settings + liste (A/B) | Tom i sample |
| Assign item to file | `AssignItemToFileBehavior.AssignItemToFileActions[]` | Høj | Liste + restriktioner (B/E) | Restriktioner i `AssignItemToFileRestrictionCondition` |
| Lifecycle change | `LifeCycleChangeBehavior.LifeCycleChangeActions[]` | Lav | Liste + detail (B) | Meget dyb; mange condition lists |
| Uses filter | `UsesFilter.UsesFilterMenuContainers[]` | Lav | Liste + detail (B) | Samme container-mønster som JobQueuer |
| Extensions | `Extension.Extensions[]` | Lav | Tabel (C) | DrawingListTemplates pr. extension |
| Design Representation | `DesignRepresentation.DesignRepresentationCollectorMenuContainers[]` | Ukendt | Generic fallback (F) | Tom i sample |
| Work Folder | `WorkFolder.WorkFolderSynchronizations[]` | Ukendt | Generic fallback (F) | Tom i sample |
| Folder/file sync | `FolderToFolderFileSynchronization.*` | Ukendt | Generic fallback (F) | Begge containere tomme i sample |

## 8. Detaljeret mapping pr. modul

### JobQueuer

#### Hvad brugeren ser i dialogen
Job queuer-liste med toolbar (Add/Remove/Move up/Move down/Export/Import), tabel
(Active/Name/Description/Edit) og et detailpanel med Name, Description, Active, Id,
Is pulldown, Add to toolbars, Supported entities samt underfaner (Job queuers / Jobs /
User job parameters).

#### JSON-struktur
```text
JobQueuer
  JobQueuerMenuContainers[] (3 i sample)
    Name, DisplayName, Description, Id, IsActive, IsChecked
    DeployAsPulldownMenu (bool)
    Toolbars[] (ofte tom)
    EntityClasses[] { ClassId, InternalId, ClassIdChecked }
    JobQueuers[] (1-2)
      Name, DisplayName, Description, Id, IsActive, IsChecked
      ShowJobQueuedInformation, ShowJobQueuedInformationOnlyIfCriteriasNotMet
      Jobs[] { Name, DisplayName, Description, Id, IsActive, IsChecked, Priority, ConditionLists, Parameters, Icon }
      UserJobParameters[] (tom i sample)
```

#### Primære felter for webviewer
Queuer: DisplayName/Name, Description, IsActive, Id, DeployAsPulldownMenu, EntityClasses, Toolbars.
Jobs: IsActive, DisplayName/Name, Description, Priority.

#### Sekundære/tekniske felter
`Icon` (base64), `ConditionLists`, `Parameters` (rå), `VaultGroups`, `InternalId`,
`ShowJobQueuedInformation*`, GUID i `Id`.

#### Foreslået webvisning
Liste + detail + underfaner (type B + D). Allerede prototypet.

#### Åbne spørgsmål
Bør vieweren vise menu-containere som egne rækker, eller fortsætte med at flade
`JobQueuers` ud (nuværende prototype flader ud)?

---

### DataCard

#### Hvad brugeren ser i dialogen
Liste af data cards; hvert card har tabs og tilknyttede entity classes.

#### JSON-struktur
```text
DataCard
  Name, DisplayName, Description, Id, IsActive, IsChecked
  DataCards[]
    Name, DisplayName, Description, Id, IsActive, IsChecked
    Tabs[] { Icon, ConditionLists, Columns, Name, DisplayName, Description, Id, IsActive, IsChecked }
    EntityClasses[] { ClassId, InternalId, ClassIdChecked }
```

#### Primære felter for webviewer
Card: Name/DisplayName, Description, IsActive, IsChecked, antal Tabs, antal EntityClasses.
Tab: Name/DisplayName, Description, SystemName, IsActive, IsChecked.

#### Sekundære/tekniske felter
`Tabs[].Columns`, `Tabs[].ConditionLists`, `Tabs[].Icon`, `EntityClasses[].InternalId`.

#### Foreslået webvisning
Tabel for cards + tabel for tabs (type C/D). Dyb tab-data i raw JSON. Allerede prototypet.

#### Åbne spørgsmål
Hvad er den korrekte brugervendte betydning af `Columns` og `ConditionLists` på en tab?

---

### General

#### Hvad brugeren ser i dialogen
General Settings: en lang liste af til/fra-flag samt avancerede indstillinger.

#### JSON-struktur
```text
General
  22 primitive flag (Enable..., Validate..., Source..., m.fl.)
  Advanced { ImpersonationUser { VaultUser { User {...}, ... } } }
```

#### Primære felter for webviewer
Alle flade `Enable*`/`Validate*`-flag som settings (boolean Ja/Nej).

#### Sekundære/tekniske felter
`Advanced.ImpersonationUser.VaultUser.User` (dyb intern brugerstruktur med interne id'er,
datoer, auth-flag) → bør være sekundær/teknisk.

#### Foreslået webvisning
Settings panel (type A) for flade flag; `Advanced` som nested gruppe eller raw JSON.
Allerede prototypet.

#### Åbne spørgsmål
Bør de mange flag grupperes (fx "Managers", "Design Representation", "Quick New") i stedet
for én lang liste?

---

### QuickProject

#### Hvad brugeren ser i dialogen
Quick Project-opsætning med menu-containere.

#### JSON-struktur
```text
QuickProject
  QuickProjectMenuContainers[] (tom i sample)
```

#### Primære felter for webviewer
Container: Name/DisplayName, Description, IsActive + liste af entries (når data findes).

#### Sekundære/tekniske felter
Dybe container-detaljer; GUID'er.

#### Foreslået webvisning
Settings + liste (type A/B). Tom i sample → vis "antal: 0".

#### Åbne spørgsmål
Hvilke felter findes på en `QuickProjectMenuContainer` i en reel config? Ikke nok viden
endnu — kræver ikke-tom data.

---

### QuickNew

#### Hvad brugeren ser i dialogen
Quick New-opsætning (filer/mapper), templates-folder m.m.

#### JSON-struktur
```text
QuickNew
  QuickNewMenuContainers[] (tom i sample)
```

#### Primære felter for webviewer
Som QuickProject.

#### Sekundære/tekniske felter
Dybe container-detaljer.

#### Foreslået webvisning
Settings + liste (type A/B). Tom i sample.

#### Åbne spørgsmål
Samme som QuickProject — kræver ikke-tom data.

---

### NumberReserve

#### Hvad brugeren ser i dialogen
Number Generator: schemes/rules for nummerering.

#### JSON-struktur
```text
NumberReserve
  NumberReserveMainMenus[] (tom i sample)
```

#### Primære felter for webviewer
Schemes/rules: Name, antal, aktiv-status (når data findes).

#### Sekundære/tekniske felter
Detaljerede rule-definitioner.

#### Foreslået webvisning
Settings + tabel for schemes/rules (type A/C). Tom i sample.

#### Åbne spørgsmål
1. Hvad svarer "Number Generator" i UI præcist til? JSON-navnet er `NumberReserve`.
2. Hvilke felter har et `NumberReserveMainMenu`? Ikke nok viden endnu.

---

### CommandsConfiguration

#### Hvad brugeren ser i dialogen
Konfiguration af kommandoer (bl.a. skjulte kommandoer i Vault Explorer).

#### JSON-struktur
```text
CommandsConfiguration
  Name, DisplayName, Description, Id, IsActive, IsChecked
  VaultExplorerHiddenCommands[] (tom i sample)
```

#### Primære felter for webviewer
Command: Name/DisplayName, Description, IsActive, IsChecked, Id.

#### Sekundære/tekniske felter
Interne kommando-id'er; GUID'er.

#### Foreslået webvisning
Tabel (type C). Tom i sample.

#### Åbne spørgsmål
Findes der flere command-lister end `VaultExplorerHiddenCommands` i reelle configs?

---

### UsesFilter

#### Hvad brugeren ser i dialogen
Uses/Where-used-filter (sandsynligvis), opbygget som menu-containere.

#### JSON-struktur
```text
UsesFilter
  UsesFilterMenuContainers[] (2 i sample)
    UsesFilters[], EntityClasses[], DeployAsPulldownMenu, Toolbars[],
    Name, DisplayName, Description, Id, IsActive, IsChecked
```

#### Primære felter for webviewer
Container: Name/DisplayName, Description, IsActive, EntityClasses + antal UsesFilters.

#### Sekundære/tekniske felter
Dybe filter-definitioner i `UsesFilters[]`.

#### Foreslået webvisning
Liste + detail (type B). Samme mønster som JobQueuer.

#### Åbne spørgsmål
Hvad indeholder et element i `UsesFilters[]`? Ikke fuldt afdækket.

---

### WorkFolder

#### Hvad brugeren ser i dialogen
Work Folder Manager / synkroniseringer.

#### JSON-struktur
```text
WorkFolder
  WorkFolderSynchronizations[] (tom i sample)
```

#### Primære felter for webviewer
Synkronisering: kilde/mål, aktiv-status (når data findes).

#### Sekundære/tekniske felter
Detaljeret sync-konfiguration.

#### Foreslået webvisning
Generic fallback (type F) indtil data afdækkes.

#### Åbne spørgsmål
Ikke nok viden endnu — kræver flere screenshots eller ikke-tom data.

---

### DesignRepresentation

#### Hvad brugeren ser i dialogen
Design Representation collector-opsætning.

#### JSON-struktur
```text
DesignRepresentation
  DesignRepresentationCollectorMenuContainers[] (tom i sample)
```

#### Foreslået webvisning
Generic fallback (type F).

#### Åbne spørgsmål
Ikke nok viden endnu — tom i sample.

---

### Extension

#### Hvad brugeren ser i dialogen
Extensions/tilføjelser, fx drawing list-templates.

#### JSON-struktur
```text
Extension
  Extensions[] (3 i sample)
    DrawingListTemplates, CreateDrawingListCommandName,
    Name, DisplayName, Description, Id, IsActive, IsChecked
```

#### Primære felter for webviewer
Extension: Name/DisplayName, Description, IsActive, CreateDrawingListCommandName.

#### Sekundære/tekniske felter
`DrawingListTemplates` (struktur ukendt), GUID'er.

#### Foreslået webvisning
Tabel (type C).

#### Åbne spørgsmål
Hvad er strukturen af `DrawingListTemplates`?

---

### LifeCycleChangeBehavior

#### Hvad brugeren ser i dialogen
Lifecycle change-handlinger med betingelser, properties og jobs.

#### JSON-struktur
```text
LifeCycleChangeBehavior
  LifeCycleChangeActions[] (1 i sample)
    Name, DisplayName, Description, Id, IsActive, IsChecked
    ItemFileSyncronizationConfiguration, RestrictionCondition,
    ItemAssociatedFileConfiguration, Jobs[],
    PreConditionLists, PostConditionLists, CopyProperties, SetProperties
```

#### Primære felter for webviewer
Action: Name/DisplayName, Description, IsActive + antal Jobs.

#### Sekundære/tekniske felter
`PreConditionLists`, `PostConditionLists`, `CopyProperties`, `SetProperties`,
`*Configuration`-objekter → dybe og tekniske.

#### Foreslået webvisning
Liste + detail (type B), med condition lists i raw JSON.

#### Åbne spørgsmål
Hvilke af condition/property-strukturerne er værd at vise brugervenligt?

---

### AssignItemToFileBehavior / AssignmentToFileBehavior

#### Hvad brugeren ser i dialogen
Regler for at tilknytte item til fil, inkl. restriktioner og beskeder.

#### JSON-struktur
```text
AssignItemToFileBehavior
  AssignItemToFileActions[]
    Name, DisplayName, Description, Id, IsActive, IsChecked
    AssignItemToFileRestrictionCondition {
      RestrictAssignItemToFile,
      AssignItemToFileRestrictionMessage,
      AssignItemToFileRestrictionConditionLists,
      RestrictWhenModelAndDrawingIsNotOneToOne,
      RestrictWhenModelAndDrawingIsNotOneToOneMessage
    }
```

#### Primære felter for webviewer
Action: Name/DisplayName, Description, IsActive, IsChecked, Id.
Restriktioner: de 5 felter i restriktionsobjektet (booleans + beskeder).

#### Sekundære/tekniske felter
`AssignItemToFileRestrictionConditionLists` (dyb), GUID'er.

#### Foreslået webvisning
Liste + restriktioner-sektion (type B/E). Allerede prototypet.

#### Åbne spørgsmål
Er `AssignmentToFileBehavior` (med "ment") en reel variant i nogen klientversion?
Indtil bekræftet behandles begge som alias.

## 9. Hvilke felter bør være primære i webvieweren

Generel regel — primære felter (vises øverst, læsbart):

```text
Name
DisplayName
Description
IsActive
IsChecked
Priority
Id          (vis, men diskret)
Type
Value
Path
EntityClasses
Toolbars
Jobs
Tabs
Settings (flade flag)
Rules
Schemes
```

## 10. Hvilke felter bør være sekundære/tekniske

Generel regel — sekundære/tekniske felter (skjult bag "Vis teknisk info" / raw JSON):

```text
GUIDs (men vises diskret, ikke skjult helt)
Internal class ids (InternalId)
Raw JSON (altid tilgængelig nederst, aldrig primær)
Null values
Empty arrays (vis blot "antal: 0")
Deep technical condition lists (Pre/PostConditionLists, ConditionLists)
System-only flags (IsSys, Auth, CreateUserId, ShowJobQueuedInformation*)
Base64 icons (Icon)
```

Principper:

- GUID kan være sekundær, men ikke helt skjult (kan vises diskret i detailgrid).
- Raw JSON skal være tilgængelig **nederst** i `<details>`, aldrig primær for kendte moduler.
- JSON keys oversættes ikke, men UI-labels må gerne være venlige.

## 11. Hvilke JSON-data må ikke oversættes

**Må oversættes (UI-lag):**

```text
UI-labels
Sektionstitler
Knaptekster
Forklarende hjælpetekster
Boolean labels: Ja/Nej, Yes/No
```

**Må IKKE oversættes (data fra konfigurationen):**

```text
JSON keys
Job names
Command names
Property names fra konfigurationen
File paths
Enum values (fx ClassId = FILE/FLDR/CO)
Descriptions fra kundens/clientens JSON
GUIDs
```

Eksempel på venlig label vs. teknisk key:

- Teknisk JSON-key: `RestrictWhenModelAndDrawingIsNotOneToOne`
- Venlig UI-label (forslag): "Spær hvis model og tegning ikke er én-til-én"
- Den tekniske key bør stadig kunne ses sekundært (tooltip, lille tekst eller raw JSON).

> Vigtigt: Venlige labels er en **mapping i UI-laget** (i18n), ikke en omskrivning af data.
> `DisplayName`/`Description` i JSON er **kundedata** og må vises som de er, uden oversættelse.

## 12. Forslag til fremtidig viewer-struktur

```text
Venstre navigation: dialogområder/moduler (som i dag)
Topområde: modulnavn + kort forklarende UI-tekst
Primær visning: dialog-lignende settings/liste/detail
Sekundær visning: tekniske detaljer ("Vis teknisk info")
Nederst: Raw JSON i <details>
```

Rendering-typer pr. modul:

| Modul | Anbefalet rendering-type | Prioritet | Begrundelse |
|-------|--------------------------|-----------|-------------|
| JobQueuer | B. Liste + detail (+ D. Tabs) | P1 | Klar dialogstruktur + rige data i sample |
| DataCard | C. Tabel (+ D. Tabs) | P1 | Cards + tabs er tabel-egnede |
| General | A. Settings panel | P1 | Mange flade flag passer til settings |
| CommandsConfiguration | C. Tabel | P1 | Kommandoliste er tabel-egnet |
| QuickProject | A. Settings + B. Liste | P2 | Container-mønster, tom i sample |
| QuickNew | A. Settings + B. Liste | P2 | Container-mønster, tom i sample |
| NumberReserve | A. Settings + C. Tabel | P2 | Schemes/rules, tom i sample |
| AssignItemToFileBehavior | B. Liste + E. Rules/conditions | P2 | Restriktioner er condition-orienterede |
| LifeCycleChangeBehavior | B. Liste + E. Rules/conditions | P2 | Dyb action-struktur |
| UsesFilter | B. Liste + detail | P3 | Container-mønster, ufuldt afdækket |
| WorkFolder | F. Generic fallback | P3 | Tom i sample |
| DesignRepresentation | F. Generic fallback | P3 | Tom i sample |
| Extension | C. Tabel | P3 | Simpel liste, dyb template-data |
| FolderToFolderFileSynchronization | F. Generic fallback | P3 | Tom i sample |

Rendering-type-katalog:

```text
A. Settings panel        - flade key/value-flag, booleans som Ja/Nej
B. Liste + detail        - tabel + valgbar detailvisning
C. Tabel                 - ren tabel af items
D. Tabs                  - underfaner i en detailvisning
E. Rules/conditions      - betingelser/restriktioner læsbart
F. Generic fallback      - eksisterende generisk visning + raw JSON
```

## 13. Modulprioritering

```text
P1 — Høj værdi / bør specialvises først
  - JobQueuer
  - DataCard
  - General
  - CommandsConfiguration

P2 — Middel værdi / specialvises senere
  - QuickProject
  - QuickNew
  - NumberReserve
  - AssignItemToFileBehavior / AssignmentToFileBehavior
  - LifeCycleChangeBehavior

P3 — Lav værdi / generisk fallback er OK
  - UsesFilter
  - WorkFolder
  - DesignRepresentation
  - Extension
  - FolderToFolderFileSynchronization
```

> Observation: De fleste P2/P3-moduler er **tomme i sample fixturen**, hvilket gør det svært
> at designe specialvisning sikkert. Prioritering bør derfor følge, hvor der findes reel data.

## 14. Åbne spørgsmål

1. Hvilket dialogmenupunkt svarer præcist til `NumberReserve`? (UI: "Number Generator"?)
2. Er både `AssignItemToFileBehavior` og `AssignmentToFileBehavior` gyldige varianter, eller
   er sidstnævnte forældet/forkert?
3. Hvilke moduler bruges oftest af konsulenter (for at prioritere specialvisning rigtigt)?
4. Skal webvieweren primært være **audit/overblik** eller **undervisningsværktøj**?
5. Skal tekniske keys vises direkte eller kun via "Vis teknisk info"?
6. Skal UI matche klientdialogen tæt (1:1), eller bare forklare indholdet bedre?
7. Skal vieweren vise JobQueuer-menu-containere som egne rækker, eller fortsætte med at flade
   `JobQueuers` ud (nuværende prototype)?
8. Hvilke felter findes på de containere/menuer, der er **tomme** i sample
   (`QuickProject`, `QuickNew`, `NumberReserve`, `WorkFolder`, `DesignRepresentation`,
   `FolderToFolderFileSynchronization`)? Kræver ikke-tom konfiguration.
9. Bør `General`-flag grupperes i logiske sektioner i stedet for én lang liste?

## 15. Forslag til næste implementeringsfase

**Anbefalet Fase A (lille, afgrænset):**

```text
Fase A:
Konsolidér og verificér JobQueuer-specialvisningen som referencemønster.
- Ingen nye moduler.
- Ingen ny funktionalitet.
- Kun visningslag + en "Vis teknisk info"-toggle for tekniske felter.
```

**Begrundelse:**

- JobQueuer er det eneste P1-modul med **rige, ikke-tomme data** i sample fixturen, og det har
  allerede en prototype-specialvisning. Det er derfor den sikreste kandidat til at etablere et
  genbrugeligt mønster (liste + detail + underfaner + read-only toolbar + raw JSON nederst).
- De øvrige P1-moduler (DataCard, General, CommandsConfiguration) kan derefter følge samme
  mønster i separate, små faser.
- Et alternativ — friendly label-system for `AssignItemToFileBehavior` — er værdifuldt, men
  bør komme **efter** at JobQueuer-mønstret er stabilt, fordi label-systemet skal genbruges på
  tværs af moduler og derfor bør designes ud fra et verificeret referencemodul.

> Hvis det vurderes, at JobQueuer allerede blev for teknisk, er det sekundære forslag:
> "Lav friendly label-system + teknisk-key toggle for AssignItemToFileBehavior" — men det
> anbefales først efter JobQueuer-mønstret er konsolideret.

## Forslag til fremtidige tests (ikke implementeret her)

Når næste kodefase påbegyndes, bør der tilføjes tests for:

- mapping keys findes (forventede top-level keys i fixturen)
- kendte modul-renderers findes i `vault-client.js`
- raw JSON er sekundær (`<details>`-container)
- data oversættes ikke (JSON keys/værdier uændret i UI)
- booleans vises venligt (Ja/Nej, Yes/No)
- tekniske keys kan vises sekundært ("Vis teknisk info")
- sample fixture dækker de vigtige moduler (mindst JobQueuer, DataCard, General med data)

## 16. Konklusion

- Client JSON er bygget op om et gennemgående mønster: hvert modul er et objekt med én eller
  få **container-arrays** (`*MenuContainers`, `*Actions`, `DataCards`, `Extensions` osv.), og
  hvert element deler standardfelterne `Name/DisplayName/Description/Id/IsActive/IsChecked`.
- **JobQueuer** har den klareste og rigeste struktur i sample og egner sig bedst som
  referencemønster (liste + detail + underfaner).
- Mange moduler (`QuickProject`, `QuickNew`, `NumberReserve`, `WorkFolder`,
  `DesignRepresentation`, `FolderToFolderFileSynchronization`) er **tomme i sample**, hvilket
  begrænser sikker specialvisning indtil ikke-tom data er tilgængelig.
- Kun `AssignItemToFileBehavior` (ikke `AssignmentToFileBehavior`) er bekræftet i sample.
- Standardregel: standardfelter primært, GUID'er/condition lists/icons sekundært, raw JSON
  altid nederst i `<details>`. JSON-data oversættes aldrig; kun UI-labels.
- Anbefalet næste fase: konsolidér JobQueuer-mønstret som genbrugelig skabelon før flere
  moduler specialvises.
