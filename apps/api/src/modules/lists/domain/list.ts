export type ManualListItem = {
  id: string;
  listId: string;
  kind: "manual";
  name: string;
  qty: number;
  checked: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CatalogListItem = {
  id: string;
  listId: string;
  kind: "catalog";
  source: "mercadona";
  sourceProductId: string;
  nameSnapshot: string;
  thumbnailSnapshot: string | null;
  priceSnapshot: number | null;
  unitSizeSnapshot: number | null;
  unitFormatSnapshot: string | null;
  unitPricePerUnitSnapshot: number | null;
  isApproxSizeSnapshot: boolean;
  categorySnapshot?: string | null;
  subcategorySnapshot?: string | null;
  qty: number;
  checked: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ListItem = ManualListItem | CatalogListItem;

export const LIST_STATUSES = ["DRAFT", "ACTIVE", "COMPLETED"] as const;
export type ListStatus = (typeof LIST_STATUSES)[number];

export type List = {
  id: string;
  ownerUserId: string;
  title: string;
  providerId: string;
  isAutosaveDraft: boolean;
  status: ListStatus;
  items: ListItem[];
  activatedAt?: Date;
  isEditing: boolean;
  editingTargetListId?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const DEFAULT_PROVIDER_ID = "provider-mercadona";
export const DEFAULT_PROVIDER_SLUG = "mercadona";

export class ListProviderInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ListProviderInvariantError";
  }
}

export function resolveListProviderId(providerId: string | null | undefined): string {
  if (typeof providerId !== "string") {
    return DEFAULT_PROVIDER_ID;
  }

  const normalized = providerId.trim();
  if (normalized.length === 0) {
    return DEFAULT_PROVIDER_ID;
  }

  if (normalized === DEFAULT_PROVIDER_SLUG) {
    return DEFAULT_PROVIDER_ID;
  }

  return normalized;
}

export function resolveListProviderSlug(providerId: string | null | undefined): string {
  const normalizedId = resolveListProviderId(providerId);

  if (normalizedId === DEFAULT_PROVIDER_ID || normalizedId === DEFAULT_PROVIDER_SLUG) {
    return DEFAULT_PROVIDER_SLUG;
  }

  if (normalizedId.startsWith("provider-")) {
    return normalizedId.slice("provider-".length);
  }

  return normalizedId;
}

export function ensureProviderCanChange(input: {
  status: ListStatus;
  itemCount: number;
  currentProviderId: string;
  nextProviderId: string;
}): void {
  const currentProviderSlug = resolveListProviderSlug(input.currentProviderId);
  const nextProviderSlug = resolveListProviderSlug(input.nextProviderId);

  if (currentProviderSlug === nextProviderSlug) {
    return;
  }

  const isDraft = input.status === "DRAFT";
  const isEmpty = input.itemCount === 0;
  if (isDraft && isEmpty) {
    return;
  }

  throw new ListProviderInvariantError(
    "List provider can only change for empty draft lists.",
  );
}

type NormalizeEditingStateInput = {
  status: ListStatus;
  isEditing: boolean;
  editingTargetListId: string | null | undefined;
};

type NormalizedEditingState = {
  isEditing: boolean;
  editingTargetListId?: string | null;
};

export class ListEditingStateInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ListEditingStateInvariantError";
  }
}

export function normalizeEditingState(
  input: NormalizeEditingStateInput,
): NormalizedEditingState {
  const editingTargetListId = input.editingTargetListId ?? null;

  if (input.status !== "DRAFT") {
    if (editingTargetListId !== null) {
      throw new ListEditingStateInvariantError(
        "editingTargetListId must be null when list status is not DRAFT.",
      );
    }

    if (input.status === "COMPLETED" && input.isEditing) {
      throw new ListEditingStateInvariantError(
        "Completed lists cannot be in editing mode.",
      );
    }

    return {
      isEditing: input.isEditing,
      editingTargetListId: null,
    };
  }

  if (input.isEditing && editingTargetListId === null) {
    throw new ListEditingStateInvariantError(
      "Draft lists in editing mode require editingTargetListId.",
    );
  }

  if (!input.isEditing && editingTargetListId !== null) {
    throw new ListEditingStateInvariantError(
      "Draft lists with editingTargetListId must have isEditing=true.",
    );
  }

  return {
    isEditing: input.isEditing,
    editingTargetListId,
  };
}
