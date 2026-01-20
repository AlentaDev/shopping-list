import type { List, ListItem } from "../domain/list.js";
import { toListItemDto, type ListItemDto } from "./listItemDto.js";
import type { IdGenerator, ListRepository } from "./ports.js";
import {
  ListForbiddenError,
  ListNotFoundError,
  ListStatusTransitionError,
} from "./errors.js";

type DuplicateListInput = {
  userId: string;
  listId: string;
};

type DuplicateListResult = {
  id: string;
  title: string;
  status: "DRAFT";
  items: ListItemDto[];
  updatedAt: string;
};

export class DuplicateList {
  constructor(
    private readonly listRepository: ListRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: DuplicateListInput): Promise<DuplicateListResult> {
    const list = await this.listRepository.findById(input.listId);
    if (!list) {
      throw new ListNotFoundError();
    }

    if (list.ownerUserId !== input.userId) {
      throw new ListForbiddenError();
    }

    if (list.status !== "COMPLETED") {
      throw new ListStatusTransitionError();
    }

    const now = new Date();
    const newListId = this.idGenerator.generate();
    const clonedItems = list.items.map((item) =>
      duplicateItem(item, newListId, now, this.idGenerator),
    );
    const newList: List = {
      id: newListId,
      ownerUserId: list.ownerUserId,
      title: list.title,
      isAutosaveDraft: false,
      status: "DRAFT",
      items: clonedItems,
      createdAt: now,
      updatedAt: now,
    };

    await this.listRepository.save(newList);

    return {
      id: newList.id,
      title: newList.title,
      status: "DRAFT",
      items: newList.items.map((item) => toListItemDto(item)),
      updatedAt: newList.updatedAt.toISOString(),
    };
  }
}

function duplicateItem(
  item: ListItem,
  listId: string,
  now: Date,
  idGenerator: IdGenerator,
): ListItem {
  if (item.kind === "manual") {
    return {
      id: idGenerator.generate(),
      listId,
      kind: "manual",
      name: item.name,
      qty: item.qty,
      checked: false,
      note: item.note,
      createdAt: now,
      updatedAt: now,
    };
  }

  return {
    id: idGenerator.generate(),
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
    note: item.note,
    createdAt: now,
    updatedAt: now,
  };
}
