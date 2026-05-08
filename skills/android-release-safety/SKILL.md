---
name: android-release-safety
description: "Trigger: Android release, localRelease, prod flavor, BuildConfig, APK, AAB, signing, publicación. Proteger builds Android."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Activation Contract

Usá esta skill cuando el cambio toque release Android, flavors, BuildConfig, URLs de API, variantes, APK/AAB, signing o publicación.

## Hard Rules

- Nunca permitir una release apuntando a API local salvo excepción explícita documentada.
- URLs y flags de entorno deben resolverse por flavors/BuildConfig, no por `if` runtime disperso.
- No commitear keystores, passwords, tokens ni secretos de signing.
- Mantener bloqueada o deshabilitada cualquier variante insegura como `localRelease`.
- Cambios de release deben revisar impacto en debug, local, prod y CI.
- TDD/test o verificación automatizada cuando cambie lógica de selección de entorno.
- Documentar decisiones de publicación, rollback y distribución beta si cambia el flujo.

## Decision Gates

| Situación | Acción |
|---|---|
| Nueva URL o entorno | Agregar flavor/BuildConfig y verificar variante release |
| Se genera APK/AAB | Confirmar flavor prod y ausencia de secretos/local API |
| Cambio Gradle de variantes | Revisar que `localRelease` siga bloqueada |
| Distribución beta | Documentar canal, archivo y rollback |

## Execution Steps

1. Identificar variantes afectadas y contrato de API base URL.
2. Cambiar Gradle/BuildConfig con mínima superficie.
3. Verificar que release solo use configuración segura.
4. Añadir o actualizar tests/checks si hay lógica testeable.
5. Documentar riesgo operativo si cambia publicación o distribución.

## Output Contract

Devolver:
- Variantes/flavors afectados.
- Confirmación de release segura y `localRelease` bloqueada.
- Tests/checks o verificación realizada.
- Riesgos de publicación y pasos de rollback.

## References

- `AGENTS.md` (reglas globales)
- `apps/mobile-android/AGENTS.md` (convenciones Android)
