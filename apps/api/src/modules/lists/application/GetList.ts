import type { ListRepository } from "./ports.js";
import type { ListStatus } from "../domain/list.js";
import { ListForbiddenError, ListNotFoundError } from "./errors.js";
import { toListItemDto, type ListItemDto } from "./listItemDto.js";

type ListDetail = {
  id: string;
  title: string;
  itemCount: number;
  activatedAt: string | null;
  isEditing: boolean;
  items: ListItemDto[];
  updatedAt: string;
  status: ListStatus;
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
      itemCount: list.items.length,
      activatedAt: list.activatedAt ? list.activatedAt.toISOString() : null,
      isEditing: list.isEditing,
      items: list.items.map((item) => toListItemDto(item)),
      updatedAt: list.updatedAt.toISOString(),
      status: list.status,
    };
  }
}
