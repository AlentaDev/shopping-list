# ADR-0004: Endpoint de usuario actual en módulo users

## Estado

Aceptado.

## Contexto

El endpoint `GET /api/auth/me` vivía en el módulo de auth, mezclando autenticación
con lectura de perfil. Además, el dominio de usuario y el repositorio estaban
acoplados a auth, lo que dificulta mantener una estructura feature-first clara.

## Decisión

- El endpoint de usuario actual se mueve a **users** como `GET /api/users/me`.
- Se mantiene `GET /api/auth/me` de forma temporal, marcado como **deprecated**
  con respuesta `410`.
- El `UserRepository` y el dominio `User` pertenecen al módulo **users** y se
  comparte con auth mediante `users/public`.

## Consecuencias

- Las rutas de usuario quedan concentradas en su feature propia.
- Auth solo orquesta autenticación y tokens; el perfil se consulta en users.
- Los clientes deben migrar a `GET /api/users/me` antes de eliminar el endpoint
  deprecated.
