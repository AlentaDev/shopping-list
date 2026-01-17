import type { ListItem } from "../domain/list.js";
import { toListItemDto, type ListItemDto } from "./listItemDto.js";
import type { IdGenerator, ListRepository } from "./ports.js";
import { ListForbiddenError, ListNotFoundError } from "./errors.js";

type AddManualItemInput = {
  userId: string;
  listId: string;
  name: string;
  qty?: number;
  note?: string;
};

export class AddManualItem {
  constructor(
    private readonly listRepository: ListRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: AddManualItemInput): Promise<ListItemDto> {
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
      kind: "manual",
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

    return toListItemDto(item);
  }
}
