import { describe, expect, it, vi } from "vitest";
import { GetRootCategories } from "./getRootCategories.js";
import { InMemoryCatalogCache } from "../infrastructure/InMemoryCatalogCache.js";
import type { CatalogProvider } from "../domain/catalogProvider.js";

describe("GetRootCategories", () => {
  it("flattens a four-level tree into ordered nodes with parent ids", async () => {
    const provider: CatalogProvider = {
      metadata: { id: "provider-mercadona", slug: "mercadona" },
      getRootCategories: vi.fn().mockResolvedValue({
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: "root-1",
            name: "Root",
            order: 0,
            is_extended: false,
            categories: [
              {
                id: "level-1",
                name: "Level 1",
                order: 0,
                layout: "grid",
                published: true,
                is_extended: false,
                categories: [
                  {
                    id: "level-2",
                    name: "Level 2",
                    order: 0,
                    layout: "grid",
                    published: true,
                    is_extended: false,
                    categories: [
                      {
                        id: "leaf-a",
                        name: "Leaf A",
                        order: 0,
                        layout: "grid",
                        published: true,
                        is_extended: false,
                      },
                      {
                        id: "leaf-b",
                        name: "Leaf B",
                        order: 1,
                        layout: "grid",
                        published: true,
                        is_extended: false,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }),
      getCategoryDetail: vi.fn(),
      getProduct: vi.fn(),
    };

    const useCase = new GetRootCategories(provider, new InMemoryCatalogCache());
    const response = await useCase.execute();

    expect(response.categories).toEqual([
      {
        id: "root-1",
        name: "Root",
        order: 0,
        level: 0,
      },
      {
        id: "level-1",
        name: "Level 1",
        order: 0,
        level: 1,
        parentId: "root-1",
        published: true,
      },
      {
        id: "level-2",
        name: "Level 2",
        order: 0,
        level: 2,
        parentId: "level-1",
        published: true,
      },
      {
        id: "leaf-a",
        name: "Leaf A",
        order: 0,
        level: 3,
        parentId: "level-2",
        published: true,
      },
      {
        id: "leaf-b",
        name: "Leaf B",
        order: 1,
        level: 3,
        parentId: "level-2",
        published: true,
      },
    ]);
  });
});
