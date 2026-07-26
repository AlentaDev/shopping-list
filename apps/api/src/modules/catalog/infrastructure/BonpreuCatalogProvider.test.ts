import { describe, expect, it, vi } from "vitest";
import { BonpreuCatalogAdapter } from "./adapters/BonpreuCatalogAdapter.js";
import { BonpreuCatalogProvider } from "./BonpreuCatalogProvider.js";

type BonpreuCategoriesPayload =
  | Array<{
      categoryId: string;
      name: string;
      level: number;
      productCount: number;
      childCategories?: Array<{
        categoryId: string;
        name: string;
        level: number;
        productCount: number;
      }>;
    }>
  | {
      categories?: Array<{
        categoryId: string;
        name: string;
        level: number;
        productCount: number;
        childCategories?: Array<{
          categoryId: string;
          name: string;
          level: number;
          productCount: number;
        }>;
      }>;
    };

const CATEGORY_TREE = [
  {
    categoryId: "root-1",
    name: "Root",
    level: 0,
    productCount: 0,
    childCategories: [
      {
        categoryId: "leaf-1",
        name: "Leaf",
        level: 1,
        productCount: 2,
      },
    ],
  },
];

const DEEP_TREE = [
  {
    categoryId: "root-1",
    name: "Root",
    level: 0,
    productCount: 0,
    childCategories: [
      {
        categoryId: "level-1",
        name: "Level 1",
        level: 1,
        productCount: 0,
        childCategories: [
          {
            categoryId: "level-2",
            name: "Level 2",
            level: 2,
            productCount: 0,
            childCategories: [
              {
                categoryId: "level-3-a",
                name: "Level 3 A",
                level: 3,
                productCount: 2,
              },
              {
                categoryId: "level-3-b",
                name: "Level 3 B",
                level: 3,
                productCount: 3,
              },
            ],
          },
        ],
      },
    ],
  },
];

describe("BonpreuCatalogProvider", () => {
  it("delegates category product mapping to the injected adapter", async () => {
    const httpClient = {
      getCategories: vi.fn().mockResolvedValue({ categories: CATEGORY_TREE }),
      getCategoryProducts: vi.fn().mockResolvedValue({
        categoryId: "leaf-1",
        name: "Leaf",
        products: [
          {
            retailerProductId: "product-1",
            name: "Milk",
            imagePaths: ["https://img.example/milk"],
            price: { amount: 1.99 },
          },
        ],
      }),
      getProductDetail: vi.fn(),
    };
    const adapter = new BonpreuCatalogAdapter();
    const toProviderCategoryProductsSpy = vi.spyOn(
      adapter,
      "toProviderCategoryProducts",
    );

    const provider = new BonpreuCatalogProvider(httpClient as never, adapter);
    await provider.getCategoryDetail("leaf-1");

    expect(toProviderCategoryProductsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: "leaf-1",
        products: expect.any(Array),
      }),
    );
  });

  it("delegates single product mapping to the injected adapter", async () => {
    const httpClient = {
      getCategories: vi.fn(),
      getCategoryProducts: vi.fn(),
      getProductDetail: vi.fn().mockResolvedValue({
        retailerProductId: "product-4",
        name: "Oil",
        imagePaths: ["https://img.example/oil"],
        price: { amount: 4.2 },
        unitPrice: { price: { amount: 2.1 }, unit: "fop.price.per.litre" },
        packSizeDescription: "1 L bottle",
        categoryPath: [{ name: "Food" }, { name: "Oils" }],
      }),
    };
    const adapter = new BonpreuCatalogAdapter();
    const toProviderProductDetailSpy = vi.spyOn(
      adapter,
      "toProviderProductDetail",
    );

    const provider = new BonpreuCatalogProvider(httpClient as never, adapter);
    await provider.getProduct("product-4");

    expect(toProviderProductDetailSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        retailerProductId: "product-4",
      }),
    );
  });

  it.each([
    ["root array payload", CATEGORY_TREE],
    ["categories object payload", { categories: CATEGORY_TREE }],
  ])("maps root categories from %s", async (_label, payload) => {
    const httpClient = {
      getCategories: vi.fn().mockResolvedValue(payload),
      getCategoryProducts: vi.fn(),
      getProductDetail: vi.fn(),
    };

    const provider = new BonpreuCatalogProvider(httpClient as never);

    await expect(provider.getRootCategories()).resolves.toMatchObject({
      count: 1,
      results: [
        {
          id: "root-1",
          name: "Root",
          categories: [{ id: "leaf-1", name: "Leaf" }],
        },
      ],
    });
  });

  it.each([
    ["root array payload", DEEP_TREE],
    ["categories object payload", { categories: DEEP_TREE }],
  ])("maps nested categories up to four levels from %s", async (_label, payload) => {
    const httpClient = {
      getCategories: vi.fn().mockResolvedValue(payload),
      getCategoryProducts: vi.fn(),
      getProductDetail: vi.fn(),
    };

    const provider = new BonpreuCatalogProvider(httpClient as never);

    await expect(provider.getRootCategories()).resolves.toMatchObject({
      count: 1,
      results: [
        {
          id: "root-1",
          name: "Root",
          categories: [
            {
              id: "level-1",
              name: "Level 1",
              categories: [
                {
                  id: "level-2",
                  name: "Level 2",
                  categories: [
                    { id: "level-3-a", name: "Level 3 A" },
                    { id: "level-3-b", name: "Level 3 B" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it.each([
    ["root array payload", CATEGORY_TREE],
    ["categories object payload", { categories: CATEGORY_TREE }],
  ])("finds category detail from %s", async (_label, payload) => {
    const httpClient = {
      getCategories: vi.fn().mockResolvedValue(payload as BonpreuCategoriesPayload),
      getCategoryProducts: vi.fn().mockResolvedValue({
        categoryId: "leaf-1",
        name: "Leaf",
        products: [
          {
            retailerProductId: "product-1",
            name: "Milk",
            imagePaths: ["https://img.example/milk"],
            price: { amount: 1.99 },
          },
        ],
      }),
      getProductDetail: vi.fn(),
    };

    const provider = new BonpreuCatalogProvider(httpClient as never);

    await expect(provider.getCategoryDetail("leaf-1")).resolves.toMatchObject({
      id: "leaf-1",
      name: "Leaf",
      categories: [
        {
          id: "leaf-1",
          name: "Leaf",
          products: [{ id: "product-1", display_name: "Milk" }],
        },
      ],
    });
    expect(httpClient.getCategoryProducts).toHaveBeenCalledWith("leaf-1", 2);
  });

  it("returns child categories without fetching products for intermediate categories", async () => {
    const httpClient = {
      getCategories: vi.fn().mockResolvedValue({ categories: CATEGORY_TREE }),
      getCategoryProducts: vi.fn(),
      getProductDetail: vi.fn(),
    };

    const provider = new BonpreuCatalogProvider(httpClient as never);

    await expect(provider.getCategoryDetail("root-1")).resolves.toMatchObject({
      id: "root-1",
      name: "Root",
      categories: [{ id: "leaf-1", name: "Leaf", products: [] }],
    });
    expect(httpClient.getCategoryProducts).not.toHaveBeenCalled();
  });

  it("matches legacy numeric ids and flattens product groups with Bonpreu thumbnails", async () => {
    const httpClient = {
      getCategories: vi.fn().mockResolvedValue({ categories: CATEGORY_TREE }),
      getCategoryProducts: vi.fn().mockResolvedValue({
        categoryId: "leaf-1",
        name: "Leaf",
        productGroups: [
          {
            type: "default",
            decoratedProducts: [
              {
                retailerProductId: "product-2",
                name: "Yogurt",
                imagePaths: ["https://img.example/yogurt"],
                price: { amount: 2.49 },
              },
            ],
          },
        ],
      }),
      getProductDetail: vi.fn(),
    };

    const provider = new BonpreuCatalogProvider(httpClient as never);

    await expect(provider.getCategoryDetail("1106754174")).resolves.toMatchObject({
      id: "leaf-1",
      categories: [
        {
          id: "leaf-1",
          products: [
            {
              id: "product-2",
              display_name: "Yogurt",
              thumbnail: "https://img.example/yogurt/300x300.webp",
            },
          ],
        },
      ],
    });
    expect(httpClient.getCategoryProducts).toHaveBeenCalledWith("leaf-1", 2);
  });

  it("maps category product main price, unit price, unit format and packaging", async () => {
    const httpClient = {
      getCategories: vi.fn().mockResolvedValue({ categories: CATEGORY_TREE }),
      getCategoryProducts: vi.fn().mockResolvedValue({
        categoryId: "leaf-1",
        name: "Leaf",
        products: [
          {
            retailerProductId: "product-3",
            name: "Rice",
            imagePaths: ["https://img.example/rice"],
            price: { amount: 3.5 },
            unitPrice: { price: { amount: 1.75 }, unit: "fop.price.per.kg" },
            packSizeDescription: "2 kg bag",
          },
        ],
      }),
      getProductDetail: vi.fn(),
    };

    const provider = new BonpreuCatalogProvider(httpClient as never);

    await expect(provider.getCategoryDetail("leaf-1")).resolves.toMatchObject({
      id: "leaf-1",
      categories: [
        {
          id: "leaf-1",
          products: [
            {
              id: "product-3",
              display_name: "Rice",
              packaging: "2 kg bag",
              price_instructions: {
                unit_price: 3.5,
                bulk_price: 1.75,
                size_format: "kg",
              },
            },
          ],
        },
      ],
    });
  });

  it.each([
    ["missing unitPrice", { price: { amount: 2 }, packSizeDescription: "box" }, null, null],
    ["missing unitPrice.price", { price: { amount: 2 }, unitPrice: { unit: "fop.price.per.kg" } }, null, null],
    ["missing unitPrice.unit", { price: { amount: 2 }, unitPrice: { price: { amount: 0.5 } } }, null, null],
    ["unknown unit segment", { price: { amount: 2 }, unitPrice: { price: { amount: 0.5 }, unit: "fop.price.per.unknown" } }, null, null],
    ["empty unit", { price: { amount: 2 }, unitPrice: { price: { amount: 0.5 }, unit: "" } }, null, null],
    ["malformed unit dots", { price: { amount: 2 }, unitPrice: { price: { amount: 0.5 }, unit: "fop.price.per." } }, null, null],
    ["malformed unitPrice amount string", { price: { amount: 2 }, unitPrice: { price: { amount: "not-a-number" }, unit: "fop.price.per.kg" } }, null, null],
    ["malformed main price string", { price: { amount: "not-a-number" }, unitPrice: { price: { amount: 0.5 }, unit: "fop.price.per.kg" } }, "kg", 0.5],
  ])(
    "falls back to null unit format for %s",
    async (_label, product, expectedUnitFormat, expectedBulkPrice) => {
      const httpClient = {
        getCategories: vi.fn().mockResolvedValue({ categories: CATEGORY_TREE }),
        getCategoryProducts: vi.fn().mockResolvedValue({
          categoryId: "leaf-1",
          name: "Leaf",
          products: [product],
        }),
        getProductDetail: vi.fn(),
      };

      const provider = new BonpreuCatalogProvider(httpClient as never);
      const detail = await provider.getCategoryDetail("leaf-1");
      const mappedProduct = detail.categories[0]?.products[0];

      expect(mappedProduct?.price_instructions.size_format).toBe(expectedUnitFormat);
      expect(mappedProduct?.price_instructions.bulk_price).toBe(expectedBulkPrice);
    },
  );

  it("parses string amounts and normalizes each unit for category products", async () => {
    const httpClient = {
      getCategories: vi.fn().mockResolvedValue({ categories: CATEGORY_TREE }),
      getCategoryProducts: vi.fn().mockResolvedValue({
        categoryId: "leaf-1",
        name: "Leaf",
        products: [
          {
            retailerProductId: "product-6",
            name: "Yogurt",
            imagePaths: ["https://img.example/yogurt"],
            price: { amount: "1.20" },
            unitPrice: { price: { amount: "0.55" }, unit: "fop.price.per.each", unitName: "EACH" },
            packSizeDescription: "4 units",
          },
        ],
      }),
      getProductDetail: vi.fn(),
    };

    const provider = new BonpreuCatalogProvider(httpClient as never);

    await expect(provider.getCategoryDetail("leaf-1")).resolves.toMatchObject({
      id: "leaf-1",
      categories: [
        {
          id: "leaf-1",
          products: [
            {
              id: "product-6",
              display_name: "Yogurt",
              packaging: "4 units",
              price_instructions: {
                unit_price: 1.2,
                bulk_price: 0.55,
                size_format: "ud",
              },
            },
          ],
        },
      ],
    });
  });

  it("maps single product main price, unit price, unit format and packaging", async () => {
    const httpClient = {
      getCategories: vi.fn(),
      getCategoryProducts: vi.fn(),
      getProductDetail: vi.fn().mockResolvedValue({
        retailerProductId: "product-4",
        name: "Oil",
        imagePaths: ["https://img.example/oil"],
        price: { amount: 4.2 },
        unitPrice: { price: { amount: 2.1 }, unit: "fop.price.per.litre" },
        packSizeDescription: "1 L bottle",
        categoryPath: [{ name: "Food" }, { name: "Oils" }],
      }),
    };

    const provider = new BonpreuCatalogProvider(httpClient as never);

    await expect(provider.getProduct("product-4")).resolves.toMatchObject({
      id: "product-4",
      display_name: "Oil",
      packaging: "1 L bottle",
      price_instructions: {
        unit_price: 4.2,
        bulk_price: 2.1,
        size_format: "litre",
      },
    });
  });

  it.each([
    ["missing unitPrice", { price: { amount: 2 }, packSizeDescription: "box" }, null, null],
    ["missing unitPrice.price", { price: { amount: 2 }, unitPrice: { unit: "fop.price.per.kg" } }, null, null],
    ["missing unitPrice.unit", { price: { amount: 2 }, unitPrice: { price: { amount: 0.5 } } }, null, null],
    ["unknown unit segment", { price: { amount: 2 }, unitPrice: { price: { amount: 0.5 }, unit: "fop.price.per.unknown" } }, null, null],
    ["malformed unitPrice amount string", { price: { amount: 2 }, unitPrice: { price: { amount: "not-a-number" }, unit: "fop.price.per.kg" } }, null, null],
  ])(
    "falls back safely for single product with %s",
    async (_label, product, expectedUnitFormat, expectedBulkPrice) => {
      const httpClient = {
        getCategories: vi.fn(),
        getCategoryProducts: vi.fn(),
        getProductDetail: vi.fn().mockResolvedValue({
          retailerProductId: "product-5",
          name: "Product",
          imagePaths: [],
          ...product,
        }),
      };

      const provider = new BonpreuCatalogProvider(httpClient as never);
      const detail = await provider.getProduct("product-5");

      expect(detail.price_instructions.size_format).toBe(expectedUnitFormat);
      expect(detail.price_instructions.bulk_price).toBe(expectedBulkPrice);
    },
  );

  it("parses string amounts and normalizes each unit for single product", async () => {
    const httpClient = {
      getCategories: vi.fn(),
      getCategoryProducts: vi.fn(),
      getProductDetail: vi.fn().mockResolvedValue({
        retailerProductId: "product-7",
        name: "Cookies",
        imagePaths: ["https://img.example/cookies"],
        price: { amount: "2.50" },
        unitPrice: { price: { amount: "0.55" }, unit: "fop.price.per.each", unitName: "EACH" },
        packSizeDescription: "6 units",
        categoryPath: [{ name: "Food" }, { name: "Bakery" }],
      }),
    };

    const provider = new BonpreuCatalogProvider(httpClient as never);

    await expect(provider.getProduct("product-7")).resolves.toMatchObject({
      id: "product-7",
      display_name: "Cookies",
      packaging: "6 units",
      price_instructions: {
        unit_price: 2.5,
        bulk_price: 0.55,
        size_format: "ud",
      },
    });
  });
});
