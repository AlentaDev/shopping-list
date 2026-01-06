import type { ListRepository } from "./ports";
import {
  ItemNotFoundError,
  ListForbiddenError,
  ListNotFoundError,
} from "./errors";

type RemoveItemInput = {
  userId: string;
  listId: string;
  itemId: string;
};

type RemoveItemResult = {
  ok: true;
};

export class RemoveItem {
  constructor(private readonly listRepository: ListRepository) {}

  async execute(input: RemoveItemInput): Promise<RemoveItemResult> {
    const list = await this.listRepository.findById(input.listId);
    if (!list) {
      throw new ListNotFoundError();
    }

    if (list.ownerUserId !== input.userId) {
      throw new ListForbiddenError();
    }

    const itemIndex = list.items.findIndex((entry) => entry.id === input.itemId);
    if (itemIndex === -1) {
      throw new ItemNotFoundError();
    }

    list.items.splice(itemIndex, 1);
    list.updatedAt = new Date();

    await this.listRepository.save(list);

    return { ok: true };
  }
}
