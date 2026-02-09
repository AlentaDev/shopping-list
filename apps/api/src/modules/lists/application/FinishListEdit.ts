import type { ListRepository } from "./ports.js";
import { toListItemDto, type ListItemDto } from "./listItemDto.js";
import type { ListItem } from "../domain/list.js";
import {
  ListForbiddenError,
  ListNotFoundError,
  ListStatusTransitionError,
} from "./errors.js";

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
  constructor(private readonly listRepository: ListRepository) {}

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
    ).filter((candidate) => candidate.isAutosaveDraft);

    if (autosaveDrafts.length === 0) {
      throw new ListStatusTransitionError();
    }

    const latestAutosave = autosaveDrafts.reduce((latest, current) =>
      current.updatedAt > latest.updatedAt ? current : latest,
    );

    const now = new Date();
    const nextItems = latestAutosave.items.map((item) =>
      cloneItemForList(item, list.id, now),
    );

    list.title = latestAutosave.title;
    list.items = nextItems;
    list.isEditing = false;
    list.updatedAt = now;

    await this.listRepository.save(list);
    await this.listRepository.deleteById(latestAutosave.id);

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

  return {
    id: item.id,
    listId,
    kind: "catalog",
    source: item.source,
    sourceProductId: item.sourceProductId,
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
