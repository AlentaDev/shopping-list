# Shopping List — Monorepo

Aplicación multiplataforma para gestionar listas de compra, construida como **monolito modular** con foco en calidad de código, TDD y evolución incremental.

Este repositorio integra web, API y Android bajo un mismo flujo de desarrollo y versionado.

---

## 1) Descripción general

Shopping List resuelve la gestión de listas de compra en escenarios reales:

- creación y gestión de listas desde web,
- consumo operativo desde Android en contexto de supermercado,
- sincronización mediante API REST con reglas de dominio compartidas.

El proyecto sigue arquitectura **feature-first**, separación de responsabilidades por capas y validaciones explícitas en backend.

---

## 2) Stack tecnológico

### Web (`apps/web`)

- React + TypeScript
- Vite
- Vitest (unit/integration)
- Playwright (E2E críticos a nivel repo)

### API (`apps/api`)

- Node.js + Express + TypeScript (strict)
- Zod para validación de inputs
- PostgreSQL por defecto en runtime normal
- Persistencia in-memory disponible con `DB_PROVIDER=inmemory`

### Android (`apps/mobile-android`)

- Kotlin
- Clean Architecture + MVVM
- Persistencia local (Room) para soporte de trabajo offline

### Tooling transversal

- pnpm workspaces
- Husky
- Changesets (versionado por app)
- Sentry (observabilidad en web, API y Android)

---

## 3) Instalación y ejecución

### Requisitos

- Node.js 20+
- pnpm
- Docker (para PostgreSQL local)

### Puesta en marcha (raíz)

1. Instalar dependencias:

```bash
pnpm install
```

2. Configurar variables de entorno de la API:

```bash
cp apps/api/.env.example apps/api/.env
```

3. Levantar base de datos local:

```bash
docker compose up -d
```

4. Ejecutar migraciones (recomendado):

```bash
pnpm -C apps/api database:migrate
```

5. Levantar aplicaciones en paralelo:

```bash
pnpm dev
```

### Scripts de uso frecuente

```bash
pnpm lint
pnpm test
pnpm quality
pnpm verify
```

### E2E del repositorio

```bash
pnpm test:e2e
```

> Nota: los E2E requieren PostgreSQL levantado porque preparan la DB de test en modo `postgres`.

---

## 4) Estructuración del proyecto

```txt
apps/
├─ web/               # Frontend React
├─ api/               # Backend Express
└─ mobile-android/    # Aplicación Android

docs/                 # ADRs, features y guías operativas
e2e/                  # Tests End-to-End de flujos críticos
scripts/              # Scripts de versionado y release
```

### Criterios de arquitectura

- Organización por features.
- Dependencias orientadas hacia adentro.
- Límites claros entre UI, servicios y adapters.
- Integraciones externas encapsuladas en backend.
- TDD como práctica obligatoria del proyecto.

Referencias clave:

- `AGENTS.md`
- `docs/003-rest-api-feature-first.md`

---

## 5) Funcionalidades cubiertas

Según el estado actual documentado en código y docs del repo, el sistema cubre:

- autenticación de usuarios,
- gestión de listas de compra,
- flujos de catálogo y carga de ítems a listas,
- agrupación de listas por categoría L1 (`categorySnapshot`) en estados `DRAFT`, `ACTIVE` y `COMPLETED`,
- persistencia de snapshots (`categorySnapshot` y `subcategorySnapshot`) en operaciones clave,
- lock de edición cross-platform al completar listas (`409 list_editing_locked`),
- operación móvil orientada a uso offline con sincronización posterior.

Además:

- el catálogo actual está centrado en productos de Mercadona,
- la APK Android beta se descarga desde la web en la ruta `/app`.

Para detalle por módulo:

- Web: `docs/features/web/`
- API: `docs/features/api/`
- Android: `apps/mobile-android/docs/use-cases/`

---

## 6) Despliegue (producción) y comportamiento esperado

### Entorno de despliegue

- **Web**: Vercel
- **API**: Render
- **Base de datos**: PostgreSQL gestionado (Neon)

### Guardrails de push y CI/CD

- Hay **guardrails/checks en GitHub Actions** para controlar PR y versionado.
- Web y API se despliegan de forma automática tras integración en `main`.
- Android es **semi-manual**: tiene guardrails de CI para versionado/tag, pero el build/firma/publicación final sigue siendo manual.

Referencias:

- `.github/workflows/versioning-pr-check.yml`
- `.github/workflows/versioning-release.yml`

Notas técnicas visibles en el repo:

- `apps/web/vercel.json` reescribe `/api/*` hacia `https://api-shopping-list.onrender.com/api/*`.
- `apps/mobile-android/README.md` y docs mobile apuntan el flavor `prod` a `https://api-shopping-list.onrender.com`.

### Importante sobre Render (plan free)

En plan free, Render puede “dormir” el servicio por inactividad.
Cuando se abre la web tras un tiempo sin uso, el catálogo puede tardar en aparecer
mientras la API despierta (aprox. 1 minuto, según carga del servicio).

Esto es esperado en este entorno y no implica un error funcional de la aplicación.

### Descarga de Android desde web

La app Android se descarga directamente desde la web, entrando en `/app`,
donde se publica el enlace a la APK beta actual.

Referencia: `docs/features/web/android-beta-download.md`.

---

## 7) Versionado y releases

El repositorio utiliza **SemVer independiente por app** (web/api/android) con Changesets y automatización de tags.

Nota Android: el pipeline sincroniza versión y tags, pero el build/publicación final es manual por seguridad de firma y distribución.

Comandos principales:

```bash
pnpm changeset
pnpm version:packages
pnpm version:android:sync
pnpm release:tag
```

Guía completa:

- `docs/versioning-and-releases.md`

---

## 8) Documentación relacionada

- README Web: `apps/web/README.md`
- README API: `apps/api/README.md`
- README Android: `apps/mobile-android/README.md`
- ADRs y diseño: `docs/`
