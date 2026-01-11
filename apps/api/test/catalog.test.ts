import request from "supertest";
import { vi } from "vitest";
import { createApp } from "../src/app";
import { createCatalogModule } from "../src/modules/catalog/catalogModule";
import { ROOT_CATEGORIES_CACHE_KEY } from "../src/modules/catalog/application/cacheKeys";
import type { CatalogProvider } from "../src/modules/catalog/domain/catalogProvider";
import type {
  GetCategoryDetailResponse,
  GetRootCategoriesResponse,
} from "../src/modules/catalog/domain/catalogTypes";
import { InMemoryCatalogCache } from "../src/modules/catalog/infrastructure/InMemoryCatalogCache";

describe("catalog endpoints", () => {
  const rootCategoriesResponse = {
    count: 1,
    next: null,
    previous: null,
    results: [
      {
        id: 12,
        name: "Food",
        order: 1,
        is_extended: false,
        categories: [
          {
            id: 1201,
            name: "Fruit",
            order: 1,
            layout: "grid",
            published: true,
            is_extended: false,
          },
        ],
      },
    ],
  };

  const categoryDetailResponse = {
    id: 12,
    name: "Food",
    categories: [
      {
        id: 1201,
        name: "Fruit",
        products: [
          {
            id: "p-1",
            packaging: "bag",
            thumbnail: "https://example.test/apple.png",
            display_name: "Apple",
            price_instructions: {
              unit_price: 1.5,
              unit_size: 1,
              bulk_price: 1.5,
              approx_size: false,
              size_format: "kg",
            },
          },
          {
            id: "p-2",
            packaging: "Granel",
            thumbnail: "https://example.test/almonds.png",
            display_name: "Almonds",
            price_instructions: {
              unit_price: 120,
              unit_size: 1,
              bulk_price: 2.5,
              approx_size: false,
              size_format: "kg",
            },
          },
        ],
      },
    ],
  };

  const mappedRootCategories: GetRootCategoriesResponse = {
    categories: [
      {
        id: "12",
        name: "Food",
        order: 1,
        level: 0,
      },
      {
        id: "1201",
        name: "Fruit",
        order: 1,
        level: 1,
        parentId: "12",
        published: true,
      },
    ],
  };

  const mappedCategoryDetail: GetCategoryDetailResponse = {
    id: "12",
    name: "Food",
    subcategories: [
      {
        id: "1201",
        name: "Fruit",
        products: [
          {
            id: "p-1",
            name: "Apple",
            thumbnail: "https://example.test/apple.png",
            packaging: "bag",
            price: 1.5,
            unitSize: 1,
            unitFormat: "kg",
            unitPrice: 1.5,
            isApproxSize: false,
          },
          {
            id: "p-2",
            name: "Almonds",
            thumbnail: "https://example.test/almonds.png",
            packaging: "Granel",
            price: 2.5,
            unitSize: 1,
            unitFormat: "kg",
            unitPrice: 2.5,
            isApproxSize: false,
          },
        ],
      },
    ],
  };

  function createProvider(
    overrides?: Partial<CatalogProvider>
  ): CatalogProvider {
    return {
      getRootCategories: vi.fn().mockResolvedValue(rootCategoriesResponse),
      getCategoryDetail: vi.fn().mockResolvedValue(categoryDetailResponse),
      ...overrides,
    } as CatalogProvider;
  }

  it("GET /api/catalog/categories returns mapped root categories", async () => {
    const provider = createProvider();
    const app = createApp({
      catalogModule: createCatalogModule({
        provider,
        cache: new InMemoryCatalogCache(),
      }),
    });

    const response = await request(app).get("/api/catalog/categories");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mappedRootCategories);
  });

  it("GET /api/catalog/categories/:id returns mapped category detail", async () => {
    const provider = createProvider();
    const app = createApp({
      catalogModule: createCatalogModule({
        provider,
        cache: new InMemoryCatalogCache(),
      }),
    });

    const response = await request(app).get("/api/catalog/categories/12");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mappedCategoryDetail);
  });

  it("returns cached root categories when provider fails", async () => {
    const provider = createProvider({
      getRootCategories: vi.fn().mockRejectedValue(new Error("boom")),
    });
    const cache = new InMemoryCatalogCache();
    cache.set(ROOT_CATEGORIES_CACHE_KEY, mappedRootCategories, 60_000);

    const app = createApp({
      catalogModule: createCatalogModule({ provider, cache }),
    });

    const response = await request(app).get("/api/catalog/categories");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mappedRootCategories);
  });

  it("returns 502 when provider fails and no cache exists", async () => {
    const provider = createProvider({
      getCategoryDetail: vi.fn().mockRejectedValue(new Error("boom")),
    });
    const app = createApp({
      catalogModule: createCatalogModule({
        provider,
        cache: new InMemoryCatalogCache(),
      }),
    });

    const response = await request(app).get("/api/catalog/categories/12");

    expect(response.status).toBe(502);
    expect(response.body).toEqual({ error: "catalog_provider_unavailable" });
  });
});
