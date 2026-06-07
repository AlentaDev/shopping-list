# Compatibilidad de catálogo con Bonpreu (UI)

## Resumen

Bonpreu/Esclat expone una jerarquía de categorías más profunda que Mercadona. Algunas categorías raíz no tienen hijos de nivel 1 (por ejemplo "Ofertas"), y cuando se entra a una categoría su detalle puede no traer productos sino una lista de subcategorías navegables (por ejemplo "Frescos" → "Fruta", "Verdura").

Esta compatibilidad ajusta el catálogo web para soportar ambos patrones sin alterar el comportamiento existente para Mercadona.

## Comportamiento visible

### Selección directa de hoja en raíz (`CategoriesPanel`)

- Si una categoría raíz no tiene hijos, hacer click la selecciona directamente (desktop y mobile).
- El chevron de expansión se oculta cuando la categoría raíz no tiene hijos.
- Las categorías con hijos siguen comportándose igual: en desktop seleccionan el primer hijo; en mobile expanden la lista de hijos.

### Navegación de nivel profundo en el detalle (`Catalog`)

- Cuando el provider es `bonpreuesclat`, el detalle de categoría no tiene productos y sus secciones traen `subcategoryId`, las secciones se renderizan como botones de navegación.
- Al hacer click en uno de esos botones se carga el detalle de la subcategoría usando `selectCategory(subcategoryId)`.
- El mensaje "no hay productos disponibles" se omite en ese caso porque la pantalla actúa como índice navegable, no como listado vacío.

### Fallback de categoría inicial

- Si la primera categoría raíz ordenada no tiene hijos, `useCatalog` la usa a ella misma como categoría inicial en lugar de devolver `null`.
- Esto evita pantallas en blanco al entrar al catálogo de Bonpreu cuando "Ofertas" (u otra hoja) es la primera categoría disponible.

## Notas de implementación

- El campo `subcategoryId` se agrega a `CatalogCategorySection` y se extrae en `CatalogAdapter` desde `subcategory.id`. Mantiene `""` cuando no viene del backend (Mercadona) para no romper el contrato.
- La detección de "modo navegación" en `Catalog.tsx` requiere `providerId === "bonpreuesclat"`, ausencia de productos y al menos un `subcategoryId` no vacío. Es una condición conservadora y específica del provider.
- El `key` de `ProductsCategory` prefiere `subcategoryId` cuando existe, con fallback a `subcategoryName` para preservar estabilidad en Mercadona.
- `getDefaultCategory` cambia su fallback de `null` a `parent`, lo que solo afecta el caso de raíz sin hijos. Mercadona no entra en este caso porque sus raíces siempre tienen nivel 1.
