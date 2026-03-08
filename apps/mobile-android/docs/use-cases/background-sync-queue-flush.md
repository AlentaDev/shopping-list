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
- Auth solo conoce `SyncCoordinator` (start/cancel), sin imports de internals sync/listdetail.

## Secuencia final de sincronización (post-flush consistency)

Al iniciar sesión autenticada, la secuencia de `SyncCoordinator` es:

1. **Flush de cola pendiente** (`flushPendingSync`).
2. **Verificación de pendientes restantes** (`hasPendingSyncOperations`).
3. Si todavía hay pendientes:
   - **No ejecutar refresh remoto→local** para evitar overwrite inseguro.
   - El estado local se mantiene y se reintentará en el siguiente ciclo.
4. Si no quedan pendientes:
   - Ejecutar warm-up (`ListsWarmupService`) con política de refresh.
   - Hacer refresh remoto→local solo cuando es seguro.

Con esto, el refresh nunca pisa cambios locales aún no sincronizados.

## Notas de implementación

- Interfaz: `SyncQueueProcessor`.
- Implementación: `SyncQueueProcessorImpl`.
- Política de reintento: `SyncBackoffPolicy` + `ExponentialSyncBackoffPolicy`.
- Detección de cambios remotos en detalle: `DetectRemoteChangesUseCase`, comparando
  `updatedAt` local vs remoto (ISO-8601).
