# Startup Session Orchestrator

## Objetivo
Centralizar la decisión de ruta inicial de la app móvil en un único orquestador (`SessionGateViewModel`) para evitar lógica dispersa de entrada.

## Reglas importantes
- El estado de bootstrap se modela con una máquina de estados:
  - `Unknown`
  - `Checking`
  - `Authenticated`
  - `Unauthenticated`
  - `OfflineRecoverable`
- La decisión usa casos de uso existentes de auth:
  - `ObserveSessionUseCase` (sesión persistida/local)
  - `GetCurrentUserUseCase` (validación remota cuando hay red)

## Resolución de arranque
1. Si no hay sesión local → `Unauthenticated` (ruta login).
2. Si hay sesión local y no hay red → `OfflineRecoverable` (redirige a login en modo recuperable).
3. Si hay sesión local y hay red:
   - pasa por `Checking`
   - valida usuario remoto con `GetCurrentUserUseCase`
   - éxito → `Authenticated`
   - error → `Unauthenticated`

## Notas de implementación
- El `AppNavHost` inicia en `bootstrap` y navega según el estado del `SessionGateViewModel`.
- `Authenticated` navega directo a listas activas.
- `OfflineRecoverable` navega a login en modo recuperable (`login?recoverable=true`).
