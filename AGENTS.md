# Reglas del Agente IA

Este proyecto usa una arquitectura **monolito modular** con TypeScript.
El agente debe seguir estas reglas estrictamente.

---

## Objetivo del agente

Ayudar a construir la aplicación de forma incremental, clara y testeable,
sin introducir complejidad innecesaria ni desviarse de la arquitectura definida.

Este documento actúa como **contrato obligatorio** para cualquier cambio.

---

## Reglas generales

- No inventar requisitos ni funcionalidades
- No introducir librerías nuevas sin justificarlo y pedir confirmación
- No cambiar la arquitectura sin pedir confirmación explícita
- Priorizar soluciones simples y explícitas
- En UI, usar `UI_TEXT` con sub-objetos por componente/feature para textos centralizados
- Evitar abstracciones prematuras
- Si una decisión no está documentada, **preguntar antes de implementar**
- Evitar refactors masivos: no mover/renombrar más de ~10 archivos por iteración sin confirmación

---

## Metodología

- **TDD obligatorio**
  - Test primero
  - Implementación mínima
  - Refactor solo después de verde
- Cambios pequeños y aislados
- Una feature o caso de uso por iteración

---

## Estrategia de testing y coverage: 100/80/0

**Principio fundamental**: Coverage ≠ calidad.  
94% coverage puede ser inútil si el 6% crítico falla.  
Enfocamos recursos donde realmente importa.

### CORE (100%)

Código que maneja **lógica crítica de negocio** y **estado del sistema**.  
Requiere **100% de cobertura** en:

- `context/`: Estado global transversal (ListContext, CartContext)
- `features/*/services/`: Orquestación de casos de uso
- `features/*/services/adapters/`: Transformación de datos externos
- `shared/utils/`: Utilidades críticas (cálculos, validaciones)

**Criterio**: Si este código falla, la app queda inutilizable o produce datos incorrectos.

### IMPORTANT (80%)

Features visibles y **lógica de presentación**.  
Requiere **80% de cobertura** en:

- `features/*/components/`: UI de features
- `App.tsx`: Composición principal
- Componentes con lógica condicional o interacciones complejas

**Criterio**: Si falla, afecta UX pero no corrompe datos.

### INFRASTRUCTURE (0%)

Código **auto-validable por TypeScript** o configuración.  
**Sin tests obligatorios**:

- `providers/`: Composición de providers (AppProviders)
- `infrastructure/`: Configuración transversal
- `main.tsx`: Entry point
- `index.ts`: Barrels de exportación
- `*.config.ts`: Archivos de configuración

**Criterio**: TypeScript garantiza corrección estructural. Si compila, funciona.

### Aplicación práctica

1. La estrategia prioriza lo crítico
2. **Coverage global target**: 80% (configurado en Vitest)
3. **Validación manual CORE**: Revisar que servicios/contextos tengan 100%
4. **Excluir de coverage**: infrastructure/, providers/, main.tsx, index.ts

**Configuración**: Ver `apps/web/vite.config.ts` → `test.coverage`

**Comando de análisis**:

```bash
cd apps/web
pnpm test:coverage
```

El comando ejecuta automáticamente:

1. Tests con Vitest + coverage
2. Análisis categorizado por estrategia 100/80/0
3. Reporte detallado de archivos CORE que necesitan atención

El análisis muestra:

- ✅ CORE: Archivos críticos (target: 100%)
- ✅ IMPORTANT: Features visibles (target: 80%)
- ℹ️ INFRASTRUCTURE: Excluido (target: 0%)

**Exit code**:

- Exit 0 (✅): IMPORTANT ≥ 80% (cumple requisito global)
- Exit 1 (❌): IMPORTANT < 80% (no cumple requisito global)
- Warning (⚠️): CORE < 100% pero no falla el build (validación manual)

---

## Tests E2E (End-to-End)

**Principio fundamental**: Los tests E2E son costosos (lentos, frágiles, complejos de mantener).  
Solo se usan para **validar flujos críticos de la aplicación** que integran múltiples componentes.

### Cuándo escribir tests E2E

✅ **SÍ escribir** para:

- Happy paths de flujos críticos de negocio (registro, login, compra)
- Integraciones entre frontend y backend donde el contrato es vital
- Funcionalidades que, si fallan, rompen la app completamente

❌ **NO escribir** para:

- Validaciones de UI individuales (usar tests unitarios de componentes)
- Lógica de negocio aislada (usar tests unitarios de servicios)
- Edge cases o variaciones (usar tests de integración)
- Features secundarias o experimentales

### Reglas de tests E2E

1. **Mínimos y enfocados**: Mantener < 15 tests E2E totales
2. **Críticos solamente**: Solo flujos que, si fallan, la app es inusable
3. **Sin duplicación**: Si un test unitario lo cubre, NO hacer E2E
4. **Timing explícito**: Usar `timeout` y `waitFor` cuando sea necesario
5. **Mocks controlados**: Todos los endpoints externos deben estar mockeados

### Configuración actual

- **Herramienta**: Playwright
- **Comando**: `pnpm test:e2e`
- **Ubicación**: `/e2e/`
- **Auto-start**: Los servidores (API + Web) se levantan automáticamente con `concurrently`

**Ver configuración**: `playwright.config.ts`

---

## Arquitectura global (obligatoria)

- Organización por **features**
- Capas permitidas (backend):
  - domain
  - application
  - infrastructure
  - web
- Dependencias solo hacia dentro
- Prohibido importar internals de otros módulos

---

## API REST (patrón a seguir a partir de ahora)

**Decisión:** Adoptamos el patrón REST feature-first del ejemplo compartido (routers por módulo, capas claras y wiring centralizado).

**Estado:** En transición. La API aún no cumple el 100% del patrón, pero todos los cambios nuevos deben moverse en esa dirección y no introducir nuevos desvíos.

**Guía base:** Ver ADR correspondiente en `docs/003-rest-api-feature-first.md`.

---

## Compartidos (backend)

- `core`: solo value objects compartidos y estables
- `shared`: utilidades técnicas (errors, middleware, config)
- **Nunca** lógica de negocio en `shared`

---

## Frontend — Arquitectura (contrato)

⚠️ El código existente puede no cumplir aún esta estructura.  
⚠️ Todo código nuevo **DEBE** seguir estas reglas.  
⚠️ Los principios generales del proyecto aplican también al frontend.

### Estructura base (frontend)

```txt
apps/web/src/
├─ app-shell/   # excepción aprobada: composición transversal de UI/routing
├─ context/
├─ features/
├─ infrastructure/
├─ providers/
└─ shared/
```

### Excepción aprobada: `app-shell/` (composición)

Se aprueba explícitamente `apps/web/src/app-shell/` como **capa de composición**
transversal (routing UI, wiring entre features, shell de navegación), con estas
restricciones obligatorias:

- `app-shell/` **no** contiene lógica de negocio de feature.
- `app-shell/` puede componer features visibles en pantalla.
- Transformaciones DTO → dominio deben vivir en `features/*/services/adapters/`.
- `features/*` no deben depender de internals de `app-shell/` salvo fallback
  de compatibilidad temporal documentado en la migración.
- Si hay conflicto entre regla feature-first y composición transversal,
  prevalece esta excepción para `app-shell/`.

### Dentro de cada feature

```text
features/<feature>/
├─ components/
├─ services/
│ └─ adapters/
└─ index.ts
```

---

## Responsabilidades estrictas (frontend)

### context/

- Estado global transversal de UI (cart, toast, modals…)
- Sin `fetch`
- Sin lógica de negocio de features

### `features/<feature>/components/`

- UI pura (presentación)
- Sin `fetch`
- Sin orquestación de casos de uso
- Solo consumen `services/`

### `features/<feature>/services/`

- Orquestación de casos de uso del frontend
- **Aquí sí se permite `fetch`**
- Decide endpoints/parámetros/reintentos
- Usa adapters para transformar datos externos
- No contiene componentes UI

### `features/<feature>/services/adapters/`

- Transformación de datos externos (DTO) → dominio del frontend
- Normalización de estructuras/formatos
- Funciones puras y testeables
- **Nunca** realiza `fetch`
- No importa React, no accede a window, no depende de UI

### shared/

- Código reutilizable y puro
- Sin `fetch`
- Sin estado global
- Sin conocimiento de features concretas
- Si algo es específico de una feature, no va en shared

### providers/ e infrastructure/

- `providers/`: composición de providers (AppProviders)
- `infrastructure/`: infra transversal (ej. sentry, boundaries)
- No lógica de negocio de features

---

## Reglas de dependencias (frontend)

🚫 Prohibido:

- `components/` → usar `fetch` o llamar a endpoints
- `components/` → importar desde `services/adapters/` directamente
- `shared/` → usar `fetch` o depender de features
- `features/*` → importar otra feature (solo vía `shared/` o `context/` cuando aplique)

✅ Permitido (excepción aprobada):

- `app-shell/*` → componer features para navegación/renderizado de pantallas
- `App.tsx` → usar `@src/app-shell/AppShell`

---

## Convenciones de nombres (frontend)

- Carpetas: **kebab-case**
- Archivos:
  - Componentes React: **PascalCase.tsx**
  - Hooks React: **useX.ts**
  - Clases (services, adapters, strategies): **PascalCase.ts**
  - Utilidades / funciones puras: **camelCase.ts**
- Tipos e interfaces: **PascalCase**
- Constantes: **UPPER_SNAKE_CASE**

---

## Backend

- Validar variables de entorno al arrancar la API (fail fast).
- Validar inputs de endpoints con Zod.
- Autorización explícita por lista/recurso
- Manejo de errores centralizado
- Integraciones externas siempre detrás de interfaces
- Persistencia por defecto **in-memory** (sin DB).
- Se permiten implementaciones **in-memory** o **Postgres**; documentar el modo usado y su wiring.

---

## Integraciones externas (Mercadona)

- Nunca llamar desde el frontend
- Acceso solo mediante provider en backend
- Usar cache y fallback
- El sistema debe seguir funcionando si el provider falla

---

## Qué NO hacer

- No microservicios
- No GraphQL
- No CQRS / Event Sourcing
- No lógica de negocio en `shared`
- No código sin tests
- No mover código existente “por limpieza” sin necesidad

---

## Documentación de features

- Para cada feature nueva, crear un `.md` conciso
- Features web → `/docs/features/web`
- Features api → `/docs/features/api`
- Documentar:
  - objetivo
  - endpoints (si aplica)
  - reglas importantes
  - notas de implementación

---

## Cuando haya dudas

- Detener implementación
- Pedir aclaración
- Elegir siempre la opción más simple

---

## Skills de proyecto

- `skills/shopping-list-architecture/SKILL.md` — Reglas transversales del repo para arquitectura, TDD, deuda técnica, refactors y sprint técnico.
- `skills/auth-session-flow/SKILL.md` — Reglas cross-app para auth, sesión, refresh token, retry 401, cookies, logout y autorización por recurso.
- `skills/shopping-list-domain/SKILL.md` — Reglas de dominio para listas, estados `draft/active/completed`, autosave, edición, completar y reutilizar.
- `skills/external-provider-mercadona/SKILL.md` — Reglas para integración backend-only con Mercadona, providers externos, cache, fallback y adapters.
- `skills/deployment-environments/SKILL.md` — Reglas para Render, Vercel, Neon, env vars, CORS y comandos de despliegue.
- `skills/android-release-safety/SKILL.md` — Reglas de seguridad para flavors, BuildConfig, variantes release, APK/AAB y publicación Android.
- `skills/react-web/SKILL.md` — Reglas operativas para cambios en `apps/web` (React/Vite/Vitest) con TDD y límites de arquitectura frontend.
- `skills/express-api/SKILL.md` — Reglas operativas para cambios en `apps/api` (Express/TypeScript) con capas backend, Zod, autorización y TDD.
- `skills/android-kotlin/SKILL.md` — Reglas operativas para cambios en `apps/mobile-android` (Kotlin/Gradle/red/auth) con foco en seguridad de release y separación por capas.
