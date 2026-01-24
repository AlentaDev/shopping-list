# ADR 006: Búsqueda de catálogo con cache persistente y refresco controlado

## Estado
Propuesto.

## Contexto

El proveedor de catálogo (Mercadona) **no expone un endpoint de búsqueda global**. La aplicación necesita un buscador rápido de productos, pero **recorrer todas las categorías en cada búsqueda** saturaría el proveedor y podría provocar bloqueos.

El catálogo cambia poco (altas/bajas poco frecuentes), pero los precios pueden variar. Se requiere un mecanismo de cache **persistente** y un refresco **gradual** que mantenga los datos razonablemente actuales sin sobrecargar el proveedor.

## Decisión

Implementar un índice de búsqueda soportado por **cache persistente** del catálogo, con dos mecanismos de refresco:

1. **Refresco on-demand por categoría**
   - Si un usuario visita una categoría y su `fetchedAt` es mayor a 24 horas, se refresca desde el proveedor y se actualiza la cache persistente.

2. **Refresco global gradual**
   - Un job recurrente recorre categorías **por lotes de 5** y actualiza su cache.
   - El job es throttled y ejecuta lotes de forma periódica (p. ej. semanal), evitando picos de tráfico.

El buscador `GET /api/catalog/search?q=` consultará **exclusivamente** el índice local, nunca el proveedor externo.

## Consecuencias

- **Rendimiento**: búsqueda rápida y consistente sin depender del proveedor.
- **Fiabilidad**: menor riesgo de rate-limit o bans.
- **Datos**: precios son orientativos y pueden estar desfasados; se acepta con transparencia.
- **Infraestructura**: se introduce un repositorio persistente de catálogo (DB) y un índice de búsqueda mantenido por jobs.

## Referencias

- `docs/usecases/catalog-use-cases.md`
- `docs/features/api/catalogCategories.md`
- `docs/features/api/listCatalogItems.md`
