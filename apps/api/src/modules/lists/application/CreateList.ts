import type { List } from "../domain/list";
import type { IdGenerator, ListRepository } from "./ports";

type CreateListInput = {
  userId: string;
  title: string;
};

type ListSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

export class CreateList {
  constructor(
    private readonly listRepository: ListRepository,
    private readonly idGenerator: IdGenerator
  ) {}

  async execute(input: CreateListInput): Promise<ListSummary> {
    const now = new Date();
    const list: List = {
      id: this.idGenerator.generate(),
      ownerUserId: input.userId,
      title: input.title,
      items: [],
      createdAt: now,
      updatedAt: now,
    };

    await this.listRepository.save(list);

    return {
      id: list.id,
      title: list.title,
      updatedAt: list.updatedAt.toISOString(),
    };
  }
}
