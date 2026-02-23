import type { List, ListItem } from "../domain/list.js";
import { toListItemDto, type ListItemDto } from "./listItemDto.js";
import { buildDraftItemId } from "./itemIdNormalization.js";
import type { IdGenerator, ListRepository } from "./ports.js";
import {
  ListForbiddenError,
  ListNotFoundError,
  ListStatusTransitionError,
} from "./errors.js";

type ReuseListInput = {
  userId: string;
  listId: string;
};

type ReuseListResult = {
  id: string;
  title: string;
  status: "DRAFT";
  items: ListItemDto[];
  updatedAt: string;
};

export class ReuseList {
  constructor(
    private readonly listRepository: ListRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: ReuseListInput): Promise<ReuseListResult> {
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

    const lists = await this.listRepository.listByOwner(input.userId);
    const existingDraft = findLatestDraft(lists);
    const now = new Date();
    const newListId = existingDraft?.id ?? this.idGenerator.generate();
    const reusedItems = list.items.map((item) =>
      reuseItem(item, newListId, now, this.idGenerator),
    );
    const newList: List = {
      id: newListId,
      ownerUserId: list.ownerUserId,
      title: list.title,
      isAutosaveDraft: true,
      status: "DRAFT",
      items: reusedItems,
      isEditing: false,
      createdAt: existingDraft?.createdAt ?? now,
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

function reuseItem(
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
      createdAt: now,
      updatedAt: now,
    };
  }

  return {
    id: buildDraftItemId(listId, item.sourceProductId),
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
}

function findLatestDraft(lists: List[]): List | null {
  const drafts = lists.filter((candidate) => candidate.status === "DRAFT");
  if (drafts.length === 0) {
    return null;
  }

  return drafts.reduce((latest, current) =>
    current.updatedAt > latest.updatedAt ? current : latest,
  );
}
