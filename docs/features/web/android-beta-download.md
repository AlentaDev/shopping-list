# Android Beta Download

## Objetivo

Permitir que usuarios web descarguen la APK beta de Android desde un punto único y claro.

## Flujo

1. El usuario pulsa `Descargar app` en el header.
2. Se navega a `/app`.
3. Desde `/app` descarga la APK oficial de la última release.

## Reglas importantes

- La descarga NO se dispara directa desde el navbar; siempre pasa por `/app`.
- El contenido de la beta (versión, fecha y enlace APK) se centraliza en `UI_TEXT.APP_DOWNLOAD`.
- El enlace APK apunta al artefacto de GitHub Releases.

## Notas de implementación

- Header: botón nuevo junto a `Categorías`.
- Ruta interna: `/app` resuelta en `useAppShellNavigation`.
- Landing: `features/mobile-app/components/MobileAppDownloadPage.tsx`.
