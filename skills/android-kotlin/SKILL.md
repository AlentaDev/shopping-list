---
name: android-kotlin
description: "Trigger: android, kotlin, retrofit, okhttp, token refresh, mobile, gradle, flavor. Aplicar reglas de app Android con foco en arquitectura, red y seguridad de release."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Activation Contract

Usá esta skill cuando el cambio toque `apps/mobile-android/**`.

## Hard Rules

- TDD obligatorio cuando el cambio incluya lógica de negocio o red.
- No hardcodear URLs ni secretos; usar configuración por `flavor`/BuildConfig.
- Mantener separación de responsabilidades: UI, lógica de caso de uso y capa de red.
- Reintentos y refresh token deben vivir en capa de red/interceptor, no en UI.
- Si cambia auth, validar flujo completo: request original, refresh, retry, fallback a logout.
- Evitar variantes de release inseguras (ej. `localRelease`) salvo excepción explícita.
- No llamar APIs externas desde UI; usar cliente/proveedor centralizado.
- Cambios de red deben preservar manejo explícito de errores (401/403/5xx/timeouts).

## Decision Gates

| Situación | Acción |
|---|---|
| Necesitás endpoint nuevo | Agregar en capa de servicio/cliente, no en Activity/Composable |
| Respuesta externa cambia | Normalizar en mapper/adapter de datos |
| Cambio de entorno (local/prod) | Resolver por product flavors, no por `if` en runtime |
| Falla de provider externo | Aplicar fallback sin romper flujo principal |

## Execution Steps

1. Escribir test del comportamiento esperado (auth/red/caso de uso).
2. Implementar mínimo cambio en capa correcta.
3. Verificar configuración de flavors/build para no comprometer release.
4. Validar errores y retries del flujo de red impactado.
5. Documentar decisión relevante si toca auth, networking o build variants.

## Output Contract

Devolver:
- Qué cambió y en qué capa Android.
- Tests agregados/ajustados y escenario cubierto.
- Confirmación de seguridad de configuración (flavors/URL/release).
- Riesgos pendientes (si aplica) y siguiente paso recomendado.

## References

- `AGENTS.md` (reglas globales del proyecto)
- `apps/mobile-android/AGENTS.md` (convenciones y límites Android)
