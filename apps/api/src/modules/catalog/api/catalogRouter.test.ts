import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { errorMiddleware } from "@src/app/errors/errorMiddleware.js";
import { AppError } from "@src/shared/errors/appError.js";
import { createCatalogRouter } from "./catalogRouter.js";

describe("catalog router", () => {
  it("rejects unknown providers before invoking a catalogue use case", async () => {
    const getRootCategoriesExecute = vi
      .fn()
      .mockImplementation(async (provider: string) => {
        if (provider === "mercadona") {
          return { categories: [] };
        }

        throw new AppError(404, "provider_not_found", "Provider not found", {
          provider,
        });
      });

    const app = express();
    app.use(
      "/api/catalog",
      createCatalogRouter({
        getRootCategories: { execute: getRootCategoriesExecute } as never,
        getCategoryDetail: { execute: vi.fn() } as never,
      }),
    );
    app.use(errorMiddleware);

    const response = await request(app).get("/api/catalog/invalid/categories");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("validation_error");
    expect(getRootCategoriesExecute).not.toHaveBeenCalled();
  });

  it("returns 400 when category id is invalid", async () => {
    const app = express();
    app.use(
      "/api/catalog",
      createCatalogRouter({
        getRootCategories: { execute: vi.fn() } as never,
        getCategoryDetail: { execute: vi.fn() } as never,
      }),
    );
    app.use(errorMiddleware);

    const response = await request(app).get("/api/catalog/mercadona/categories/%20");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("validation_error");
  });

  it("rejects Bonpreu catalogue routes before invoking a catalogue use case", async () => {
    const getRootCategoriesExecute = vi.fn().mockResolvedValue({ categories: [] });
    const app = express();
    app.use(
      "/api/catalog",
      createCatalogRouter({
        getRootCategories: { execute: getRootCategoriesExecute } as never,
        getCategoryDetail: { execute: vi.fn() } as never,
      }),
    );
    app.use(errorMiddleware);

    const response = await request(app).get("/api/catalog/bonpreuesclat/categories");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("validation_error");
    expect(getRootCategoriesExecute).not.toHaveBeenCalled();
  });

  it("forwards provider and category id to category detail use case", async () => {
    const getCategoryDetailExecute = vi
      .fn()
      .mockResolvedValue({ id: "1", name: "test", subcategories: [] });
    const app = express();
    app.use(
      "/api/catalog",
      createCatalogRouter({
        getRootCategories: { execute: vi.fn() } as never,
        getCategoryDetail: { execute: getCategoryDetailExecute } as never,
      }),
    );
    app.use(errorMiddleware);

    const response = await request(app).get(
      "/api/catalog/mercadona/categories/123",
    );

    expect(response.status).toBe(200);
    expect(getCategoryDetailExecute).toHaveBeenCalledWith("mercadona", "123");
  });

  it("accepts string category ids for the supported catalogue", async () => {
    const getCategoryDetailExecute = vi
      .fn()
      .mockResolvedValue({ id: "leaf.uuid-1", name: "test", subcategories: [] });
    const app = express();
    app.use(
      "/api/catalog",
      createCatalogRouter({
        getRootCategories: { execute: vi.fn() } as never,
        getCategoryDetail: { execute: getCategoryDetailExecute } as never,
      }),
    );
    app.use(errorMiddleware);

    const response = await request(app).get(
      "/api/catalog/mercadona/categories/08f4f6d0-4c2a-4d2b-a51b-8a6c9f16c123.leaf",
    );

    expect(response.status).toBe(200);
    expect(getCategoryDetailExecute).toHaveBeenCalledWith(
      "mercadona",
      "08f4f6d0-4c2a-4d2b-a51b-8a6c9f16c123.leaf",
    );
  });

});
