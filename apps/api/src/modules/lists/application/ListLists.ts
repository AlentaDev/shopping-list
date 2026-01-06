import type { ListRepository } from "./ports";

type ListSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

type ListListsResult = {
  lists: ListSummary[];
};

export class ListLists {
  constructor(private readonly listRepository: ListRepository) {}

  async execute(userId: string): Promise<ListListsResult> {
    const lists = await this.listRepository.listByOwner(userId);

    return {
      lists: lists.map((list) => ({
        id: list.id,
        title: list.title,
        updatedAt: list.updatedAt.toISOString(),
      })),
    };
  }
}
