import type { ListRepository } from "./ports.js";
import {
  ListForbiddenError,
  ListNotFoundError,
  ListStatusTransitionError,
} from "./errors.js";
import type { List } from "../domain/list.js";

type StartListEditingInput = {
  userId: string;
  listId: string;
  isEditing: boolean;
};

type StartListEditingResult = {
  id: string;
  isEditing: boolean;
  updatedAt: string;
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
    latestAutosave.updatedAt = now;

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
      createdAt: now,
      updatedAt: now,
    };
  }
}
