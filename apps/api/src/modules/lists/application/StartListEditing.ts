import type { ListRepository } from "./ports.js";
import {
  ListForbiddenError,
  ListNotFoundError,
  ListStatusTransitionError,
} from "./errors.js";

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

    list.isEditing = input.isEditing;
    list.updatedAt = new Date();

    await this.listRepository.save(list);

    return {
      id: list.id,
      isEditing: list.isEditing,
      updatedAt: list.updatedAt.toISOString(),
    };
  }
}
