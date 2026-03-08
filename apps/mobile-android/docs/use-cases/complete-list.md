# Especificación de feature: Complete-list flow (Android)

## Objetivo
Definir el comportamiento funcional y técnico del flujo **completar lista** en Android, para que implementación y tests compartan una única fuente de verdad.

## Decisiones de negocio (explícitas)
1. **Se permite completar con ítems sin check**.
2. **Lista vacía no esperada** por restricciones actuales de producto.
3. Si no hay conexión, la acción se **encola como pending** en el flujo de cola existente de listas.
4. El comportamiento **local-first es obligatorio**.
5. Cuando backend confirma éxito, la lista queda en estado **completed** y **desaparece de listas activas**.

## Alcance
- Feature Android de detalle de lista activa.
- Acción de usuario: confirmar “Completar lista”.
- Coordinación con repositorio local, cola offline y sincronización/replay.

## Precondiciones
- Usuario autenticado.
- Lista activa cargada en detalle.
- Confirmación de usuario aceptada en UI.

## Flujo base (happy path)
1. Usuario toca “Completar lista”.
2. UI pide confirmación.
3. Al confirmar, ViewModel dispara caso de uso en modo local-first.
4. Repositorio aplica transición local inmediata (estado completed/pending según conectividad).
5. Si hay red y backend responde éxito, la lista se elimina de activas y se navega fuera del detalle.

## Matriz de escenarios (fuente de verdad para tests)

| Escenario | Resultado de repositorio esperado | Estado/Efecto esperado en ViewModel | Mensaje visible esperado | Navegación esperada |
|---|---|---|---|---|
| **Online success** | `Success.Completed` (persistencia local + confirmación remota OK) | Estado de carga termina, efecto de éxito emitido (`ListCompleted`) | “Lista completada” (o equivalente de éxito) | Sale del detalle y vuelve a listas activas; la lista ya no aparece |
| **Offline enqueue/pending** | `Success.PendingSync` (transición local + enqueue en cola de listas) | Estado refleja operación exitosa pendiente (`CompletedPendingSync`) | “Se completará cuando vuelva la conexión” | Sale del detalle y vuelve a listas activas (lista removida localmente de activas) |
| **Reconnect replay success** | `SyncReplay.Success` para operación pendiente | Efecto de sincronización exitosa opcional/no bloqueante; sin regresión de estado | Opcional: mensaje silencioso o toast corto de sincronización completada | Sin navegación extra; usuario ya fuera del detalle |
| **HTTP 400 invalid transition** | `Error.InvalidTransition` (no completar local definitivo) | Estado de error controlado, efecto `ShowError` | “No se pudo completar la lista en su estado actual” | Permanece en detalle (sin pop) |
| **401/403 autorización** | `Error.Unauthorized` / `Error.Forbidden` | Efecto de sesión/autorización según política global + `ShowError` | “Tu sesión no permite completar esta lista” | Si política exige re-login: navegar a login; si no, quedarse en detalle |
| **404 not found** | `Error.NotFound` | Efecto de recurso no encontrado (`ListNotFound`) | “La lista ya no existe o fue removida” | Sale del detalle y vuelve a activas (refrescando origen) |
| **5xx server error** | `Error.Server` con fallback local-first: mantener pendiente para retry | Estado de éxito pendiente o error recuperable según implementación; **nunca perder intención del usuario** | “Hubo un problema del servidor. Reintentaremos automáticamente” | Sale del detalle si la operación quedó pending; si no se pudo persistir pending, permanece y muestra error |
| **Duplicate submit prevention** | `Ignored.AlreadyInProgress` o deduplicación idempotente | Botón deshabilitado durante request; sin doble efecto de éxito/error | Sin mensaje extra o “Procesando…” | Una sola navegación de salida; nunca doble pop |

## Reglas de resolución de conflictos
- Ante respuesta remota incierta o error transitorio, prevalece el principio **local-first + intención durable** (pending en cola).
- Errores de negocio/contrato (400) y autorización (401/403) **no** se convierten automáticamente en pending indefinido.
- 404 se trata como estado terminal del recurso en cliente (evitar bloqueo en detalle roto).

## Contrato para tests (obligatorio)
Esta matriz es la **fuente de verdad** para todos los tests del flujo complete-list:

1. **Repository tests**: validar resultado exacto por escenario (columna “Resultado de repositorio esperado”).
2. **ViewModel tests**: validar estado y efectos (columna “Estado/Efecto esperado en ViewModel”).
3. **UI tests** (si aplica): validar mensaje visible y resultado de navegación.
4. **Sync/replay tests**: cubrir al menos el escenario de reconexión con pending exitoso.
5. No agregar comportamiento fuera de esta matriz sin actualizar primero este documento.

## Criterios de aceptación
- Se puede completar lista con ítems sin check.
- Sin conexión, la acción queda en pending y no se pierde.
- Tras éxito backend, la lista desaparece de activas.
- Errores 400/401/403/404/5xx siguen exactamente la matriz.
- No existe doble envío efectivo por taps repetidos.
