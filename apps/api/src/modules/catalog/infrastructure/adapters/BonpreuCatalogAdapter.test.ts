import { describe, expect, it } from "vitest";
import { BonpreuCatalogAdapter } from "./BonpreuCatalogAdapter.js";

describe("BonpreuCatalogAdapter", () => {
  const adapter = new BonpreuCatalogAdapter();

  it("maps category products to the legacy provider domain shape", () => {
    const response = {
      categoryId: "cat-1",
      name: "Lácteos",
      products: [
        {
          retailerProductId: "p-1",
          name: "Leche",
          imagePaths: ["https://img.example/leche"],
          price: { amount: "1.20" },
          unitPrice: { price: { amount: "0.55" }, unit: "fop.price.per.each", unitName: "EACH" },
          packSizeDescription: "1 L bottle",
        },
      ],
    };

    const mapped = adapter.toProviderCategoryProducts(response);

    expect(mapped).toHaveLength(1);
    const product = mapped[0];
    expect(product?.id).toBe("p-1");
    expect(product?.display_name).toBe("Leche");
    expect(product?.thumbnail).toBe("https://img.example/leche/300x300.webp");
    expect(product?.packaging).toBe("1 L bottle");
    expect(product?.price_instructions.unit_price).toBe(1.2);
    expect(product?.price_instructions.bulk_price).toBe(0.55);
    expect(product?.price_instructions.size_format).toBe("ud");
  });

  it("keeps unit line absent for invalid provider category products", () => {
    const response = {
      categoryId: "cat-1",
      name: "Lácteos",
      products: [
        {
          retailerProductId: "p-1",
          name: "Leche",
          imagePaths: [],
          price: { amount: 1.2 },
          unitPrice: { price: { amount: "not-a-number" }, unit: "fop.price.per.kg" },
        },
      ],
    };

    const mapped = adapter.toProviderCategoryProducts(response);
    const product = mapped[0];

    expect(product?.price_instructions.size_format).toBeNull();
    expect(product?.price_instructions.bulk_price).toBeNull();
    expect(product?.price_instructions.unit_price).toBe(1.2);
  });

  it("maps single product detail to the legacy provider domain shape", () => {
    const response = {
      retailerProductId: "p-2",
      name: "Cookies",
      imagePaths: ["https://img.example/cookies"],
      price: { amount: "2.50" },
      unitPrice: { price: { amount: "0.55" }, unit: "fop.price.per.each", unitName: "EACH" },
      packSizeDescription: "6 units",
      categoryPath: [{ name: "Food" }, { name: "Bakery" }],
    };

    const mapped = adapter.toProviderProductDetail(response);

    expect(mapped.id).toBe("p-2");
    expect(mapped.display_name).toBe("Cookies");
    expect(mapped.thumbnail).toBe("https://img.example/cookies/300x300.webp");
    expect(mapped.packaging).toBe("6 units");
    expect(mapped.price_instructions.unit_price).toBe(2.5);
    expect(mapped.price_instructions.bulk_price).toBe(0.55);
    expect(mapped.price_instructions.size_format).toBe("ud");
    expect(mapped.categories).toEqual([]);
  });

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
      unitPrice: { price: { amount: "0.10" }, unit: "fop.price.per.each" },
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
    expect(mapped[0]?.unitPrice).toBe(0.1);
    expect(mapped[0]?.unitFormat).toBe("ud");
  });

  it("parses string amounts and normalizes each unit for category products", () => {
    const response = {
      categoryId: "cat-1",
      name: "Lácteos",
      products: [
        {
          retailerProductId: "p-1",
          name: "Leche",
          imagePaths: [],
          price: { amount: "1.20" },
          unitPrice: { price: { amount: "0.55" }, unit: "fop.price.per.each", unitName: "EACH" },
          categoryPath: ["alimentación", "lácteos"],
        },
      ],
    };

    const mapped = adapter.toCategoryProducts(response, {
      id: "provider-bonpreuesclat",
      slug: "bonpreuesclat",
      displayName: "BonpreuEsclat",
    });

    const product = mapped.subcategories[0]?.products[0];
    expect(product?.price).toBe(1.2);
    expect(product?.unitPrice).toBe(0.55);
    expect(product?.unitFormat).toBe("ud");
  });

  it.each([
    ["invalid unitPrice amount string", { amount: "not-a-number" }, "fop.price.per.kg"],
    ["missing unitPrice amount", null, "fop.price.per.kg"],
    ["unknown unit segment", { amount: "0.50" }, "fop.price.per.unknown"],
    ["empty unit", { amount: "0.50" }, ""],
  ])(
    "keeps unit line absent for %s",
    (_label, unitPriceAmount, unit) => {
      const response = {
        categoryId: "cat-1",
        name: "Lácteos",
        products: [
          {
            retailerProductId: "p-1",
            name: "Leche",
            imagePaths: [],
            price: { amount: 1.2 },
            unitPrice: unitPriceAmount === null ? null : { price: unitPriceAmount, unit },
            categoryPath: ["alimentación", "lácteos"],
          },
        ],
      };

      const mapped = adapter.toCategoryProducts(response, {
        id: "provider-bonpreuesclat",
        slug: "bonpreuesclat",
        displayName: "BonpreuEsclat",
      });

      const product = mapped.subcategories[0]?.products[0];
      expect(product?.unitPrice).toBeNull();
      expect(product?.unitFormat).toBeNull();
    },
  );
});
