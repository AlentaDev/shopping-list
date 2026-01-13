# Auth (Web)

## Objetivo
Permitir a los usuarios registrarse e iniciar sesión desde la interfaz web.

## Rutas
- `/auth/register`: pantalla de registro.
- `/auth/login`: pantalla de inicio de sesión.

## Reglas importantes
- El frontend usa endpoints token-based del backend (`/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`).
- Los tokens se almacenan en cookies httpOnly/secure (definido en backend).
- Los textos UI se centralizan en `UI_TEXT.AUTH`.
- Los formularios validan con Zod y usan Value Objects para normalizar (email en minúsculas, nombre con trim).
- Los errores se muestran por campo al hacer blur y al enviar, con hints visibles siempre.

## Notas de implementación
- La navegación es simple (basada en `window.history`) y se resuelve en `App.tsx`.
- Los formularios son UI pura y delegan en `AuthService`.
