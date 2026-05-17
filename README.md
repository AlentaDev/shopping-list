# Shopping List Monorepo

Monorepo de **Shopping List** con arquitectura de **monolito modular**.

Objetivo: construir producto real con foco en **claridad**, **TDD** y **cambios pequeños**.

---

## Inicio rápido

1. Instalar dependencias

```bash
pnpm install
```

2. Configurar entorno API

- Copiar `apps/api/.env.example` -> `apps/api/.env`
- Completar variables mínimas (`PORT`, `CORS_ORIGIN`)

3. Levantar Postgres (obligatorio por defecto)

```bash
docker compose up -d
```

4. (Opcional recomendado) ejecutar migraciones

```bash
pnpm -C apps/api database:migrate
```

5. Levantar web + api

```bash
pnpm dev
```

6. Verificar calidad

```bash
pnpm quality
pnpm test
```

---

## Estructura del repo

```txt
apps/
├─ web/               # Frontend React + Vite
├─ api/               # Backend Express + TypeScript
└─ mobile-android/    # Android app (Kotlin)

docs/                 # Documentación de arquitectura, features y releases
```

---

## Arquitectura y reglas clave

- Monolito modular, organización por **features**.
- Dependencias hacia adentro, sin importar internals entre módulos.
- **TDD obligatorio**: test primero, implementación mínima, refactor después.
- Frontend y backend con límites de responsabilidades estrictos (ver `AGENTS.md`).
- Integraciones externas encapsuladas en backend.

Si querés contexto completo de decisiones, empezá por:

- `AGENTS.md`
- `docs/003-rest-api-feature-first.md`

---

## Workspaces

### Web (`apps/web`)

- React + TypeScript + Vite
- Tests con Vitest (+ Playwright para E2E críticos)

> README específico: `apps/web/README.md`

### API (`apps/api`)

- Express + TypeScript (`strict`)
- Zod para validación
- Persistencia **PostgreSQL por defecto** en runtime normal
- Modo in-memory disponible solo con `DB_PROVIDER=inmemory`

> README específico: `apps/api/README.md` 

### Android (`apps/mobile-android`)

- Kotlin
- Arquitectura Clean + MVVM
- Publicación manual (firma y subida)

> README específico: `apps/mobile-android/README.md`

---

## Versionado y releases

Se usa **SemVer independiente por app**:

- `web` -> `1.0.0`
- `api` -> `1.0.0`
- `android` -> `0.9.0`

Versión actual:

- `web` -> `1.2.1`
- `api` -> `1.2.1`
- `android` -> `0.10.0`

### Puntos destacados del release

- Agrupación por categorías L1 (`categorySnapshot`) en listas `DRAFT`, `ACTIVE` y `COMPLETED`.
- Persistencia de snapshots `categorySnapshot`/`subcategorySnapshot` en autosave y alta desde catálogo.
- Lock de edición cross-platform: al completar desde Android, si la edición web está activa, la API responde `409 list_editing_locked`.
- Migraciones relevantes incluidas en el corte: API SQL `009` y Android Room `v5 -> v6`.

Automatización actual:

- PR check exige changeset cuando hay cambios en apps.
- En `main` se aplican bumps y tags por app.
- Android mantiene publish manual (firma/subida).

Guía completa:

- `docs/versioning-and-releases.md`

---

## Scripts útiles (raíz)

```bash
pnpm dev
pnpm lint
pnpm test
pnpm quality
pnpm verify

pnpm changeset
pnpm version:packages
pnpm version:android:sync
pnpm release:tag
```

---

## E2E y base de datos

Los tests E2E del repo **requieren Postgres**.

- El script raíz `pnpm test:e2e` ejecuta primero `apps/api database:test:prepare`.
- Ese paso está configurado con `DB_PROVIDER=postgres`.

Antes de correr E2E, levantá la DB:

```bash
docker compose up -d
```

---

## Estado actual

Web y API están estables en producción.

El foco de evolución principal está en Android (iteración funcional + release manual seguro).

---

## Nota importante sobre BBDD

Por diseño actual del backend:

- En entorno normal, si no se define `DB_PROVIDER`, la API usa **Postgres**.
- En tests, la API usa **in-memory** por defecto.
- Si querés correr sin Postgres en local, definí explícitamente:

```bash
DB_PROVIDER=inmemory pnpm api
```

---

## Estándar editorial de documentación

Todo documento del repo debe escribirse en castellano.

Excepciones permitidas:

- nombres de archivos y rutas
- identificadores y contratos de código (`categorySnapshot`, `list_editing_locked`, etc.)
- comandos, snippets y términos técnicos en inglés cuando corresponda
