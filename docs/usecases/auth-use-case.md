# Casos de uso – Autenticación (login y registro)

## Objetivo

Permitir que los usuarios creen una cuenta, inicien sesión y mantengan su sesión activa para acceder a sus listas desde web y móvil.

---

## Actores

* Usuario no registrado
* Usuario registrado

---

## Estados relevantes

* **ANÓNIMO**: usuario sin sesión iniciada.
* **AUTENTICADO**: usuario con sesión activa.

---

## Casos de uso

### CU-AUTH-01: Registro de usuario

**Actor:** Usuario no registrado

**Descripción:**
El usuario crea una cuenta nueva proporcionando sus credenciales.

**Flujo principal:**

1. El usuario abre el formulario de registro.
2. Introduce los datos requeridos (email, contraseña, nombre, etc.).
3. El sistema valida los datos y crea la cuenta.
4. El usuario queda autenticado al finalizar el registro.

**Estado resultante:** `AUTENTICADO`

---

### CU-AUTH-02: Inicio de sesión

**Actor:** Usuario no registrado

**Descripción:**
El usuario inicia sesión con sus credenciales existentes.

**Flujo principal:**

1. El usuario abre el formulario de login.
2. Introduce su email y contraseña.
3. El sistema valida las credenciales.
4. El usuario queda autenticado.

**Estado resultante:** `AUTENTICADO`

---

### CU-AUTH-03: Cierre de sesión

**Actor:** Usuario registrado

**Descripción:**
El usuario cierra su sesión.

**Flujo principal:**

1. El usuario selecciona “Cerrar sesión”.
2. El sistema invalida la sesión activa.
3. El usuario vuelve al estado anónimo.

**Estado resultante:** `ANÓNIMO`

---

## Reglas clave

* Un usuario autenticado mantiene su sesión hasta que cierre sesión o expire.
* El registro deja al usuario autenticado automáticamente.
* El login no crea cuentas nuevas: solo valida credenciales existentes.
