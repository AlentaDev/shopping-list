# Catalog product detail

Selecting a catalog product opens a detail dialog with product photos and available details. When multiple photos are available, the dialog provides previous and next controls. The dialog supports keyboard dismissal and returns focus to the selected product.

Prices and unit prices come from the same catalog summary displayed on the card. Adding products and stored list prices are unchanged. Product details are requested through the catalog API, which caches them for six hours and can return stale data if the provider is unavailable. Loading failures can be retried from the dialog.
