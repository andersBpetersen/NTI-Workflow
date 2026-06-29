"""One-off helper: sync vault i18n keys from en-GB to all locale files."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
I18N_DIR = ROOT / "static" / "i18n"

PRIORITY_OVERRIDES: dict[str, dict[str, str]] = {
    "es-ES.json": {
        "languageLabel": "Idioma",
        "backHome": "Volver al inicio",
        "loadConfig": "Cargar configuración",
        "dropTitle": "Arrastre un archivo JSON de NTI for Vault Job aquí",
        "dropSubtitle": "o haga clic para seleccionar un archivo de configuración",
        "supportedTypes": "Tipo de archivo admitido: .json",
        "ariaLabel": "Subir archivo JSON de configuración NTI for Vault Job",
        "topContainers": "Contenedores de procesadores de trabajos",
        "topDeactivate": "Desactivar procesadores de trabajos",
        "topFilepaths": "Rutas de archivo excluidas durante la limpieza de trabajos",
        "hideInactive": "Ocultar inactivos",
        "showAll": "Mostrar todos",
        "findNext": "Buscar siguiente",
        "searchPlaceholder": "Buscar...",
        "tableName": "Nombre",
        "tableDescription": "Descripción",
        "tableActive": "Activo",
        "tableJobProcessorKey": "Clave del procesador de trabajos",
        "tableRunOnlyViaJobProcessorKey": "Ejecutar solo mediante clave del procesador de trabajos",
        "tablePriority": "Prioridad",
        "emptyChooseContainer": "Seleccione un contenedor.",
        "emptyChooseJobProcessor": "Seleccione un procesador de trabajos para ver los detalles.",
        "emptyNoContainers": "No hay contenedores.",
        "emptyNoProcessors": "No hay procesadores de trabajos configurados.",
        "emptyNoFilePaths": "No hay rutas de archivo configuradas.",
        "emptyNoDeactivateConfig": "No se encontró configuración de desactivación.",
        "statusReady": "Listo: cargue un archivo de configuración para comenzar.",
        "statusLoaded": "Cargado: {name} — {count} contenedores",
        "statusVersionPrefix": "Versión:",
        "modalClose": "Cerrar",
        "modalConditions": "Condiciones",
        "modalParameters": "Parámetros",
        "modalJob": "Trabajo",
        "errorJsonOnly": "Solo se admiten archivos .json.",
        "errorEmptyArray": "El archivo de configuración contiene una matriz vacía.",
        "errorInvalidFormat": "Se pudo leer el JSON, pero el formato de configuración no es válido.",
        "errorMissingContainers": "Se pudo leer el JSON, pero no contiene JobProcessor.JobProcessorContainers.",
        "errorParsePrefix": "No se pudo analizar el JSON:\n",
        "unknownConfigName": "Configuración desconocida",
        "readonlyViewerTitle": "El visor es de solo lectura",
    },
    "pt-BR.json": {
        "languageLabel": "Idioma",
        "backHome": "Voltar ao início",
        "loadConfig": "Carregar configuração",
        "dropTitle": "Arraste um arquivo JSON do NTI for Vault Job aqui",
        "dropSubtitle": "ou clique para selecionar um arquivo de configuração",
        "supportedTypes": "Tipo de arquivo suportado: .json",
        "ariaLabel": "Enviar arquivo JSON de configuração NTI for Vault Job",
        "topContainers": "Contêineres de processadores de jobs",
        "topDeactivate": "Desativar processadores de jobs",
        "topFilepaths": "Caminhos de arquivo excluídos durante a limpeza de jobs",
        "hideInactive": "Ocultar inativos",
        "showAll": "Mostrar todos",
        "findNext": "Buscar próximo",
        "searchPlaceholder": "Buscar...",
        "tableName": "Nome",
        "tableDescription": "Descrição",
        "tableActive": "Ativo",
        "tableJobProcessorKey": "Chave do processador de jobs",
        "tableRunOnlyViaJobProcessorKey": "Executar somente pela chave do processador de jobs",
        "tablePriority": "Prioridade",
        "emptyChooseContainer": "Selecione um contêiner.",
        "emptyChooseJobProcessor": "Selecione um processador de jobs para ver os detalhes.",
        "emptyNoContainers": "Nenhum contêiner.",
        "emptyNoProcessors": "Nenhum processador de jobs configurado.",
        "emptyNoFilePaths": "Nenhum caminho de arquivo configurado.",
        "emptyNoDeactivateConfig": "Nenhuma configuração de desativação encontrada.",
        "statusReady": "Pronto - carregue um arquivo de configuração para começar.",
        "statusLoaded": "Carregado: {name} — {count} contêineres",
        "statusVersionPrefix": "Versão:",
        "modalClose": "Fechar",
        "modalConditions": "Condições",
        "modalParameters": "Parâmetros",
        "modalJob": "Job",
        "errorJsonOnly": "Somente arquivos .json são suportados.",
        "errorEmptyArray": "O arquivo de configuração contém uma matriz vazia.",
        "errorInvalidFormat": "O JSON pôde ser lido, mas o formato de configuração é inválido.",
        "errorMissingContainers": "O JSON pôde ser lido, mas não contém JobProcessor.JobProcessorContainers.",
        "errorParsePrefix": "Não foi possível analisar o JSON:\n",
        "unknownConfigName": "Configuração desconhecida",
        "readonlyViewerTitle": "O visualizador é somente leitura",
    },
}


def main() -> None:
    canonical = json.loads((I18N_DIR / "en-GB.json").read_text(encoding="utf-8"))["vault"]
    skip = {"en-GB.json", "da-DK.json"}
    for path in sorted(I18N_DIR.glob("*.json")):
        if path.name in skip:
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        vault = data.setdefault("vault", {})
        vault.update(canonical)
        vault.update(PRIORITY_OVERRIDES.get(path.name, {}))
        vault.pop("containersCountSuffix", None)
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Synced vault keys from en-GB")


if __name__ == "__main__":
    main()
