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
};

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

      if (input.status === "ACTIVE") {
        await this.createEmptyDraft(list, now);
      }
    }

    return {
      id: list.id,
      status: list.status,
      updatedAt: list.updatedAt.toISOString(),
    };
  }

  private async createEmptyDraft(activeList: List, now: Date) {
    const draft: List = {
      id: this.idGenerator.generate(),
      ownerUserId: activeList.ownerUserId,
      title: activeList.title,
      isAutosaveDraft: false,
      status: "DRAFT",
      items: [],
      isEditing: false,
      createdAt: now,
      updatedAt: now,
    };

    await this.listRepository.save(draft);
  }
}
