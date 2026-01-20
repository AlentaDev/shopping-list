import type { ListRepository } from "./ports.js";
import { ListForbiddenError, ListNotFoundError } from "./errors.js";

type DeleteListInput = {
  userId: string;
  listId: string;
};

type DeleteListResult = {
  ok: true;
};

export class DeleteList {
  constructor(private readonly listRepository: ListRepository) {}

  async execute(input: DeleteListInput): Promise<DeleteListResult> {
    const list = await this.listRepository.findById(input.listId);
    if (!list) {
      throw new ListNotFoundError();
    }

    if (list.ownerUserId !== input.userId) {
      throw new ListForbiddenError();
    }

    await this.listRepository.deleteById(list.id);

    return { ok: true };
  }
}
