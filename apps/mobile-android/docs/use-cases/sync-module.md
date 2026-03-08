# Sync module (post-login warm-up)

## Objetivo

Mover la orquestación de warm-up fuera de `feature/auth` para que autenticación solo maneje sesión/credenciales.

## Reglas importantes

- El trigger de sync se ejecuta en el límite de app/sesión (`AppSessionSyncObserver`).
- `feature/auth` no importa internals de `lists`, `listdetail` ni `sync`.
- `feature/sync` puede observar estado de sesión, pero no altera reglas del dominio de auth.

## Flujo actual (equivalente a iteración 1)

1. Sesión autenticada → `SyncCoordinator.startForAuthenticatedSession()`.
2. `ListsWarmupService` hidrata Room en background (no bloquea UI).
3. Cierre de sesión o sesión inválida → `SyncCoordinator.cancel()`.

## Componentes

- `SyncCoordinator`: puerto estable de arranque/cancelación.
- `ListsWarmupService`: orquestación de warm-up por listas.
- `RefreshDecisionPolicy`: decisión pura (`FETCH_MISSING`, `SKIP_EQUAL`, `REFRESH_REMOTE_NEWER`).
