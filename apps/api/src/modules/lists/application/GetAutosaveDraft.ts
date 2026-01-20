import type { ListRepository } from "./ports.js";
import { toListItemDto, type ListItemDto } from "./listItemDto.js";

type AutosaveDraft = {
  id: string;
  title: string;
  items: ListItemDto[];
  updatedAt: string;
};

export class GetAutosaveDraft {
  constructor(private readonly listRepository: ListRepository) {}

  async execute(userId: string): Promise<AutosaveDraft | null> {
    const lists = await this.listRepository.listByOwner(userId);
    const autosaveDrafts = lists.filter((list) => list.isAutosaveDraft);

    if (autosaveDrafts.length === 0) {
      return null;
    }

    const latestAutosave = autosaveDrafts.reduce((latest, current) =>
      current.updatedAt > latest.updatedAt ? current : latest,
    );

    return {
      id: latestAutosave.id,
      title: latestAutosave.title,
      items: latestAutosave.items.map((item) => toListItemDto(item)),
      updatedAt: latestAutosave.updatedAt.toISOString(),
    };
  }
}
