import { describe, expect, it } from "vitest";
import { AppError } from "@src/shared/errors/appError.js";
import { ProviderStrategyResolver } from "./ProviderStrategyResolver.js";
import type { CatalogProvider, CatalogProviderSlug } from "../domain/catalogProvider.js";

function createProvider(slug: CatalogProviderSlug): CatalogProvider {
  return {
    metadata: {
      id: `provider-${slug}`,
      slug,
      displayName: slug === "mercadona" ? "Mercadona" : "BonpreuEsclat",
    },
    getRootCategories: async () => ({ count: 0, next: null, previous: null, results: [] }),
    getCategoryDetail: async () => ({ id: 1, name: "cat", categories: [] }),
    getProduct: async () => ({ id: "1", display_name: "product", price_instructions: { unit_price: 1 } }),
  };
}

describe("ProviderStrategyResolver", () => {
  it("resolves known provider strategy", () => {
    const mercadona = createProvider("mercadona");
    const bonpreu = createProvider("bonpreuesclat");
    const resolver = new ProviderStrategyResolver([mercadona, bonpreu]);

    expect(resolver.resolve("mercadona")).toBe(mercadona);
    expect(resolver.resolve("bonpreuesclat")).toBe(bonpreu);
  });

  it("throws stable provider_not_found for unknown provider", () => {
    const resolver = new ProviderStrategyResolver([createProvider("mercadona")]);

    expect(() => resolver.resolve("unknown-provider")).toThrowError(AppError);

    try {
      resolver.resolve("unknown-provider");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).status).toBe(404);
      expect((error as AppError).code).toBe("provider_not_found");
      expect((error as AppError).message).toBe("Provider not found");
      expect((error as AppError).details).toEqual({ provider: "unknown-provider" });
    }
  });
});
