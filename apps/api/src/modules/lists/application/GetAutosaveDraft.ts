import type { ListRepository } from "./ports.js";
import { toListItemDto, type ListItemDto } from "./listItemDto.js";

type AutosaveDraft = {
  id: string;
  title: string;
  isEditing: boolean;
  items: ListItemDto[];
  updatedAt: string;
  editingTargetListId: string | null;
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
      isEditing: latestAutosave.isEditing,
      items: latestAutosave.items.map((item) => toListItemDto(item)),
      updatedAt: latestAutosave.updatedAt.toISOString(),
      editingTargetListId: latestAutosave.editingTargetListId ?? null,
    };
  }
}
