import request from "supertest";
import { createApp } from "../src/app.js";
import { createCatalogModule } from "../src/modules/catalog/catalogModule.js";
import type {
  CatalogProvider,
  MercadonaProductDetail,
} from "../src/modules/catalog/public.js";

type TestUser = {
  name: string;
  email: string;
  password: string;
  postalCode: string;
  fingerprint: string;
};

const defaultUser: TestUser = {
  name: "Alice",
  email: "alice@example.com",
  password: "Password12!A",
  postalCode: "12345",
  fingerprint: "device-1",
};

async function loginUser(app: ReturnType<typeof createApp>, user: TestUser) {
  const response = await request(app).post("/api/auth/register").send(user);
  const setCookieHeader = response.headers["set-cookie"];
  const cookies = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : setCookieHeader
      ? [setCookieHeader]
      : [];
  const accessCookie = cookies.find((cookie: string) =>
    cookie.startsWith("access_token="),
  );

  if (!accessCookie) {
    throw new Error("Missing access_token cookie");
  }

  return accessCookie;
}

const sampleProduct: MercadonaProductDetail = {
  id: "123",
  display_name: "Whole Milk",
  thumbnail: "https://cdn.example.com/milk-thumb.jpg",
  photos: [{ thumbnail: "https://cdn.example.com/milk-photo-thumb.jpg" }],
  price_instructions: {
    unit_price: 1.35,
    unit_size: 1,
    bulk_price: 1.35,
    approx_size: false,
    size_format: "L",
  },
};

const catalogProvider: CatalogProvider = {
  async getRootCategories() {
    return { count: 0, next: null, previous: null, results: [] };
  },
  async getCategoryDetail() {
    return { id: 1, name: "root", categories: [] };
  },
  async getProduct() {
    return sampleProduct;
  },
};

function createAppWithCatalogProvider(provider: CatalogProvider) {
  const catalogModule = createCatalogModule({ provider });

  return createApp({ catalogModule });
}

describe("lists endpoints", () => {
  it.each([
    { method: "post", path: "/api/lists", body: { title: "Groceries" } },
    { method: "get", path: "/api/lists" },
    { method: "get", path: "/api/lists/any-list" },
    {
      method: "patch",
      path: "/api/lists/any-list/items/any-item",
      body: { checked: true },
    },
    {
      method: "delete",
      path: "/api/lists/any-list/items/any-item",
    },
    {
      method: "post",
      path: "/api/lists/any-list/items/from-catalog",
      body: { source: "mercadona", productId: "123" },
    },
  ])("%s returns 401 without session", async ({ method, path, body }) => {
    const app = createApp();

    const agent = request(app) as any;
    const response = await agent[method](path).send(body);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "not_authenticated" });
  });

  it("POST /api/lists creates list and returns summary", async () => {
    const app = createApp();
    const cookie = await loginUser(app, defaultUser);

    const response = await request(app)
      .post("/api/lists")
      .set("Cookie", cookie)
      .send({ title: "Groceries" });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(String),
      title: "Groceries",
      status: "DRAFT",
      itemCount: 0,
      activatedAt: null,
      isEditing: false,
      updatedAt: expect.any(String),
    });
  });

  it("GET /api/lists returns lists for the authenticated user", async () => {
    const app = createApp();
    const cookie = await loginUser(app, defaultUser);

    await request(app)
      .post("/api/lists")
      .set("Cookie", cookie)
      .send({ title: "Groceries" });

    const response = await request(app).get("/api/lists").set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      lists: [],
    });
  });

  it("GET /api/lists/:id returns list detail for owner", async () => {
    const app = createApp();
    const cookie = await loginUser(app, defaultUser);

    const listResponse = await request(app)
      .post("/api/lists")
      .set("Cookie", cookie)
      .send({ title: "Weekly" });
    const listId = listResponse.body.id;

    const response = await request(app)
      .get(`/api/lists/${listId}`)
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: listId,
      title: "Weekly",
      items: [],
      itemCount: 0,
      activatedAt: null,
      isEditing: false,
      updatedAt: expect.any(String),
      status: "DRAFT",
    });
  });

  it("GET /api/lists/:id returns 403 for other user", async () => {
    const app = createApp();
    const ownerCookie = await loginUser(app, defaultUser);
    const otherCookie = await loginUser(app, {
      name: "Bob",
      email: "bob@example.com",
      password: "Password12!A",
      postalCode: "54321",
      fingerprint: "device-2",
    });

    const listResponse = await request(app)
      .post("/api/lists")
      .set("Cookie", ownerCookie)
      .send({ title: "Shared" });

    const response = await request(app)
      .get(`/api/lists/${listResponse.body.id}`)
      .set("Cookie", otherCookie);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "forbidden" });
  });

  it("PATCH /api/lists/:id/items/:itemId updates item fields", async () => {
    const app = createAppWithCatalogProvider(catalogProvider);
    const cookie = await loginUser(app, defaultUser);

    const listResponse = await request(app)
      .post("/api/lists")
      .set("Cookie", cookie)
      .send({ title: "Groceries" });

    const itemResponse = await request(app)
      .post(`/api/lists/${listResponse.body.id}/items/from-catalog`)
      .set("Cookie", cookie)
      .send({ source: "mercadona", productId: "123" });

    const response = await request(app)
      .patch(`/api/lists/${listResponse.body.id}/items/${itemResponse.body.id}`)
      .set("Cookie", cookie)
      .send({ checked: true, qty: 2 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: itemResponse.body.id,
        kind: "catalog",
        name: "Whole Milk",
        qty: 2,
        checked: true,
        updatedAt: expect.any(String),
        source: "mercadona",
        sourceProductId: "123",
      }),
    );
  });

  it("DELETE /api/lists/:id/items/:itemId removes item", async () => {
    const app = createAppWithCatalogProvider(catalogProvider);
    const cookie = await loginUser(app, defaultUser);

    const listResponse = await request(app)
      .post("/api/lists")
      .set("Cookie", cookie)
      .send({ title: "Groceries" });

    const itemResponse = await request(app)
      .post(`/api/lists/${listResponse.body.id}/items/from-catalog`)
      .set("Cookie", cookie)
      .send({ source: "mercadona", productId: "123" });

    const deleteResponse = await request(app)
      .delete(
        `/api/lists/${listResponse.body.id}/items/${itemResponse.body.id}`,
      )
      .set("Cookie", cookie);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({ ok: true });

    const detailResponse = await request(app)
      .get(`/api/lists/${listResponse.body.id}`)
      .set("Cookie", cookie);

    expect(detailResponse.body.items).toEqual([]);
  });

  it("returns 400 for validation errors", async () => {
    const app = createAppWithCatalogProvider(catalogProvider);
    const cookie = await loginUser(app, defaultUser);

    const invalidListResponse = await request(app)
      .post("/api/lists")
      .set("Cookie", cookie)
      .send({ title: "" });

    expect(invalidListResponse.status).toBe(400);
    expect(invalidListResponse.body).toEqual({
      error: "validation_error",
      details: expect.any(Array),
    });

    const listResponse = await request(app)
      .post("/api/lists")
      .set("Cookie", cookie)
      .send({ title: "Groceries" });

    const invalidItemResponse = await request(app)
      .post(`/api/lists/${listResponse.body.id}/items/from-catalog`)
      .set("Cookie", cookie)
      .send({ source: "mercadona", productId: "", qty: 0 });

    expect(invalidItemResponse.status).toBe(400);
    expect(invalidItemResponse.body).toEqual({
      error: "validation_error",
      details: expect.any(Array),
    });
  });

  it("POST /api/lists/:id/items/from-catalog returns 404 when list is missing", async () => {
    const app = createAppWithCatalogProvider(catalogProvider);
    const cookie = await loginUser(app, defaultUser);

    const response = await request(app)
      .post("/api/lists/missing/items/from-catalog")
      .set("Cookie", cookie)
      .send({ source: "mercadona", productId: "123" });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "list_not_found" });
  });

  it("POST /api/lists/:id/items/from-catalog returns 403 for other user", async () => {
    const app = createAppWithCatalogProvider(catalogProvider);
    const ownerCookie = await loginUser(app, defaultUser);
    const otherCookie = await loginUser(app, {
      name: "Bob",
      email: "bob@example.com",
      password: "Password12!A",
      postalCode: "54321",
      fingerprint: "device-2",
    });

    const listResponse = await request(app)
      .post("/api/lists")
      .set("Cookie", ownerCookie)
      .send({ title: "Shared" });

    const response = await request(app)
      .post(`/api/lists/${listResponse.body.id}/items/from-catalog`)
      .set("Cookie", otherCookie)
      .send({ source: "mercadona", productId: "123" });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "forbidden" });
  });

  it("POST /api/lists/:id/items/from-catalog adds a catalog item snapshot", async () => {
    const app = createAppWithCatalogProvider(catalogProvider);
    const cookie = await loginUser(app, defaultUser);

    const listResponse = await request(app)
      .post("/api/lists")
      .set("Cookie", cookie)
      .send({ title: "Groceries" });

    const response = await request(app)
      .post(`/api/lists/${listResponse.body.id}/items/from-catalog`)
      .set("Cookie", cookie)
      .send({ source: "mercadona", productId: "123", qty: 2, note: "Promo" });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(String),
      kind: "catalog",
      name: "Whole Milk",
      qty: 2,
      checked: false,
      note: "Promo",
      updatedAt: expect.any(String),
      thumbnail: "https://cdn.example.com/milk-thumb.jpg",
      price: 1.35,
      unitSize: 1,
      unitFormat: "L",
      unitPrice: 1.35,
      isApproxSize: false,
      source: "mercadona",
      sourceProductId: "123",
    });
  });

  it("POST /api/lists/:id/items/from-catalog defaults qty and validates bounds", async () => {
    const app = createAppWithCatalogProvider(catalogProvider);
    const cookie = await loginUser(app, defaultUser);

    const listResponse = await request(app)
      .post("/api/lists")
      .set("Cookie", cookie)
      .send({ title: "Groceries" });

    const defaultQtyResponse = await request(app)
      .post(`/api/lists/${listResponse.body.id}/items/from-catalog`)
      .set("Cookie", cookie)
      .send({ source: "mercadona", productId: "123" });

    expect(defaultQtyResponse.status).toBe(201);
    expect(defaultQtyResponse.body).toEqual(
      expect.objectContaining({ qty: 1 }),
    );

    const invalidMinResponse = await request(app)
      .post(`/api/lists/${listResponse.body.id}/items/from-catalog`)
      .set("Cookie", cookie)
      .send({ source: "mercadona", productId: "123", qty: 0 });

    expect(invalidMinResponse.status).toBe(400);
    expect(invalidMinResponse.body).toEqual({
      error: "validation_error",
      details: expect.any(Array),
    });

    const invalidMaxResponse = await request(app)
      .post(`/api/lists/${listResponse.body.id}/items/from-catalog`)
      .set("Cookie", cookie)
      .send({ source: "mercadona", productId: "123", qty: 100 });

    expect(invalidMaxResponse.status).toBe(400);
    expect(invalidMaxResponse.body).toEqual({
      error: "validation_error",
      details: expect.any(Array),
    });
  });

  it("POST /api/lists/:id/items/from-catalog returns 502 on provider failure", async () => {
    const failingProvider: CatalogProvider = {
      async getRootCategories() {
        return { count: 0, next: null, previous: null, results: [] };
      },
      async getCategoryDetail() {
        return { id: 1, name: "root", categories: [] };
      },
      async getProduct() {
        throw new Error("Provider down");
      },
    };

    const app = createAppWithCatalogProvider(failingProvider);
    const cookie = await loginUser(app, defaultUser);

    const listResponse = await request(app)
      .post("/api/lists")
      .set("Cookie", cookie)
      .send({ title: "Groceries" });

    const response = await request(app)
      .post(`/api/lists/${listResponse.body.id}/items/from-catalog`)
      .set("Cookie", cookie)
      .send({ source: "mercadona", productId: "123" });

    expect(response.status).toBe(502);
    expect(response.body).toEqual({ error: "catalog_provider_failed" });
  });

  it("GET /api/lists/:id returns catalog items normalized", async () => {
    const app = createAppWithCatalogProvider(catalogProvider);
    const cookie = await loginUser(app, defaultUser);

    const listResponse = await request(app)
      .post("/api/lists")
      .set("Cookie", cookie)
      .send({ title: "Weekly" });

    const catalogResponse = await request(app)
      .post(`/api/lists/${listResponse.body.id}/items/from-catalog`)
      .set("Cookie", cookie)
      .send({ source: "mercadona", productId: "123" });

    const catalogResponseTwo = await request(app)
      .post(`/api/lists/${listResponse.body.id}/items/from-catalog`)
      .set("Cookie", cookie)
      .send({ source: "mercadona", productId: "123", qty: 2 });

    const response = await request(app)
      .get(`/api/lists/${listResponse.body.id}`)
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: listResponse.body.id,
      title: "Weekly",
      status: "DRAFT",
      itemCount: 2,
      activatedAt: null,
      isEditing: false,
      items: [
        {
          id: catalogResponse.body.id,
          kind: "catalog",
          name: "Whole Milk",
          qty: 1,
          checked: false,
          updatedAt: expect.any(String),
          thumbnail: "https://cdn.example.com/milk-thumb.jpg",
          price: 1.35,
          unitSize: 1,
          unitFormat: "L",
          unitPrice: 1.35,
          isApproxSize: false,
          source: "mercadona",
          sourceProductId: "123",
        },
        {
          id: catalogResponseTwo.body.id,
          kind: "catalog",
          name: "Whole Milk",
          qty: 2,
          checked: false,
          updatedAt: expect.any(String),
          thumbnail: "https://cdn.example.com/milk-thumb.jpg",
          price: 1.35,
          unitSize: 1,
          unitFormat: "L",
          unitPrice: 1.35,
          isApproxSize: false,
          source: "mercadona",
          sourceProductId: "123",
        },
      ],
      updatedAt: expect.any(String),
    });
  });

  it("PATCH /api/lists/:id/editing marks an active list as editing", async () => {
    const app = createAppWithCatalogProvider(catalogProvider);
    const cookie = await loginUser(app, defaultUser);

    const listResponse = await request(app)
      .post("/api/lists")
      .set("Cookie", cookie)
      .send({ title: "Weekly" });

    const itemResponse = await request(app)
      .post(`/api/lists/${listResponse.body.id}/items/from-catalog`)
      .set("Cookie", cookie)
      .send({ source: "mercadona", productId: "123" });

    await request(app)
      .patch(`/api/lists/${listResponse.body.id}/activate`)
      .set("Cookie", cookie)
      .send({ status: "ACTIVE" });

    const response = await request(app)
      .patch(`/api/lists/${listResponse.body.id}/editing`)
      .set("Cookie", cookie)
      .send({ isEditing: true });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: listResponse.body.id,
      isEditing: true,
      updatedAt: expect.any(String),
    });

    const detailResponse = await request(app)
      .get(`/api/lists/${listResponse.body.id}`)
      .set("Cookie", cookie);

    expect(detailResponse.body).toEqual(
      expect.objectContaining({
        isEditing: true,
        itemCount: 1,
      }),
    );
    expect(itemResponse.body.id).toBeDefined();
  });

  it("POST /api/lists/:id/finish-edit applies autosave draft to active list", async () => {
    const app = createAppWithCatalogProvider(catalogProvider);
    const cookie = await loginUser(app, defaultUser);

    const listResponse = await request(app)
      .post("/api/lists")
      .set("Cookie", cookie)
      .send({ title: "Weekly" });

    await request(app)
      .post(`/api/lists/${listResponse.body.id}/items/from-catalog`)
      .set("Cookie", cookie)
      .send({ source: "mercadona", productId: "123" });

    await request(app)
      .patch(`/api/lists/${listResponse.body.id}/activate`)
      .set("Cookie", cookie)
      .send({ status: "ACTIVE" });

    await request(app)
      .patch(`/api/lists/${listResponse.body.id}/editing`)
      .set("Cookie", cookie)
      .send({ isEditing: true });

    await request(app)
      .put("/api/lists/autosave")
      .set("Cookie", cookie)
      .send({
        title: "Weekly updated",
        items: [
          {
            id: "autosave-item-1",
            kind: "catalog",
            name: "Whole Milk",
            qty: 2,
            checked: false,
            source: "mercadona",
            sourceProductId: "123",
          },
        ],
      });

    const response = await request(app)
      .post(`/api/lists/${listResponse.body.id}/finish-edit`)
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: listResponse.body.id,
        title: "Weekly updated",
        status: "ACTIVE",
        isEditing: false,
        itemCount: 1,
      }),
    );

    const detailResponse = await request(app)
      .get(`/api/lists/${listResponse.body.id}`)
      .set("Cookie", cookie);

    expect(detailResponse.body.items).toEqual([
      expect.objectContaining({
        id: "autosave-item-1",
        name: "Whole Milk",
        checked: false,
      }),
    ]);
  });

  it("GET /api/lists/autosave returns 204 when there is no autosave", async () => {
    const app = createApp();
    const cookie = await loginUser(app, defaultUser);

    const response = await request(app)
      .get("/api/lists/autosave")
      .set("Cookie", cookie);

    expect(response.status).toBe(204);
  });

  it("POST /api/lists/:id/reuse duplicates a completed list", async () => {
    const app = createAppWithCatalogProvider(catalogProvider);
    const cookie = await loginUser(app, defaultUser);

    const listResponse = await request(app)
      .post("/api/lists")
      .set("Cookie", cookie)
      .send({ title: "Weekly" });

    const itemResponse = await request(app)
      .post(`/api/lists/${listResponse.body.id}/items/from-catalog`)
      .set("Cookie", cookie)
      .send({ source: "mercadona", productId: "123" });

    await request(app)
      .patch(`/api/lists/${listResponse.body.id}/activate`)
      .set("Cookie", cookie)
      .send({ status: "ACTIVE" });

    await request(app)
      .post(`/api/lists/${listResponse.body.id}/complete`)
      .set("Cookie", cookie)
      .send({ checkedItemIds: [itemResponse.body.id] });

    const response = await request(app)
      .post(`/api/lists/${listResponse.body.id}/reuse`)
      .set("Cookie", cookie);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(String),
      title: "Weekly",
      status: "DRAFT",
      items: [
        expect.objectContaining({
          kind: "catalog",
          name: "Whole Milk",
          checked: false,
        }),
      ],
      updatedAt: expect.any(String),
    });
  });
});
