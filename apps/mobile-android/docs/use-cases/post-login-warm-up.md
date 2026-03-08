# Post-login warm-up (Android)

## Objetivo

Hidratar caché local de Room en segundo plano justo después del login exitoso,
sin bloquear navegación ni render inicial de pantallas de listas/detalle.

## Reglas importantes

- El warm-up inicia **después del login**.
- El proceso es **no bloqueante** (background).
- Se refrescan primero los **resúmenes de listas activas**.
- Solo se hidratan detalles faltantes en Room (`missing details`).
- Si falla un detalle individual, el warm-up continúa con el resto.
- El warm-up se cancela en `logout` y cuando la sesión se invalida.

## Notas de implementación

- Orquestación central: `SessionWarmUpOrchestrator`.
- Caso de uso principal: `WarmUpListsCacheUseCase`.
- Listas y detalle en UI quedan en modo **Room-first** para render inicial.
