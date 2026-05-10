# Android (`@app/mobile-android`)

App Android de Shopping List para operar listas activas en contexto real de supermercado.

Foco: app robusta, simple y **offline-first** con arquitectura **Clean + MVVM**.

---

## Quick start

1. Abrir `apps/mobile-android/` en Android Studio.
2. Sincronizar Gradle.
3. Ejecutar variante local debug:

```bash
./gradlew :app:assembleLocalDebug
```

4. (Opcional) correr tests unitarios:

```bash
./gradlew :app:testLocalDebugUnitTest
```

---

## Flavors y entornos

La app usa dimensión `environment`:

- `local`: `API_BASE_URL = http://10.0.2.2:3000`
- `prod`: `API_BASE_URL = https://api-shopping-list.onrender.com`

Regla de seguridad activa:

- `localRelease` está deshabilitado (no se puede generar release local por error).

---

## Versión Android

Fuente de verdad de versión:

- `apps/mobile-android/package.json` -> `version` (SemVer)

Sincronización automática al hacer release en main:

- `versionName` = SemVer (ej: `0.9.0`)
- `versionCode` = `MAJOR*10000 + MINOR*100 + PATCH`

Ejemplo:

- `0.9.0` -> `versionCode 900`
- `0.10.2` -> `versionCode 1002`

Script manual de sync (si hace falta):

```bash
pnpm version:android:sync
```

---

## Release (importante)

La publicación Android es **manual por diseño**:

1. Versionado/tags los gestiona CI.
2. Build de release firmado lo hacés vos.
3. Subida a Play Console también manual.

Esto protege la firma y evita publicar artefactos sin control.

---

## Arquitectura y reglas

- Clean Architecture + MVVM
- Organización feature-first
- TDD obligatorio
- Sin librerías nuevas sin aprobación
- Sin hardcode de textos (`strings.xml`)

Referencia operativa completa:

- `apps/mobile-android/AGENTS.md`

---

## Casos de uso (resumen)

- Login con cuenta registrada en web.
- Ver listas activas.
- Detalle de lista con checks y cálculo local.
- Trabajo offline con sincronización posterior.

Detalle completo:

- `apps/mobile-android/docs/use-cases/`

---

## Troubleshooting y docs

- Arquitectura: `apps/mobile-android/docs/architecture.md`
- Plan/implementación: `apps/mobile-android/docs/implementation/`
- Debugging: `apps/mobile-android/.github/docs/debugging/`
