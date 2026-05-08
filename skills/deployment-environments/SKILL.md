---
name: deployment-environments
description: "Trigger: deploy, Render, Vercel, Neon, env vars, CORS, build command, start command. Aplicar contrato de entornos y despliegue."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Activation Contract

Usá esta skill cuando el cambio toque despliegue, variables de entorno, CORS, Render, Vercel, Neon, comandos build/start o configuración por entorno.

## Hard Rules

- Validar variables de entorno al arrancar la API; fallar rápido si falta configuración crítica.
- No commitear secretos ni valores productivos sensibles.
- CORS con credenciales requiere origen explícito; no usar `*` para sesiones con cookies.
- Render API debe garantizar build antes de ejecutar runtime compilado.
- Neon/Postgres debe documentar modo de conexión y wiring; no asumir `DATABASE_URL` si la app espera variables separadas.
- Vercel rewrites/proxy deben preservar contrato API sin esconder errores de CORS/auth.
- No cambiar estrategia de deploy sin documentar el tradeoff.

## Decision Gates

| Situación | Acción |
|---|---|
| Error `dist/server.js` faltante | Revisar build/start command y artefactos esperados |
| CORS local/prod falla | Validar origen exacto y credenciales |
| Nueva env var | Agregar validación, `.env.example` y documentación mínima |
| Cambio DB/deploy | Documentar wiring y modo activo |

## Execution Steps

1. Identificar entorno afectado: local, preview, prod o CI.
2. Verificar contrato actual de env vars y comandos antes de cambiar.
3. Actualizar validación/configuración y ejemplos sin secretos.
4. Cubrir con tests si cambia lógica de config o CORS.
5. Documentar pasos operativos y riesgo de rollback.

## Output Contract

Devolver:
- Entorno/configuración afectada.
- Variables o comandos cambiados.
- Confirmación de no secretos y fail-fast.
- Riesgos de deploy, rollback o compatibilidad.

## References

- `AGENTS.md` (backend env validation y reglas generales)
- `.env.example` files cuando existan en cada app
