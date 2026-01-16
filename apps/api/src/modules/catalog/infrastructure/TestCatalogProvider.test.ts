import { describe, expect, it } from "vitest";
import { TestCatalogProvider } from "./TestCatalogProvider";

describe("TestCatalogProvider", () => {
  it("returns stable catalog responses for e2e flows", async () => {
    const provider = new TestCatalogProvider();

    const roots = await provider.getRootCategories();
    expect(roots.results[0]?.name).toBe("Frescos");
    expect(roots.results[0]?.categories[0]?.name).toBe("Frutas");

    const detail = await provider.getCategoryDetail("11");
    expect(detail.name).toBe("Frutas");
    expect(detail.categories[0]?.products[0]?.display_name).toBe("Manzana");

    const product = await provider.getProduct("101");
    expect(product.display_name).toBe("Manzana");
  });
});
