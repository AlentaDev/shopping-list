import { describe, expect, it } from "vitest";
import type { List } from "../domain/list.js";
import { InMemoryListRepository } from "../infrastructure/InMemoryListRepository.js";
import { DiscardAutosaveDraft } from "./DiscardAutosaveDraft.js";

describe("DiscardAutosaveDraft", () => {
  it("deletes the latest autosave draft for the user", async () => {
    const repository = new InMemoryListRepository();
    const useCase = new DiscardAutosaveDraft(repository);
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
      updatedAt: new Date("2024-01-02T10:00:00.000Z"),
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
      createdAt: new Date("2024-01-03T10:00:00.000Z"),
      updatedAt: new Date("2024-01-04T10:00:00.000Z"),
    };
    const activeList: List = {
      id: "list-3",
      ownerUserId: "user-1",
      title: "Active list",
      isAutosaveDraft: false,
      status: "ACTIVE",
      activatedAt: undefined,
      isEditing: false,
      items: [],
      createdAt: new Date("2024-01-05T10:00:00.000Z"),
      updatedAt: new Date("2024-01-06T10:00:00.000Z"),
    };
    const otherUserAutosave: List = {
      id: "list-4",
      ownerUserId: "user-2",
      title: "Other autosave",
      isAutosaveDraft: true,
      status: "DRAFT",
      activatedAt: undefined,
      isEditing: false,
      items: [],
      createdAt: new Date("2024-01-07T10:00:00.000Z"),
      updatedAt: new Date("2024-01-08T10:00:00.000Z"),
    };

    await repository.save(olderAutosave);
    await repository.save(latestAutosave);
    await repository.save(activeList);
    await repository.save(otherUserAutosave);

    await expect(useCase.execute("user-1")).resolves.toEqual({ ok: true });

    await expect(repository.findById("list-1")).resolves.toEqual(olderAutosave);
    await expect(repository.findById("list-2")).resolves.toBeNull();
    await expect(repository.findById("list-3")).resolves.toEqual(activeList);
    await expect(repository.findById("list-4")).resolves.toEqual(otherUserAutosave);
  });

  it("returns ok when there are no autosave drafts", async () => {
    const repository = new InMemoryListRepository();
    const useCase = new DiscardAutosaveDraft(repository);
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

    await repository.save(list);

    await expect(useCase.execute("user-1")).resolves.toEqual({ ok: true });
    await expect(repository.findById("list-1")).resolves.toEqual(list);
  });
});
