# Web (`@app/web`)

Frontend React + TypeScript + Vite para Shopping List.

Sigue arquitectura por features y reglas estrictas de separación entre UI y servicios.

---

## Quick start

Desde la raíz del repo:

```bash
pnpm -C apps/web dev
```

Build producción:

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

Actualmente la web puede funcionar sin `.env` propio en local.

Si se agregan nuevas variables, se documentan en este README y en `docs/`.

---

## Versionado y releases

- Versión inicial estable: `1.0.0`
- SemVer independiente por app (web/api/android)
- Cambios de versión gestionados por Changesets desde la raíz del repo

Guía completa:

- `docs/versioning-and-releases.md`
