import { describe, expect, it, vi } from "vitest";
import { GetProductDetail } from "./getProductDetail.js";
import { InMemoryCatalogCache } from "../infrastructure/InMemoryCatalogCache.js";
import type { CatalogProvider } from "../domain/catalogProvider.js";

describe("GetProductDetail", () => {
  it("returns a controlled error when the provider fails without cached data", async () => {
    const provider: CatalogProvider = {
      getRootCategories: vi.fn(), getCategoryDetail: vi.fn(),
      getProduct: vi.fn().mockRejectedValue(new Error("offline")),
    };
    await expect(new GetProductDetail(provider, new InMemoryCatalogCache()).execute("4740"))
      .rejects.toMatchObject({ status: 502, code: "catalog_provider_unavailable" });
  });

  it("caches normalized product details for six hours and falls back to stale data", async () => {
    vi.useFakeTimers();
    try {
      const provider: CatalogProvider = {
        getRootCategories: vi.fn(),
        getCategoryDetail: vi.fn(),
        getProduct: vi.fn().mockResolvedValue({
          id: "4740", display_name: "Aceite", packaging: "Botella",
          photos: [{ regular: "https://example.com/photo.jpg" }],
          brand: "Hacendado", origin: "Jaén",
          details: { description: "Aceite", storage_instructions: "Keep cool" },
          nutrition_information: { ingredients: "<p>Olive oil</p>" },
          price_instructions: { unit_price: "4.35", bulk_price: "4.35", size_format: "l" },
        }),
      };
      const useCase = new GetProductDetail(provider, new InMemoryCatalogCache());
      const first = await useCase.execute("4740");
      expect(first).toMatchObject({ id: "4740", name: "Aceite", brand: "Hacendado", origin: "Jaén", photos: ["https://example.com/photo.jpg"] });
      expect(await useCase.execute("4740")).toEqual(first);
      expect(provider.getProduct).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(6 * 60 * 60 * 1000 + 1);
      vi.mocked(provider.getProduct).mockRejectedValueOnce(new Error("offline"));
      expect(await useCase.execute("4740")).toEqual(first);
      expect(provider.getProduct).toHaveBeenCalledTimes(2);
      await useCase.execute("4740");
      expect(provider.getProduct).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
    }
  });
});
