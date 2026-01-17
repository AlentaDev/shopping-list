import { AppError } from "@src/shared/errors/appError.js";

export class ListNotFoundError extends AppError {
  constructor() {
    super(404, "list_not_found", "List not found");
  }
}

export class ListForbiddenError extends AppError {
  constructor() {
    super(403, "forbidden", "Forbidden");
  }
}

export class ItemNotFoundError extends AppError {
  constructor() {
    super(404, "item_not_found", "Item not found");
  }
}

export class CatalogProviderError extends AppError {
  constructor() {
    super(502, "catalog_provider_failed", "Catalog provider failed");
  }
}
