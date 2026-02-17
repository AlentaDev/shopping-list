# Auth (Web)

## Objetivo
Permitir a los usuarios registrarse e iniciar sesión desde la interfaz web.

## Rutas
- `/auth/register`: pantalla de registro.
- `/auth/login`: pantalla de inicio de sesión.

## Reglas importantes
- El frontend usa endpoints token-based del backend (`/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`).
- Los tokens se almacenan en cookies httpOnly/secure (definido en backend).
- Los textos UI se centralizan en `UI_TEXT.AUTH`.
- Los formularios validan con Zod y usan Value Objects para normalizar (email en minúsculas, nombre con trim).
- Los errores se muestran por campo al hacer blur y al enviar, con hint visible solo en contraseña de registro.
- `fetchWithAuth` emite logs estructurados con etiqueta `[AUTH_HTTP]` para facilitar filtros en consola.

## Checklist de migración auth client (incremental)

### Fase 1 — Auth context + `/api/users/me`
- [x] `AuthContext` depende del flujo de sesión centralizado vía `getCurrentUser`.
- [x] `/api/users/me` usa `fetchWithAuth` con retry controlado en `401`.
- [x] Tests locales de fase ejecutados (context + service + auth http client).

**Criterios de aceptación (Fase 1)**
- [x] En modo `quiet` no hay ruido de consola por flujo esperado `401 -> refresh -> retry`.
- [x] Si el refresh token es válido, el retry completa correctamente.
- [x] No hay loops de retry infinitos en `refresh` ni en request original.

### Fase 2 — Shopping-list acciones críticas
- [x] `activate`, `delete`, `edit`, `reuse` usan cliente auth centralizado con retry explícito en `401`.
- [x] Autosave crítico (`GET/PUT/DELETE`) usa cliente auth centralizado con retry explícito.
- [x] Tests locales de fase ejecutados (services de shopping-list impactados).

**Criterios de aceptación (Fase 2)**
- [x] En modo `quiet` se evitan logs de refresh esperados (sin ruido inesperado).
- [x] Con refresh token válido, las acciones críticas recuperan sesión y reintentan con éxito.
- [x] Se mantiene tope de reintento (sin bucles de reintento).

## Auth debug logging mode

### Variable
- `VITE_AUTH_LOG_MODE`

### Modos soportados
- `verbose`: registra el flujo esperado `401 -> refresh -> retry` (eventos `expected_auth_refresh`).
- `quiet` (default): oculta los eventos esperados y deja solo fallos terminales.

### Clasificación de logs
- `expected_auth_refresh`: eventos esperados de renovación de sesión.
- `unexpected_auth_failure`: fallos de auth no esperados o terminales (ej. refresh fallido).
- `business_validation_error`: errores funcionales/validación (`4xx` no-auth).

### Uso recomendado
- **Debug local**: ejecutar el frontend con `VITE_AUTH_LOG_MODE=verbose`.
- **Producción**: usar `VITE_AUTH_LOG_MODE=quiet` para reducir ruido en consola.

## Notas de implementación
- La navegación es simple (basada en `window.history`) y se resuelve en `App.tsx`.
- Los formularios son UI pura y delegan en `AuthService`.
