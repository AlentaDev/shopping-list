import type { ListRepository } from "./ports.js";
import {
  ItemNotFoundError,
  ListForbiddenError,
  ListNotFoundError,
  ListStatusTransitionError,
} from "./errors.js";
import type { ListStatus } from "../domain/list.js";

type UpdateListStatusInput = {
  userId: string;
  listId: string;
  status: ListStatus;
  checkedItemIds?: string[];
};

type UpdateListStatusResult = {
  id: string;
  status: ListStatus;
  updatedAt: string;
};

const ALLOWED_TRANSITIONS: Record<ListStatus, ListStatus[]> = {
  DRAFT: ["ACTIVE"],
  ACTIVE: ["COMPLETED"],
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

      if (input.status === "ACTIVE" && list.items.length === 0) {
        throw new ListStatusTransitionError();
      }

      if (input.status === "COMPLETED") {
        if (!input.checkedItemIds) {
          throw new ListStatusTransitionError();
        }

        const checkedIds = new Set(input.checkedItemIds);
        for (const checkedId of checkedIds) {
          if (!list.items.some((item) => item.id === checkedId)) {
            throw new ItemNotFoundError();
          }
        }

        const now = new Date();
        for (const item of list.items) {
          const shouldBeChecked = checkedIds.has(item.id);
          if (item.checked !== shouldBeChecked) {
            item.checked = shouldBeChecked;
            item.updatedAt = now;
          }
        }

        list.status = "COMPLETED";
        list.updatedAt = now;
        await this.listRepository.save(list);
      } else {
        list.status = input.status;
        list.updatedAt = new Date();
        await this.listRepository.save(list);
      }
    }

    return {
      id: list.id,
      status: list.status,
      updatedAt: list.updatedAt.toISOString(),
    };
  }
}
