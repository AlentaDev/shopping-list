import { describe, expect, it, vi } from "vitest";
import type { List } from "../domain/list.js";
import { InMemoryListRepository } from "../infrastructure/InMemoryListRepository.js";
import { UpsertAutosaveDraft } from "./UpsertAutosaveDraft.js";

describe("UpsertAutosaveDraft", () => {
  it("creates a new autosave draft when none exists", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = {
      generate: vi.fn().mockReturnValueOnce("list-1").mockReturnValueOnce("item-1"),
    };
    const useCase = new UpsertAutosaveDraft(listRepository, idGenerator);

    const response = await useCase.execute({
      userId: "user-1",
      title: "Autosave",
      items: [
        {
          id: "product-1",
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
    const idGenerator = {
      generate: vi.fn().mockReturnValueOnce("item-2"),
    };
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
      items: [
        {
          id: "product-2",
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
});
