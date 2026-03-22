# Caso de uso: Login

## Objetivo
Autenticar usuario web existente en Android y dejar sesión lista para navegación protegida.

## Precondiciones
- Cuenta creada en web.
- Conectividad para login inicial.

## Flujo principal
1. Usuario ingresa email/password.
2. App envía login al backend.
3. Backend responde con sesión basada en cookies HttpOnly.
4. App persiste sesión local y navega a flujo autenticado.

## Reglas clave
- Sin red en login inicial: mostrar error y opción de reintento.
- Ante 401 en requests autenticadas: intentar refresh automático.
- Si refresh termina en no autorizado: ir a estado no autenticado.
- Si el error es recuperable de red, preservar estado recuperable cuando exista sesión local.

## Relación con startup auth gate
- El login no decide rutas globales por sí mismo.
- La decisión final de entrada/salida de sesión la centraliza `SessionGateViewModel`.
- Tras reconectar desde `OfflineRecoverable`, la app intenta auto-auth sin requerir login manual inmediato.
