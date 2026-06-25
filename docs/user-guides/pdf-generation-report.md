# PDF-generering — brugervejledninger

Rapport genereret: 2026-06-25

## 1. Aktuel branch

`refactor/app-shell-workflow-split`

## 2. Aktuel version

`0.7.1` (fra `app/core/version.py`)

## 3. Remote URL

`https://github.com/andersBpetersen/NTI-Workflow.git`  
(Ingen credentials i URL — sikker til dokumentation.)

## 4. Kilder anvendt

- `README.md`
- `docs/architecture.md`
- `docs/backend-architecture.md`
- `docs/i18n.md`
- `docs/shared-frontend.md`
- `docs/openapi-contract.json`
- `DEPLOY.md`, `PUBLISH.md`, `START-DOCKER.md`
- `CHANGELOG.md`, `docs/release-notes-0.7.1.md`
- `app/core/version.py`, `app/routes/*`, `app/services/workflow/*`
- `static/index.html`, `static/workflow/`, `static/vault-config/`
- `Dockerfile`, `docker-compose.yml`, `docker-compose.prod.yml`
- `requirements.txt`, `requirements-dev.txt`
- `tests/` (pytest-resultat)

## 5. Oprettede Markdown-filer

| Fil | Beskrivelse |
|-----|-------------|
| `docs/user-guides/NTI-Workflow-Programbeskrivelse.md` | Samlet programbeskrivelse |
| `docs/user-guides/NTI-Workflow-GitHub-Gendannelse.md` | GitHub-gendannelsesvejledning |

## 6. Oprettede PDF-filer

| Fil | Sider | Størrelse |
|-----|-------|-----------|
| `docs/user-guides/pdf/NTI-Workflow-Programbeskrivelse.pdf` | 8 | ca. 116 KB |
| `docs/user-guides/pdf/NTI-Workflow-GitHub-Gendannelse.pdf` | 8 | ca. 112 KB |

## 7. PDF-bibliotek

`reportlab==4.2.5` (kun i `requirements-dev.txt`)

## 8. Fontvalg og Unicode

| Rolle | Font (system) |
|-------|----------------|
| Brødtekst | Arial (`C:\Windows\Fonts\arial.ttf`) |
| Fed | Arial Bold (`arialbd.ttf`) |
| Kodeblokke | Consolas (`consola.ttf`) |

Danske tegn (æ, ø, å, Æ, Ø, Å) verificeret i genereret PDF-indhold. Ingen fontfiler er committed til repository.

## 9. Testresultat

Seneste kørsel: **155 passed** (inkl. `tests/test_user_guide_pdfs.py`, 19 tests).

Programbeskrivelse-testresultat dokumenteret i Markdown: **136 passed** (basis-testsuite før brugervejledningstests).

## 10. Manuel kontrol

| Kontrolpunkt | Status |
|--------------|--------|
| Titelblad med version og dato | OK |
| Indholdsfortegnelse | OK |
| Sidehoved og sidetal | OK |
| PowerShell-kodeblokke | OK |
| Advarselsbokse | OK |
| Tabeller | OK |
| Arkitekturdiagram | OK (programbeskrivelse) |
| Danske tegn | OK |
| Ingen credentials/secrets | OK |
| Korrekt version 0.7.1 | OK |

## 11. Kendte begrænsninger

- PDF-indholdsfortegnelse viser sidetal efter ReportLab TOC-opbygning; layout kan variere ved regenerering.
- Markdown bruger `##` som øverste sektionsniveau i PDF (titel vises på titelblad).
- PDF-tekstudtræk uden ekstra bibliotek er begrænset; tests bruger byte-signatur, sidetal og metadata.
- Scriptet forudsætter Windows-systemfonter; på Linux bruges DejaVu-fallback-stier.

## 12. Kommando til regenerering

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
python scripts\generate_user_guide_pdfs.py
```

Valgfri output-mappe:

```powershell
python scripts\generate_user_guide_pdfs.py --output-dir docs\user-guides\pdf
```

## 13. Git-status ved rapport

```
 M README.md
 M requirements-dev.txt
?? docs/user-guides/
?? scripts/generate_user_guide_pdfs.py
?? tests/test_user_guide_pdfs.py
```

Ingen commit, tag eller push er udført automatisk.
