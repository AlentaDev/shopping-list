# Auth

## Objetivo

Permitir a los usuarios iniciar sesión y registrarse con formularios dedicados y servicios que consumen los endpoints de autenticación.

## Rutas

- `/auth/login`
- `/auth/register`

## Endpoints

- `POST /api/auth/login`
- `POST /api/auth/register`

## Reglas importantes

- Los formularios son UI pura (sin `fetch`).
- La orquestación de la autenticación vive en `features/auth/services`.

## Notas de implementación

- Los textos de la UI se centralizan en `UI_TEXT.auth`.
- Se usa un adapter para normalizar el DTO de autenticación.
