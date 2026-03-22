# Caso de uso: Startup Session Orchestrator

## Objetivo
Decidir la ruta inicial de la app en un solo punto (`SessionGateViewModel`) y evitar lógica de arranque dispersa.

## Estados de bootstrap
- `Unknown`
- `Checking`
- `Authenticated`
- `Unauthenticated`
- `OfflineRecoverable`

## Entradas
- `ObserveSessionUseCase` (sesión local persistida).
- `GetCurrentUserUseCase` (validación remota con red).
- `NetworkMonitor` (conectividad efectiva).

## Flujo principal de arranque (auth gate)
1. Sin sesión local → `Unauthenticated`.
2. Con sesión local + sin red → `OfflineRecoverable`.
3. Con sesión local + red → `Checking` y validación remota:
   - éxito → `Authenticated`
   - fallo no recuperable → `Unauthenticated`

`AppNavHost` usa este estado para navegar desde `bootstrap`.

## Política de reconexión (auto-auth)
- Condición: estado actual `OfflineRecoverable`.
- Evento: vuelve conectividad.
- Acción: revalidar sesión automáticamente con `GetCurrentUserUseCase`.
- Resultado:
  - válido → `Authenticated`
  - inválido/no autorizado → `Unauthenticated`

## Regla de comportamiento recuperable
No invalidar sesión local de forma agresiva ante errores recuperables de red durante bootstrap.
