import { describe, expect, it, vi } from "vitest";
import type { List } from "../domain/list.js";
import { InMemoryListRepository } from "../infrastructure/InMemoryListRepository.js";
import { ListStatusTransitionError } from "./errors.js";
import { UpdateListStatus } from "./UpdateListStatus.js";

describe("UpdateListStatus", () => {
  it("updates status when transition is allowed", async () => {
    const listRepository = new InMemoryListRepository();
    const useCase = new UpdateListStatus(listRepository);
    const list: List = {
      id: "list-1",
      ownerUserId: "user-1",
      title: "Weekly groceries",
      isAutosaveDraft: false,
      status: "DRAFT",
      activatedAt: undefined,
      isEditing: false,
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
    const now = new Date("2024-01-02T10:00:00.000Z");

    await listRepository.save(list);

    vi.useFakeTimers();
    vi.setSystemTime(now);

    await expect(
      useCase.execute({
        userId: "user-1",
        listId: "list-1",
        status: "ACTIVE",
      }),
    ).resolves.toEqual({
      id: "list-1",
      status: "ACTIVE",
      updatedAt: now.toISOString(),
    });

    await expect(listRepository.findById("list-1")).resolves.toMatchObject({
      status: "ACTIVE",
      updatedAt: now,
    });

    vi.useRealTimers();
  });

  it("completes an active list and syncs checked items", async () => {
    const listRepository = new InMemoryListRepository();
    const useCase = new UpdateListStatus(listRepository);
    const list: List = {
      id: "list-1",
      ownerUserId: "user-1",
      title: "Weekly groceries",
      isAutosaveDraft: false,
      status: "ACTIVE",
      activatedAt: undefined,
      isEditing: false,
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
        status: "COMPLETED",
        checkedItemIds: ["item-1"],
      }),
    ).resolves.toEqual({
      id: "list-1",
      status: "COMPLETED",
      updatedAt: now.toISOString(),
    });

    await expect(listRepository.findById("list-1")).resolves.toMatchObject({
      status: "COMPLETED",
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
      updatedAt: now,
    });

    vi.useRealTimers();
  });

  it("throws when transition is not allowed", async () => {
    const listRepository = new InMemoryListRepository();
    const useCase = new UpdateListStatus(listRepository);
    const list: List = {
      id: "list-1",
      ownerUserId: "user-1",
      title: "Weekly groceries",
      isAutosaveDraft: false,
      status: "DRAFT",
      activatedAt: undefined,
      isEditing: false,
      items: [],
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      updatedAt: new Date("2024-01-01T10:00:00.000Z"),
    };

    await listRepository.save(list);

    await expect(
      useCase.execute({
        userId: "user-1",
        listId: "list-1",
        status: "COMPLETED",
      }),
    ).rejects.toBeInstanceOf(ListStatusTransitionError);
  });

  it("throws when activating a list without items", async () => {
    const listRepository = new InMemoryListRepository();
    const useCase = new UpdateListStatus(listRepository);
    const list: List = {
      id: "list-1",
      ownerUserId: "user-1",
      title: "Weekly groceries",
      isAutosaveDraft: false,
      status: "DRAFT",
      activatedAt: undefined,
      isEditing: false,
      items: [],
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      updatedAt: new Date("2024-01-01T10:00:00.000Z"),
    };

    await listRepository.save(list);

    await expect(
      useCase.execute({
        userId: "user-1",
        listId: "list-1",
        status: "ACTIVE",
      }),
    ).rejects.toBeInstanceOf(ListStatusTransitionError);
  });
});
