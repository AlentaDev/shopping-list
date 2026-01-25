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

### CU-AUTH-02: Registro con email existente o datos inválidos

**Actor:** Usuario no registrado

**Descripción:**
El usuario intenta registrarse con datos inválidos o un email ya registrado.

**Flujo principal:**

1. El usuario envía el formulario de registro.
2. El sistema valida el formato y la completitud de los datos.
3. Si el email ya existe o hay errores, se informa al usuario.
4. El usuario permanece en estado anónimo.

**Estado resultante:** `ANÓNIMO`

---

### CU-AUTH-03: Inicio de sesión

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

### CU-AUTH-04: Inicio de sesión con credenciales inválidas

**Actor:** Usuario no registrado

**Descripción:**
El usuario intenta iniciar sesión con credenciales incorrectas.

**Flujo principal:**

1. El usuario envía el formulario de login.
2. El sistema valida las credenciales.
3. Si son incorrectas, se informa al usuario.
4. El usuario permanece en estado anónimo.

**Estado resultante:** `ANÓNIMO`

---

### CU-AUTH-05: Recuperación de sesión (refresh automático)

**Actor:** Usuario registrado

**Descripción:**
El usuario mantiene la sesión activa mediante renovación automática.

**Flujo principal:**

1. La sesión se aproxima a su expiración.
2. El sistema solicita un refresh de la sesión.
3. Si el refresh es válido, se renueva la sesión sin intervención del usuario.

**Estado resultante:** `AUTENTICADO`

---

### CU-AUTH-06: Fallo de refresh de sesión

**Actor:** Usuario registrado

**Descripción:**
El sistema no puede renovar la sesión del usuario.

**Flujo principal:**

1. El sistema intenta refrescar la sesión.
2. El refresh falla o está expirado.
3. El sistema cierra la sesión y redirige a login.

**Estado resultante:** `ANÓNIMO`

---

### CU-AUTH-07: Cierre de sesión

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
* Si el refresh falla, el usuario vuelve al estado anónimo.
