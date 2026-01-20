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
  it("removes autosave drafts for the user", async () => {
    const listRepository = new InMemoryListRepository();
    const useCase = new DiscardAutosaveDraft(listRepository);
    const autosaveDraft: List = {
      id: "list-1",
      ownerUserId: "user-1",
      title: "Autosave",
      isAutosaveDraft: true,
      status: "DRAFT",
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

  it("does nothing when there is no autosave draft", async () => {
    const repository = new InMemoryListRepository();
    const useCase = new DiscardAutosaveDraft(repository);
      updatedAt: new Date("2024-01-01T10:00:00.000Z"),
    };
    const regularList: List = {
      id: "list-2",
      ownerUserId: "user-1",
      title: "Regular",
      isAutosaveDraft: false,
      status: "DRAFT",
      items: [],
      createdAt: new Date("2024-01-01T11:00:00.000Z"),
      updatedAt: new Date("2024-01-01T11:00:00.000Z"),
    };
    const otherUserAutosave: List = {
      id: "list-3",
      ownerUserId: "user-2",
      title: "Other user autosave",
      isAutosaveDraft: true,
      status: "DRAFT",
      items: [],
      createdAt: new Date("2024-01-01T12:00:00.000Z"),
      updatedAt: new Date("2024-01-01T12:00:00.000Z"),
    };

    await listRepository.save(autosaveDraft);
    await listRepository.save(regularList);
    await listRepository.save(otherUserAutosave);

    await expect(useCase.execute("user-1")).resolves.toEqual({
      ok: true,
      removedCount: 1,
    });

    await expect(listRepository.listByOwner("user-1")).resolves.toEqual([
      regularList,
    ]);
    await expect(listRepository.listByOwner("user-2")).resolves.toEqual([
      otherUserAutosave,
    ]);
  });

  it("returns ok when there are no autosave drafts", async () => {
    const listRepository = new InMemoryListRepository();
    const useCase = new DiscardAutosaveDraft(listRepository);
    const list: List = {
      id: "list-1",
      ownerUserId: "user-1",
      title: "Weekly groceries",
      isAutosaveDraft: false,
      status: "ACTIVE",
      status: "DRAFT",
      items: [],
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      updatedAt: new Date("2024-01-01T10:00:00.000Z"),
    };

    await repository.save(list);

    await expect(useCase.execute("user-1")).resolves.toEqual({ ok: true });
    await expect(repository.findById("list-1")).resolves.toEqual(list);
    await listRepository.save(list);

    await expect(useCase.execute("user-1")).resolves.toEqual({
      ok: true,
      removedCount: 0,
    });
  });
});
