import type { ListItem } from "../domain/list";
import type { IdGenerator, ListRepository } from "./ports";
import { ListForbiddenError, ListNotFoundError } from "./errors";

type AddManualItemInput = {
  userId: string;
  listId: string;
  name: string;
  qty?: number;
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

export class AddManualItem {
  constructor(
    private readonly listRepository: ListRepository,
    private readonly idGenerator: IdGenerator
  ) {}

  async execute(input: AddManualItemInput): Promise<ItemResponse> {
    const list = await this.listRepository.findById(input.listId);
    if (!list) {
      throw new ListNotFoundError();
    }

    if (list.ownerUserId !== input.userId) {
      throw new ListForbiddenError();
    }

    const now = new Date();
    const item: ListItem = {
      id: this.idGenerator.generate(),
      listId: list.id,
      name: input.name,
      qty: input.qty ?? 1,
      checked: false,
      note: input.note,
      createdAt: now,
      updatedAt: now,
    };

    list.items.push(item);
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
