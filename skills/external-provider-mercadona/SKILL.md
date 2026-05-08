---
name: external-provider-mercadona
description: "Trigger: Mercadona, catálogo, productos externos, provider externo, cache, fallback. Aplicar contrato de integración externa backend-only."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Activation Contract

Usá esta skill cuando el cambio toque integración Mercadona, catálogo externo, normalización de productos, cache o fallback de provider.

## Hard Rules

- Nunca llamar Mercadona ni providers externos desde frontend o Android.
- Toda integración externa vive detrás de interfaces/providers en backend infrastructure.
- El sistema debe seguir funcionando si Mercadona falla: cache, fallback o respuesta degradada explícita.
- Normalizar DTO externo antes de exponerlo al dominio o clientes.
- No filtrar detalles internos del provider en respuestas públicas ni errores de usuario.
- TDD obligatorio: éxito, fallo provider, fallback/cache y transformación de datos.
- No agregar librerías HTTP/cache sin justificar tradeoff y pedir confirmación.

## Decision Gates

| Situación | Acción |
|---|---|
| Necesitás dato de Mercadona | Agregar/usar provider backend, nunca cliente directo |
| DTO externo cambia | Actualizar adapter/normalizador con tests |
| Provider falla | Usar cache/fallback o error controlado sin romper la app |
| Se expone dato nuevo | Documentar contrato de catálogo/API |

## Execution Steps

1. Escribir tests del provider/adapter/caso de uso antes de implementar.
2. Encapsular llamada externa en infrastructure detrás de interfaz.
3. Normalizar datos y mapear errores a categorías internas.
4. Verificar fallback/cache y comportamiento degradado.
5. Documentar endpoint o regla nueva si cambia el contrato público.

## Output Contract

Devolver:
- Provider/adapters/casos de uso afectados.
- Tests de éxito, fallo y fallback.
- Confirmación de backend-only y ausencia de acoplamiento frontend.
- Riesgos por contrato externo o datos cambiantes.

## References

- `AGENTS.md` (Integraciones externas Mercadona y backend)
- `docs/003-rest-api-feature-first.md` (dirección REST feature-first)
