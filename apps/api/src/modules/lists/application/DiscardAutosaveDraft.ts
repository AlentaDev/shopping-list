import type { ListRepository } from "./ports.js";

type DiscardAutosaveDraftResult = {
  ok: true;
  removedCount: number;
};

export class DiscardAutosaveDraft {
  constructor(private readonly listRepository: ListRepository) {}

  async execute(userId: string): Promise<DiscardAutosaveDraftResult> {
    const lists = await this.listRepository.listByOwner(userId);
    const autosaveDrafts = lists.filter((list) => list.isAutosaveDraft);

    await Promise.all(
      autosaveDrafts.map((draft) => this.listRepository.deleteById(draft.id)),
    );

    return { ok: true, removedCount: autosaveDrafts.length };
  }
}
