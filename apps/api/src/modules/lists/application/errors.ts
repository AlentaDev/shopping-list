import { AppError } from "../../../shared/errors/appError";

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
