import { describe, expect, it, vi } from "vitest";
import type { List } from "../domain/list.js";
import { InMemoryListRepository } from "../infrastructure/InMemoryListRepository.js";
import { AddManualItem } from "./AddManualItem.js";
import { ListStatusTransitionError } from "./errors.js";

describe("AddManualItem", () => {
  it("throws when the list is completed", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: vi.fn().mockReturnValue("item-1") };
    const useCase = new AddManualItem(listRepository, idGenerator);
    const list: List = {
      id: "list-1",
      ownerUserId: "user-1",
      title: "Done list",
      isAutosaveDraft: false,
      status: "COMPLETED",
      items: [],
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      updatedAt: new Date("2024-01-01T10:00:00.000Z"),
    };

    await listRepository.save(list);

    await expect(
      useCase.execute({
        userId: "user-1",
        listId: "list-1",
        name: "Milk",
      }),
    ).rejects.toBeInstanceOf(ListStatusTransitionError);
  });
});
