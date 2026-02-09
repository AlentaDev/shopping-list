import { describe, expect, it, vi } from "vitest";
import type { List } from "../domain/list.js";
import { InMemoryListRepository } from "../infrastructure/InMemoryListRepository.js";
import { ListStatusTransitionError } from "./errors.js";
import { UpdateListStatus } from "./UpdateListStatus.js";

describe("UpdateListStatus", () => {
  it("updates status when transition is allowed", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: vi.fn().mockReturnValue("draft-2") };
    const useCase = new UpdateListStatus(listRepository, idGenerator);
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

  it("clears autosave flag and sets activation time", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: vi.fn().mockReturnValue("draft-2") };
    const useCase = new UpdateListStatus(listRepository, idGenerator);
    const list: List = {
      id: "list-2",
      ownerUserId: "user-1",
      title: "Autosave list",
      isAutosaveDraft: true,
      status: "DRAFT",
      activatedAt: undefined,
      isEditing: false,
      items: [
        {
          id: "item-1",
          listId: "list-2",
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
    const now = new Date("2024-01-03T10:00:00.000Z");

    await listRepository.save(list);

    vi.useFakeTimers();
    vi.setSystemTime(now);

    await expect(
      useCase.execute({
        userId: "user-1",
        listId: "list-2",
        status: "ACTIVE",
      }),
    ).resolves.toEqual({
      id: "list-2",
      status: "ACTIVE",
      updatedAt: now.toISOString(),
    });

    await expect(listRepository.findById("list-2")).resolves.toMatchObject({
      status: "ACTIVE",
      isAutosaveDraft: false,
      activatedAt: now,
    });

    vi.useRealTimers();
  });

  it("throws when transition is not allowed", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: vi.fn() };
    const useCase = new UpdateListStatus(listRepository, idGenerator);
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

  it("throws when trying to complete an active list", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: vi.fn() };
    const useCase = new UpdateListStatus(listRepository, idGenerator);
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
      ],
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
    const idGenerator = { generate: vi.fn() };
    const useCase = new UpdateListStatus(listRepository, idGenerator);
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

  it("creates a new empty draft after activation", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: vi.fn().mockReturnValue("draft-2") };
    const useCase = new UpdateListStatus(listRepository, idGenerator);
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
    const now = new Date("2024-01-04T10:00:00.000Z");

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

    const lists = await listRepository.listByOwner("user-1");
    const draft = lists.find(
      (savedList) => savedList.status === "DRAFT" && !savedList.isAutosaveDraft,
    );

    expect(draft).toMatchObject({
      id: "draft-2",
      ownerUserId: "user-1",
      title: "Weekly groceries",
      status: "DRAFT",
      isAutosaveDraft: false,
      items: [],
      isEditing: false,
      createdAt: now,
      updatedAt: now,
    });

    expect(idGenerator.generate).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
