import request from "supertest";
import { createApp } from "../src/app";

type TestUser = {
  name: string;
  email: string;
  password: string;
  postalCode: string;
};

const defaultUser: TestUser = {
  name: "Alice",
  email: "alice@example.com",
  password: "secret123",
  postalCode: "12345",
};

async function loginUser(app: ReturnType<typeof createApp>, user: TestUser) {
  await request(app).post("/api/auth/signup").send(user);
  const response = await request(app)
    .post("/api/auth/login")
    .send({ email: user.email, password: user.password });

  return response.headers["set-cookie"]?.[0] as string;
}

describe("lists endpoints", () => {
  it.each([
    { method: "post", path: "/api/lists", body: { title: "Groceries" } },
    { method: "get", path: "/api/lists" },
    { method: "get", path: "/api/lists/any-list" },
    {
      method: "post",
      path: "/api/lists/any-list/items",
      body: { name: "Milk" },
    },
    {
      method: "patch",
      path: "/api/lists/any-list/items/any-item",
      body: { checked: true },
    },
    {
      method: "delete",
      path: "/api/lists/any-list/items/any-item",
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

    const response = await request(app)
      .get("/api/lists")
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      lists: [
        {
          id: expect.any(String),
          title: "Groceries",
          updatedAt: expect.any(String),
        },
      ],
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
      updatedAt: expect.any(String),
    });
  });

  it("GET /api/lists/:id returns 403 for other user", async () => {
    const app = createApp();
    const ownerCookie = await loginUser(app, defaultUser);
    const otherCookie = await loginUser(app, {
      name: "Bob",
      email: "bob@example.com",
      password: "secret123",
      postalCode: "54321",
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

  it("POST /api/lists/:id/items adds a manual item", async () => {
    const app = createApp();
    const cookie = await loginUser(app, defaultUser);

    const listResponse = await request(app)
      .post("/api/lists")
      .set("Cookie", cookie)
      .send({ title: "Groceries" });

    const response = await request(app)
      .post(`/api/lists/${listResponse.body.id}/items`)
      .set("Cookie", cookie)
      .send({ name: "Milk" });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(String),
      name: "Milk",
      qty: 1,
      checked: false,
      updatedAt: expect.any(String),
    });
  });

  it("PATCH /api/lists/:id/items/:itemId updates item fields", async () => {
    const app = createApp();
    const cookie = await loginUser(app, defaultUser);

    const listResponse = await request(app)
      .post("/api/lists")
      .set("Cookie", cookie)
      .send({ title: "Groceries" });

    const itemResponse = await request(app)
      .post(`/api/lists/${listResponse.body.id}/items`)
      .set("Cookie", cookie)
      .send({ name: "Eggs" });

    const response = await request(app)
      .patch(
        `/api/lists/${listResponse.body.id}/items/${itemResponse.body.id}`
      )
      .set("Cookie", cookie)
      .send({ checked: true, qty: 2 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: itemResponse.body.id,
      name: "Eggs",
      qty: 2,
      checked: true,
      updatedAt: expect.any(String),
    });
  });

  it("DELETE /api/lists/:id/items/:itemId removes item", async () => {
    const app = createApp();
    const cookie = await loginUser(app, defaultUser);

    const listResponse = await request(app)
      .post("/api/lists")
      .set("Cookie", cookie)
      .send({ title: "Groceries" });

    const itemResponse = await request(app)
      .post(`/api/lists/${listResponse.body.id}/items`)
      .set("Cookie", cookie)
      .send({ name: "Bread" });

    const deleteResponse = await request(app)
      .delete(
        `/api/lists/${listResponse.body.id}/items/${itemResponse.body.id}`
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
    const app = createApp();
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
      .post(`/api/lists/${listResponse.body.id}/items`)
      .set("Cookie", cookie)
      .send({ name: "Milk", qty: 0 });

    expect(invalidItemResponse.status).toBe(400);
    expect(invalidItemResponse.body).toEqual({
      error: "validation_error",
      details: expect.any(Array),
    });
  });
});
