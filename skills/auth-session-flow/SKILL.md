---
name: auth-session-flow
description: "Trigger: auth, login, refresh token, 401, cookies, logout, sesión, autorización. Aplicar contrato cross-app de sesión segura."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Activation Contract

Usá esta skill cuando el cambio toque autenticación, sesión, refresh token, retry 401, cookies, logout o autorización en Web, API o Android.

## Hard Rules

- TDD obligatorio para cualquier cambio de auth; cubrir éxito, expiración, retry y fallo final.
- La API es la autoridad de sesión y autorización; clientes no infieren permisos.
- Autorización explícita por lista/recurso en backend antes de devolver o mutar datos.
- Refresh token y retry deben ser centralizados, no duplicados en componentes, pantallas o casos de uso.
- Un 401 puede intentar refresh una vez; si falla, limpiar sesión y forzar estado no autenticado.
- No loguear tokens, cookies ni secretos; los logs de auth deben ser estructurados y seguros.
- Web debe respetar cookies/credenciales; Android debe persistir y reinyectar credenciales de forma controlada.

## Decision Gates

| Situación | Acción |
|---|---|
| Endpoint requiere usuario | Validar auth + autorización de recurso en API |
| Cliente recibe 401 | Usar flujo central de refresh/retry, nunca lógica local ad hoc |
| Refresh falla | Limpiar sesión y exponer logout/estado anónimo |
| Se agrega cookie/header/token | Documentar contrato y cubrir tests de seguridad |

## Execution Steps

1. Escribir test del flujo afectado: login, refresh, retry, logout o autorización.
2. Cambiar solo la capa dueña: API auth/web, servicio HTTP web o capa red Android.
3. Validar que no haya credenciales hardcodeadas ni logs sensibles.
4. Verificar que el fallo final sea explícito y recuperable para UI.
5. Documentar cambios de contrato si toca endpoints, cookies o headers.

## Output Contract

Devolver:
- Flujo de auth afectado y capa dueña.
- Tests agregados/actualizados y escenarios cubiertos.
- Confirmación de retry único, limpieza de sesión y ausencia de secretos en logs.
- Riesgos de compatibilidad entre Web/API/Android.

## References

- `AGENTS.md` (autorización, TDD y límites de capas)
- `apps/mobile-android/AGENTS.md` (convenciones Android si aplica)
