import { describe, expect, it } from "vitest";
import type { List } from "../domain/list.js";
import { AutosaveVersionConflictError } from "./errors.js";
import { InMemoryListRepository } from "../infrastructure/InMemoryListRepository.js";
import { UpsertAutosaveDraft } from "./UpsertAutosaveDraft.js";

describe("UpsertAutosaveDraft", () => {
  it("creates a new autosave draft when none exists", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: () => "list-1" };
    const useCase = new UpsertAutosaveDraft(listRepository, idGenerator);

    const response = await useCase.execute({
      userId: "user-1",
      title: "Autosave",
      baseUpdatedAt: "2024-01-01T09:00:00.000Z",
      items: [
        {
          id: "item-1",
          kind: "manual",
          name: "Milk",
          qty: 2,
          checked: false,
        },
      ],
    });

    expect(response).toEqual({
      id: "list-1",
      title: "Autosave",
      updatedAt: expect.any(String),
    });

    const savedList = await listRepository.findById("list-1");
    expect(savedList).not.toBeNull();
    expect(savedList).toEqual(
      expect.objectContaining({
        id: "list-1",
        ownerUserId: "user-1",
        title: "Autosave",
        isAutosaveDraft: true,
        status: "DRAFT",
        items: [
          expect.objectContaining({
            id: "item-1",
            listId: "list-1",
            kind: "manual",
            name: "Milk",
            qty: 2,
            checked: false,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          }),
        ],
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }),
    );
  });

  it("updates the latest autosave draft for the user", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: () => "list-new" };
    const useCase = new UpsertAutosaveDraft(listRepository, idGenerator);
    const olderDraft: List = {
      id: "list-1",
      ownerUserId: "user-1",
      title: "Older autosave",
      isAutosaveDraft: true,
      status: "DRAFT",
      activatedAt: undefined,
      isEditing: false,
      items: [],
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      updatedAt: new Date("2024-01-01T10:01:00.000Z"),
    };
    const latestDraft: List = {
      id: "list-2",
      ownerUserId: "user-1",
      title: "Latest autosave",
      isAutosaveDraft: true,
      status: "DRAFT",
      activatedAt: undefined,
      isEditing: false,
      items: [],
      createdAt: new Date("2024-01-01T11:00:00.000Z"),
      updatedAt: new Date("2024-01-01T11:10:00.000Z"),
    };

    await listRepository.save(olderDraft);
    await listRepository.save(latestDraft);

    const response = await useCase.execute({
      userId: "user-1",
      title: "Updated autosave",
      baseUpdatedAt: "2024-01-01T11:10:00.000Z",
      items: [
        {
          id: "item-2",
          kind: "manual",
          name: "Bread",
          qty: 1,
          checked: false,
        },
      ],
    });

    expect(response).toEqual({
      id: "list-2",
      title: "Updated autosave",
      updatedAt: expect.any(String),
    });

    const updatedLatest = await listRepository.findById("list-2");
    expect(updatedLatest).toEqual(
      expect.objectContaining({
        id: "list-2",
        title: "Updated autosave",
        isAutosaveDraft: true,
        status: "DRAFT",
        updatedAt: expect.any(Date),
        items: [
          expect.objectContaining({
            id: "item-2",
            listId: "list-2",
            kind: "manual",
            name: "Bread",
          }),
        ],
      }),
    );
    expect(updatedLatest?.updatedAt.getTime()).toBeGreaterThan(
      new Date("2024-01-01T11:10:00.000Z").getTime(),
    );

    const savedOlder = await listRepository.findById("list-1");
    expect(savedOlder?.title).toBe("Older autosave");
  });

  it("preserves isEditing=true when updating an autosave draft from active editing", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: () => "list-new" };
    const useCase = new UpsertAutosaveDraft(listRepository, idGenerator);
    const latestDraft: List = {
      id: "autosave-editing",
      ownerUserId: "user-1",
      title: "Autosave editing",
      isAutosaveDraft: true,
      status: "DRAFT",
      activatedAt: undefined,
      isEditing: true,
      items: [],
      createdAt: new Date("2024-01-01T11:00:00.000Z"),
      updatedAt: new Date("2024-01-01T11:10:00.000Z"),
    };

    await listRepository.save(latestDraft);

    await useCase.execute({
      userId: "user-1",
      title: "Autosave editing updated",
      baseUpdatedAt: "2024-01-01T11:10:00.000Z",
      items: [
        {
          id: "item-3",
          kind: "manual",
          name: "Huevos",
          qty: 1,
          checked: false,
        },
      ],
    });

    const persistedDraft = await listRepository.findById("autosave-editing");
    expect(persistedDraft).toEqual(
      expect.objectContaining({
        isEditing: true,
        status: "DRAFT",
      }),
    );
  });

  it("throws conflict when baseUpdatedAt does not match latest autosave version", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: () => "list-new" };
    const useCase = new UpsertAutosaveDraft(listRepository, idGenerator);
    const latestDraft: List = {
      id: "list-2",
      ownerUserId: "user-1",
      title: "Latest autosave",
      isAutosaveDraft: true,
      status: "DRAFT",
      activatedAt: undefined,
      isEditing: false,
      items: [],
      createdAt: new Date("2024-01-01T11:00:00.000Z"),
      updatedAt: new Date("2024-01-01T11:10:00.000Z"),
    };

    await listRepository.save(latestDraft);

    await expect(
      useCase.execute({
        userId: "user-1",
        title: "Updated autosave",
        baseUpdatedAt: "2024-01-01T11:09:59.000Z",
        items: [],
      }),
    ).rejects.toEqual(
      new AutosaveVersionConflictError("2024-01-01T11:10:00.000Z"),
    );

    const persistedDraft = await listRepository.findById("list-2");
    expect(persistedDraft).toEqual(latestDraft);
  });



  it("stores autosave catalog item ids scoped by list to avoid global collisions", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: () => "list-1" };
    const useCase = new UpsertAutosaveDraft(listRepository, idGenerator);

    await useCase.execute({
      userId: "user-1",
      title: "Autosave",
      baseUpdatedAt: "2024-01-01T09:00:00.000Z",
      items: [
        {
          id: "4749",
          kind: "catalog",
          name: "Aceite",
          qty: 1,
          checked: false,
          source: "mercadona",
          sourceProductId: "4749",
        },
      ],
    });

    const savedList = await listRepository.findById("list-1");
    expect(savedList?.items[0]).toEqual(
      expect.objectContaining({
        id: "list-1:4749",
        sourceProductId: "4749",
      }),
    );
  });

  it("does not keep chaining prefixes when autosave receives an already-prefixed item id", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: () => "autosave-1" };
    const useCase = new UpsertAutosaveDraft(listRepository, idGenerator);

    await useCase.execute({
      userId: "user-1",
      title: "Autosave",
      baseUpdatedAt: "2024-01-01T09:00:00.000Z",
      items: [
        {
          id: "active-1:4241",
          kind: "catalog",
          name: "Aceite",
          qty: 1,
          checked: false,
          source: "mercadona",
          sourceProductId: "active-1:4241",
        },
      ],
    });

    const savedList = await listRepository.findById("autosave-1");
    expect(savedList?.items[0]).toEqual(
      expect.objectContaining({
        id: "autosave-1:4241",
        sourceProductId: "4241",
      }),
    );
  });
});
