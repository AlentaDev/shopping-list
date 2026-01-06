import type { ListRepository } from "./ports";
import { ListForbiddenError, ListNotFoundError } from "./errors";

type ListDetail = {
  id: string;
  title: string;
  items: Array<{
    id: string;
    name: string;
    qty: number;
    checked: boolean;
    note?: string;
    updatedAt: string;
  }>;
  updatedAt: string;
};

export class GetList {
  constructor(private readonly listRepository: ListRepository) {}

  async execute(userId: string, listId: string): Promise<ListDetail> {
    const list = await this.listRepository.findById(listId);
    if (!list) {
      throw new ListNotFoundError();
    }

    if (list.ownerUserId !== userId) {
      throw new ListForbiddenError();
    }

    return {
      id: list.id,
      title: list.title,
      items: list.items.map((item) => ({
        id: item.id,
        name: item.name,
        qty: item.qty,
        checked: item.checked,
        note: item.note,
        updatedAt: item.updatedAt.toISOString(),
      })),
      updatedAt: list.updatedAt.toISOString(),
    };
  }
}
