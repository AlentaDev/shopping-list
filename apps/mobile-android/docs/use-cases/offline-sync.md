# Caso de uso: Offline y sincronización

## Objetivo
Permitir operación continua sin red y recuperación automática al reconectar, sin perder consistencia.

## Alcance
- Listas activas con snapshot local.
- Detalle de lista con check/uncheck local.
- Sincronización diferida al volver la conectividad.

## Flujo offline recoverable
1. Se detecta pérdida de red.
2. Si existe snapshot local, la UI sigue operativa con datos cacheados.
3. Los cambios del usuario (checks) se persisten localmente.
4. El estado se muestra como recuperable (sin forzar cierre de sesión inmediato).

## Flujo al reconectar
1. Se restablece red.
2. Se dispara revalidación automática de sesión cuando aplica (`OfflineRecoverable`).
3. Si la sesión es válida, continúa sincronización de pendientes.
4. Si la sesión no es válida, se redirige a login.

## Política de sincronización
- Prioridad 1: preservar cambios locales del usuario.
- Prioridad 2: actualizar desde remoto cuando la red sea estable.
- Si hay cambios remotos relevantes, mostrar aviso y permitir refresh explícito en UI.

## UX mínima esperada
- Con snapshot: banner no intrusivo de modo offline.
- Sin snapshot: estado de error recuperable con acción de reintento.
