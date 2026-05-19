# Web (`@app/web`)

Frontend React + TypeScript + Vite para Shopping List.

Sigue arquitectura por features y reglas estrictas de separación entre UI y servicios.

---

## Inicio rápido

Desde la raíz del repo:

```bash
pnpm -C apps/web dev
```

Build de producción:

```bash
pnpm -C apps/web build
```

Preview local del build:

```bash
pnpm -C apps/web preview
```

---

## Scripts principales

```bash
pnpm -C apps/web dev
pnpm -C apps/web lint
pnpm -C apps/web typecheck
pnpm -C apps/web test
pnpm -C apps/web test:run
pnpm -C apps/web test:coverage
pnpm -C apps/web quality
pnpm -C apps/web verify
```

---

## Testing y cobertura

Estrategia del proyecto: **100/80/0**

- **CORE (100%)**: lógica crítica (services/adapters/context/shared utils críticas)
- **IMPORTANT (80%)**: componentes/flujo visible de features
- **INFRASTRUCTURE (0%)**: wiring/config sin obligación de tests

Comando útil:

```bash
pnpm -C apps/web test:coverage
```

---

## Reglas de arquitectura frontend (resumen)

Estructura base:

```txt
src/
├─ app-shell/
├─ context/
├─ features/
├─ infrastructure/
├─ providers/
└─ shared/
```

Reglas críticas:

- `features/*/components`: UI pura, sin `fetch`.
- `features/*/services`: orquestación y llamadas HTTP.
- `features/*/services/adapters`: DTO -> dominio frontend (funciones puras).
- `shared`: reutilizable y puro, sin `fetch` ni acoplamiento a features.
- Textos UI centralizados en `UI_TEXT`.

Referencia completa de normas: `AGENTS.md` (raíz).

---

## Variables de entorno

La web funciona en local sin configurar variables obligatorias.

Si querés habilitar Sentry en desarrollo, copiá el ejemplo:

```bash
cp .env.example .env
```

Variables disponibles:

- `VITE_SENTRY_DSN` (opcional; vacío = Sentry deshabilitado)
- `VITE_SENTRY_RELEASE` (opcional; etiqueta de release)

---

## Versionado y releases

- Versión inicial estable: `1.0.0`
- Versión actual del release: `1.2.2`
- SemVer independiente por app (web/api/android)
- Cambios de versión gestionados por Changesets desde la raíz del repo

### Notas de release (resumen)

- La UI de listas ahora mantiene agrupación por categorías L1 (`categorySnapshot`) en `DRAFT`, `ACTIVE` y `COMPLETED`.
- `subcategorySnapshot` se conserva como metadata y no cambia la regla de agrupación.
- El flujo de autosave y add-from-catalog queda alineado con snapshots persistidos por backend.

Guía completa:

- `docs/versioning-and-releases.md`
