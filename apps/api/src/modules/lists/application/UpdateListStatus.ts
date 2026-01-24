import type { ListRepository } from "./ports.js";
import {
  ListForbiddenError,
  ListNotFoundError,
  ListStatusTransitionError,
} from "./errors.js";
import type { ListStatus } from "../domain/list.js";

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
  constructor(private readonly listRepository: ListRepository) {}

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

      list.status = input.status;
      list.updatedAt = new Date();
      await this.listRepository.save(list);
    }

    return {
      id: list.id,
      status: list.status,
      updatedAt: list.updatedAt.toISOString(),
    };
  }
}
