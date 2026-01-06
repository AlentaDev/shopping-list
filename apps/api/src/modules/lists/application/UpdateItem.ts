import type { ListRepository } from "./ports";
import {
  ItemNotFoundError,
  ListForbiddenError,
  ListNotFoundError,
} from "./errors";

type UpdateItemInput = {
  userId: string;
  listId: string;
  itemId: string;
  name?: string;
  qty?: number;
  checked?: boolean;
  note?: string;
};

type ItemResponse = {
  id: string;
  name: string;
  qty: number;
  checked: boolean;
  note?: string;
  updatedAt: string;
};

export class UpdateItem {
  constructor(private readonly listRepository: ListRepository) {}

  async execute(input: UpdateItemInput): Promise<ItemResponse> {
    const list = await this.listRepository.findById(input.listId);
    if (!list) {
      throw new ListNotFoundError();
    }

    if (list.ownerUserId !== input.userId) {
      throw new ListForbiddenError();
    }

    const item = list.items.find((entry) => entry.id === input.itemId);
    if (!item) {
      throw new ItemNotFoundError();
    }

    if (input.name !== undefined) {
      item.name = input.name;
    }
    if (input.qty !== undefined) {
      item.qty = input.qty;
    }
    if (input.checked !== undefined) {
      item.checked = input.checked;
    }
    if (input.note !== undefined) {
      item.note = input.note;
    }

    const now = new Date();
    item.updatedAt = now;
    list.updatedAt = now;

    await this.listRepository.save(list);

    return {
      id: item.id,
      name: item.name,
      qty: item.qty,
      checked: item.checked,
      note: item.note,
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}
