# Compatibilidad de catálogo con Bonpreu (UI)

## Resumen

Bonpreu/Esclat expone una jerarquía de categorías más profunda que Mercadona. Algunas categorías raíz no tienen hijos de nivel 1 (por ejemplo "Ofertas"), y cuando se entra a una categoría su detalle puede no traer productos sino una lista de subcategorías navegables (por ejemplo "Frescos" → "Fruta", "Verdura").

Esta compatibilidad ajusta el catálogo web para soportar ambos patrones sin alterar el comportamiento existente para Mercadona.

## Comportamiento visible

### Selección directa de hoja más profunda (`CategoriesPanel`)

- En desktop, el click en cualquier categoría padre selecciona automáticamente la primera hoja más profunda de esa rama y carga sus productos.
- En mobile, el click en un padre expande/contrae sus hijos; el usuario navega nivel a nivel hasta seleccionar una hoja.
- El panel renderiza árboles de forma recursiva, por lo que soporta jerarquías de 4 niveles (raíz + 3 niveles) sin condicionales por provider.
- Solo la rama activa está expandida; las demás permanecen colapsadas para mantener la legibilidad.
- La hoja seleccionada se resalta con el estilo verde existente y sus hermanas permanecen clicables.

### Navegación de nivel profundo en el detalle (`Catalog`)

- Cuando el detalle de una categoría no tiene productos y sus secciones traen `subcategoryId`, las secciones se renderizan como botones de navegación.
- Al hacer click en uno de esos botones se carga el detalle de la subcategoría usando `selectCategory(subcategoryId)`.
- El mensaje "no hay productos disponibles" se omite en ese caso porque la pantalla actúa como índice navegable, no como listado vacío.
- Esta detección es agnóstica al provider: solo requiere que haya al menos una sección con `subcategoryId` y sin productos.

### Fallback de categoría inicial

- `useCatalog` elige como categoría inicial la primera hoja más profunda bajo la primera raíz ordenada.
- Si la primera raíz es ella misma una hoja, se selecciona directamente.
- Esto evita pantallas en blanco tanto en Mercadona (2 niveles) como en Bonpreu/Esclat (hasta 4 niveles).

## Notas de implementación

- El campo `subcategoryId` se agrega a `CatalogCategorySection` y se extrae en `CatalogAdapter` desde `subcategory.id`. Mantiene `""` cuando no viene del backend (Mercadona) para no romper el contrato.
- `CategoriesPanel` construye un árbol recursivo desde el array plano de `CatalogCategoryNode`, que ahora usa `level: number` para soportar profundidades arbitrarias.
- El backend (`BonpreuCatalogProvider` y `GetRootCategories`) aplana recursivamente la jerarquía de categorías y expone todos los niveles disponibles.
- La detección de "modo navegación" en `Catalog.tsx` ya no depende del provider; usa solo la presencia de `subcategoryId` y ausencia de productos.
- El `key` de `ProductsCategory` prefiere `subcategoryId` cuando existe, con fallback a `subcategoryName` para preservar estabilidad en Mercadona.
- `getDefaultCategory` devuelve la primera hoja más profunda siguiendo recursivamente el primer hijo de cada nivel.
