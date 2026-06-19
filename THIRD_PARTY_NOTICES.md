# Third-Party Notices – NTI Workflow

Dette dokument lister tredjepartsprogrammer, biblioteker og komponenter, som NTI Workflow
bruger eller bygger på. Licenser og versioner gælder for de versioner, der er angivet i
`requirements.txt` og `requirements-dev.txt` på udgivelsestidspunktet.

NTI Workflow selv er intern software til NTI. Tredjepartskomponenterne forbliver under
deres respektive licenser.

---

## Produktion (Python / backend)

Disse pakker installeres via `requirements.txt` og bruges i den kørende webservice.

| Komponent | Version | Licens | Formål |
|-----------|---------|--------|--------|
| [FastAPI](https://github.com/fastapi/fastapi) | 0.115.6 | MIT | Web-API og HTTP-endpoints |
| [Starlette](https://github.com/encode/starlette) | 0.41.3* | BSD-3-Clause | ASGI-framework (afhængighed af FastAPI) |
| [Pydantic](https://github.com/pydantic/pydantic) | 2.13.4* | MIT | Datavalidering (afhængighed af FastAPI) |
| [Uvicorn](https://www.uvicorn.org/) | 0.34.0 | BSD-3-Clause | ASGI-server |
| [python-multipart](https://github.com/Kludex/python-multipart) | 0.0.20 | Apache-2.0 | Multipart file upload |
| [openpyxl](https://openpyxl.readthedocs.io/) | 3.1.5 | MIT | Læsning af Excel-filer (.xlsx/.xlsm) |
| [et-xmlfile](https://foss.heptapod.net/openpyxl/et_xmlfile) | 2.0.0* | MIT | XML-understøttelse (afhængighed af openpyxl) |

\*Transitive afhængighed – version kan variere ved `pip install`. Kør `pip freeze` ved
release for præcis liste.

### Yderligere transitive afhængigheder (Uvicorn)

Uvicorn `[standard]` kan trække bl.a. følgende ind (afhænger af platform):

- `click` (BSD-3-Clause)
- `h11` (MIT)
- `httptools` (MIT)
- `python-dotenv` (BSD-3-Clause)
- `pyyaml` (MIT)
- `watchfiles` (MIT)
- `websockets` (BSD-3-Clause)

Se `pip freeze` eller `pip-licenses` for fuld liste i et givet miljø.

---

## Udvikling og test

Disse pakker installeres via `requirements-dev.txt` og bruges **ikke** i produktions-
Docker-imaget, medmindre de bevidst tilføjes.

| Komponent | Version | Licens | Formål |
|-----------|---------|--------|--------|
| [pytest](https://pytest.org/) | 8.3.4 | MIT | Enhedstests |
| [httpx](https://www.python-httpx.org/) | 0.28.1* | BSD-3-Clause | HTTP-klient til API-tests (via FastAPI TestClient) |

---

## Frontend

Workflow Viewer i `static/` er implementeret med **egen HTML, CSS og JavaScript** uden
eksterne JavaScript- eller CSS-biblioteker fra CDN.

Der loades ingen tredjeparts frontend-frameworks (fx React, Vue, Cytoscape.js) i den
nuværende version.

---

## Container-basis

Docker-imaget (`Dockerfile`) bygger på:

| Komponent | Reference | Licens |
|-----------|-----------|--------|
| [Python](https://www.python.org/) | `python:3.13-slim` (Docker Official Image) | PSF License |

---

## Licensreferencer (kort)

### MIT License

Tillader brug, kopiering, ændring og distribution med bevarelse af copyright- og
licensmeddelelse. Se respektive projekters `LICENSE`-filer.

### BSD-3-Clause

Tillader brug og distribution med bevarelse af copyright, disclaimer og
ansvarsfraskrivelse. Se respektive projekters `LICENSE`-filer.

### Apache License 2.0

Tillader brug og distribution med bevarelse af copyright, NOTICE og ansvarsfraskrivelse.
Se [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).

---

## Opdatering af dette dokument

Ved opgradering af afhængigheder:

```powershell
pip install -r requirements.txt
pip freeze > pip-freeze.txt
```

Gennemgå derefter om nye pakker eller licensændringer skal tilføjes her.

---

## Kontakt

Spørgsmål om tredjepartslicenser i forbindelse med intern distribution eller deploy
rettes til projektansvarlig / IT.
