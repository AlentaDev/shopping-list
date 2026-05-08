# Skill Registry

Proyecto: `shopping-list`  
Actualizado: 2026-05-08  
Fuentes principales de skills: `/home/alentadev/projects/shopping-list/skills`, `/home/alentadev/.config/opencode/skills`

## Reglas de resolución

- Priorizar skills de proyecto sobre skills globales con el mismo nombre.
- Ignorar `_shared`, `skill-registry` y todos los `sdd-*` para esta registry operativa.
- Activar skill solo cuando el trigger aplica al pedido actual.
- Siempre combinar con convenciones de `AGENTS.md` del repo.

## Skills activas detectadas

### shopping-list-architecture
- **Trigger**: arquitectura shopping-list, monolito modular, TDD, refactor, shared, sprint técnico.
- **Path**: `/home/alentadev/projects/shopping-list/skills/shopping-list-architecture/SKILL.md`
- **Reglas compactas**:
  - Aplicar en cambios no triviales, deuda técnica, refactors o planificación de sprint técnico.
  - TDD obligatorio: test primero, implementación mínima, refactor después de verde.
  - Mantener monolito modular; no microservicios, GraphQL, CQRS ni Event Sourcing.
  - No inventar requisitos, no cambiar arquitectura y no agregar librerías sin confirmación.
  - Mantener cambios chicos; evitar mover/renombrar más de ~10 archivos por iteración.
  - `shared` solo para utilidades puras/técnicas; lógica específica vive en su feature/app.
  - Si el ownership de una capa no está claro, detenerse y preguntar.

### react-web
- **Trigger**: react, vite, vitest, testing-library, frontend web, componente, hook, UI_TEXT.
- **Path**: `/home/alentadev/projects/shopping-list/skills/react-web/SKILL.md`
- **Reglas compactas**:
  - TDD obligatorio en `apps/web`: test primero, mínimo cambio, refactor después de verde.
  - `components/` es UI pura: sin `fetch`, sin endpoints, sin orquestación.
  - `services/` orquesta casos de uso y llamadas API; `adapters/` transforma DTO → modelo UI.
  - `shared/` debe ser reusable puro: sin `fetch`, sin estado global, sin conocimiento de features.
  - No importar internals de otra feature; cruzar solo por `shared` o `context` cuando aplique.
  - Todo copy nuevo debe vivir en `UI_TEXT` por componente/feature.
  - Respetar naming: componentes `PascalCase.tsx`, hooks `useX.ts`, utils `camelCase.ts`.

### express-api
- **Trigger**: express, api, rest, zod, endpoint, router, middleware, authorization.
- **Path**: `/home/alentadev/projects/shopping-list/skills/express-api/SKILL.md`
- **Reglas compactas**:
  - TDD obligatorio en `apps/api`: test del caso/endpoint antes de implementar.
  - Respetar capas `domain`, `application`, `infrastructure`, `web`; dependencias hacia adentro.
  - Validar inputs de endpoints con Zod y variables de entorno al arrancar.
  - Autorización explícita por lista/recurso; nunca implícita.
  - Manejo de errores centralizado, sin duplicar lógica en handlers.
  - Integraciones externas detrás de interfaces/providers con cache/fallback.
  - Persistencia por defecto in-memory; Postgres requiere documentar modo y wiring.

### android-kotlin
- **Trigger**: android, kotlin, retrofit, okhttp, token refresh, mobile, gradle, flavor.
- **Path**: `/home/alentadev/projects/shopping-list/skills/android-kotlin/SKILL.md`
- **Reglas compactas**:
  - TDD obligatorio cuando toque lógica de negocio o red en `apps/mobile-android`.
  - No hardcodear URLs ni secretos; resolver entornos por flavors/BuildConfig.
  - Separar UI, casos de uso y red; endpoints no van en Activity/Composable.
  - Refresh token y retries viven en capa de red/interceptor, no en UI.
  - Cambios de auth deben validar request original, refresh, retry y fallback a logout.
  - Evitar release insegura como `localRelease` salvo excepción explícita.
  - Cambios de red preservan manejo explícito de 401/403/5xx/timeouts.

### branch-pr
- **Trigger**: crear/abrir/preparar PR.
- **Path**: `/home/alentadev/.config/opencode/skills/branch-pr/SKILL.md`
- **Reglas compactas**:
  - Todo PR debe linkear issue aprobado (`status:approved`).
  - Agregar exactamente una label `type:*`.
  - Mantener Conventional Commits válidos.
  - Respetar naming de branch `type/description`.
  - Validar checks automáticos antes de merge.

### chained-pr
- **Trigger**: PR grande, stacked/chained PRs, control de carga de review.
- **Path**: `/home/alentadev/.config/opencode/skills/chained-pr/SKILL.md`
- **Reglas compactas**:
  - Si supera ~400 líneas cambiadas, dividir salvo `size:exception` explícita.
  - Una unidad entregable por PR, con tests/docs en el mismo slice.
  - No mezclar estrategias de encadenado una vez elegida.
  - Corregir diffs contaminados (retarget/rebase) antes de pedir review.

### cognitive-doc-design
- **Trigger**: escritura/edición de docs, README, RFC, onboarding, docs de review.
- **Path**: `/home/alentadev/.config/opencode/skills/cognitive-doc-design/SKILL.md`
- **Reglas compactas**:
  - Arrancar por decisión/resultado, no por contexto largo.
  - Aplicar progressive disclosure (camino rápido primero).
  - Usar estructura escaneable: chunks, tablas, checklist.
  - Delimitar scope de review y próximos pasos.

### comment-writer
- **Trigger**: comentarios en PR/issues/chat.
- **Path**: `/home/alentadev/.config/opencode/skills/comment-writer/SKILL.md`
- **Reglas compactas**:
  - Ser directo y accionable al inicio.
  - Mantener tono cálido y breve.
  - Explicar el porqué técnico cuando pedís cambio.
  - En español, usar voseo rioplatense.

### go-testing
- **Trigger**: tests de Go, cobertura Go, Bubble Tea/teatest, golden files.
- **Path**: `/home/alentadev/.config/opencode/skills/go-testing/SKILL.md`
- **Reglas compactas**:
  - Preferir table-driven tests.
  - Probar comportamiento/estado, no trivia de implementación.
  - Aislar FS con `t.TempDir()`.
  - Golden files determinísticos con flujo `-update` + rerun normal.

### issue-creation
- **Trigger**: creación de issues (bug/feature).
- **Path**: `/home/alentadev/.config/opencode/skills/issue-creation/SKILL.md`
- **Reglas compactas**:
  - Usar template obligatorio, no issue en blanco.
  - Estado inicial `status:needs-review`.
  - No abrir PR hasta tener `status:approved`.
  - Preguntas van a Discussions, no a Issues.

### judgment-day
- **Trigger**: “judgment day”, dual review, adversarial review.
- **Path**: `/home/alentadev/.config/opencode/skills/judgment-day/SKILL.md`
- **Reglas compactas**:
  - Ejecutar dos jueces ciegos en paralelo.
  - No cerrar con resultados parciales.
  - Pedir confirmación antes de fix en ronda 1.
  - Re-juzgar siempre después de cada fix.

### skill-creator
- **Trigger**: crear/actualizar skills de agentes.
- **Path**: `/home/alentadev/.config/opencode/skills/skill-creator/SKILL.md`
- **Reglas compactas**:
  - Seguir estructura LLM-first obligatoria del SKILL.
  - Descripción en una sola línea, con triggers explícitos.
  - Mover detalle extenso a `assets/` o `references/`.
  - Registrar skill de proyecto en `AGENTS.md`.

### work-unit-commits
- **Trigger**: planificación de commits por unidad de trabajo.
- **Path**: `/home/alentadev/.config/opencode/skills/work-unit-commits/SKILL.md`
- **Reglas compactas**:
  - Commitear por comportamiento entregable, no por tipo de archivo.
  - Tests y docs viajan con el cambio que validan.
  - Cada commit debe ser reversible sin romper trabajo no relacionado.
  - Si crece mucho, preparar slicing para chained PRs.

## Convenciones de proyecto detectadas

### Índices/contratos
- `/home/alentadev/projects/shopping-list/AGENTS.md`
- `/home/alentadev/projects/shopping-list/apps/mobile-android/AGENTS.md`

### Referencias enlazadas por contrato
- `/home/alentadev/projects/shopping-list/docs/003-rest-api-feature-first.md`

## Reglas críticas del repo (resumen operativo)

- Monolito modular TypeScript, cambios incrementales y testeables.
- TDD obligatorio: test primero, implementación mínima, refactor tras verde.
- Frontend feature-first con límites estrictos entre `components/`, `services/`, `adapters/`, `context/`, `shared/`.
- Estrategia de coverage 100/80/0 para web (CORE/IMPORTANT/INFRASTRUCTURE).
- E2E mínimos con Playwright, solo flujos críticos.
- Backend REST feature-first en transición, sin nuevos desvíos arquitectónicos.
