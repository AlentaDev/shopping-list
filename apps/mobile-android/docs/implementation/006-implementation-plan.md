# Plan de Implementación Android (Canónico)

> **Fecha inicial**: 2026-01-31  
> **Última actualización**: 2026-03-22  
> **Documento canónico de roadmap**: este archivo

---

## 1) Estado real tras Session Manager rollout

### ✅ Completado

- **Fundación técnica (Fase 0)**: Room, Hilt, Coil, DataStore, estructura feature-first, testing base.
- **Autenticación (Fase 1)**: login/logout/me, sesión persistida, cookies HttpOnly, refresh en 401, retry de red y ViewModel/UI de login.
- **Listas activas (Fase 2)**: domain + data + UI, snapshot local, fallback offline, refresh manual.
- **Detalle de lista (Fase 3)**: domain + data + UI, check/uncheck local, total reactivo, sync de checks, detección de cambios remotos.
- **Session Manager / Auth gate de arranque**:
  - `SessionGateViewModel` como punto único de decisión de ruta inicial.
  - Estados: `Unknown`, `Checking`, `Authenticated`, `Unauthenticated`, `OfflineRecoverable`.
  - Auto-revalidación al reconectar cuando estaba en `OfflineRecoverable`.

### 🟡 Pendiente

- **Fase 4**: completar lista (`POST /api/lists/{id}/complete`) con confirmación de usuario.
- **Fase 5**: refinamientos de sincronización avanzada y UX de conflictos.
- **Fase 6**: endurecimiento de tests de integración/UI en flujos críticos pendientes.
- **Fase 7**: polish final (UX, rendimiento, documentación de cierre).

---

## 2) Roadmap único (sin duplicados)

## Fase 4 — Completar lista

**Objetivo**: cerrar compra desde detalle sin romper modo offline.

- [ ] Caso de uso `CompleteListUseCase` + tests unitarios.
- [ ] Integración data (`completeList`) + mapeos + manejo de errores 400/401/timeout.
- [ ] UI de confirmación + navegación de retorno a listas activas.
- [ ] Estrategia offline: comportamiento explícito (bloquear con mensaje o encolar) documentado e implementado.

## Fase 5 — Modo recuperable offline y sincronización

**Objetivo**: consolidar política única de reconexión y consistencia.

- [x] Orquestador de auth al inicio con estado `OfflineRecoverable`.
- [x] Reintento automático de autenticación al reconectar desde estado recuperable.
- [x] Preservar sesión local cuando el refresh falla por error recuperable de red.
- [ ] UX de conflictos avanzada (casos límite de merge y mensajes finales).
- [ ] Métricas/logs operativos finales para troubleshooting de sincronización.

## Fase 6 — Calidad enfocada

**Objetivo**: cubrir lo crítico pendiente sin tests redundantes.

- [ ] Tests adicionales de flujos críticos todavía abiertos (principalmente completar lista).
- [ ] Validación final de cobertura por criticidad según política del proyecto.
- [ ] Revisión de resiliencia de red en escenarios inestables.

## Fase 7 — Cierre de producto

**Objetivo**: dejar release candidate documentado y mantenible.

- [ ] Ajustes finales de UX (mensajes, feedback de carga/error).
- [ ] Revisión final de rendimiento percibido en listas y detalle.
- [ ] Actualización final de docs operativas (runbook corto + decisiones).

---

## 3) Políticas funcionales vigentes (alineadas con código)

### Orquestador de auth al inicio

1. Sin sesión local → `Unauthenticated` (login).
2. Con sesión local + sin red → `OfflineRecoverable` (login en modo recuperable).
3. Con sesión local + red → `Checking` y validación remota:
   - éxito → `Authenticated`
   - fallo no recuperable → `Unauthenticated`

### Modo recuperable offline

- Si no hay red pero hay sesión/snapshot local, la app entra en modo recuperable en vez de invalidar sesión inmediatamente.
- La UI debe informar estado recuperable y permitir retry explícito.

### Política de auto-auth al reconectar

- Cuando el estado actual es `OfflineRecoverable` y vuelve la conectividad, se dispara validación automática de sesión (`GetCurrentUserUseCase`).
- Si valida, navega a flujo autenticado.
- Si no valida, mantiene/retorna a login según resultado.

---

## 4) Definición de terminado (100%)

> Checklist único de cierre documental y funcional para Android.

### A. Arquitectura y flujo de sesión
- [x] Orquestador de auth al inicio centralizado en un único punto.
- [x] Estados de bootstrap definidos y usados de forma consistente.
- [x] Política de reconexión automática documentada y aplicada.

### B. Offline-first
- [x] Fallback a snapshot local en listas activas.
- [x] Check/uncheck funcional sin red en detalle.
- [x] Sincronización de checks al recuperar red.
- [x] Detección de cambios remotos con feedback en UI.

### C. Roadmap y documentación
- [x] Un único roadmap canónico (este archivo).
- [x] Documentos solapados convertidos a referencias cortas.
- [x] Arquitectura y casos de uso actualizados para Session Manager.
- [x] Redacción concisa, sin secciones duplicadas ni estados contradictorios.

### D. Trabajo pendiente para 100% funcional
- [ ] Flujo “Completar lista” implementado end-to-end.
- [ ] Refinamientos finales de sync/conflictos cerrados.
- [ ] Cierre completo de calidad/polish (fases 6 y 7).
