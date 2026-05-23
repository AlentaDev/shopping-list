import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { errorMiddleware } from "@src/app/errors/errorMiddleware.js";
import { createCatalogRouter } from "./catalogRouter.js";

describe("catalog router", () => {
  it("returns 400 when provider is invalid", async () => {
    const app = express();
    app.use(
      "/api/catalog",
      createCatalogRouter({
        getRootCategories: { execute: vi.fn() } as never,
        getCategoryDetail: { execute: vi.fn() } as never,
      }),
    );
    app.use(errorMiddleware);

    const response = await request(app).get("/api/catalog/invalid/categories");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("validation_error");
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

  it("uses provider-aware categories endpoint", async () => {
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

    const response = await request(app).get("/api/catalog/mercadona/categories");

    expect(response.status).toBe(200);
    expect(getRootCategoriesExecute).toHaveBeenCalledTimes(1);
  });
});
