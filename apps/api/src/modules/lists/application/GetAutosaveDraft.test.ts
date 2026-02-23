import { describe, expect, it } from "vitest";
import type { List } from "../domain/list.js";
import { InMemoryListRepository } from "../infrastructure/InMemoryListRepository.js";
import { GetAutosaveDraft } from "./GetAutosaveDraft.js";

describe("GetAutosaveDraft", () => {
  it("returns null when there is no autosave draft", async () => {
    const listRepository = new InMemoryListRepository();
    const useCase = new GetAutosaveDraft(listRepository);
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

    await expect(useCase.execute("user-1")).resolves.toBeNull();
  });

  it("returns the latest autosave draft for the user", async () => {
    const listRepository = new InMemoryListRepository();
    const useCase = new GetAutosaveDraft(listRepository);
    const olderAutosave: List = {
      id: "list-1",
      ownerUserId: "user-1",
      title: "Autosave older",
      isAutosaveDraft: true,
      status: "DRAFT",
      activatedAt: undefined,
      isEditing: false,
      items: [],
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      updatedAt: new Date("2024-01-01T10:01:00.000Z"),
    };
    const latestAutosave: List = {
      id: "list-2",
      ownerUserId: "user-1",
      title: "Autosave latest",
      isAutosaveDraft: true,
      status: "DRAFT",
      activatedAt: undefined,
      isEditing: false,
      items: [],
      createdAt: new Date("2024-01-01T11:00:00.000Z"),
      updatedAt: new Date("2024-01-01T11:10:00.000Z"),
    };
    const otherUserAutosave: List = {
      id: "list-3",
      ownerUserId: "user-2",
      title: "Other autosave",
      isAutosaveDraft: true,
      status: "DRAFT",
      activatedAt: undefined,
      isEditing: false,
      items: [],
      createdAt: new Date("2024-01-01T12:00:00.000Z"),
      updatedAt: new Date("2024-01-01T12:10:00.000Z"),
    };

    await listRepository.save(olderAutosave);
    await listRepository.save(latestAutosave);
    await listRepository.save(otherUserAutosave);

    await expect(useCase.execute("user-1")).resolves.toEqual({
      id: "list-2",
      title: "Autosave latest",
      isEditing: false,
      items: [],
      updatedAt: "2024-01-01T11:10:00.000Z",
      editingTargetListId: null,
    });
  });

  it("returns cleaned autosave draft instead of null", async () => {
    const listRepository = new InMemoryListRepository();
    const useCase = new GetAutosaveDraft(listRepository);
    const cleanedAutosave: List = {
      id: "list-1",
      ownerUserId: "user-1",
      title: "",
      isAutosaveDraft: true,
      status: "DRAFT",
      activatedAt: undefined,
      isEditing: false,
      items: [],
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      updatedAt: new Date("2024-01-01T10:01:00.000Z"),
    };

    await listRepository.save(cleanedAutosave);

    await expect(useCase.execute("user-1")).resolves.toEqual({
      id: "list-1",
      title: "",
      isEditing: false,
      items: [],
      updatedAt: "2024-01-01T10:01:00.000Z",
      editingTargetListId: null,
    });
  });

  it("returns editing state from latest autosave draft", async () => {
    const listRepository = new InMemoryListRepository();
    const useCase = new GetAutosaveDraft(listRepository);
    const editingAutosave: List = {
      id: "list-1",
      ownerUserId: "user-1",
      title: "Autosave editing",
      isAutosaveDraft: true,
      status: "DRAFT",
      activatedAt: undefined,
      isEditing: true,
      editingTargetListId: "active-1",
      items: [],
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      updatedAt: new Date("2024-01-01T10:01:00.000Z"),
    };

    await listRepository.save(editingAutosave);

    await expect(useCase.execute("user-1")).resolves.toEqual({
      id: "list-1",
      title: "Autosave editing",
      isEditing: true,
      editingTargetListId: "active-1",
      items: [],
      updatedAt: "2024-01-01T10:01:00.000Z",
    });
  });

});
