---
name: release-pr
description: "Trigger: PR de release, notas de versión, publicación web, Android o API. Preparar y verificar el flujo de release del repositorio."
license: Apache-2.0
metadata:
  author: shopping-list
  version: "1.0"
---

## Activation Contract

Usa esta skill para preparar un PR de release o sus notas. Consulta `android-release-safety` cuando intervenga Android.

## Hard Rules

- Compara la rama con la base y revisa los cambios desde el tag anterior de cada aplicación; no supongas que el mismo rango sirve para todas.
- Incluye web y Android cuando corresponda al alcance acordado; incluye API solo si tiene cambios. Comprueba los cambios y los changesets por paquete antes de prometer una versión.
- Escribe el PR y las notas públicas en español de España, breves y fieles a los cambios. El PR explica el conjunto; redacta notas separadas para cada aplicación. Web y Android se orientan a usuarios; API puede ser técnica.
- No inventes versiones, funcionalidades, pruebas ni publicaciones. Indica lo pendiente y resuelve discrepancias entre documentación, tags y releases antes de actuar.
- Crear un PR, hacer merge, modificar releases o subir artefactos requiere autorización explícita para cada acción. Nunca incluyas claves ni secretos de firma.

## Decision Gates

| Situación | Acción |
| --- | --- |
| Faltan changesets para los paquetes que deben versionarse | Señala el bloqueo y prepara los changesets adecuados con el bump acordado. |
| Ya existe una release o un tag | Inspecciona su destino y contenido; no lo sobrescribas ni lo recrees sin autorización. |
| Hay release Android | Aplica `android-release-safety`; verifica variante de producción, versión, firma y destino antes de distribuir. |
| Las notas automáticas no coinciden con las aprobadas | Advierte que el workflow no usa las notas del PR; la edición posterior de cada release requiere autorización. |

## Execution Steps

1. Revisa `docs/versioning-and-releases.md`, `docs/development-quality-gates.md` y `.github/workflows/versioning-release.yml`; comprueba rama, cambios, changesets, tags y releases vigentes.
2. Prepara título y descripción concisos del PR, y notas independientes para web, Android y, si hay cambios, API. Pide las decisiones no documentadas, como el tipo de bump, cuando sean necesarias.
3. Comprueba los quality gates aplicables. El workflow de release en `main` no sustituye a las pruebas del PR.
4. Tras el merge autorizado, comprueba el workflow y los tags/releases efectivos. El workflow genera sus propias notas y omite las releases existentes; no presupongas que el texto aprobado se publicará solo.
5. Para Android, el versionado es automático pero la firma y la subida son manuales. Verifica el nombre y URL esperados del APK en `docs/features/web/android-download.md`, además de su versión y firma. Comprueba la descarga sin declarar éxito antes de verificarla.
6. Informa de enlaces, versiones, verificaciones, acciones pendientes y cualquier discrepancia, sin exponer secretos.

## Output Contract

Entrega el texto del PR y las notas por aplicación, junto con checks, versiones confirmadas y pasos manuales pendientes. Distingue propuesta de publicación real.

## References

- `docs/versioning-and-releases.md`
- `docs/development-quality-gates.md`
- `docs/features/web/android-download.md`
- `apps/mobile-android/README.md`
- `skills/android-release-safety/SKILL.md`
