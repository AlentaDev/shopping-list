import type { ListRepository } from "./ports";
import { ListForbiddenError, ListNotFoundError } from "./errors";
import { toListItemDto, type ListItemDto } from "./listItemDto";

type ListDetail = {
  id: string;
  title: string;
  items: ListItemDto[];
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
      items: list.items.map((item) => toListItemDto(item)),
      updatedAt: list.updatedAt.toISOString(),
    };
  }
}
