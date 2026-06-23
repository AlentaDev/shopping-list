# Android Beta Download

## Objetivo

Permitir que usuarios web descarguen la APK beta de Android desde un punto único y claro.

## Flujo

1. El usuario pulsa `Descargar app` en el header.
2. También puede pulsar el CTA de Android dentro del hero de Home.
3. Se navega a `/app`.
4. Desde `/app` descarga la APK oficial de la última release.

## Reglas importantes

- La descarga NO se dispara directa desde el navbar; siempre pasa por `/app`.
- Home reutiliza ese mismo destino `/app` desde el hero; el footer ya no contiene este CTA.
- El contenido de la beta (versión, fecha y enlace APK) se centraliza en `UI_TEXT.APP_DOWNLOAD`.
- El enlace APK apunta al artefacto de GitHub Releases.
- La beta publicada actualmente desde `/app` es Android `v0.10.3`.

## Notas de implementación

- Header: `Descargar app` vive como opción de navegación principal y muestra estado activo cuando la ruta actual es `/app`.
- Home: CTA secundaria del hero enlaza a `/app`.
- Ruta interna: `/app` resuelta en `useAppShellNavigation`.
- Landing: `features/mobile-app/components/MobileAppDownloadPage.tsx`.
