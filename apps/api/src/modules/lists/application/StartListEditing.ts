import type { ListRepository } from "./ports.js";
import {
  ListForbiddenError,
  ListNotFoundError,
  ListStatusTransitionError,
} from "./errors.js";
import type { List, ListItem } from "../domain/list.js";
import { buildDraftItemId, normalizeSourceProductId } from "./itemIdNormalization.js";

type StartListEditingInput = {
  userId: string;
  listId: string;
  isEditing: boolean;
};

type StartListEditingResult = {
  id: string;
  isEditing: boolean;
  updatedAt: string;
  autosaveUpdatedAt: string;
};

export class StartListEditing {
  constructor(private readonly listRepository: ListRepository) {}

  async execute(
    input: StartListEditingInput,
  ): Promise<StartListEditingResult> {
    const list = await this.listRepository.findById(input.listId);
    if (!list) {
      throw new ListNotFoundError();
    }

    if (list.ownerUserId !== input.userId) {
      throw new ListForbiddenError();
    }

    if (list.status !== "ACTIVE") {
      throw new ListStatusTransitionError();
    }

    const now = new Date();
    list.isEditing = input.isEditing;
    list.updatedAt = now;

    const autosaveDrafts = (
      await this.listRepository.listByOwner(input.userId)
    ).filter(
      (candidate) => candidate.isAutosaveDraft && candidate.status === "DRAFT",
    );

    const latestAutosave =
      autosaveDrafts.length === 0
        ? this.createAutosaveDraft(list, now)
        : autosaveDrafts.reduce((latest, current) =>
            current.updatedAt > latest.updatedAt ? current : latest,
          );

    latestAutosave.isEditing = input.isEditing;
    latestAutosave.editingTargetListId = input.isEditing ? list.id : null;
    latestAutosave.updatedAt = now;

    if (input.isEditing) {
      latestAutosave.title = list.title;
      latestAutosave.items = list.items.map((item) =>
        cloneItemForDraft(item, latestAutosave.id),
      );
    }

    await this.listRepository.save(list);
    await this.listRepository.save(latestAutosave);

    const staleAutosaveDrafts = autosaveDrafts.filter(
      (autosaveDraft) => autosaveDraft.id !== latestAutosave.id,
    );

    await Promise.all(
      staleAutosaveDrafts.map((autosaveDraft) =>
        this.listRepository.deleteById(autosaveDraft.id),
      ),
    );

    return {
      id: list.id,
      isEditing: list.isEditing,
      updatedAt: list.updatedAt.toISOString(),
      autosaveUpdatedAt: latestAutosave.updatedAt.toISOString(),
    };
  }

  private createAutosaveDraft(activeList: List, now: Date): List {
    return {
      id: crypto.randomUUID(),
      ownerUserId: activeList.ownerUserId,
      title: activeList.title,
      isAutosaveDraft: true,
      status: "DRAFT",
      items: [],
      isEditing: activeList.isEditing,
      editingTargetListId: activeList.isEditing ? activeList.id : null,
      createdAt: now,
      updatedAt: now,
    };
  }
}

function cloneItemForDraft(item: ListItem, draftListId: string): ListItem {
  if (item.kind === "manual") {
    return {
      ...item,
      listId: draftListId,
    };
  }

  const canonicalSourceProductId = normalizeSourceProductId(item.sourceProductId);

  return {
    ...item,
    id: buildDraftItemId(draftListId, canonicalSourceProductId),
    listId: draftListId,
    sourceProductId: canonicalSourceProductId,
  };
}
