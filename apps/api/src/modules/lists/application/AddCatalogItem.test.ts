import { describe, expect, it, vi } from "vitest";
import type { List } from "../domain/list.js";
import { InMemoryListRepository } from "../infrastructure/InMemoryListRepository.js";
import { AddCatalogItem } from "./AddCatalogItem.js";
import { ListStatusTransitionError } from "./errors.js";

const createDraftList = (): List => ({
  id: "list-1",
  ownerUserId: "user-1",
  title: "Draft list",
  isAutosaveDraft: true,
  status: "DRAFT",
  activatedAt: undefined,
  isEditing: false,
  items: [],
  createdAt: new Date("2024-01-01T10:00:00.000Z"),
  updatedAt: new Date("2024-01-01T10:00:00.000Z"),
});

describe("AddCatalogItem", () => {
  it("throws when the list is completed", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: vi.fn().mockReturnValue("item-1") };
    const catalogProvider = {
      getProduct: vi.fn(),
      getRootCategories: vi.fn(),
      getCategoryDetail: vi.fn(),
    };
    const useCase = new AddCatalogItem(
      listRepository,
      idGenerator,
      catalogProvider,
    );
    const list: List = {
      id: "list-1",
      ownerUserId: "user-1",
      title: "Done list",
      isAutosaveDraft: false,
      status: "COMPLETED",
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
        productId: "sku-1",
      }),
    ).rejects.toBeInstanceOf(ListStatusTransitionError);
    expect(catalogProvider.getProduct).not.toHaveBeenCalled();
  });

  it("persists level 1 category and level 2 subcategory from nested categories tree", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: vi.fn().mockReturnValue("item-1") };
    const catalogProvider = {
      getProduct: vi.fn(async () => ({
        id: "4706",
        display_name: "Leche",
        thumbnail: null,
        categories: [
          {
            id: 1,
            name: "Alimentación",
            level: 0,
            categories: [
              {
                id: 2,
                name: "Lácteos",
                level: 1,
                categories: [
                  {
                    id: 3,
                    name: "Leche",
                    level: 2,
                  },
                ],
              },
            ],
          },
        ],
        price_instructions: {
          unit_price: 1.5,
          bulk_price: 1.5,
        },
      })),
      getRootCategories: vi.fn(),
      getCategoryDetail: vi.fn(),
    };
    const useCase = new AddCatalogItem(
      listRepository,
      idGenerator,
      catalogProvider,
    );
    const list = createDraftList();
    await listRepository.save(list);

    const result = await useCase.execute({
      userId: "user-1",
      listId: "list-1",
      productId: "4706",
    });

    expect(result.categorySnapshot).toBe("Lácteos");
    expect(result.subcategorySnapshot).toBe("Leche");

    const persistedList = await listRepository.findById("list-1");
    expect(persistedList?.items[0]).toMatchObject({
      categorySnapshot: "Lácteos",
      subcategorySnapshot: "Leche",
    });
  });

  it("persists level 1 category and keeps subcategory null when level 2 is missing", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: vi.fn().mockReturnValue("item-1") };
    const catalogProvider = {
      getProduct: vi.fn(async () => ({
        id: "4706",
        display_name: "Leche",
        thumbnail: null,
        categories: [
          {
            id: 1,
            name: "Alimentación",
            level: 0,
            categories: [
              {
                id: 2,
                name: "Lácteos",
                level: 1,
              },
            ],
          },
        ],
        price_instructions: {
          unit_price: 1.5,
          bulk_price: 1.5,
        },
      })),
      getRootCategories: vi.fn(),
      getCategoryDetail: vi.fn(),
    };
    const useCase = new AddCatalogItem(
      listRepository,
      idGenerator,
      catalogProvider,
    );
    const list = createDraftList();
    await listRepository.save(list);

    const result = await useCase.execute({
      userId: "user-1",
      listId: "list-1",
      productId: "4706",
    });

    expect(result.categorySnapshot).toBe("Lácteos");
    expect(result.subcategorySnapshot).toBeNull();
  });

  it("falls back to defensive category when snapshots are missing", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: vi.fn().mockReturnValue("item-1") };
    const catalogProvider = {
      getProduct: vi.fn(async () => ({
        id: "4706",
        display_name: "Leche",
        thumbnail: null,
        price_instructions: {
          unit_price: 1.5,
          bulk_price: 1.5,
        },
      })),
      getRootCategories: vi.fn(),
      getCategoryDetail: vi.fn(),
    };
    const useCase = new AddCatalogItem(
      listRepository,
      idGenerator,
      catalogProvider,
    );
    const list = createDraftList();
    await listRepository.save(list);

    const result = await useCase.execute({
      userId: "user-1",
      listId: "list-1",
      productId: "4706",
    });

    expect(result.categorySnapshot).toBe("Sin categoría");
    expect(result.subcategorySnapshot).toBeNull();
  });
});
