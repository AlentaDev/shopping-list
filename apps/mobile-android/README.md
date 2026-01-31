# Shopping List Mobile (Android)

App móvil Android para consumir las listas **active** creadas en la web.
Esta carpeta se mantiene aislada para que Android Studio pueda trabajar sin
cargar el resto del repositorio.

## Objetivo

- App móvil **robusta y simple**.
- Offline-first para uso en supermercado.
- Login obligatorio con cuenta creada en la web.

## Documentación local

- `AGENTS.md`: reglas operativas para IA y contribuciones.
- `docs/architecture.md`: arquitectura móvil y decisiones clave.
- `docs/use-cases/`: casos de uso definitivos.

## Principios clave

- **Clean Architecture + MVVM**.
- **TDD obligatorio**.
- **Sin nuevas librerías** sin aprobación previa.
- **No hardcode** de textos: usar `strings.xml`.

## Casos de uso (resumen)

- Login email/password (registro en web obligatorio).
- Listado de listas activas.
- Detalle con productos, precios, cantidades y checks offline.
- Total local calculado en app (EUR, sin redondeos).
- Completar lista con confirmación.
- Sync con merge y aviso de borrados.

Para el detalle completo ver `docs/use-cases/`.

## API

Los endpoints están documentados en el OpenAPI del repositorio:
`/docs/api/` (fuera de esta carpeta).

## Notas

- Esta app **no** muestra historial (por ahora, sólo en web).
- El login con QR queda en futuro.
