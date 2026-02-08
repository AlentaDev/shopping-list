# Casos de uso – App de listas de la compra

## Objetivo del producto

Permitir a los usuarios **preparar listas de la compra en PC**, guardarlas en su cuenta y **consumirlas desde una app móvil** durante la compra, marcando productos como comprados. Las listas finalizadas se conservan como historial y pueden reutilizarse para crear nuevas listas.

---

## Estados de una lista

* **LOCAL_DRAFT**: único borrador en navegador cuando no hay sesión.
* **DRAFT**: único borrador sincronizado con autosave remoto al autenticarse.
* **ACTIVE**: lista preparada para comprar, visible en web y móvil.
* **COMPLETED**: compra finalizada, visible en historial.

### Autosave con sesión (decisión)

Cuando el usuario ya está autenticado, el autosave se persiste en servidor.
La comparación entre el borrador local y el autosave remoto ocurre **una sola vez**
al iniciar la app o tras login. La regla es:

* Se compara por `updatedAt` (más reciente gana).
* Si ambos existen, `updatedAt` empata y el contenido difiere, se pide al usuario elegir.
* Si elige el local, se sincroniza el autosave remoto con el local.
* Si elige el remoto, se reemplaza el borrador local.
* Si el local está vacío y el remoto tiene items, se usa el remoto automáticamente y se muestra un toast de recuperación.

---

## Actores

* Usuario no registrado (web)
* Usuario registrado (web)
* Usuario registrado (móvil)

---

## Casos de uso

### CU-01: Crear lista sin registrarse (borrador local)

**Actor:** Usuario no registrado (web)

**Descripción:**
El usuario puede crear una lista sin tener cuenta. La lista se guarda automáticamente en el navegador.

**Flujo principal:**

1. El usuario accede a la web sin iniciar sesión.
2. Añade productos, cantidades o los borra.
3. La lista se autoguarda en el navegador.
4. Al recargar la página, la lista sigue disponible.

**Estado resultante:** `LOCAL_DRAFT`

---

### CU-02: Registro/Login con borrador existente

**Actor:** Usuario no registrado → Usuario registrado (web)

**Descripción:**
Al registrarse o iniciar sesión, el borrador local se compara con el autosave remoto. Si ambos
existen, el usuario decide cuál mantener.

**Flujo principal:**

1. El usuario pulsa “Registrarse / Iniciar sesión”.
2. El sistema detecta un `LOCAL_DRAFT`.
3. Si existe autosave remoto, se compara por `updatedAt`:
   * Si el local está vacío y el remoto tiene items, se usa el remoto y se muestra un toast.
   * Si `updatedAt` es distinto, se mantiene el más reciente.
   * Si `updatedAt` empata y el contenido difiere, se muestra un modal para elegir:
     - Mantener la lista local → se sincroniza el autosave remoto con el local.
     - Mantener la lista remota → se reemplaza el borrador local.
4. Si no existe autosave remoto, se sincroniza el borrador local al autosave remoto creando uno nuevo.

**Estado resultante:** `DRAFT`

---

### CU-03A: Crear y editar lista en borrador (web)

**Actor:** Usuario registrado (web)

**Descripción:**
El usuario crea y edita listas en modo borrador desde el PC. Si no existe borrador local ni autosave remoto, **no se crea un DRAFT vacío** hasta que el usuario añada el primer item.

**Flujo principal:**

1. Al autenticarse, no se crea ningún borrador si no hay items.
2. Al añadir el primer item, se crea el `DRAFT` y se inicia el autosave remoto.
3. Añade, edita o elimina productos.
4. La lista se autoguarda localmente; si hay sesión, también se sincroniza por autosave.
5. El usuario puede cerrar sesión o refrescar sin perder cambios.
6. El usuario puede pulsar “Finalizar lista” para pasarla a `ACTIVE` (solo si hay items).

**Estado resultante:** `DRAFT` o `ACTIVE`

### CU-03B: Al autenticarse, descartar o no autosave temporal

**Actor:** Usuario registrado (web)

**Descripción:**
Al autenticarse (login o sesión mantenida), si el usuario tiene un borrador local `LOCAL_DRAFT` y un autosave remoto `DRAFT`, se comparan por `updatedAt`. Si empatan y el contenido difiere, se muestra un modal para elegir cuál mantener.

**Flujo principal:**

1. El usuario se autentica ya sea login o con la sesión mantenida al abrir la app.
2. La app detecta que hay un borrador local `LOCAL_DRAFT` y un autosave remoto `DRAFT`.
3. Si el local está vacío y el remoto tiene items, se usa el remoto y se muestra un toast.
4. Si ambos existen y `updatedAt` es distinto, se mantiene el más reciente.
5. Si `updatedAt` empata y el contenido difiere, se muestra un modal para elegir:
   * Mantener la lista local `LOCAL_DRAFT` → se sincroniza el autosave remoto `DRAFT` con el local.
   * Mantener la lista remota `DRAFT` → se sincroniza el borrador local `LOCAL_DRAFT` con el remoto.

**Estado resultante:** `DRAFT` 

---

### CU-04: Marcar lista como finalizada en web y pasar a activa para móvil

**Actor:** Usuario registrado (web)

**Descripción:**
El usuario indica que la lista está finalizada para usarse en el móvil.

**Flujo principal:**

1. Desde una lista en `DRAFT`, en el modal el usuario pulsa “Finalizar lista” (solo si hay items).
2. El sistema cambia el estado de la lista a `ACTIVE` **reutilizando el mismo registro**.
3. El borrador local/autosave se limpia y **no se crea un DRAFT nuevo** hasta añadir el primer item.
4. La lista `ACTIVE` ya está disponible en móvil para marcar/desmarcar productos y para ver en la web.
5. Se cierra el modal de edición y se muestra la lista en la pantalla principal de listas.
6. Se muestra un toast indicando que la lista se ha finalizado y está disponible en móvil.

**Estado resultante:** `ACTIVE`

---

### CU-05: Ver y usar listas activas en móvil

**Actor:** Usuario registrado (móvil)

**Descripción:**
El usuario ve únicamente las listas activas y las usa durante la compra. En móvil solo se marcan/desmarcan productos.

**Flujo principal:**

1. El usuario abre la app móvil.
2. El sistema muestra las listas con estado `ACTIVE`.
3. El usuario entra en una lista.
4. Marca o desmarca productos como comprados.
5. La sincronización con la BBDD se realiza al finalizar la compra.
6. Si la lista ya no existe al sincronizar, se muestra un mensaje de error.

**Estado resultante:** `ACTIVE`

---

### CU-06A: Editar lista activa desde web y cancelar edición

**Actor:** Usuario registrado (web)

**Descripción:**
Al editar una lista `ACTIVE` desde la web y cancelar, la lista vuelve a `ACTIVE` sin cambios y sigue disponible en móvil.

**Flujo principal:**

1. El usuario abre una lista `ACTIVE` en la web para ver los productos (modal desde la pantalla de listas).
2. Al pulsar editar, se muestra un aviso: la lista no podrá usarse en móvil y, si hay DRAFT, se perderá.
3. Si el usuario cancela, la lista se mantiene `ACTIVE` sin cambios.

**Estado resultante:** `ACTIVE`

---
### CU-06B: Editar lista activa desde web 

**Actor:** Usuario registrado (web)

**Descripción:**
Al editar una lista `ACTIVE` desde la web, la lista permanece `ACTIVE` con `isEditing=true` y se
crea un `DRAFT` paralelo editable. En móvil queda en solo lectura hasta terminar la edición.

**Flujo principal:**

1. El usuario abre una lista `ACTIVE` en la web para ver los productos (modal desde la pantalla de listas).
2. Al pulsar editar, se muestra un aviso: la lista dejará de estar disponible en móvil y, si hay DRAFT, se perderá.
3. Si confirma, la lista `ACTIVE` queda con `isEditing=true`.
4. Se crea un **DRAFT paralelo editable** con el mismo contenido (reemplazando el DRAFT previo si existía).
5. El usuario edita la lista. Si pulsa “Añadir productos”, navega al catálogo y sigue editando el DRAFT.
6. No se permite marcar/desmarcar productos en móvil mientras la lista está en edición.
7. Si el usuario cancela la edición, se descartan los cambios: se borra el DRAFT temporal y se deja `ACTIVE` con su contenido original.
8. Al pulsar “Terminar edición”, se aplica el DRAFT a la lista `ACTIVE`, se pone `isEditing=false`, se elimina el DRAFT y se muestra un toast indicando que ya está disponible en móvil.
9. Si el usuario cierra sesión o refresca durante la edición, se descartan los cambios del DRAFT y se restaura la lista `ACTIVE` original.

**Estado resultante:** `DRAFT` o `ACTIVE`

---

### CU-07: Finalizar compra

**Actor:** Usuario registrado (móvil)

**Descripción:**
El usuario indica que ha terminado la compra.

**Flujo principal:**

1. En una lista `ACTIVE`, el usuario pulsa “Compra finalizada”.
2. El sistema sincroniza los productos marcados y completa la lista.

**Estado resultante:** `COMPLETED`

---

### CU-08: Ver historial de compras

**Actor:** Usuario registrado (web)

**Descripción:**
El usuario puede consultar listas de compras anteriores.

**Flujo principal:**

1. El usuario accede a la sección de historial.
2. El sistema muestra listas con estado `COMPLETED`.
3. El usuario puede abrir una lista para verla.

**Estado resultante:** `COMPLETED`

---

### CU-09: Reutilizar una lista completada

**Actor:** Usuario registrado (web)

**Descripción:**
El usuario crea una nueva lista a partir de una compra anterior.

**Flujo principal:**

1. Desde una lista `COMPLETED`, el usuario pulsa “Reutilizar”.
2. El sistema crea una nueva lista copiando todos los productos.
3. Los productos aparecen sin marcar.

**Estado resultante:** nueva lista en `DRAFT`

---

### CU-10: Borrar una lista

**Actor:** Usuario registrado (web)

**Descripción:**
El usuario puede borrar cualquier lista, independientemente de su estado.

**Flujo principal:**

1. El usuario pulsa “Borrar lista”.
2. El sistema elimina la lista.
3. Si la lista estaba activa, desaparece inmediatamente del móvil y la sincronización fallará.

**Estados posibles:** `DRAFT`, `ACTIVE`, `COMPLETED`

---

## Reglas clave

* El móvil **solo muestra listas `ACTIVE`**.
* En móvil solo se permite **marcar/desmarcar** productos.
* Una lista `COMPLETED` **no se reutiliza directamente**: siempre se duplica.
* Se pueden tener **varias listas activas a la vez**.
* Todas las listas pueden borrarse.
* El autoguardado es continuo en web y se sincroniza si hay sesión.
* Si falla el autosave remoto, se guarda localmente y se reintenta en background.
* Solo existe **un borrador en progreso** (local + autosave remoto).
* No se crea un DRAFT vacío: el borrador nace al añadir el primer item.
* Reusar una lista o editar una ACTIVE **reemplaza** el DRAFT previo (con aviso).
* En edición web, la lista `ACTIVE` se mantiene con `isEditing=true` y se crea un DRAFT paralelo.
* Si una lista `ACTIVE` se borra antes de sincronizar en móvil, la sincronización devuelve error.
* Los items solo se añaden desde catálogo. Repetir añade cantidad.
* Cantidad válida: **1–99**. Duplicados se consolidan por nombre (trim + case-insensitive).
* No se puede finalizar una lista sin items.

---

## Notas finales

Este modelo prioriza:

* Claridad de estados
* Historial limpio
* Flujo natural PC → móvil
* Reutilización sin romper datos históricos
