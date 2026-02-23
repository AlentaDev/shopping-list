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
  it("applies the latest autosave draft to an active list and clears it", async () => {
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
      isEditing: true,
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
    const clearedDraft = await listRepository.findById("draft-1");

    expect(updatedActive).toMatchObject({
      title: "Weekly updated",
      isEditing: false,
      items: [
        expect.objectContaining({
          id: "list-1:123",
          listId: "list-1",
          checked: false,
        }),
      ],
      updatedAt: now,
    });
    expect(clearedDraft).toMatchObject({
      id: "draft-1",
      isAutosaveDraft: true,
      title: "",
      isEditing: false,
      items: [],
      updatedAt: now,
    });

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

  it("keeps exactly one reusable autosave draft after finishing edit", async () => {
    const listRepository = new InMemoryListRepository();
    const useCase = new FinishListEdit(listRepository);
    const now = new Date("2024-01-03T10:00:00.000Z");

    await listRepository.save({
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
    });

    await listRepository.save({
      id: "draft-old",
      ownerUserId: "user-1",
      title: "Old draft",
      isAutosaveDraft: true,
      status: "DRAFT",
      activatedAt: undefined,
      isEditing: false,
      items: [],
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      updatedAt: new Date("2024-01-01T10:00:00.000Z"),
    });

    await listRepository.save({
      id: "draft-latest",
      ownerUserId: "user-1",
      title: "Latest draft",
      isAutosaveDraft: true,
      status: "DRAFT",
      activatedAt: undefined,
      isEditing: false,
      items: [
        {
          id: "item-1",
          listId: "draft-latest",
          kind: "manual",
          name: "Milk",
          qty: 2,
          checked: false,
          createdAt: new Date("2024-01-02T10:00:00.000Z"),
          updatedAt: new Date("2024-01-02T10:00:00.000Z"),
        },
      ],
      createdAt: new Date("2024-01-02T10:00:00.000Z"),
      updatedAt: new Date("2024-01-02T10:00:00.000Z"),
    });

    vi.useFakeTimers();
    vi.setSystemTime(now);

    await useCase.execute({ userId: "user-1", listId: "list-1" });

    const remainingAutosaveDrafts = (await listRepository.listByOwner("user-1")).filter(
      (list) => list.isAutosaveDraft,
    );

    expect(remainingAutosaveDrafts).toHaveLength(1);
    expect(remainingAutosaveDrafts[0]).toMatchObject({
      id: "draft-latest",
      title: "",
      items: [],
      updatedAt: now,
    });

    vi.useRealTimers();
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

  it("normalizes nested autosave ids when applying draft to active list", async () => {
    const listRepository = new InMemoryListRepository();
    const useCase = new FinishListEdit(listRepository);

    await listRepository.save({
      id: "active-1",
      ownerUserId: "user-1",
      title: "Activa",
      isAutosaveDraft: false,
      status: "ACTIVE",
      activatedAt: new Date("2024-01-01T09:00:00.000Z"),
      isEditing: true,
      items: [],
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      updatedAt: new Date("2024-01-01T10:00:00.000Z"),
    });

    await listRepository.save({
      id: "autosave-1",
      ownerUserId: "user-1",
      title: "Activa editada",
      isAutosaveDraft: true,
      status: "DRAFT",
      activatedAt: undefined,
      isEditing: true,
      items: [
        {
          id: "autosave-1:active-1:4241",
          listId: "autosave-1",
          kind: "catalog",
          source: "mercadona",
          sourceProductId: "active-1:4241",
          nameSnapshot: "Aceite",
          thumbnailSnapshot: null,
          priceSnapshot: 1.2,
          unitSizeSnapshot: null,
          unitFormatSnapshot: null,
          unitPricePerUnitSnapshot: null,
          isApproxSizeSnapshot: false,
          qty: 1,
          checked: false,
          createdAt: new Date("2024-01-02T10:00:00.000Z"),
          updatedAt: new Date("2024-01-02T10:00:00.000Z"),
        },
      ],
      createdAt: new Date("2024-01-02T10:00:00.000Z"),
      updatedAt: new Date("2024-01-02T10:00:00.000Z"),
    });

    await useCase.execute({ userId: "user-1", listId: "active-1" });

    const updatedActive = await listRepository.findById("active-1");
    expect(updatedActive?.items[0]).toEqual(
      expect.objectContaining({
        id: "active-1:4241",
        sourceProductId: "4241",
      }),
    );
  });
});
