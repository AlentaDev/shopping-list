# Arquitectura móvil (Android)

## Objetivo
Mantener la app Android robusta, simple y alineada con **Clean Architecture + MVVM** y organización por features.

## Estructura por feature

```text
com.alentadev.shopping
├─ core/                 # utilidades técnicas transversales
├─ feature/<feature>/
│  ├─ ui/
│  ├─ domain/
│  └─ data/
│     ├─ remote/
│     └─ local/
├─ shared/ui/
└─ ui/navigation/        # entrada y enrutamiento global
```

## Reglas de dependencias
- `ui -> domain -> data`.
- `domain` no depende de Android framework.
- `data` encapsula API + persistencia local.

## Orquestador de auth al inicio (fuente única de verdad)

El arranque de sesión se decide en `ui/navigation/SessionGateViewModel`.

### Estados de bootstrap
- `Unknown`
- `Checking`
- `Authenticated`
- `Unauthenticated`
- `OfflineRecoverable`

### Política de decisión
1. Sin sesión local: `Unauthenticated`.
2. Con sesión local y sin red: `OfflineRecoverable`.
3. Con sesión local y red: `Checking` y validación remota.
   - éxito: `Authenticated`
   - error no recuperable: `Unauthenticated`

`AppNavHost` inicia en `bootstrap` y enruta en función de estos estados.

## Comportamiento offline recuperable

- Si hay datos locales y no hay red, la app preserva sesión recuperable en lugar de forzar logout inmediato.
- Listas activas y detalle consumen snapshot local cuando la red falla.
- Cambios de check se guardan localmente y se intentan sincronizar al recuperar conectividad.

## Política de auto-auth al reconectar

- Si el estado es `OfflineRecoverable`, al volver la red se dispara validación automática de sesión.
- Si valida, la app vuelve a flujo autenticado sin login manual.
- Si no valida, permanece/retorna a login según resultado del backend.

## Red y autenticación

- Login con email/password.
- Cookies HttpOnly (access/refresh) gestionadas por cliente HTTP.
- Ante 401, se ejecuta refresh coordinado y reintento.
- Si el refresh devuelve no autorizado, se invalida sesión.
- Si el refresh falla por causa recuperable de red, se mantiene estado recuperable.

## Logout

- Logout explícito limpia sesión local.
- Se limpian snapshots y estado local asociado para evitar datos stale entre sesiones.

## Referencias

- Roadmap canónico: `docs/implementation/006-implementation-plan.md`
- Caso de uso de arranque: `docs/use-cases/startup-session-orchestrator.md`
- Caso de uso offline/sync: `docs/use-cases/offline-sync.md`
