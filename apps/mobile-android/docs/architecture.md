# Arquitectura móvil (Android)

## Objetivo

Mantener una app móvil **robusta y simple**, alineada con la arquitectura del
proyecto y preparada para crecer sin complejidad innecesaria.

## Estructura por features

Se usa una organización por **feature** y **Clean Architecture + MVVM**.
Ejemplo de estructura:

```
com.alentadev.shopping
├─ core/                 # utilidades puras
├─ feature/health/
│  ├─ ui/
│  ├─ domain/
│  └─ data/
│     ├─ remote/
│     └─ local/
├─ shared/ui/            # componentes UI reutilizables
└─ app/                  # wiring (DI, navegación)
```

## Dependencias

- `ui/` → `domain/` → `data/`.
- `domain/` no depende de Android framework.
- `data/` encapsula red y almacenamiento local.

## Offline-first

- Las listas activas se guardan en **snapshot local**.
- Los checks de compra se permiten **sin red**.
- Se usa **merge con confirmación** al recuperar conexión.

## Snapshot local (mínimo viable)

Campos mínimos:
- Lista: `id`, `name`.
- Productos: `id`, `name`, `price`, `quantity`, `photoUrl`.
- Estado local: `checked`.
- Información extra según responda la API (si es necesaria en UI).

## Reconciliación al volver la red (merge)

- Si la lista cambió en backend, se muestra **aviso**.
- Si un producto fue eliminado en backend:
  - Se elimina localmente y se **notifica**.
- No se hace refresh silencioso sin aviso.

## Reintentos de red

- 2 reintentos con backoff (1s, 3s).
- Luego se muestra aviso con opción **Reintentar**.
- UX mixto:
  - Si hay snapshot: banner/snackbar no intrusivo.
  - Si no hay snapshot: pantalla completa con botón.

## Auth y cookies

- Login con email/password.
- Cookies HttpOnly: access 15 min / refresh 7 días.
- Ante 401: refresh automático y reintento de la request.
- Si refresh falla: logout automático.

## Logout

- Logout manual.
- Limpia sesión y **borra datos locales** (snapshots y checks).

## UI y textos

- Textos en `strings.xml`.
- Mensajes iniciales definidos en la documentación de casos de uso.


## Sync post-login (módulo dedicado)

- El warm-up de listas vive en `feature/sync/`.
- `feature/auth` se limita a autenticación/sesión y no orquesta warm-up.
- El trigger ocurre en límite de app/sesión (`AppSessionSyncObserver`).
- Componentes estables:
  - `SyncCoordinator` (arranque/cancelación)
  - `ListsWarmupService` (orquestación)
  - `RefreshDecisionPolicy` (decisión pura)
- Al cerrar sesión o invalidarse, el warm-up en curso se cancela.

## Startup routing (single source of truth)

- El entry routing de la app vive en `ui/navigation/SessionGateViewModel`.
- Usa `ObserveSessionUseCase` para sesión persistida y `GetCurrentUserUseCase` para validación remota cuando hay conectividad.
- Máquina de estados de bootstrap:
  - `Unknown`
  - `Checking`
  - `Authenticated`
  - `Unauthenticated`
  - `OfflineRecoverable`
- `AppNavHost` arranca en `bootstrap`; enruta a listas activas (`Authenticated`) o a login (`Unauthenticated` y `OfflineRecoverable`, con modo recuperable en este último caso).
