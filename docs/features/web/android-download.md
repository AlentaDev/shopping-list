# Descarga de Android 1.1

## Objetivo

Android es el acompañante estable para usar en el supermercado las listas activas creadas y finalizadas desde la web. La página `/app` concentra su distribución y explica el flujo real antes de instalarla.

## Cómo funciona

1. Crea una cuenta y una lista en la web, y finalízala para dejarla activa.
2. Inicia sesión en Android con la misma cuenta.
3. Elige una lista activa.
4. Toca un producto de catálogo para ver su ficha en grande.
5. Marca los productos que incorporas a la cesta.
6. Consulta el avance y el total, que solo suma productos de catálogo marcados con precio.
7. Finaliza la lista al terminar la compra.

## Conexión y alcance

- La descarga NO se dispara directa desde el navbar; siempre pasa por `/app`.
- Home reutiliza ese mismo destino `/app` desde el hero; el footer ya no contiene este CTA.
- Las listas ya descargadas permanecen disponibles sin conexión.
- Si un intento de sincronización falla por conexión, Android conserva el último estado de marcar o desmarcar y lo reintenta cuando vuelve la conectividad.
- No se promete que todos los cambios sin conexión se sincronicen automáticamente.
- La creación y edición de cuentas, listas y productos se mantiene en la web.
- Android muestra listas activas; el historial se consulta en la web.

## Instalación y actualización

1. Descarga la APK de la release oficial de GitHub desde `/app`.
2. Abre el archivo y confirma la instalación.
3. Si Android lo solicita, permite instalar aplicaciones desconocidas para el navegador o gestor de archivos utilizado.
4. Para actualizar, instala una APK más reciente sobre la aplicación existente.

## Publicación 1.1

- La versión prevista es Android `v1.1.0`.
- La URL prevista del artefacto oficial es `https://github.com/AlentaDev/shopping-list/releases/download/android-v1.1.0/shopping-list-android.apk`.
- La publicación de esta versión y su descarga deben verificarse tras subir la APK firmada.

## Implementación

- El contenido de la landing, incluida versión y URL, se centraliza en `UI_TEXT.APP_DOWNLOAD`.
- Header y hero navegan a `/app`.
- La ruta `/app` se resuelve en `useAppShellNavigation` y renderiza `features/mobile-app/components/MobileAppDownloadPage.tsx`.
