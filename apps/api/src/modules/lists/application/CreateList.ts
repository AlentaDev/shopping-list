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
    const lists = await this.listRepository.listByOwner(input.userId);
    const existingDraft = findLatestDraft(lists);
    const now = new Date();
    const list: List = {
      id: existingDraft?.id ?? this.idGenerator.generate(),
      ownerUserId: input.userId,
      title: input.title,
      isAutosaveDraft: true,
      status: "DRAFT",
      items: [],
      isEditing: false,
      createdAt: existingDraft?.createdAt ?? now,
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

function findLatestDraft(lists: List[]): List | null {
  const drafts = lists.filter((list) => list.status === "DRAFT");
  if (drafts.length === 0) {
    return null;
  }

  return drafts.reduce((latest, current) =>
    current.updatedAt > latest.updatedAt ? current : latest,
  );
}
