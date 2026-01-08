# Plan de migración incremental para frontend (apps/web)

## Resumen de arquitectura objetivo

El frontend debe seguir una arquitectura por **features** con límites claros:

```
apps/web/src/
├─ context/
├─ features/
├─ infrastructure/
├─ providers/
└─ shared/
```

Cada feature debe contener:

```
features/<feature>/
├─ components/
├─ services/
│ └─ adapters/
└─ index.ts
```

Reglas clave: componentes sin `fetch`, orquestación y llamadas a API en `services/`, transformaciones en `services/adapters/`, y `shared/` sin lógica de negocio ni dependencias de features.

## Violaciones actuales (por regla)

### 1) Componentes con `fetch` o lógica de orquestación
- **Ejemplo:** `apps/web/src/App.tsx` contiene llamadas `fetch` y lógica de carga/errores.  
  **Por qué importa:** rompe el límite `components/` ⇢ `services/`, dificultando testeo y evolución.

### 2) Estructura de feature incompleta (sin `components/` y `services/`)
- **Ejemplo:** `apps/web/src/features/catalog/CategoriesPanel.tsx` vive en la raíz de la feature, no en `components/`.  
  **Por qué importa:** impide separar UI de orquestación y estandarizar imports.

### 3) Código de feature fuera de `features/`
- **Ejemplo:** `apps/web/src/App.tsx` concentra UI y lógica del catálogo en el root.  
  **Por qué importa:** desvía la organización por features y mezcla responsabilidades.

### 4) Estructura base incompleta (faltan carpetas)
- **Ejemplo:** no existen `apps/web/src/context`, `apps/web/src/infrastructure`, `apps/web/src/providers`.  
  **Por qué importa:** dificulta aplicar el contrato de arquitectura y ubicar responsabilidades futuras.

### 5) Convenciones de nombres y ubicación
- **Ejemplo:** `apps/web/src/features/catalog/types.ts` está en raíz de la feature.  
  **Por qué importa:** las convenciones y la ubicación consistente facilitan navegación y refactors pequeños.

## Plan incremental (pasos pequeños y reversibles)

> Prioridad: 1) límites (no fetch en components), 2) skeleton de carpetas, 3) migrar feature a feature, 4) renombres al final.

### Paso 1 — Crear skeleton de carpetas base
- **Objetivo:** dejar preparada la estructura obligatoria sin tocar comportamiento.
- **Operaciones:**
  - Crear carpetas vacías:
    - `apps/web/src/context/`
    - `apps/web/src/infrastructure/`
    - `apps/web/src/providers/`
- **Tests/commands:** `pnpm --filter web test` (si ya existe) o `pnpm --filter web lint`.
- **Resultado esperado:** estructura base presente; sin cambios funcionales.

### Paso 2 — Crear skeleton de la feature catalog
- **Objetivo:** alinear la estructura interna de `catalog`.
- **Operaciones:**
  - Crear carpetas:
    - `apps/web/src/features/catalog/components/`
    - `apps/web/src/features/catalog/services/`
    - `apps/web/src/features/catalog/services/adapters/`
  - Crear `apps/web/src/features/catalog/index.ts` con re-exports iniciales.
- **Tests/commands:** `pnpm --filter web test`.
- **Resultado esperado:** estructura lista para migración, sin cambios de comportamiento.

### Paso 3 — Mover componente de UI a components/
- **Objetivo:** separar la UI del resto de la feature.
- **Operaciones:**
  - Mover archivo:
    - `apps/web/src/features/catalog/CategoriesPanel.tsx` → `apps/web/src/features/catalog/components/CategoriesPanel.tsx`
  - Ajustar imports desde el nuevo path y mantener re-export en `features/catalog/index.ts`.
- **Tests/commands:** `pnpm --filter web test`.
- **Resultado esperado:** mismo comportamiento, imports estables vía `index.ts`.

### Paso 4 — Introducir servicio de catálogo (sin cambiar UI)
- **Objetivo:** trasladar la orquestación a `services/`.
- **Operaciones:**
  - Crear `apps/web/src/features/catalog/services/CatalogService.ts` con funciones de carga (sin tocar UI aún).
  - (Opcional) crear types específicos de servicio en `services/` si es necesario.
- **Tests/commands:** `pnpm --filter web test`.
- **Resultado esperado:** servicio disponible, sin integración en componentes todavía.

### Paso 5 — Extraer adaptadores de respuesta API
- **Objetivo:** separar transformación DTO → dominio frontend.
- **Operaciones:**
  - Crear `apps/web/src/features/catalog/services/adapters/` con funciones puras para mapear respuestas de `GET /api/catalog/categories` y `GET /api/catalog/categories/:id`.
  - Actualizar `CatalogService` para usar los adapters.
- **Tests/commands:** `pnpm --filter web test`.
- **Resultado esperado:** transformaciones puras aisladas y testeables.

### Paso 6 — Mover lógica de fetch fuera de App.tsx
- **Objetivo:** eliminar `fetch` en componentes.
- **Operaciones:**
  - Actualizar `apps/web/src/App.tsx` para consumir `CatalogService` en lugar de `fetch` directo.
  - Mantener la UI y estados; solo cambia la fuente de datos.
- **Tests/commands:** `pnpm --filter web test`.
- **Resultado esperado:** `App.tsx` sin llamadas `fetch`; comportamiento igual.

### Paso 7 — Encapsular lógica de estado en hook de feature
- **Objetivo:** mantener App simple y mover lógica a la feature.
- **Operaciones:**
  - Crear `apps/web/src/features/catalog/services/useCatalog.ts` (hook) para manejar estado, loadCategories, loadItems.
  - `App.tsx` usa el hook en vez de manejar estado propio.
- **Tests/commands:** `pnpm --filter web test`.
- **Resultado esperado:** responsabilidades de catálogo concentradas en la feature.

### Paso 8 — Reubicar tipos a lugar consistente
- **Objetivo:** alinear tipos con la estructura de la feature.
- **Operaciones:**
  - Mover `apps/web/src/features/catalog/types.ts` a `apps/web/src/features/catalog/services/` o `shared/` según uso.
  - Mantener compatibilidad con re-exports en `features/catalog/index.ts`.
- **Tests/commands:** `pnpm --filter web test`.
- **Resultado esperado:** tipado consistente con la capa correspondiente.

### Paso 9 — Preparar providers/context si aparece estado global
- **Objetivo:** evitar lógica transversal en App.
- **Operaciones:**
  - Crear `apps/web/src/providers/AppProviders.tsx` y un `index.ts` (sin usar aún) si se necesita un punto único de providers.
  - Mantener cambios mínimos (solo estructura).
- **Tests/commands:** `pnpm --filter web test`.
- **Resultado esperado:** base lista para futuros providers sin modificar comportamiento.

### Paso 10 — Renombres de convenciones (solo si es necesario)
- **Objetivo:** ajustar nombres que bloqueen la arquitectura.
- **Operaciones:**
  - Revisar y renombrar **de uno en uno** archivos que incumplan (ej. mover utilidades a `camelCase.ts` si aparecen).
  - Actualizar imports y re-exports.
- **Tests/commands:** `pnpm --filter web test`.
- **Resultado esperado:** convención de nombres alineada sin cambios funcionales.

