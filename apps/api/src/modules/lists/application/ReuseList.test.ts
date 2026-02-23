import { describe, expect, it, vi } from "vitest";
import type { List } from "../domain/list.js";
import { InMemoryListRepository } from "../infrastructure/InMemoryListRepository.js";
import { ReuseList } from "./ReuseList.js";
import { ListStatusTransitionError } from "./errors.js";

const fixedDate = new Date("2024-01-03T10:00:00.000Z");

describe("ReuseList", () => {
  it("reuses a completed list into a draft with unchecked items", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = {
      generate: vi
        .fn()
        .mockReturnValueOnce("list-2")
        .mockReturnValueOnce("item-3"),
    };
    const useCase = new ReuseList(listRepository, idGenerator);
    const list: List = {
      id: "list-1",
      ownerUserId: "user-1",
      title: "Weekly groceries",
      isAutosaveDraft: false,
      status: "COMPLETED",
      activatedAt: undefined,
      isEditing: false,
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
        {
          id: "item-2",
          listId: "list-1",
          kind: "catalog",
          source: "mercadona",
          sourceProductId: "sku-1",
          nameSnapshot: "Bread",
          thumbnailSnapshot: "https://example.com/bread.png",
          priceSnapshot: 1.75,
          unitSizeSnapshot: 500,
          unitFormatSnapshot: "g",
          unitPricePerUnitSnapshot: 3.5,
          isApproxSizeSnapshot: false,
          qty: 2,
          checked: true,
          createdAt: new Date("2024-01-01T10:00:00.000Z"),
          updatedAt: new Date("2024-01-01T10:00:00.000Z"),
        },
      ],
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      updatedAt: new Date("2024-01-01T10:00:00.000Z"),
    };

    await listRepository.save(list);

    vi.useFakeTimers();
    vi.setSystemTime(fixedDate);

    await expect(
      useCase.execute({
        userId: "user-1",
        listId: "list-1",
      }),
    ).resolves.toEqual({
      id: "list-2",
      title: "Weekly groceries",
      status: "DRAFT",
      updatedAt: fixedDate.toISOString(),
      items: [
        {
          id: "item-3",
          kind: "manual",
          name: "Milk",
          qty: 1,
          checked: false,
          updatedAt: fixedDate.toISOString(),
        },
        {
          id: "list-2:sku-1",
          kind: "catalog",
          name: "Bread",
          qty: 2,
          checked: false,
          updatedAt: fixedDate.toISOString(),
          thumbnail: "https://example.com/bread.png",
          price: 1.75,
          unitSize: 500,
          unitFormat: "g",
          unitPrice: 3.5,
          isApproxSize: false,
          source: "mercadona",
          sourceProductId: "sku-1",
        },
      ],
    });

    await expect(listRepository.findById("list-2")).resolves.toMatchObject({
      id: "list-2",
      ownerUserId: "user-1",
      title: "Weekly groceries",
      isAutosaveDraft: false,
      status: "DRAFT",
      createdAt: fixedDate,
      updatedAt: fixedDate,
      items: [
        expect.objectContaining({
          id: "item-3",
          listId: "list-2",
          kind: "manual",
          checked: false,
          createdAt: fixedDate,
          updatedAt: fixedDate,
        }),
        expect.objectContaining({
          id: "list-2:sku-1",
          listId: "list-2",
          kind: "catalog",
          checked: false,
          createdAt: fixedDate,
          updatedAt: fixedDate,
        }),
      ],
    });

    await expect(listRepository.findById("list-1")).resolves.toMatchObject({
      status: "COMPLETED",
      items: [
        expect.objectContaining({
          id: "item-1",
          checked: true,
        }),
        expect.objectContaining({
          id: "item-2",
          checked: true,
        }),
      ],
    });

    vi.useRealTimers();
  });

  it("throws when the list is not completed", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: vi.fn() };
    const useCase = new ReuseList(listRepository, idGenerator);
    const list: List = {
      id: "list-1",
      ownerUserId: "user-1",
      title: "Weekly groceries",
      isAutosaveDraft: false,
      status: "ACTIVE",
      activatedAt: undefined,
      isEditing: false,
      items: [],
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      updatedAt: new Date("2024-01-01T10:00:00.000Z"),
    };

    await listRepository.save(list);

    await expect(
      useCase.execute({
        userId: "user-1",
        listId: "list-1",
      }),
    ).rejects.toBeInstanceOf(ListStatusTransitionError);
  });

  it("overwrites an existing draft when reusing a list", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = {
      generate: vi.fn().mockReturnValueOnce("item-3"),
    };
    const useCase = new ReuseList(listRepository, idGenerator);
    const now = new Date("2024-01-05T10:00:00.000Z");
    const completedList: List = {
      id: "list-1",
      ownerUserId: "user-1",
      title: "Weekly groceries",
      isAutosaveDraft: false,
      status: "COMPLETED",
      activatedAt: undefined,
      isEditing: false,
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
        {
          id: "item-2",
          listId: "list-1",
          kind: "catalog",
          source: "mercadona",
          sourceProductId: "sku-1",
          nameSnapshot: "Bread",
          thumbnailSnapshot: "https://example.com/bread.png",
          priceSnapshot: 1.75,
          unitSizeSnapshot: 500,
          unitFormatSnapshot: "g",
          unitPricePerUnitSnapshot: 3.5,
          isApproxSizeSnapshot: false,
          qty: 2,
          checked: true,
          createdAt: new Date("2024-01-01T10:00:00.000Z"),
          updatedAt: new Date("2024-01-01T10:00:00.000Z"),
        },
      ],
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      updatedAt: new Date("2024-01-01T10:00:00.000Z"),
    };
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
          id: "item-legacy",
          listId: "draft-1",
          kind: "manual",
          name: "Eggs",
          qty: 1,
          checked: false,
          createdAt: new Date("2024-01-02T10:00:00.000Z"),
          updatedAt: new Date("2024-01-02T10:00:00.000Z"),
        },
      ],
      createdAt: new Date("2024-01-02T10:00:00.000Z"),
      updatedAt: new Date("2024-01-02T10:00:00.000Z"),
    };

    await listRepository.save(completedList);
    await listRepository.save(existingDraft);

    vi.useFakeTimers();
    vi.setSystemTime(now);

    await expect(
      useCase.execute({
        userId: "user-1",
        listId: "list-1",
      }),
    ).resolves.toEqual({
      id: "draft-1",
      title: "Weekly groceries",
      status: "DRAFT",
      updatedAt: now.toISOString(),
      items: [
        {
          id: "item-3",
          kind: "manual",
          name: "Milk",
          qty: 1,
          checked: false,
          updatedAt: now.toISOString(),
        },
        {
          id: "draft-1:sku-1",
          kind: "catalog",
          name: "Bread",
          qty: 2,
          checked: false,
          updatedAt: now.toISOString(),
          thumbnail: "https://example.com/bread.png",
          price: 1.75,
          unitSize: 500,
          unitFormat: "g",
          unitPrice: 3.5,
          isApproxSize: false,
          source: "mercadona",
          sourceProductId: "sku-1",
        },
      ],
    });

    await expect(listRepository.findById("draft-1")).resolves.toMatchObject({
      id: "draft-1",
      title: "Weekly groceries",
      status: "DRAFT",
      isAutosaveDraft: false,
      isEditing: false,
      items: [
        expect.objectContaining({
          id: "item-3",
          listId: "draft-1",
          checked: false,
        }),
        expect.objectContaining({
          id: "draft-1:sku-1",
          listId: "draft-1",
          checked: false,
        }),
      ],
      createdAt: existingDraft.createdAt,
      updatedAt: now,
    });

    expect(idGenerator.generate).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it("reuses existing draft even when it is an autosave draft", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = {
      generate: vi.fn().mockReturnValueOnce("item-3"),
    };
    const useCase = new ReuseList(listRepository, idGenerator);
    const now = new Date("2024-01-06T10:00:00.000Z");
    const completedList: List = {
      id: "list-1",
      ownerUserId: "user-1",
      title: "Weekly groceries",
      isAutosaveDraft: false,
      status: "COMPLETED",
      activatedAt: undefined,
      isEditing: false,
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
      id: "autosave-1",
      ownerUserId: "user-1",
      title: "Autosave",
      isAutosaveDraft: true,
      status: "DRAFT",
      activatedAt: undefined,
      isEditing: false,
      items: [],
      createdAt: new Date("2024-01-02T10:00:00.000Z"),
      updatedAt: new Date("2024-01-02T10:00:00.000Z"),
    };

    await listRepository.save(completedList);
    await listRepository.save(autosaveDraft);

    vi.useFakeTimers();
    vi.setSystemTime(now);

    await expect(
      useCase.execute({
        userId: "user-1",
        listId: "list-1",
      }),
    ).resolves.toMatchObject({
      id: "autosave-1",
      title: "Weekly groceries",
      status: "DRAFT",
      updatedAt: now.toISOString(),
    });

    await expect(listRepository.findById("autosave-1")).resolves.toMatchObject({
      id: "autosave-1",
      status: "DRAFT",
      isAutosaveDraft: true,
      items: [
        expect.objectContaining({
          id: "item-3",
          listId: "autosave-1",
        }),
      ],
    });

    expect(idGenerator.generate).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
