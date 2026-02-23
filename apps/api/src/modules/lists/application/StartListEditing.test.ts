import { describe, expect, it, vi } from "vitest";
import type { List } from "../domain/list.js";
import { InMemoryListRepository } from "../infrastructure/InMemoryListRepository.js";
import {
  ListForbiddenError,
  ListNotFoundError,
  ListStatusTransitionError,
} from "./errors.js";
import { StartListEditing } from "./StartListEditing.js";

describe("StartListEditing", () => {
  it("marks an active list as editing", async () => {
    const listRepository = new InMemoryListRepository();
    const useCase = new StartListEditing(listRepository);
    const list: List = {
      id: "list-1",
      ownerUserId: "user-1",
      title: "Weekly groceries",
      isAutosaveDraft: false,
      status: "ACTIVE",
      activatedAt: new Date("2024-01-01T09:00:00.000Z"),
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
      useCase.execute({ userId: "user-1", listId: "list-1", isEditing: true }),
    ).resolves.toEqual({
      id: "list-1",
      isEditing: true,
      updatedAt: now.toISOString(),
      autosaveUpdatedAt: now.toISOString(),
    });

    await expect(listRepository.findById("list-1")).resolves.toMatchObject({
      isEditing: true,
      updatedAt: now,
    });

    await expect(listRepository.listByOwner("user-1")).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          isAutosaveDraft: true,
          isEditing: true,
        }),
      ]),
    );

    vi.useRealTimers();
  });

  it("throws when list is not active", async () => {
    const listRepository = new InMemoryListRepository();
    const useCase = new StartListEditing(listRepository);
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
      useCase.execute({ userId: "user-1", listId: "list-1", isEditing: true }),
    ).rejects.toBeInstanceOf(ListStatusTransitionError);
  });

  it("throws when list does not exist", async () => {
    const listRepository = new InMemoryListRepository();
    const useCase = new StartListEditing(listRepository);

    await expect(
      useCase.execute({ userId: "user-1", listId: "missing", isEditing: true }),
    ).rejects.toBeInstanceOf(ListNotFoundError);
  });

  it("throws when list belongs to another user", async () => {
    const listRepository = new InMemoryListRepository();
    const useCase = new StartListEditing(listRepository);
    const list: List = {
      id: "list-1",
      ownerUserId: "user-1",
      title: "Weekly groceries",
      isAutosaveDraft: false,
      status: "ACTIVE",
      activatedAt: new Date("2024-01-01T09:00:00.000Z"),
      isEditing: false,
      items: [],
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      updatedAt: new Date("2024-01-01T10:00:00.000Z"),
    };

    await listRepository.save(list);

    await expect(
      useCase.execute({ userId: "user-2", listId: "list-1", isEditing: true }),
    ).rejects.toBeInstanceOf(ListForbiddenError);
  });

  it("allows disabling editing on an active list", async () => {
    const listRepository = new InMemoryListRepository();
    const useCase = new StartListEditing(listRepository);
    const list: List = {
      id: "list-1",
      ownerUserId: "user-1",
      title: "Weekly groceries",
      isAutosaveDraft: false,
      status: "ACTIVE",
      activatedAt: new Date("2024-01-01T09:00:00.000Z"),
      isEditing: true,
      items: [],
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      updatedAt: new Date("2024-01-01T10:00:00.000Z"),
    };
    const now = new Date("2024-01-03T10:00:00.000Z");

    await listRepository.save(list);

    vi.useFakeTimers();
    vi.setSystemTime(now);

    await expect(
      useCase.execute({ userId: "user-1", listId: "list-1", isEditing: false }),
    ).resolves.toEqual({
      id: "list-1",
      isEditing: false,
      updatedAt: now.toISOString(),
      autosaveUpdatedAt: now.toISOString(),
    });

    await expect(listRepository.findById("list-1")).resolves.toMatchObject({
      isEditing: false,
      updatedAt: now,
    });

    vi.useRealTimers();
  });

  it("creates an autosave draft when starting editing and none exists", async () => {
    const listRepository = new InMemoryListRepository();
    const useCase = new StartListEditing(listRepository);
    const activeItemCreatedAt = new Date("2024-01-01T10:03:00.000Z");
    const activeItemUpdatedAt = new Date("2024-01-01T10:04:00.000Z");
    const list: List = {
      id: "active-list",
      ownerUserId: "user-1",
      title: "Weekly groceries",
      isAutosaveDraft: false,
      status: "ACTIVE",
      activatedAt: new Date("2024-01-01T09:00:00.000Z"),
      isEditing: false,
      items: [
        {
          id: "active-item-1",
          listId: "active-list",
          kind: "manual",
          name: "Milk",
          qty: 2,
          checked: false,
          createdAt: activeItemCreatedAt,
          updatedAt: activeItemUpdatedAt,
        },
        {
          id: "active-list:123",
          listId: "active-list",
          kind: "catalog",
          source: "mercadona",
          sourceProductId: "active-list:123",
          nameSnapshot: "Whole Milk",
          thumbnailSnapshot: null,
          priceSnapshot: 1.2,
          unitSizeSnapshot: null,
          unitFormatSnapshot: null,
          unitPricePerUnitSnapshot: null,
          isApproxSizeSnapshot: false,
          qty: 1,
          checked: false,
          createdAt: activeItemCreatedAt,
          updatedAt: activeItemUpdatedAt,
        },
      ],
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      updatedAt: new Date("2024-01-01T10:00:00.000Z"),
    };

    await listRepository.save(list);

    await useCase.execute({
      userId: "user-1",
      listId: "active-list",
      isEditing: true,
    });

    await expect(listRepository.listByOwner("user-1")).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          isAutosaveDraft: true,
          isEditing: true,
          editingTargetListId: "active-list",
          status: "DRAFT",
          items: expect.arrayContaining([
            expect.objectContaining({
              id: "active-item-1",
              listId: expect.any(String),
              name: "Milk",
              qty: 2,
            }),
            expect.objectContaining({
              id: expect.stringMatching(/:123$/),
              listId: expect.any(String),
              sourceProductId: "123",
            }),
          ]),
        }),
      ]),
    );
  });


  it("reuses the existing autosave draft instead of creating a new one", async () => {
    const listRepository = new InMemoryListRepository();
    const useCase = new StartListEditing(listRepository);
    const activeList: List = {
      id: "active-list",
      ownerUserId: "user-1",
      title: "Weekly groceries",
      isAutosaveDraft: false,
      status: "ACTIVE",
      activatedAt: new Date("2024-01-01T09:00:00.000Z"),
      isEditing: false,
      items: [],
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      updatedAt: new Date("2024-01-01T10:00:00.000Z"),
    };
    const existingDraft: List = {
      id: "autosave-existing",
      ownerUserId: "user-1",
      title: "Autosave",
      isAutosaveDraft: true,
      status: "DRAFT",
      activatedAt: undefined,
      isEditing: false,
      items: [],
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      updatedAt: new Date("2024-01-01T10:01:00.000Z"),
    };

    await listRepository.save(activeList);
    await listRepository.save(existingDraft);

    await useCase.execute({
      userId: "user-1",
      listId: "active-list",
      isEditing: true,
    });

    const userDrafts = (await listRepository.listByOwner("user-1")).filter(
      (list) => list.isAutosaveDraft,
    );

    expect(userDrafts).toHaveLength(1);
    expect(userDrafts[0]).toMatchObject({
      id: "autosave-existing",
      isEditing: true,
      editingTargetListId: "active-list",
    });
  });

  it("keeps only the latest autosave draft while syncing editing state", async () => {
    const listRepository = new InMemoryListRepository();
    const useCase = new StartListEditing(listRepository);
    const activeList: List = {
      id: "active-list",
      ownerUserId: "user-1",
      title: "Weekly groceries",
      isAutosaveDraft: false,
      status: "ACTIVE",
      activatedAt: new Date("2024-01-01T09:00:00.000Z"),
      isEditing: false,
      items: [],
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      updatedAt: new Date("2024-01-01T10:00:00.000Z"),
    };
    const olderDraft: List = {
      id: "autosave-old",
      ownerUserId: "user-1",
      title: "Old",
      isAutosaveDraft: true,
      status: "DRAFT",
      activatedAt: undefined,
      isEditing: false,
      items: [],
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      updatedAt: new Date("2024-01-01T10:01:00.000Z"),
    };
    const latestDraft: List = {
      id: "autosave-latest",
      ownerUserId: "user-1",
      title: "Latest",
      isAutosaveDraft: true,
      status: "DRAFT",
      activatedAt: undefined,
      isEditing: false,
      items: [],
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      updatedAt: new Date("2024-01-01T10:02:00.000Z"),
    };

    await listRepository.save(activeList);
    await listRepository.save(olderDraft);
    await listRepository.save(latestDraft);

    await useCase.execute({
      userId: "user-1",
      listId: "active-list",
      isEditing: true,
    });

    const userLists = await listRepository.listByOwner("user-1");
    expect(userLists.find((list) => list.id === "autosave-old")).toBeUndefined();
    expect(userLists.find((list) => list.id === "autosave-latest")).toMatchObject({
      isEditing: true,
      editingTargetListId: "active-list",
    });
  });
});
