import { describe, expect, it, vi } from "vitest";
import type { List } from "../domain/list.js";
import { InMemoryListRepository } from "../infrastructure/InMemoryListRepository.js";
import { AddCatalogItem } from "./AddCatalogItem.js";
import { ListStatusTransitionError } from "./errors.js";

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
});
