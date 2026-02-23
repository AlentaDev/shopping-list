import type { ListRepository } from "./ports.js";
import { ResetAutosaveDraft } from "./ResetAutosaveDraft.js";
import { toListItemDto, type ListItemDto } from "./listItemDto.js";
import type { ListItem } from "../domain/list.js";
import {
  ListForbiddenError,
  ListNotFoundError,
  ListStatusTransitionError,
} from "./errors.js";
import {
  buildActiveItemId,
  normalizeSourceProductId,
} from "./itemIdNormalization.js";

type FinishListEditInput = {
  userId: string;
  listId: string;
};

type FinishListEditResult = {
  id: string;
  title: string;
  itemCount: number;
  activatedAt: string | null;
  isEditing: boolean;
  items: ListItemDto[];
  updatedAt: string;
  status: "ACTIVE";
};

export class FinishListEdit {
  private readonly listRepository: ListRepository;
  private readonly resetAutosaveDraft: ResetAutosaveDraft;

  constructor(listRepository: ListRepository) {
    this.listRepository = listRepository;
    this.resetAutosaveDraft = new ResetAutosaveDraft(listRepository);
  }

  async execute(input: FinishListEditInput): Promise<FinishListEditResult> {
    const list = await this.listRepository.findById(input.listId);
    if (!list) {
      throw new ListNotFoundError();
    }

    if (list.ownerUserId !== input.userId) {
      throw new ListForbiddenError();
    }

    if (list.status !== "ACTIVE" || !list.isEditing) {
      throw new ListStatusTransitionError();
    }

    const autosaveDrafts = (
      await this.listRepository.listByOwner(input.userId)
    ).filter((candidate) =>
        candidate.isAutosaveDraft && candidate.status === "DRAFT",
    );

    if (autosaveDrafts.length === 0) {
      throw new ListStatusTransitionError();
    }

    const autosaveForActiveList = autosaveDrafts.filter(
      (candidate) => candidate.editingTargetListId === list.id,
    );

    const targetAutosave =
      autosaveForActiveList.length > 0
        ? autosaveForActiveList.reduce((latest, current) =>
            current.updatedAt > latest.updatedAt ? current : latest,
          )
        : autosaveDrafts.reduce((latest, current) =>
            current.updatedAt > latest.updatedAt ? current : latest,
          );

    if (!targetAutosave) {
      throw new ListStatusTransitionError();
    }

    const now = new Date();
    const nextItems = mapDraftItemsToActiveItems(targetAutosave.items, list.id, now);

    list.title = targetAutosave.title;
    list.items = nextItems;
    list.isEditing = false;
    list.editingTargetListId = null;
    list.updatedAt = now;

    await this.listRepository.save(list);
    await this.resetAutosaveDraft.execute({
      userId: input.userId,
      targetDraftId: targetAutosave.id,
    });

    return {
      id: list.id,
      title: list.title,
      itemCount: list.items.length,
      activatedAt: list.activatedAt ? list.activatedAt.toISOString() : null,
      isEditing: list.isEditing,
      items: list.items.map((item) => toListItemDto(item)),
      updatedAt: list.updatedAt.toISOString(),
      status: "ACTIVE",
    };
  }
}

const cloneItemForList = (
  item: ListItem,
  listId: string,
  now: Date,
): ListItem => {
  if (item.kind === "manual") {
    return {
      id: item.id,
      listId,
      kind: "manual",
      name: item.name,
      qty: item.qty,
      checked: false,
      createdAt: now,
      updatedAt: now,
    };
  }

  const canonicalSourceProductId = normalizeSourceProductId(item.sourceProductId);

  return {
    id: buildActiveItemId(listId, canonicalSourceProductId),
    listId,
    kind: "catalog",
    source: item.source,
    sourceProductId: canonicalSourceProductId,
    nameSnapshot: item.nameSnapshot,
    thumbnailSnapshot: item.thumbnailSnapshot,
    priceSnapshot: item.priceSnapshot,
    unitSizeSnapshot: item.unitSizeSnapshot,
    unitFormatSnapshot: item.unitFormatSnapshot,
    unitPricePerUnitSnapshot: item.unitPricePerUnitSnapshot,
    isApproxSizeSnapshot: item.isApproxSizeSnapshot,
    qty: item.qty,
    checked: false,
    createdAt: now,
    updatedAt: now,
  };
};

const mapDraftItemsToActiveItems = (
  draftItems: ListItem[],
  listId: string,
  now: Date,
): ListItem[] => {
  const nextItems: ListItem[] = [];
  const seenCatalogSourceProductIds = new Set<string>();

  for (const item of draftItems) {
    const nextItem = cloneItemForList(item, listId, now);

    if (nextItem.kind === "catalog") {
      if (seenCatalogSourceProductIds.has(nextItem.sourceProductId)) {
        continue;
      }

      seenCatalogSourceProductIds.add(nextItem.sourceProductId);
    }

    nextItems.push(nextItem);
  }

  return nextItems;
};
