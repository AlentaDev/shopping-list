import { describe, expect, it, vi } from "vitest";
import type { List } from "../domain/list.js";
import { InMemoryListRepository } from "../infrastructure/InMemoryListRepository.js";
import { ListStatusTransitionError } from "./errors.js";
import { CompleteList } from "./CompleteList.js";

describe("CompleteList", () => {
  it("marks items as checked and completes the list", async () => {
    const listRepository = new InMemoryListRepository();
    const useCase = new CompleteList(listRepository);
    const list: List = {
      id: "list-1",
      ownerUserId: "user-1",
      title: "Weekly groceries",
      isAutosaveDraft: false,
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
        {
          id: "item-2",
          listId: "list-1",
          kind: "manual",
          name: "Bread",
          qty: 2,
          checked: true,
          createdAt: new Date("2024-01-01T10:00:00.000Z"),
          updatedAt: new Date("2024-01-01T10:00:00.000Z"),
        },
      ],
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      updatedAt: new Date("2024-01-01T10:00:00.000Z"),
    };
    const now = new Date("2024-01-02T10:00:00.000Z");

    await listRepository.save(list);

    vi.useFakeTimers();
    vi.setSystemTime(now);

    await expect(
      useCase.execute({
        userId: "user-1",
        listId: "list-1",
        checkedItemIds: ["item-1"],
      }),
    ).resolves.toEqual({
      id: "list-1",
      status: "COMPLETED",
      updatedAt: now.toISOString(),
      items: [
        {
          id: "item-1",
          kind: "manual",
          name: "Milk",
          qty: 1,
          checked: true,
          updatedAt: now.toISOString(),
        },
        {
          id: "item-2",
          kind: "manual",
          name: "Bread",
          qty: 2,
          checked: false,
          updatedAt: now.toISOString(),
        },
      ],
    });

    await expect(listRepository.findById("list-1")).resolves.toMatchObject({
      status: "COMPLETED",
      updatedAt: now,
      items: [
        expect.objectContaining({
          id: "item-1",
          checked: true,
          updatedAt: now,
        }),
        expect.objectContaining({
          id: "item-2",
          checked: false,
          updatedAt: now,
        }),
      ],
    });

    vi.useRealTimers();
  });

  it("throws when the list is not active", async () => {
    const listRepository = new InMemoryListRepository();
    const useCase = new CompleteList(listRepository);
    const list: List = {
      id: "list-1",
      ownerUserId: "user-1",
      title: "Weekly groceries",
      isAutosaveDraft: false,
      status: "DRAFT",
      items: [],
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      updatedAt: new Date("2024-01-01T10:00:00.000Z"),
    };

    await listRepository.save(list);

    await expect(
      useCase.execute({
        userId: "user-1",
        listId: "list-1",
        checkedItemIds: [],
      }),
    ).rejects.toBeInstanceOf(ListStatusTransitionError);
  });
});
