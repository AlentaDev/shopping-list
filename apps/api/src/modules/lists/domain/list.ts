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
  isAutosaveDraft: boolean;
  status: ListStatus;
  items: ListItem[];
  activatedAt?: Date;
  isEditing: boolean;
  editingTargetListId?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

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
