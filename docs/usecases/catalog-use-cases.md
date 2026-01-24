# Casos de uso – Catálogo

## Objetivo del producto

Permitir a los usuarios **navegar el catálogo de productos** para construir listas de compra, mostrando información relevante (nombre, formato, precio orientativo) sin depender de búsquedas directas del proveedor.

---

## Actores

* Usuario registrado (web)
* Usuario no registrado (web)

---

## Casos de uso

### CU-CAT-01: Ver categorías del catálogo

**Actor:** Usuario registrado o no registrado (web)

**Descripción:**
El usuario accede al catálogo y obtiene la lista de categorías raíz y subcategorías de primer nivel.

**Flujo principal:**

1. El usuario abre el catálogo.
2. El sistema solicita las categorías raíz.
3. El sistema devuelve categorías con jerarquía y orden.

**Estado resultante:** categorías disponibles para navegación.

---

### CU-CAT-02: Ver detalle de una categoría

**Actor:** Usuario registrado o no registrado (web)

**Descripción:**
El usuario abre una categoría para ver sus subcategorías y productos.

**Flujo principal:**

1. El usuario selecciona una categoría.
2. El sistema solicita el detalle de la categoría.
3. El sistema devuelve subcategorías con productos y sus datos básicos.

**Estado resultante:** productos visibles para selección.

---

### CU-CAT-03: Buscar productos en todo el catálogo (pendiente)

**Actor:** Usuario registrado o no registrado (web)

**Descripción:**
El usuario introduce un término y el sistema devuelve productos coincidentes en el catálogo completo.

**Flujo principal (pendiente):**

1. El usuario introduce un término de búsqueda.
2. El sistema consulta el índice de búsqueda local (no el proveedor externo).
3. El sistema devuelve productos coincidentes con datos básicos.

**Estado resultante:** lista de productos para selección.

---

## Reglas clave

* El proveedor externo **no ofrece búsqueda global**, por lo que la búsqueda se resuelve con un índice propio.
* Las respuestas del catálogo deben incluir **datos orientativos de precio y formato** (snapshot) con posible desfase temporal.
* El acceso al catálogo **no requiere autenticación**; añadir productos a listas sí lo requiere (documentado en casos de uso de listas).

---

## Notas

* El catálogo utiliza cache para reducir llamadas al proveedor y ofrecer fallback si el proveedor falla.
* La búsqueda global del catálogo queda como **pendiente** hasta que se implemente el índice persistente y su refresco controlado.
