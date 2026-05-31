import { describe, expect, it, vi } from "vitest";
import { GetCategoryDetail } from "./getCategoryDetail.js";
import { InMemoryCatalogCache } from "../infrastructure/InMemoryCatalogCache.js";
import type { CatalogProvider } from "../domain/catalogProvider.js";

describe("GetCategoryDetail", () => {
  it("uses maxProductsToDecorate=productCount for leaf categories (via provider contract)", async () => {
    const getCategoryDetailMock = vi.fn<CatalogProvider["getCategoryDetail"]>();
    getCategoryDetailMock.mockResolvedValue({
      id: 500,
      name: "Congelados",
      categories: [
        {
          id: 501,
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
    expect(response.subcategories).toHaveLength(1);
    expect(response.subcategories[0]?.products).toHaveLength(1);
    expect(response.subcategories[0]?.products[0]?.id).toBe("bp-123");
  });

  it("returns intermediate category without products", async () => {
    const provider: CatalogProvider = {
      metadata: { id: "provider-bonpreuesclat", slug: "bonpreuesclat" },
      getRootCategories: vi.fn(),
      getCategoryDetail: vi.fn().mockResolvedValue({
        id: 200,
        name: "Frescos",
        categories: [
          {
            id: 201,
            name: "Fruta",
            products: [],
          },
        ],
      }),
      getProduct: vi.fn(),
    };

    const useCase = new GetCategoryDetail(provider, new InMemoryCatalogCache());
    const response = await useCase.execute("intermediate-200");

    expect(response.id).toBe("200");
    expect(response.subcategories).toHaveLength(1);
    expect(response.subcategories[0]?.id).toBe("201");
    expect(response.subcategories[0]?.products).toEqual([]);
  });
});
