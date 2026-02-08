import type { ListRepository } from "./ports.js";
import { toListItemDto, type ListItemDto } from "./listItemDto.js";
import {
  ItemNotFoundError,
  ListForbiddenError,
  ListNotFoundError,
  ListStatusTransitionError,
} from "./errors.js";

type UpdateItemInput = {
  userId: string;
  listId: string;
  itemId: string;
  name?: string;
  qty?: number;
  checked?: boolean;
};

export class UpdateItem {
  constructor(private readonly listRepository: ListRepository) {}

  async execute(input: UpdateItemInput): Promise<ListItemDto> {
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

    const item = list.items.find(
      (entry: { id: string }) => entry.id === input.itemId,
    );
    if (!item) {
      throw new ItemNotFoundError();
    }

    if (input.name !== undefined && item.kind === "manual") {
      item.name = input.name;
    }
    if (input.qty !== undefined) {
      item.qty = input.qty;
    }
    if (input.checked !== undefined) {
      item.checked = input.checked;
    }
    const now = new Date();
    item.updatedAt = now;
    list.updatedAt = now;

    await this.listRepository.save(list);

    return toListItemDto(item);
  }
}
