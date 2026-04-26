# ADR-0008: Gobernanza de documentación (fuentes canónicas y anti-drift)

## Estado

Aceptado.

## Contexto

El proyecto acumuló documentación duplicada, parcialmente desactualizada y con mezcla de idioma/estilo.
Esto generó inconsistencias de contrato (por ejemplo, endpoints y semántica de flujos) y dificultó el onboarding.

## Decisión

Se establece una política explícita para mantener la documentación consistente y evitar drift.

### 1) Idioma oficial

- La documentación operativa del proyecto se mantiene en **español (ES)**.
- Se conservan en inglés solo nombres técnicos, identificadores, endpoints, estados y términos de código.

### 2) Fuentes canónicas por dominio

- **Contrato HTTP API (snapshot actual):** `docs/api/openapi.yaml`
- **Comportamiento actual de API:** `docs/api/design.md`
- **Política transversal de listas/draft/recovery:** `docs/usecases/list-use-cases.md`
- **Roadmap canónico Android:** `apps/mobile-android/docs/implementation/006-implementation-plan.md`

### 3) Documentos derivados

- Los documentos de feature (API/Web/Mobile) deben priorizar:
  - objetivo
  - alcance
  - notas específicas de la feature
- Reglas transversales largas deben referenciar la fuente canónica y no duplicarse.

### 4) Regla anti-duplicación

Antes de agregar una sección nueva:

1. Buscar si ya existe una fuente canónica.
2. Si existe, enlazarla y resumir el impacto local.
3. Evitar copiar bloques normativos completos en múltiples archivos.

### 5) Convención para documentos históricos

- Si un documento ya no es canónico, marcarlo explícitamente como:
  - `histórico`, o
  - `parcialmente desactualizado`.
- Debe incluir puntero al documento canónico vigente.

## Consecuencias

### Positivas

- Menor riesgo de contradicciones entre docs.
- Onboarding más rápido y trazable.
- Cambios futuros más simples de validar.

### Negativas

- Requiere disciplina editorial en cada PR.

## Checklist mínimo por PR con cambios de documentación

- [ ] ¿El cambio respeta idioma ES y estilo del proyecto?
- [ ] ¿Actualiza la fuente canónica correspondiente?
- [ ] ¿Evita duplicación de reglas transversales?
- [ ] ¿Marca claramente documentos históricos/desactualizados cuando aplica?
