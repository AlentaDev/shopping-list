import type { ListRepository } from "./ports.js";
import {
  ItemNotFoundError,
  ListForbiddenError,
  ListNotFoundError,
  ListStatusTransitionError,
} from "./errors.js";

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

    if (list.status === "COMPLETED") {
      throw new ListStatusTransitionError();
    }

    const itemIndex = list.items.findIndex(
      (entry) => entry.id === input.itemId,
    );
    if (itemIndex === -1) {
      throw new ItemNotFoundError();
    }

    list.items.splice(itemIndex, 1);
    list.updatedAt = new Date();

    await this.listRepository.save(list);

    return { ok: true };
  }
}
