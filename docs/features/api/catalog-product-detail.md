# Catalog product detail

The catalog API exposes `GET /api/catalog/:provider/products/:id` for product details. The supported provider is `mercadona`. The response contains the product name, brand, origin, photos, description, usage and storage instructions, ingredients and allergens when provided.

The catalog provider fetches product details from Mercadona. Results are cached in memory for six hours per provider and product. If the provider fails, an expired cached result is returned when available; otherwise the API returns `catalog_provider_unavailable`. The cache is process-local and is lost on restart.

Nutrition text can contain markup from the provider and must not be rendered as trusted HTML.
