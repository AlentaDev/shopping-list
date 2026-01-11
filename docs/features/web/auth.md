# Auth

## Objetivo

Permitir a los usuarios iniciar sesión y registrarse con formularios dedicados y servicios que consumen los endpoints de autenticación.

## Rutas

- `/auth/login`
- `/auth/register`

## Endpoints

- `POST /api/auth/login`
- `POST /api/auth/register`

## Notas de implementación

- Los textos de la UI se centralizan en `UI_TEXT.auth`.
- Se usa un adapter para normalizar el DTO de autenticación.
# Auth (schemas de login y registro)

## Objetivo

Centralizar la validación de formularios de registro y login en el frontend.

## Reglas importantes

- Los formularios son UI pura (sin `fetch`).
- La orquestación de la autenticación vive en `features/auth/services`.
- El password requiere: 12-20 caracteres, minúscula, mayúscula, número y carácter especial.
- El registro valida: nombre, email, password y código postal.
- El login valida: email y password.

## Notas de implementación

- Los schemas viven en `apps/web/src/features/auth/services/authSchemas.ts`.
