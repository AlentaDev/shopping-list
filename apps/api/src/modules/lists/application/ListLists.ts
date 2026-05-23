import type { ListRepository } from "./ports.js";
import { resolveListProviderId, type List, type ListStatus } from "../domain/list.js";
import { toListProviderDto, type ListProviderDto } from "./providerDto.js";

type ListSummary = {
  id: string;
  title: string;
  itemCount: number;
  activatedAt: string | null;
  isEditing: boolean;
  updatedAt: string;
  status: ListStatus;
  providerId: string;
  provider: ListProviderDto;
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
    const normalizedLists = lists.map(normalizeLegacyStatus);
    const filteredLists = filters.status
      ? normalizedLists.filter((list) => list.status === filters.status)
      : normalizedLists.filter(
          (list) => list.status !== "DRAFT" && !list.isAutosaveDraft,
        );

    return {
      lists: filteredLists
        .slice()
        .sort(compareListsByStatusAndDate)
        .map((list) => ({
          id: list.id,
          title: list.title,
          itemCount: list.items.length,
          activatedAt: list.activatedAt
            ? list.activatedAt.toISOString()
            : null,
          isEditing: list.isEditing,
          updatedAt: list.updatedAt.toISOString(),
          status: list.status,
          providerId: resolveListProviderId(list.providerId),
          provider: toListProviderDto(resolveListProviderId(list.providerId)),
        })),
    };
  }
}

function normalizeLegacyStatus(list: List): List {
  const status =
    list.status && ["DRAFT", "ACTIVE", "COMPLETED"].includes(list.status)
      ? list.status
      : "DRAFT";

  return {
    ...list,
    status,
  };
}

function compareListsByStatusAndDate(a: List, b: List): number {
  if (a.status !== b.status) {
    if (a.status === "ACTIVE") {
      return -1;
    }
    if (b.status === "ACTIVE") {
      return 1;
    }
  }

  if (a.status === "ACTIVE" && b.status === "ACTIVE") {
    const aDate = a.activatedAt?.getTime() ?? 0;
    const bDate = b.activatedAt?.getTime() ?? 0;
    return bDate - aDate;
  }

  return b.updatedAt.getTime() - a.updatedAt.getTime();
}
