import { describe, expect, it, vi } from "vitest";
import type { List } from "../domain/list.js";
import { InMemoryListRepository } from "../infrastructure/InMemoryListRepository.js";
import { CreateList } from "./CreateList.js";

describe("CreateList", () => {
  it("creates a new draft list when no draft exists", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: vi.fn().mockReturnValue("list-1") };
    const useCase = new CreateList(listRepository, idGenerator);
    const now = new Date("2024-01-02T10:00:00.000Z");

    vi.useFakeTimers();
    vi.setSystemTime(now);

    await expect(
      useCase.execute({ userId: "user-1", title: "Weekly groceries" }),
    ).resolves.toEqual({
      id: "list-1",
      title: "Weekly groceries",
      itemCount: 0,
      activatedAt: null,
      isEditing: false,
      updatedAt: now.toISOString(),
      status: "DRAFT",
    });

    await expect(listRepository.findById("list-1")).resolves.toMatchObject({
      id: "list-1",
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

  it("reuses an existing draft list instead of creating a new one", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: vi.fn() };
    const useCase = new CreateList(listRepository, idGenerator);
    const existingDraft: List = {
      id: "draft-1",
      ownerUserId: "user-1",
      title: "Old title",
      isAutosaveDraft: false,
      status: "DRAFT",
      activatedAt: undefined,
      isEditing: true,
      items: [
        {
          id: "item-1",
          listId: "draft-1",
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

    await listRepository.save(existingDraft);

    vi.useFakeTimers();
    vi.setSystemTime(now);

    await expect(
      useCase.execute({ userId: "user-1", title: "Weekly groceries" }),
    ).resolves.toEqual({
      id: "draft-1",
      title: "Weekly groceries",
      itemCount: 0,
      activatedAt: null,
      isEditing: false,
      updatedAt: now.toISOString(),
      status: "DRAFT",
    });

    await expect(listRepository.findById("draft-1")).resolves.toMatchObject({
      id: "draft-1",
      ownerUserId: "user-1",
      title: "Weekly groceries",
      status: "DRAFT",
      isAutosaveDraft: false,
      items: [],
      isEditing: false,
      createdAt: existingDraft.createdAt,
      updatedAt: now,
    });

    expect(idGenerator.generate).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("ignores autosave drafts when creating a new list", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: vi.fn().mockReturnValue("list-2") };
    const useCase = new CreateList(listRepository, idGenerator);
    const autosaveDraft: List = {
      id: "autosave-1",
      ownerUserId: "user-1",
      title: "Autosave",
      isAutosaveDraft: true,
      status: "DRAFT",
      activatedAt: undefined,
      isEditing: false,
      items: [],
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      updatedAt: new Date("2024-01-01T10:00:00.000Z"),
    };
    const now = new Date("2024-01-04T10:00:00.000Z");

    await listRepository.save(autosaveDraft);

    vi.useFakeTimers();
    vi.setSystemTime(now);

    await expect(
      useCase.execute({ userId: "user-1", title: "Weekly groceries" }),
    ).resolves.toMatchObject({
      id: "list-2",
      title: "Weekly groceries",
      itemCount: 0,
      status: "DRAFT",
    });

    await expect(listRepository.findById("list-2")).resolves.toMatchObject({
      id: "list-2",
      ownerUserId: "user-1",
      title: "Weekly groceries",
      status: "DRAFT",
      isAutosaveDraft: false,
    });

    expect(idGenerator.generate).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
