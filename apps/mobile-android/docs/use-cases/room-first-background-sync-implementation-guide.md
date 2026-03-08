# Room-first background sync — implementation guide

## Goal and non-goals

### Goal
Implementar un contrato offline-first consistente para listas y detalle:
- render inmediato desde Room,
- refresh en background no bloqueante,
- merge determinista con `updatedAt` estricto,
- cola pendiente prioritaria en reconexión/foreground,
- feedback UX transitorio con Snackbar.

### Non-goals
- No cambiar arquitectura Clean + MVVM.
- No introducir librerías nuevas.
- No mover módulos entre features.
- No agregar E2E para este rollout (alcance: unit tests Android locales).

## Current state snapshot (implemented today)

- **Detalle**: `DetailViewModel` ya carga `preferCache = true` y observa conectividad reactiva. También intenta detectar cambios remotos al recuperar red. (`feature/listdetail/ui/detail/DetailViewModel.kt`)
- **Pantalla detalle**: `ListDetailScreen` usa banner offline por `fromCache`, no por conectividad efectiva; no tiene Snackbar de sync background. (`feature/listdetail/ui/detail/ListDetailScreen.kt`)
- **Detección remota**: `DetectRemoteChangesUseCase` compara `updatedAt` parseando `Instant`, con fallback silencioso a `false` en parse inválido. (`feature/listdetail/domain/usecase/DetectRemoteChangesUseCase.kt`)
- **Sync coordinator**: `SyncCoordinatorImpl` ejecuta flush y luego warmup solo si no quedan pendientes; puede bloquear hidratación si siempre quedan pendientes. (`feature/sync/application/SyncCoordinatorImpl.kt`)
- **Warmup**: `ListsWarmupServiceImpl` aplica `RefreshDecisionPolicy` por lista y decide `FETCH_MISSING/REFRESH_REMOTE_NEWER/SKIP_EQUAL`. (`feature/sync/application/ListsWarmupServiceImpl.kt`)
- **Queue processor**: `SyncQueueProcessorImpl` distingue fallos permanentes (403/404) vs transitorios y aplica retry/backoff. (`feature/sync/application/SyncQueueProcessorImpl.kt`)
- **Room merge de checked**: en persistencia de detalle, `pending_sync` gana para `checked` (`pending checked state wins`). (`core/data/database/dao/RoomDaos.kt` + `feature/listdetail/data/local/ListDetailLocalDataSource.kt`)

## Target architecture and flow diagram

### Login (authenticated session start)
1. `AppSessionSyncObserver` detecta sesión autenticada.
2. `SyncCoordinatorImpl.startForAuthenticatedSession()` ejecuta:
   - flush de pendientes,
   - warmup/hydration de snapshots.
3. Fallo en flush **no** impide warmup (aislamiento de fases).

### Screen entry (lists/detail)
1. ViewModel renderiza Room snapshot inmediatamente.
2. Si conectividad efectiva = `true`, dispara refresh background no bloqueante.
3. Refresh decide por `updatedAt` estricto:
   - `FETCH_MISSING`
   - `REFRESH_REMOTE_NEWER`
   - `SKIP_EQUAL`
4. Durante refresh background se emite evento one-shot para Snackbar.

### Reconnect (authenticated)
1. Evento de reconexión dispara ciclo `flush -> warmup`.
2. Si flush falla parcialmente o quedan pendientes, warmup igual corre.
3. Operaciones por recurso se deduplican (single-flight).

### App foreground (authenticated)
1. Evento foreground dispara ciclo `flush -> warmup`.
2. Mismo aislamiento y deduplicación que en reconnect.

## Invariants (must always hold)

1. La UI no bloquea con fullscreen loading si existe snapshot local.
2. Banner offline solo aparece cuando conectividad efectiva es `false`.
3. Sobrescritura remota solo si `remote.updatedAt > local.updatedAt`.
4. `pending_sync.checked` prevalece al persistir snapshot remoto de detalle.
5. Errores de parseo de timestamps nunca crashean y siguen fallback determinista.
6. Snackbar de sync background es one-shot (sin duplicados por recomposición).
7. `flushPendingQueue` no bloquea permanentemente el warmup.

## Edge cases and explicit expected behavior

1. **Concurrent refresh triggers** (entry + reconnect + foreground):
   - comportamiento: single-flight por recurso, triggers duplicados hacen `dedup hit`.
2. **Conectividad reactiva stale vs actual**:
   - comportamiento: resolver único `resolveConnectivity(flow, current)` y usar `effectiveConnected`.
3. **Timestamps inválidos/no parseables**:
   - comportamiento: decisión `SKIP_EQUAL` defensiva + logging de `parse`.
4. **Pending local vs remote snapshot merge**:
   - comportamiento: checked local pendiente gana para el mismo `itemId`.
5. **Errores permanentes (403/404) en refresh detalle**:
   - comportamiento: política local determinista = mantener snapshot local y marcarlo como `stale` en estado UI (sin borrado automático).
6. **Snackbar one-shot**:
   - comportamiento: mostrar solo una vez por ciclo refresh y auto-dismiss en `finally` (success/failure).
7. **Pending queue no bloquea warmup**:
   - comportamiento: warmup se ejecuta incluso si quedan pendientes tras flush.

## TDD rollout phases + acceptance criteria

### Phase 1 — Connectivity semantics
- Test first: banner offline no se muestra si `effectiveConnected=true` aunque `flow=false`.
- Minimal impl: usar `resolveConnectivity` para señal de offline efectiva en listas/detalle.
- Refactor green.
- **Acceptance**: sin falsos offline banners cuando hay conectividad actual.

### Phase 2 — Snackbar one-shot
- Test first: eventos `show/hide` emitidos una vez por refresh.
- Minimal impl: `SharedFlow<SyncSnackbarEvent>` en ViewModel + `SnackbarHostState` en Compose.
- Refactor green.
- **Acceptance**: Snackbar "Mostrando datos guardados. Actualizando…" aparece durante sync y se cierra al terminar.

### Phase 3 — Background refresh orchestration
- Test first: screen entry con cache + online dispara refresh no bloqueante.
- Minimal impl: `load*` mantiene snapshot y lanza refresh en coroutine independiente.
- Refactor green.
- **Acceptance**: render instantáneo desde Room, refresh en background sin bloquear interacción.

### Phase 4 — Unified updatedAt comparator
- Test first: comparator único para `FETCH_MISSING/REFRESH_REMOTE_NEWER/SKIP_EQUAL` + parse inválido.
- Minimal impl: reutilizar en `DetectRemoteChangesUseCase` y warmup/refresh decisions.
- Refactor green.
- **Acceptance**: política `updatedAt` consistente y estricta en todos los puntos.

### Phase 5 — Dedup single-flight
- Test first: triggers concurrentes no duplican refresh por mismo recurso.
- Minimal impl: guard/map de jobs in-flight por `listId`.
- Refactor green.
- **Acceptance**: deduplicación verificable por tests y logs hit/miss.

### Phase 6 — Pending vs remote merge
- Test first: al persistir remoto, checked pendiente local prevalece.
- Minimal impl: mantener merge policy en datasource local y validar regresión.
- Refactor green.
- **Acceptance**: nunca se pierde interacción local pendiente por snapshot remoto.

### Phase 7 — Reconnect hardening
- Test first: reconnect/foreground ejecuta `flush` y luego `warmup`, aislado.
- Minimal impl: coordinator siempre corre warmup después del flush `runCatching`.
- Refactor green.
- **Acceptance**: hidratación ocurre aunque queden pendientes o flush falle parcialmente.

### Phase 8 — Permanent error stale policy
- Test first: refresh detalle 403/404 mantiene snapshot y marca estado stale.
- Minimal impl: manejar `HttpException(403|404)` con `stale=true` en UI state.
- Refactor green.
- **Acceptance**: política local determinista, sin crash ni borrado implícito.

## Test matrix and regression checklist

### Unit tests (targeted)
- `feature/listdetail/ui/detail/*Test.kt`
  - snackbar one-shot,
  - dedup,
  - stale policy 403/404,
  - no falso offline.
- `feature/lists/ui/list/*Test.kt`
  - room-first + background refresh,
  - banner offline por conectividad efectiva,
  - dedup refresh.
- `feature/sync/application/*Test.kt`
  - reconnect/foreground flush + warmup aislados,
  - queue flush observabilidad/permanent/transient.
- `feature/sync/domain/*Test.kt`
  - comparator/decision policy (`updatedAt`) + parse fallback.

### Regression checklist
- [ ] Lista y detalle muestran datos Room de inmediato.
- [ ] No fullscreen loading si hay cache.
- [ ] Snackbar aparece/auto-dismiss correctamente.
- [ ] Offline banner solo con `effectiveConnected=false`.
- [ ] `updatedAt` estricto evita overwrite por igualdad/older.
- [ ] Reconnect/foreground ejecuta flush y warmup.
- [ ] Merge pending checked mantiene última intención local.

## Observability/logging checklist

Agregar logs estructurados (`key=value`) en:
- [ ] `refresh_started resource=<lists|detail> listId=? trigger=<entry|reconnect|foreground>`
- [ ] `refresh_finished resource=<...> status=<success|failure> durationMs=?`
- [ ] `refresh_decision listId=? decision=<FETCH_MISSING|REFRESH_REMOTE_NEWER|SKIP_EQUAL>`
- [ ] `refresh_dedup listId=? hit=<true|false>`
- [ ] `pending_flush_result status=<success|partial|failed> pendingBefore=? pendingAfter=?`
- [ ] `merge_result listId=? remoteItems=? pendingOverrides=?`
- [ ] `failure_category type=<transient|permanent|parse|connectivity_mismatch> code=?`
- [ ] `diagnostic_detail_empty_while_list_exists listId=? cacheListPresent=? cacheDetailPresent=?`

## Explicit mapping to existing modules/classes

- `feature/listdetail/ui/detail/DetailViewModel.kt`
  - source-of-truth UI state, triggers background refresh, snackbar events, stale marker.
- `feature/listdetail/ui/detail/ListDetailScreen.kt`
  - consume one-shot snackbar events y banner/estado de stale data.
- `feature/listdetail/domain/usecase/DetectRemoteChangesUseCase.kt`
  - reutilizar comparator `updatedAt` + fallback parse determinista.
- `feature/sync/application/SyncCoordinatorImpl.kt`
  - ciclo robusto `flush -> warmup` con aislamiento.
- `feature/sync/application/ListsWarmupServiceImpl.kt`
  - aplicar policy de refresh y logging de decisión por lista.
- `feature/sync/application/SyncQueueProcessorImpl.kt`
  - flush con clasificación de fallos y logs de resultado.
- `core/data/database/dao/RoomDaos.kt`
  - soporte de merge pending (`pending_sync`) y trazabilidad de estado.
