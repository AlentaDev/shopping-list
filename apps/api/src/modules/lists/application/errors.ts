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

export class ListStatusTransitionError extends AppError {
  constructor() {
    super(400, "invalid_list_status_transition", "Invalid list status");
  }
}

export class DraftProviderConflictError extends AppError {
  constructor(input: {
    draftProvider: { id: string; slug: string; displayName: string };
    requestedProvider: { id: string; slug: string; displayName: string };
    draftSummary: { itemCount: number; updatedAt: string };
  }) {
    super(409, "draft_provider_conflict", "Draft provider conflict", {
      errorCode: "draft_provider_conflict",
      draftProvider: input.draftProvider,
      requestedProvider: input.requestedProvider,
      allowedActions: ["switch_and_clear", "keep_draft_provider"],
      draftSummary: input.draftSummary,
    });
  }
}

export class ProviderPayloadContractError extends AppError {
  constructor(field: "price.amount") {
    super(422, "provider_payload_contract_error", "Provider payload contract error", {
      errorCode: "provider_payload_contract_error",
      field,
    });
  }
}

export class ListEditingLockedError extends AppError {
  constructor() {
    super(409, "list_editing_locked", "List is being edited");
  }
}


export class AutosaveVersionConflictError extends AppError {
  readonly remoteUpdatedAt: string;

  constructor(remoteUpdatedAt: string) {
    super(
      409,
      "autosave_version_conflict",
      "El borrador remoto cambió. Recarga antes de guardar.",
      { remoteUpdatedAt },
    );
    this.remoteUpdatedAt = remoteUpdatedAt;
  }
}
