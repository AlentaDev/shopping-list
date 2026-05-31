# BonpreuEsclat — Contrato Vivo Pre-SDD (API/Web/Android)

Estado: **IN PROGRESS**
Última actualización: **2026-05-31**

Este documento es la fuente de verdad funcional/técnica antes de entrar al flujo SDD.
La implementación se hará por app (API -> Web -> Android), pero con contrato global único.

---

## 1) Objetivo y alcance

### DECIDIDO
- Integrar BonpreuEsclat minimizando errores y sin romper Mercadona.
- Mantener contrato global común para consumidores (Web y Android).
- Ejecutar implementación por fases: **API primero**, luego Web, luego Android.

### PENDIENTE
- Definir fecha/hito de corte para inicio de SDD.

---

## 2) Persistencia al añadir producto a lista/draft

### DECIDIDO
Se persiste snapshot mínimo de item de catálogo:

- `id`: compuesta `list_id:source_product_id`
- `list_id`
- `source`: `bonpreusclat`
- `source_product_id`: `retailerProductId`
- `name_snapshot`: `name`
- `thumbnail_snapshot`: `imagePaths[0] + "/300x300.webp"`
- `price_snapshot`: `price.amount`
- `qty`
- `checked`
- `category_snapshot`
- `subcategory_snapshot`
- `created_at`
- `updated_at`

Notas:
- Si `imagePaths` no existe o está vacío -> `thumbnail_snapshot = null`.
- `price.amount` es obligatorio para persistir. Si falta o es inválido, se trata como error de contrato del provider.

### PENDIENTE
- Ninguno.

### Regla cerrada
- `qty` inicial al añadir producto de catálogo: `1`.

---

## 3) Regla de category/subcategory desde `categoryPath[]`

### DECIDIDO
No se normalizan textos; se guardan tal cual llegan.

Regla:
1. Si `categoryPath[]` tiene 2 o más niveles:
   - `category_snapshot = penúltimo`
   - `subcategory_snapshot = último`
2. Si tiene 1 nivel:
   - `category_snapshot = nivel único`
   - `subcategory_snapshot = null`
3. Si no tiene niveles válidos:
   - `category_snapshot = null`
   - `subcategory_snapshot = null`

Ejemplo:
- `alimentacion -> lacteos -> batidos` -> categoría: `lacteos`, subcategoría: `batidos`.

### PENDIENTE
- Acordar comportamiento si llega un `categoryPath[]` con nodos vacíos o `null` intermedios.

---

## 4) Campos legacy de unidad/pack en `list_items`

### DECIDIDO
- En esquema y repositorio actual todavía existen columnas legacy (`unit_size_snapshot`, `unit_format_snapshot`, `unit_price_per_unit_snapshot`, `is_approx_size_snapshot`).
- Para Bonpreu, la estrategia funcional actual prioriza snapshot mínimo y no depende de esos campos para la lista final.

### PENDIENTE
- Decidir si:
  - A) se mantienen legacy (posiblemente en `null`) por compatibilidad temporal, o
  - B) se planifica migración aditiva/de limpieza en iteración separada.

---

## 5) Política de errores del provider

### DECIDIDO
- Si falta `price.amount` al añadir producto: error de contrato del provider (no persistir).
- Si el provider cambia API, se corrige en adapter/capa de integración.

### PENDIENTE
- Definir código de error de dominio concreto para "payload inválido de provider" y su mapeo HTTP.

---

## 6) Compatibilidad Mercadona vs Bonpreu

### DECIDIDO
- No hacer big-bang cross-app.
- Mantener compatibilidad y avanzar por slices.
- Mantener `source` legacy temporalmente durante la transición a `providerId` en items de catálogo.
- Limpiar/remover `source` legacy en una iteración posterior, una vez estabilizado el flujo multi-provider.

### PENDIENTE
- Ninguno.

### Regla cerrada
- `provider.displayName`: si falta resolución desde `providers`, fallback a `slug`.

---

## 13) Punto 3 — IDs + DRAFT + autosave (decisiones cerradas)

### DECIDIDO
- **3-1 Identidad en DRAFT:** se mantiene el patrón actual de `id` de item catálogo como `listId:sourceProductId` para continuidad del flujo de edición/cancelación.
- Este `id` se usa para reconciliar cambios al duplicar DRAFT durante edición y re-integrar cambios en la lista ACTIVE al confirmar.
- La transición de `source` -> `providerId` en payload/modelo continúa, pero no obliga a cambiar inmediatamente el formato de `id` interno del draft.

- **3-2 Cambio de ID externo del provider:** si ocurre, se detecta por observabilidad y se corrige en iteración posterior (sin sobre-ingeniería preventiva ahora).

- **3-3 Snapshot editable (opción B):** se acepta actualización de snapshot si cambia la API (ej. nombre/precio), manteniendo estable el identificador del producto.

### PENDIENTE
- Ninguno para el punto 3 en esta etapa pre-SDD.

---

## 14) Punto 4 — Conflicto de provider con DRAFT activo (cerrado)

### DECIDIDO
- Ante conflicto de provider con DRAFT activo, responder con **409 Conflict**.
- `errorCode` estable: `draft_provider_conflict`.
- Acciones permitidas:
  - `switch_and_clear`
  - `keep_draft_provider`

Payload de referencia:

```json
{
  "errorCode": "draft_provider_conflict",
  "message": "Draft provider conflict",
  "draftProvider": {
    "id": "provider-mercadona",
    "slug": "mercadona",
    "displayName": "Mercadona"
  },
  "requestedProvider": {
    "id": "provider-bonpreuesclat",
    "slug": "bonpreuesclat",
    "displayName": "BonpreuEsclat"
  },
  "allowedActions": ["switch_and_clear", "keep_draft_provider"],
  "draftSummary": {
    "itemCount": 12,
    "updatedAt": "2026-05-31T10:30:00.000Z"
  }
}
```

Comportamiento UI esperado:
- Mostrar modal con dos opciones al recibir 409:
  - Cambiar proveedor y vaciar borrador.
  - Mantener proveedor actual.
- Web/Android deben actuar por `errorCode` + `allowedActions`, no por texto de `message`.

### PENDIENTE
- Ninguno para el punto 4 en esta etapa pre-SDD.

---

## 7) Plan de ejecución sin sobresaltos

### DECIDIDO
Orden de implementación:
1. API
2. Web
3. Android

Gates:
- Gate 1: API verde + tests.
- Gate 2: Web verde + tests.
- Gate 3: Android verde + tests.

### PENDIENTE
- Definir lista exacta de tests mínimos por gate.

---

## 8) Checklist Ready-for-SDD

- [x] Reglas de persistencia mínima definidas
- [x] Política de imagen faltante definida
- [x] Política de precio ausente/ inválido definida
- [x] Regla de category/subcategory definida
- [x] Política de campos legacy cerrada (mantener vs migrar)
- [x] Contrato de error de provider invalid payload cerrado
- [x] Plan de pruebas mínimo por fase cerrado
- [x] Estrategia de DTO de transición cerrada (si aplica)

---

## 9) Árbol de categorías Bonpreu (panel de categorías)

### DECIDIDO
- Para Bonpreu se debe replicar el árbol completo de categorías (no limitarse al patrón actual de Mercadona depth 2 en panel + depth 3 en productos).
- El panel debe permitir navegar categorías por profundidad y mostrar nodos hijos hasta hoja.
- En catálogo de productos se debe priorizar la categoría de mayor profundidad seleccionada para evitar traer volumen excesivo de productos.
- En cada nodo de categoría se consideran como campos mínimos:
  - `categoryId`
  - `name`
  - `productCount`
- `productCount` se usará para informar volumen y para enriquecer la llamada/estado al navegar categorías.

Contexto observado:
- Bonpreu devuelve ramas con profundidad hasta 4 niveles y categorías intermedias con productos agregados de hijos.
- Se investigó que algunas llamadas pueden rondar ~400 productos si no se filtra por categoría hoja.

### PENDIENTE
- Ninguno.
- Definir fallback si un nodo intermedio no tiene hijos válidos pero sí `productCount > 0`.
- Confirmar si se persiste `productCount` en cache interna de catálogo o solo en memoria de respuesta.

### Regla de navegación y carga de productos

### DECIDIDO
- Solo se muestran/cargan productos cuando el usuario llega a la categoría más profunda (nodo hoja).
- Mientras el nodo seleccionado tenga hijos, el panel continúa en modo navegación de categorías sin cargar listado de productos.

---

## 10) Reglas de precio y oferta en cards de catálogo Bonpreu

### DECIDIDO
- Mostrar oferta con badge/icono y detalle de `promotions.description` bajo demanda (popover/modal), evitando texto largo dentro de la card.
- No mostrar `brand` ni `packSizeDescription` en card.
- Mostrar precio principal y aclaración de precio por unidad aunque coincidan (duplicado permitido por claridad visual).
- Formato de unidad para "each": mostrar como `ud`.
- Formato final de aclaración: `€/ud` (ej.: `0.79€/ud`).

### PENDIENTE
- Ninguno.

### Mapeo de `unitPrice.unit` -> sufijo visible

Regla general:
- Tomar el último segmento del token (después del último `.`) y mapearlo.
- Si no existe mapeo conocido, fallback a `ud`.

Tabla inicial acordada:

| unitPrice.unit (entrada) | Mostrar |
| --- | --- |
| `fop.price.per.each` | `€/ud` |
| `fop.price.per.unit` | `€/ud` |
| `fop.price.per.kg` | `€/kg` |
| `fop.price.per.g` | `€/g` |
| `fop.price.per.l` | `€/l` |
| `fop.price.per.ml` | `€/ml` |
| `fop.price.per.cl` | `€/cl` |
| `fop.price.per.m` | `€/m` |

Fallback:
- Cualquier valor no reconocido -> `€/ud`.
- Registrar warning técnico (sin romper UX) con el valor original para ampliar el mapeo en futuras iteraciones.

Observabilidad (feature 2):
- Guardar el valor **raw** original de `unitPrice.unit` para observabilidad/debug (aunque la UI use el valor mapeado).

---

## 11) Endpoints Bonpreu de referencia (base para adaptar)

### DECIDIDO
Tomamos estos endpoints como base de diseño. Se podrán adaptar en nuestro backend según necesidades de UX/performance, manteniendo contrato interno estable.

1. **Árbol de categorías (global)**
   - `GET /api/webproductpagews/v1/categories?decoration=true&categoryDepth=3`
   - Uso: construir panel de categorías con profundidad completa.
   - Campos clave por nodo: `categoryId`, `name`, `productCount`, `childCategories[]`, `breadcrumbs[]`, `retailerCategoryId`.

2. **Productos por categoría**
   - `GET /api/webproductpagews/v6/product-pages?categoryId={categoryId}&includeAdditionalPageInfo=false&maxProductsToDecorate={n}`
   - Uso: listar productos cuando se alcanza categoría hoja.
   - Campos clave por producto: `retailerProductId`, `name`, `price`, `unitPrice`, `promotions`, `imagePaths`, `categoryPath`.

3. **Detalle de producto único**
   - `GET /api/webproductpagews/v5/products/bop?retailerProductId={retailerProductId}`
   - Uso: enriquecer datos en flujos que requieran detalle puntual.
   - Campos clave: `retailerProductId`, `name`, `price`, `unitPrice`, `imagePaths`, `availability`.

4. **Búsqueda**
   - `GET /api/webproductpagews/v6/product-pages/search?includeAdditionalPageInfo=false&maxProductsToDecorate=30&q={query}`
   - Uso: obtener resultados de búsqueda acotados a máximo 30 productos.
   - Observación funcional:
     - Puede venir un primer `productGroup.type = personalized` con resultados directos.
     - Luego aparecen grupos `cluster` (a veces vacíos si ya se alcanzó el límite de resultados).

### Reglas funcionales para búsqueda (acordadas)
- Limitar resultados a **30 productos máximo**.
- No depender del orden/semántica exacta de clusters para UX inicial; priorizar productos decorados disponibles hasta completar el máximo.
- Ignorar grupos vacíos sin tratarlos como error.
- Tratar la salida de búsqueda con el mismo contrato de producto que categoría simple para reutilizar el mismo pipeline de pintado en catálogo.

### PENDIENTE
- Definir regla final de mezcla/orden cuando haya productos en múltiples `productGroups` (personalized + clusters con productos no vacíos).

### DECISIÓN DE NORMALIZACIÓN (búsqueda vs categoría)
- Búsqueda y categoría simple convergen al mismo modelo interno de catálogo.
- Diferencia permitida: el origen (`sourceContext`) para analítica/UI (ej.: `search` o `category`).
- Render y comportamiento de card deben ser idénticos entre ambos flujos.

---

## 12) Regla de `maxProductsToDecorate` por categoría

### DECIDIDO
- Para endpoint de categoría, calcular `maxProductsToDecorate` usando `productCount` de la categoría seleccionada.
- No aplicar tope artificial en backend para v1, porque no hay paginación posterior por llamadas incrementales.
- Se trae el total de productos de la categoría hoja en una sola llamada:
  - `maxProductsToDecorate = productCount`

Ejemplo:
- `productCount=48` -> `maxProductsToDecorate=48`
- `productCount=309` -> `maxProductsToDecorate=309`

Renderizado UI (Web):
- Aunque se reciba todo el dataset, no se renderiza todo de una vez.
- Render incremental por scroll en bloques de 40 ítems visibles.

Alcance:
- Esta política de render incremental aplica de forma transversal a todos los providers (no solo Bonpreu).

### PENDIENTE
- Definir estrategia equivalente en Android para mantener consistencia de UX/performance con render incremental.

---

## Decisiones cerradas en esta etapa

1. Contrato de persistencia mínimo para Bonpreu al añadir producto.
2. Fallback de imagen a `null` sin `imagePaths`.
3. Precio obligatorio para persistencia.
4. Derivación de categoría/subcategoría desde últimos niveles de `categoryPath[]`.
5. Ejecución por app con contrato global único.

6. Legacy temporal: mantener campos legacy durante transición y limpiar en iteración posterior de estabilización.
7. Plan de pruebas: TDD estricto como criterio obligatorio de implementación por fase.
8. Transición DTO: Android/Web consumen nuevos campos de provider en listas (`providerId`, `provider.slug`, `provider.displayName`) y se adaptan al contrato actualizado manteniendo compatibilidad temporal.
