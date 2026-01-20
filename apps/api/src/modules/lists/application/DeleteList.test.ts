import { describe, expect, it } from "vitest";
import type { List } from "../domain/list.js";
import { InMemoryListRepository } from "../infrastructure/InMemoryListRepository.js";
import { ListForbiddenError, ListNotFoundError } from "./errors.js";
import { DeleteList } from "./DeleteList.js";

describe("DeleteList", () => {
  it("deletes the list for the owner", async () => {
    const repository = new InMemoryListRepository();
    const useCase = new DeleteList(repository);
    const list: List = {
      id: "list-1",
      ownerUserId: "user-1",
      title: "Weekly groceries",
      status: "ACTIVE",
      items: [
        {
          id: "item-1",
          listId: "list-1",
          kind: "manual",
          name: "Milk",
          qty: 1,
          checked: false,
          createdAt: new Date("2024-01-01T10:00:00.000Z"),
          updatedAt: new Date("2024-01-01T10:00:00.000Z"),
        },
      ],
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      updatedAt: new Date("2024-01-01T10:00:00.000Z"),
    };

    await repository.save(list);

    await expect(
      useCase.execute({ userId: "user-1", listId: "list-1" }),
    ).resolves.toEqual({ ok: true });

    await expect(repository.findById("list-1")).resolves.toBeNull();
  });

  it("throws when list does not exist", async () => {
    const repository = new InMemoryListRepository();
    const useCase = new DeleteList(repository);

    await expect(
      useCase.execute({ userId: "user-1", listId: "missing" }),
    ).rejects.toBeInstanceOf(ListNotFoundError);
  });

  it("throws when list belongs to another user", async () => {
    const repository = new InMemoryListRepository();
    const useCase = new DeleteList(repository);
    const list: List = {
      id: "list-1",
      ownerUserId: "user-1",
      title: "Weekly groceries",
      status: "ACTIVE",
      items: [],
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      updatedAt: new Date("2024-01-01T10:00:00.000Z"),
    };

    await repository.save(list);

    await expect(
      useCase.execute({ userId: "user-2", listId: "list-1" }),
    ).rejects.toBeInstanceOf(ListForbiddenError);
  });
});
