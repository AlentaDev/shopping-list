import { describe, expect, it, vi } from "vitest";
import { GetCategoryDetail } from "./getCategoryDetail.js";
import { InMemoryCatalogCache } from "../infrastructure/InMemoryCatalogCache.js";
import type { CatalogProvider } from "../domain/catalogProvider.js";

describe("GetCategoryDetail", () => {
  it("round-trips canonical Bonpreu ids for deepest categories", async () => {
    const getCategoryDetailMock = vi.fn<CatalogProvider["getCategoryDetail"]>();
    getCategoryDetailMock.mockResolvedValue({
      id: "08f4f6d0-4c2a-4d2b-a51b-8a6c9f16c123",
      name: "Congelados",
      categories: [
        {
          id: "08f4f6d0-4c2a-4d2b-a51b-8a6c9f16c123",
          name: "Helados",
          products: [
            {
              id: "bp-123",
              display_name: "Helado vainilla",
              thumbnail: "https://img/helado.png",
              packaging: null,
              price_instructions: {
                unit_price: 3.45,
                bulk_price: 3.45,
              },
            },
          ],
        },
      ],
    });

    const provider: CatalogProvider = {
      metadata: { id: "provider-bonpreuesclat", slug: "bonpreuesclat" },
      getRootCategories: vi.fn(),
      getCategoryDetail: getCategoryDetailMock,
      getProduct: vi.fn(),
    };

    const useCase = new GetCategoryDetail(provider, new InMemoryCatalogCache());

    const response = await useCase.execute("leaf-500");

    expect(getCategoryDetailMock).toHaveBeenCalledWith("leaf-500");
    expect(response.id).toBe("08f4f6d0-4c2a-4d2b-a51b-8a6c9f16c123");
    expect(response.subcategories).toHaveLength(1);
    expect(response.subcategories[0]?.id).toBe("08f4f6d0-4c2a-4d2b-a51b-8a6c9f16c123");
    expect(response.subcategories[0]?.products).toHaveLength(1);
    expect(response.subcategories[0]?.products[0]?.id).toBe("bp-123");
  });

  it("returns intermediate category without products", async () => {
    const provider: CatalogProvider = {
      metadata: { id: "provider-bonpreuesclat", slug: "bonpreuesclat" },
      getRootCategories: vi.fn(),
      getCategoryDetail: vi.fn().mockResolvedValue({
        id: "fresh-root",
        name: "Frescos",
        categories: [
          {
            id: "fruit-child",
            name: "Fruta",
            products: [],
          },
        ],
      }),
      getProduct: vi.fn(),
    };

    const useCase = new GetCategoryDetail(provider, new InMemoryCatalogCache());
    const response = await useCase.execute("intermediate-200");

    expect(response.id).toBe("fresh-root");
    expect(response.subcategories).toHaveLength(1);
    expect(response.subcategories[0]?.id).toBe("fruit-child");
    expect(response.subcategories[0]?.products).toEqual([]);
  });
});
