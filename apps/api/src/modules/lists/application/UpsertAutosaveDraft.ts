import { AutosaveVersionConflictError } from "./errors.js";
import {
  buildDraftItemId,
  normalizeSourceProductId,
} from "./itemIdNormalization.js";
import type { List, ListItem } from "../domain/list.js";
import type { IdGenerator, ListRepository } from "./ports.js";

type AutosaveItemInput =
  | {
      id: string;
      kind: "manual";
      name: string;
      qty: number;
      checked: boolean;
    }
  | {
      id: string;
      kind: "catalog";
      name: string;
      qty: number;
      checked: boolean;
      source: "mercadona";
      sourceProductId: string;
      thumbnail?: string | null;
      price?: number | null;
      unitSize?: number | null;
      unitFormat?: string | null;
      unitPrice?: number | null;
      isApproxSize?: boolean;
    };

type UpsertAutosaveDraftInput = {
  userId: string;
  title: string;
  baseUpdatedAt: string;
  items: AutosaveItemInput[];
};

type AutosaveDraftSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

export class UpsertAutosaveDraft {
  constructor(
    private readonly listRepository: ListRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: UpsertAutosaveDraftInput): Promise<AutosaveDraftSummary> {
    const lists = await this.listRepository.listByOwner(input.userId);
    const autosaveDrafts = lists.filter((list) => list.isAutosaveDraft);
    const now = new Date();
    const latestAutosave =
      autosaveDrafts.length === 0
        ? null
        : autosaveDrafts.reduce((latest, current) =>
            current.updatedAt > latest.updatedAt ? current : latest,
          );

    const matchingAutosave = autosaveDrafts.find(
      (draft) => draft.updatedAt.toISOString() === input.baseUpdatedAt,
    );
    const targetAutosave = matchingAutosave ?? latestAutosave;

    if (
      !matchingAutosave &&
      latestAutosave &&
      latestAutosave.updatedAt.toISOString() !== input.baseUpdatedAt
    ) {
      throw new AutosaveVersionConflictError(
        latestAutosave.updatedAt.toISOString(),
      );
    }

    const listId = targetAutosave?.id ?? this.idGenerator.generate();
    const list: List = {
      id: listId,
      ownerUserId: input.userId,
      title: input.title,
      isAutosaveDraft: true,
      status: "DRAFT",
      items: input.items.map((item) => toListItem(item, listId, now)),
      isEditing: targetAutosave?.isEditing ?? false,
      editingTargetListId: targetAutosave?.editingTargetListId ?? null,
      createdAt: targetAutosave?.createdAt ?? now,
      updatedAt: now,
    };

    await this.listRepository.save(list);

    return {
      id: list.id,
      title: list.title,
      updatedAt: list.updatedAt.toISOString(),
    };
  }
}

function toListItem(
  item: AutosaveItemInput,
  listId: string,
  now: Date,
): ListItem {
  if (item.kind === "manual") {
    return {
      id: item.id,
      listId,
      kind: "manual",
      name: item.name,
      qty: item.qty,
      checked: item.checked,
      createdAt: now,
      updatedAt: now,
    };
  }

  const canonicalSourceProductId = normalizeSourceProductId(item.sourceProductId);

  return {
    id: buildDraftItemId(listId, canonicalSourceProductId),
    listId,
    kind: "catalog",
    source: item.source,
    sourceProductId: canonicalSourceProductId,
    nameSnapshot: item.name,
    thumbnailSnapshot: item.thumbnail ?? null,
    priceSnapshot: item.price ?? null,
    unitSizeSnapshot: item.unitSize ?? null,
    unitFormatSnapshot: item.unitFormat ?? null,
    unitPricePerUnitSnapshot: item.unitPrice ?? null,
    isApproxSizeSnapshot: item.isApproxSize ?? false,
    qty: item.qty,
    checked: item.checked,
    createdAt: now,
    updatedAt: now,
  };
}

