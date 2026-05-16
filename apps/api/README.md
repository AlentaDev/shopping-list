# API (`@app/api`)

Backend Express + TypeScript del monorepo Shopping List.

Esta API sigue arquitectura de monolito modular (feature-first) y usa validación con Zod.

---

## Inicio rápido

1. Crear env local

```bash
cp .env.example .env
```

2. Levantar Postgres (desde raíz del repo)

```bash
docker compose up -d
```

3. Correr migraciones

```bash
pnpm database:migrate
```

4. Levantar API

```bash
pnpm dev
```

---

## Persistencia (importante)

Comportamiento actual en runtime:

- Default fuera de test: **Postgres**
- Default en tests: **in-memory**
- Override manual posible:

```bash
DB_PROVIDER=inmemory pnpm dev
```

---

## Scripts principales

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm typecheck
pnpm test
pnpm quality
pnpm verify
```

DB:

```bash
pnpm database:migrate
pnpm database:reset
pnpm database:test:prepare
```

---

## Testing

- Unit/integration: `pnpm test`
- Calidad completa API: `pnpm quality`
- Verificación API + build: `pnpm verify`

### E2E del repo

Los E2E se lanzan desde la raíz (`pnpm test:e2e`) y **requieren Postgres**,
porque preparan DB de test con `DB_PROVIDER=postgres`.

---

## Variables de entorno

Base mínima (`.env.example`):

- `PORT`
- `CORS_ORIGIN`
- `ALLOWED_ORIGINS`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_SSL`

Opcional explícita:

- `DB_PROVIDER=postgres|inmemory`

---

## Estructura de alto nivel

```txt
src/
├─ modules/        # Features backend
├─ core/           # Value objects compartidos
├─ shared/         # Utilidades técnicas transversales
├─ app/            # Wiring de app (incluye persistencia)
└─ infrastructure/ # Conexiones y adaptadores técnicos
```

Regla clave: no importar internals de otros módulos.

---

## Notas de release (resumen)

- Versión planeada del release actual: `1.1.0`.
- Se persisten `categorySnapshot` y `subcategorySnapshot` en autosave y en `POST /api/lists/:id/items/from-catalog`.
- Se refuerza agrupación por categoría L1 para `DRAFT`, `ACTIVE` y `COMPLETED` (usando `categorySnapshot` como eje; subcategoría como metadata).
- `POST /api/lists/:id/complete` devuelve `409` con error `list_editing_locked` si la lista `ACTIVE` está en edición web (`isEditing=true`).
- Migración incluida en este corte: SQL `009`.
