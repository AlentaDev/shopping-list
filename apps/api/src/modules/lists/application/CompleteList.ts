import type { ListRepository } from "./ports.js";
import { toListItemDto, type ListItemDto } from "./listItemDto.js";
import {
  ItemNotFoundError,
  ListForbiddenError,
  ListNotFoundError,
  ListStatusTransitionError,
} from "./errors.js";

type CompleteListInput = {
  userId: string;
  listId: string;
  checkedItemIds: string[];
};

type CompleteListResult = {
  id: string;
  status: "COMPLETED";
  items: ListItemDto[];
  updatedAt: string;
};

export class CompleteList {
  constructor(private readonly listRepository: ListRepository) {}

  async execute(input: CompleteListInput): Promise<CompleteListResult> {
    const list = await this.listRepository.findById(input.listId);
    if (!list) {
      throw new ListNotFoundError();
    }

    if (list.ownerUserId !== input.userId) {
      throw new ListForbiddenError();
    }

    if (list.status !== "ACTIVE") {
      throw new ListStatusTransitionError();
    }

    const checkedIds = new Set(input.checkedItemIds);
    for (const checkedId of checkedIds) {
      if (!list.items.some((item) => item.id === checkedId)) {
        throw new ItemNotFoundError();
      }
    }

    const now = new Date();

    for (const item of list.items) {
      const shouldBeChecked = checkedIds.has(item.id);
      if (item.checked !== shouldBeChecked) {
        item.checked = shouldBeChecked;
        item.updatedAt = now;
      }
    }

    list.status = "COMPLETED";
    list.updatedAt = now;

    await this.listRepository.save(list);

    return {
      id: list.id,
      status: "COMPLETED",
      items: list.items.map((item) => toListItemDto(item)),
      updatedAt: list.updatedAt.toISOString(),
    };
  }
}
