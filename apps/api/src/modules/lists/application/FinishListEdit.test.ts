import { describe, expect, it, vi } from "vitest";
import type { List } from "../domain/list.js";
import { InMemoryListRepository } from "../infrastructure/InMemoryListRepository.js";
import {
  ListForbiddenError,
  ListNotFoundError,
  ListStatusTransitionError,
} from "./errors.js";
import { FinishListEdit } from "./FinishListEdit.js";

describe("FinishListEdit", () => {
  it("applies the latest autosave draft to an active list", async () => {
    const listRepository = new InMemoryListRepository();
    const useCase = new FinishListEdit(listRepository);
    const activeList: List = {
      id: "list-1",
      ownerUserId: "user-1",
      title: "Weekly",
      isAutosaveDraft: false,
      status: "ACTIVE",
      activatedAt: new Date("2024-01-01T09:00:00.000Z"),
      isEditing: true,
      items: [
        {
          id: "item-1",
          listId: "list-1",
          kind: "manual",
          name: "Milk",
          qty: 1,
          checked: true,
          createdAt: new Date("2024-01-01T10:00:00.000Z"),
          updatedAt: new Date("2024-01-01T10:00:00.000Z"),
        },
      ],
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      updatedAt: new Date("2024-01-01T10:00:00.000Z"),
    };
    const autosaveDraft: List = {
      id: "draft-1",
      ownerUserId: "user-1",
      title: "Weekly updated",
      isAutosaveDraft: true,
      status: "DRAFT",
      activatedAt: undefined,
      isEditing: false,
      items: [
        {
          id: "item-2",
          listId: "draft-1",
          kind: "catalog",
          source: "mercadona",
          sourceProductId: "123",
          nameSnapshot: "Bread",
          thumbnailSnapshot: null,
          priceSnapshot: 1.2,
          unitSizeSnapshot: 1,
          unitFormatSnapshot: "kg",
          unitPricePerUnitSnapshot: 1.2,
          isApproxSizeSnapshot: false,
          qty: 2,
          checked: false,
          note: undefined,
          createdAt: new Date("2024-01-02T10:00:00.000Z"),
          updatedAt: new Date("2024-01-02T10:00:00.000Z"),
        },
      ],
      createdAt: new Date("2024-01-02T10:00:00.000Z"),
      updatedAt: new Date("2024-01-02T10:00:00.000Z"),
    };
    const now = new Date("2024-01-03T10:00:00.000Z");

    await listRepository.save(activeList);
    await listRepository.save(autosaveDraft);

    vi.useFakeTimers();
    vi.setSystemTime(now);

    await expect(
      useCase.execute({ userId: "user-1", listId: "list-1" }),
    ).resolves.toMatchObject({
      id: "list-1",
      title: "Weekly updated",
      status: "ACTIVE",
      itemCount: 1,
      isEditing: false,
    });

    const updatedActive = await listRepository.findById("list-1");
    const removedDraft = await listRepository.findById("draft-1");

    expect(updatedActive).toMatchObject({
      title: "Weekly updated",
      isEditing: false,
      items: [
        expect.objectContaining({
          id: "item-2",
          listId: "list-1",
          checked: false,
        }),
      ],
      updatedAt: now,
    });
    expect(removedDraft).toBeNull();

    vi.useRealTimers();
  });

  it("throws when there is no autosave draft", async () => {
    const listRepository = new InMemoryListRepository();
    const useCase = new FinishListEdit(listRepository);
    const activeList: List = {
      id: "list-1",
      ownerUserId: "user-1",
      title: "Weekly",
      isAutosaveDraft: false,
      status: "ACTIVE",
      activatedAt: new Date("2024-01-01T09:00:00.000Z"),
      isEditing: true,
      items: [],
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      updatedAt: new Date("2024-01-01T10:00:00.000Z"),
    };

    await listRepository.save(activeList);

    await expect(
      useCase.execute({ userId: "user-1", listId: "list-1" }),
    ).rejects.toBeInstanceOf(ListStatusTransitionError);
  });

  it("throws when list is missing or owned by another user", async () => {
    const listRepository = new InMemoryListRepository();
    const useCase = new FinishListEdit(listRepository);

    await expect(
      useCase.execute({ userId: "user-1", listId: "missing" }),
    ).rejects.toBeInstanceOf(ListNotFoundError);

    const activeList: List = {
      id: "list-1",
      ownerUserId: "user-1",
      title: "Weekly",
      isAutosaveDraft: false,
      status: "ACTIVE",
      activatedAt: new Date("2024-01-01T09:00:00.000Z"),
      isEditing: true,
      items: [],
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      updatedAt: new Date("2024-01-01T10:00:00.000Z"),
    };
    const autosaveDraft: List = {
      id: "draft-1",
      ownerUserId: "user-1",
      title: "Weekly",
      isAutosaveDraft: true,
      status: "DRAFT",
      activatedAt: undefined,
      isEditing: false,
      items: [],
      createdAt: new Date("2024-01-02T10:00:00.000Z"),
      updatedAt: new Date("2024-01-02T10:00:00.000Z"),
    };

    await listRepository.save(activeList);
    await listRepository.save(autosaveDraft);

    await expect(
      useCase.execute({ userId: "user-2", listId: "list-1" }),
    ).rejects.toBeInstanceOf(ListForbiddenError);
  });
});
