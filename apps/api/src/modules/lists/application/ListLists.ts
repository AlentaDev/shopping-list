import type { ListRepository } from "./ports.js";
import type { ListStatus } from "../domain/list.js";

type ListSummary = {
  id: string;
  title: string;
  updatedAt: string;
  status: ListStatus;
};

type ListListsResult = {
  lists: ListSummary[];
};

type ListListsFilters = {
  status?: ListStatus;
};

export class ListLists {
  constructor(private readonly listRepository: ListRepository) {}

  async execute(
    userId: string,
    filters: ListListsFilters = {},
  ): Promise<ListListsResult> {
    const lists = await this.listRepository.listByOwner(userId);
    const filteredLists = filters.status
      ? lists.filter((list) => list.status === filters.status)
      : lists;

    return {
      lists: filteredLists.map((list) => ({
        id: list.id,
        title: list.title,
        updatedAt: list.updatedAt.toISOString(),
        status: list.status,
      })),
    };
  }
}
