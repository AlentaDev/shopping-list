import type { ListRepository } from "./ports.js";

type DiscardAutosaveDraftResult = {
  ok: true;
};

export class DiscardAutosaveDraft {
  constructor(private readonly listRepository: ListRepository) {}

  async execute(userId: string): Promise<DiscardAutosaveDraftResult> {
    const lists = await this.listRepository.listByOwner(userId);
    const autosaveDrafts = lists.filter((list) => list.isAutosaveDraft);

    if (autosaveDrafts.length === 0) {
      return { ok: true };
    }

    const latestAutosave = autosaveDrafts.reduce((latest, current) =>
      current.updatedAt > latest.updatedAt ? current : latest,
    );

    latestAutosave.title = "";
    latestAutosave.items = [];
    latestAutosave.updatedAt = new Date();

    await this.listRepository.save(latestAutosave);

    return { ok: true };
  }
}
