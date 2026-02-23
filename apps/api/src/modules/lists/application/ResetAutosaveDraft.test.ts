import { describe, expect, it } from "vitest";
import type { List } from "../domain/list.js";
import { InMemoryListRepository } from "../infrastructure/InMemoryListRepository.js";
import { ResetAutosaveDraft } from "./ResetAutosaveDraft.js";

describe("ResetAutosaveDraft", () => {
  it("clears and keeps only the latest autosave draft for the user", async () => {
    const repository = new InMemoryListRepository();
    const useCase = new ResetAutosaveDraft(repository);
    const olderAutosave: List = {
      id: "list-1",
      ownerUserId: "user-1",
      title: "Autosave older",
      isAutosaveDraft: true,
      status: "DRAFT",
      activatedAt: undefined,
      isEditing: true,
      editingTargetListId: "active-1",
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
      isEditing: true,
      editingTargetListId: "active-2",
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
    const previousUpdatedAt = latestAutosave.updatedAt.getTime();

    await expect(
      useCase.execute({ userId: "user-1" }),
    ).resolves.toEqual({ ok: true, draftId: "list-2" });

    await expect(repository.findById("list-1")).resolves.toBeNull();
    const cleanedAutosave = await repository.findById("list-2");
    expect(cleanedAutosave).not.toBeNull();
    expect(cleanedAutosave).toMatchObject({
      id: "list-2",
      ownerUserId: "user-1",
      title: "",
      isAutosaveDraft: true,
      status: "DRAFT",
      isEditing: false,
      editingTargetListId: null,
      items: [],
    });
    expect(cleanedAutosave?.updatedAt.getTime()).toBeGreaterThanOrEqual(
      previousUpdatedAt,
    );
    await expect(repository.findById("list-3")).resolves.toEqual(activeList);
    await expect(repository.findById("list-4")).resolves.toEqual(otherUserAutosave);
  });

  it("resets the explicit target draft id when provided", async () => {
    const repository = new InMemoryListRepository();
    const useCase = new ResetAutosaveDraft(repository);

    await repository.save({
      id: "draft-a",
      ownerUserId: "user-1",
      title: "Autosave A",
      isAutosaveDraft: true,
      status: "DRAFT",
      activatedAt: undefined,
      isEditing: true,
      editingTargetListId: "active-a",
      items: [],
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      updatedAt: new Date("2024-01-01T10:00:00.000Z"),
    });

    await repository.save({
      id: "draft-b",
      ownerUserId: "user-1",
      title: "Autosave B",
      isAutosaveDraft: true,
      status: "DRAFT",
      activatedAt: undefined,
      isEditing: true,
      editingTargetListId: "active-b",
      items: [],
      createdAt: new Date("2024-01-02T10:00:00.000Z"),
      updatedAt: new Date("2024-01-02T10:00:00.000Z"),
    });

    await expect(
      useCase.execute({ userId: "user-1", targetDraftId: "draft-a" }),
    ).resolves.toEqual({ ok: true, draftId: "draft-a" });

    const draftA = await repository.findById("draft-a");
    expect(draftA).toMatchObject({
      title: "",
      items: [],
      isEditing: false,
      editingTargetListId: null,
    });
    await expect(repository.findById("draft-b")).resolves.toBeNull();
  });

  it("returns ok when there are no autosave drafts", async () => {
    const repository = new InMemoryListRepository();
    const useCase = new ResetAutosaveDraft(repository);
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

    await expect(useCase.execute({ userId: "user-1" })).resolves.toEqual({
      ok: true,
      draftId: null,
    });
    await expect(repository.findById("list-1")).resolves.toEqual(list);
  });
});
