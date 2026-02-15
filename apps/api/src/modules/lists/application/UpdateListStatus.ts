import type { IdGenerator, ListRepository } from "./ports.js";
import {
  ListForbiddenError,
  ListNotFoundError,
  ListStatusTransitionError,
} from "./errors.js";
import type { ListStatus } from "../domain/list.js";
import type { List } from "../domain/list.js";

type UpdateListStatusInput = {
  userId: string;
  listId: string;
  status: ListStatus;
};

type UpdateListStatusResult = {
  id: string;
  status: ListStatus;
  updatedAt: string;
  autosaveDraft?: {
    id: string;
    title: string;
    updatedAt: string;
  };
};

const DEFAULT_AUTOSAVE_DRAFT_TITLE = "Tu Lista";

const ALLOWED_TRANSITIONS: Record<ListStatus, ListStatus[]> = {
  DRAFT: ["ACTIVE"],
  ACTIVE: [],
  COMPLETED: [],
};

export class UpdateListStatus {
  constructor(
    private readonly listRepository: ListRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(
    input: UpdateListStatusInput,
  ): Promise<UpdateListStatusResult> {
    const list = await this.listRepository.findById(input.listId);
    if (!list) {
      throw new ListNotFoundError();
    }

    if (list.ownerUserId !== input.userId) {
      throw new ListForbiddenError();
    }

    if (list.status !== input.status) {
      const allowed = ALLOWED_TRANSITIONS[list.status];
      if (!allowed.includes(input.status)) {
        throw new ListStatusTransitionError();
      }

      if (input.status === "ACTIVE" && list.items.length === 0) {
        throw new ListStatusTransitionError();
      }

      const now = new Date();
      list.status = input.status;
      list.updatedAt = now;

      if (input.status === "ACTIVE") {
        list.isAutosaveDraft = false;
        list.activatedAt = now;
      }
      await this.listRepository.save(list);

      let autosaveDraft: List | null = null;

      if (input.status === "ACTIVE") {
        autosaveDraft = await this.createEmptyDraft(list, now);
      }

      return {
        id: list.id,
        status: list.status,
        updatedAt: list.updatedAt.toISOString(),
        autosaveDraft: autosaveDraft
          ? {
              id: autosaveDraft.id,
              title: autosaveDraft.title,
              updatedAt: autosaveDraft.updatedAt.toISOString(),
            }
          : undefined,
      };
    }

    return {
      id: list.id,
      status: list.status,
      updatedAt: list.updatedAt.toISOString(),
    };
  }

  private async createEmptyDraft(activeList: List, now: Date): Promise<List> {
    const draft: List = {
      id: this.idGenerator.generate(),
      ownerUserId: activeList.ownerUserId,
      title: DEFAULT_AUTOSAVE_DRAFT_TITLE,
      isAutosaveDraft: true,
      status: "DRAFT",
      items: [],
      isEditing: false,
      createdAt: now,
      updatedAt: now,
    };

    await this.listRepository.save(draft);

    return draft;
  }
}
