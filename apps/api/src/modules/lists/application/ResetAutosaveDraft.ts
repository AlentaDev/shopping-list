import type { List } from "../domain/list.js";
import type { ListRepository } from "./ports.js";

type ResetAutosaveDraftInput = {
  userId: string;
  targetDraftId?: string;
};

type ResetAutosaveDraftResult = {
  ok: true;
  draftId: string | null;
};

export class ResetAutosaveDraft {
  constructor(private readonly listRepository: ListRepository) {}

  async execute(
    input: ResetAutosaveDraftInput,
  ): Promise<ResetAutosaveDraftResult> {
    const lists = await this.listRepository.listByOwner(input.userId);
    const autosaveDrafts = lists.filter(
      (list) => list.isAutosaveDraft && list.status === "DRAFT",
    );

    if (autosaveDrafts.length === 0) {
      return { ok: true, draftId: null };
    }

    const targetAutosave = selectTargetAutosaveDraft(
      autosaveDrafts,
      input.targetDraftId,
    );

    if (!targetAutosave) {
      return { ok: true, draftId: null };
    }

    targetAutosave.title = "";
    targetAutosave.items = [];
    targetAutosave.isEditing = false;
    targetAutosave.editingTargetListId = null;
    targetAutosave.updatedAt = new Date();

    await this.listRepository.save(targetAutosave);

    const staleAutosaveDrafts = autosaveDrafts.filter(
      (autosaveDraft) => autosaveDraft.id !== targetAutosave.id,
    );

    await Promise.all(
      staleAutosaveDrafts.map((autosaveDraft) =>
        this.listRepository.deleteById(autosaveDraft.id),
      ),
    );

    return { ok: true, draftId: targetAutosave.id };
  }
}

function selectTargetAutosaveDraft(
  autosaveDrafts: List[],
  targetDraftId?: string,
): List | null {
  if (targetDraftId) {
    const matchingDraft = autosaveDrafts.find(
      (autosaveDraft) => autosaveDraft.id === targetDraftId,
    );

    if (matchingDraft) {
      return matchingDraft;
    }

    return null;
  }

  return autosaveDrafts.reduce((latest, current) =>
    current.updatedAt > latest.updatedAt ? current : latest,
  );
}
