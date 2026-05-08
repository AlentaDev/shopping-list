---
name: shopping-list-architecture
description: "Trigger: arquitectura shopping-list, monolito modular, TDD, refactor, shared, sprint técnico. Aplicar contrato transversal del repo."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Activation Contract

Usá esta skill en cualquier cambio no trivial del repo, especialmente si toca límites entre apps, arquitectura, deuda técnica, refactors o planificación de sprint técnico.

## Hard Rules

- TDD obligatorio: test primero, implementación mínima, refactor solo después de verde.
- Mantener monolito modular; no introducir microservicios, GraphQL, CQRS ni Event Sourcing.
- No inventar requisitos ni cambiar arquitectura sin confirmación explícita.
- Priorizar cambios chicos y aislados; no mover/renombrar más de ~10 archivos por iteración sin confirmación.
- No agregar librerías sin justificar tradeoff y pedir confirmación.
- Respetar feature-first: código específico vive en su feature; `shared` solo contiene utilidades puras/técnicas sin lógica de negocio.
- Todo código nuevo debe moverse hacia la arquitectura definida, aunque el legado todavía no la cumpla.
- Si una decisión no está documentada o el ownership de una capa no es claro, detenerse y preguntar.

## Decision Gates

| Situación | Acción |
|---|---|
| Refactor de deuda existente | Reducir scope a una unidad verificable con tests |
| Código específico cae en `shared` | Moverlo a feature/app correspondiente o pedir decisión |
| Nueva feature | Documentar en `docs/features/web` o `docs/features/api` según aplique |
| Cambio grande inevitable | Dividir en work units o pedir excepción explícita |

## Execution Steps

1. Identificar la capa y feature dueña antes de tocar código.
2. Escribir o ajustar tests del comportamiento esperado.
3. Implementar el mínimo cambio sin refactors colaterales.
4. Verificar que las dependencias respetan límites hacia adentro.
5. Documentar decisiones o features nuevas en el lugar correspondiente.

## Output Contract

Devolver:
- Scope exacto del cambio y capa/feature afectada.
- Tests agregados/actualizados y comportamiento validado.
- Confirmación de límites arquitectónicos respetados.
- Riesgos, deuda restante o decisiones que requieren confirmación.

## References

- `AGENTS.md` (contrato obligatorio del repo)
- `docs/003-rest-api-feature-first.md` (dirección REST feature-first)
