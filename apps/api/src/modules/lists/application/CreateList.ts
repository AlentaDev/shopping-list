import type { List } from "../domain/list.js";
import type { IdGenerator, ListRepository } from "./ports.js";

type CreateListInput = {
  userId: string;
  title: string;
};

type ListSummary = {
  id: string;
  title: string;
  itemCount: number;
  activatedAt: string | null;
  isEditing: boolean;
  updatedAt: string;
  status: List["status"];
};

export class CreateList {
  constructor(
    private readonly listRepository: ListRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: CreateListInput): Promise<ListSummary> {
    const now = new Date();
    const list: List = {
      id: this.idGenerator.generate(),
      ownerUserId: input.userId,
      title: input.title,
      isAutosaveDraft: false,
      status: "DRAFT",
      items: [],
      isEditing: false,
      createdAt: now,
      updatedAt: now,
    };

    await this.listRepository.save(list);

    return {
      id: list.id,
      title: list.title,
      itemCount: list.items.length,
      activatedAt: list.activatedAt ? list.activatedAt.toISOString() : null,
      isEditing: list.isEditing,
      updatedAt: list.updatedAt.toISOString(),
      status: list.status,
    };
  }
}
