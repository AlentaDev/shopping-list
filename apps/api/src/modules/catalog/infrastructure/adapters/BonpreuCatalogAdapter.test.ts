import { describe, expect, it } from "vitest";
import { BonpreuCatalogAdapter } from "./BonpreuCatalogAdapter.js";

describe("BonpreuCatalogAdapter", () => {
  const adapter = new BonpreuCatalogAdapter();

  it("maps missing imagePaths to thumbnail=null", () => {
    const response = {
      categoryId: "cat-1",
      name: "Lácteos",
      products: [
        {
          retailerProductId: "p-1",
          name: "Leche",
          imagePaths: [],
          price: { amount: 1.2 },
          categoryPath: ["alimentación", "lácteos"],
        },
      ],
    };

    const mapped = adapter.toCategoryProducts(response, {
      id: "provider-bonpreuesclat",
      slug: "bonpreuesclat",
    });

    expect(mapped.id).toBe("cat-1");
    expect(mapped.subcategories[0]?.products[0]?.thumbnail).toBeNull();
    expect(mapped.subcategories[0]?.products[0]?.provider.displayName).toBe(
      "bonpreuesclat",
    );
  });

  it("caps search at 30 and ignores empty clusters", () => {
    const products = Array.from({ length: 35 }, (_, idx) => ({
      retailerProductId: `p-${idx}`,
      name: `Prod ${idx}`,
      imagePaths: ["https://img"],
      price: { amount: idx + 1 },
      categoryPath: ["a", "b"],
    }));

    const response = {
      productGroups: [
        { type: "cluster", products: [] },
        { type: "cluster", products: products.slice(0, 20) },
        { type: "personalized", products: [] },
        { type: "cluster", products: products.slice(20) },
      ],
    };

    const mapped = adapter.toSearchProducts(response, {
      id: "provider-bonpreuesclat",
      slug: "bonpreuesclat",
      displayName: "BonpreuEsclat",
    });

    expect(mapped).toHaveLength(30);
    expect(mapped[0]?.id).toBe("p-0");
    expect(mapped[29]?.id).toBe("p-29");
  });
});
