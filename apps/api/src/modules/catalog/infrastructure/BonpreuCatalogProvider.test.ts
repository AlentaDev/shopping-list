import { describe, expect, it, vi } from "vitest";
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
});
