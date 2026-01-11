# Auth (schemas de login y registro)

## Objetivo

Centralizar la validación de formularios de registro y login en el frontend.

## Reglas importantes

- El password requiere: 12-20 caracteres, minúscula, mayúscula, número y carácter especial.
- El registro valida: nombre, email, password y código postal.
- El login valida: email y password.

## Notas de implementación

- Los schemas viven en `apps/web/src/features/auth/services/authSchemas.ts`.
