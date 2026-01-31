# Caso de uso: Login

## Objetivo
Permitir que el usuario acceda a la app con email y contraseña, usando cuenta
creada previamente en la web.

## Precondiciones
- El usuario **ya tiene cuenta** creada en la web.
- Hay conectividad de red.

## Flujo principal
1) La app verifica conectividad.
2) El usuario introduce email y contraseña.
3) Se envía la solicitud de login.
4) El backend responde con cookies HttpOnly:
   - Access: 15 min
   - Refresh: 7 días (rotación en cada refresh)
5) Se navega a listas activas.

## Reglas y decisiones
- Si no hay red, se muestra aviso y no se intenta login.
- Reintentos: 2 con backoff (1s, 3s). Luego se muestra opción **Reintentar**.
- Ante 401: refresh automático y reintento de la request.
- Si refresh falla: logout automático.

## Mensajes sugeridos
- Sin red: "Sin conexión. Revisa tu red y vuelve a intentar."
- Error de credenciales: "Email o contraseña incorrectos."
- Error temporal: "No se pudo iniciar sesión. Reintenta en unos segundos."

## Alternativas / excepciones
- Usuario sin cuenta: mostrar enlace a registro web.

## Notas
- El registro **solo existe en web**.
