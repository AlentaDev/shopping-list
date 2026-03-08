# Background sync queue flush (Android)

## Objetivo

Procesar en segundo plano las operaciones pendientes de sincronización
(`pending_sync`) para mantener consistencia entre estado local y backend.

## Reglas importantes

- El procesamiento lo hace `SyncQueueProcessor` en capa `feature/sync/application`.
- Lectura de cola en orden `localUpdatedAt ASC` (FIFO-like).
- Por cada operación pendiente:
  - PATCH remoto exitoso → eliminar operación local.
  - Error transitorio → incrementar `retryCount` y aplicar backoff exponencial.
  - Error permanente (HTTP 403/404) → marcar `failed_permanent`.
- El coordinador de sync solo dispara warm-up + flush de cola en background al iniciar sesión.
- Auth solo conoce `SyncCoordinator` (start/cancel), sin imports de internals sync/listdetail.

## Notas de implementación

- Interfaz: `SyncQueueProcessor`.
- Implementación: `SyncQueueProcessorImpl`.
- Política de reintento: `SyncBackoffPolicy` + `ExponentialSyncBackoffPolicy`.
