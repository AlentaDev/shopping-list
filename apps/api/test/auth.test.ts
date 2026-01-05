import request from "supertest";
import { createApp } from "../src/app";

describe("auth endpoints", () => {
  const validUser = {
    name: "Alice",
    email: "alice@example.com",
    password: "secret123",
    postalCode: "12345",
  };

  it("POST /api/auth/signup returns 201 and user", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/api/auth/signup")
      .send(validUser);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(String),
      name: validUser.name,
      email: validUser.email,
      postalCode: validUser.postalCode,
    });
    expect(response.body).not.toHaveProperty("password");
    expect(response.body).not.toHaveProperty("passwordHash");
  });

  it.each([
    {
      name: "Al",
      email: "alice@example.com",
      password: "secret123",
      postalCode: "12345",
    },
    {
      name: "Alice",
      email: "not-an-email",
      password: "secret123",
      postalCode: "12345",
    },
    {
      name: "Alice",
      email: "alice@example.com",
      password: "",
      postalCode: "12345",
    },
    {
      name: "Alice",
      email: "alice@example.com",
      password: "secret123",
      postalCode: "",
    },
  ])("POST /api/auth/signup returns 400 for invalid input", async (payload) => {
    const app = createApp();

    const response = await request(app)
      .post("/api/auth/signup")
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "validation_error",
      details: expect.any(Array),
    });
  });

  it("POST /api/auth/signup returns 409 for duplicate email", async () => {
    const app = createApp();

    await request(app).post("/api/auth/signup").send(validUser);
    const response = await request(app)
      .post("/api/auth/signup")
      .send(validUser);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: "duplicate_email" });
  });

  it("POST /api/auth/login returns 200, user and sets session cookie", async () => {
    const app = createApp();

    await request(app).post("/api/auth/signup").send(validUser);
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: validUser.password });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: expect.any(String),
      name: validUser.name,
      email: validUser.email,
      postalCode: validUser.postalCode,
    });
    const setCookie = response.headers["set-cookie"]?.[0];
    expect(setCookie).toContain("session=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
  });

  it("POST /api/auth/login returns 401 for invalid credentials", async () => {
    const app = createApp();

    await request(app).post("/api/auth/signup").send(validUser);
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: "wrong" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "invalid_credentials" });
  });

  it("GET /api/auth/me returns 401 without session", async () => {
    const app = createApp();

    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "not_authenticated" });
  });

  it("GET /api/auth/me returns 200 with session", async () => {
    const app = createApp();

    await request(app).post("/api/auth/signup").send(validUser);
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: validUser.password });
    const cookie = loginResponse.headers["set-cookie"]?.[0];

    const response = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookie as string);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: expect.any(String),
      name: validUser.name,
      email: validUser.email,
      postalCode: validUser.postalCode,
    });
  });

  it("POST /api/auth/logout clears session", async () => {
    const app = createApp();

    await request(app).post("/api/auth/signup").send(validUser);
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: validUser.password });
    const cookie = loginResponse.headers["set-cookie"]?.[0];

    const response = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", cookie as string);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
    const setCookie = response.headers["set-cookie"]?.[0];
    expect(setCookie).toContain("session=");
    expect(setCookie).toContain("Max-Age=0");
  });
});
