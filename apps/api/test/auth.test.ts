import request from "supertest";
import { createApp } from "../src/app";

describe("auth endpoints", () => {
  const validUser = {
    name: "Alice",
    email: "alice@example.com",
    password: "secret123",
    postalCode: "12345",
  };

  function getCookie(cookies: string[] | string | undefined, name: string) {
    const cookieList = typeof cookies === "string" ? [cookies] : cookies;
    const cookie = cookieList?.find((item) => item.startsWith(`${name}=`));
    if (!cookie) {
      throw new Error(`Missing ${name} cookie`);
    }
    return cookie;
  }

  it("POST /api/auth/register returns 201, user and sets auth cookies", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/api/auth/register")
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
    const accessCookie = getCookie(response.headers["set-cookie"], "accessToken");
    const refreshCookie = getCookie(
      response.headers["set-cookie"],
      "refreshToken"
    );
    expect(accessCookie).toContain("accessToken=");
    expect(accessCookie).toContain("HttpOnly");
    expect(accessCookie).toContain("SameSite=Lax");
    expect(accessCookie).toContain("Max-Age=900");
    expect(refreshCookie).toContain("refreshToken=");
    expect(refreshCookie).toContain("HttpOnly");
    expect(refreshCookie).toContain("SameSite=Lax");
    expect(refreshCookie).toContain("Max-Age=604800");
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
  ])("POST /api/auth/register returns 400 for invalid input", async (payload) => {
    const app = createApp();

    const response = await request(app)
      .post("/api/auth/register")
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "validation_error",
      details: expect.any(Array),
    });
  });

  it("POST /api/auth/register returns 409 for duplicate email", async () => {
    const app = createApp();

    await request(app).post("/api/auth/register").send(validUser);
    const response = await request(app)
      .post("/api/auth/register")
      .send(validUser);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: "duplicate_email" });
  });

  it("POST /api/auth/login returns 200, user and sets auth cookies", async () => {
    const app = createApp();

    await request(app).post("/api/auth/register").send(validUser);
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
    const accessCookie = getCookie(response.headers["set-cookie"], "accessToken");
    const refreshCookie = getCookie(
      response.headers["set-cookie"],
      "refreshToken"
    );
    expect(accessCookie).toContain("accessToken=");
    expect(accessCookie).toContain("HttpOnly");
    expect(accessCookie).toContain("SameSite=Lax");
    expect(accessCookie).toContain("Max-Age=900");
    expect(refreshCookie).toContain("refreshToken=");
    expect(refreshCookie).toContain("HttpOnly");
    expect(refreshCookie).toContain("SameSite=Lax");
    expect(refreshCookie).toContain("Max-Age=604800");
  });

  it("POST /api/auth/login returns 400 for invalid input", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "not-an-email", password: "" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "validation_error",
      details: expect.any(Array),
    });
  });

  it("POST /api/auth/login returns 401 for invalid credentials", async () => {
    const app = createApp();

    await request(app).post("/api/auth/register").send(validUser);
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: "wrong" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "invalid_credentials" });
  });

  it("POST /api/auth/refresh returns 401 without refresh token", async () => {
    const app = createApp();

    const response = await request(app).post("/api/auth/refresh");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "not_authenticated" });
  });

  it("POST /api/auth/refresh sets new access token", async () => {
    const app = createApp();

    await request(app).post("/api/auth/register").send(validUser);
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: validUser.password });
    const refreshCookie = getCookie(
      loginResponse.headers["set-cookie"],
      "refreshToken"
    );

    const response = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", refreshCookie as string);

    expect(response.status).toBe(204);
    const accessCookie = getCookie(response.headers["set-cookie"], "accessToken");
    expect(accessCookie).toContain("accessToken=");
    expect(accessCookie).toContain("HttpOnly");
    expect(accessCookie).toContain("SameSite=Lax");
    expect(accessCookie).toContain("Max-Age=900");
  });

  it("GET /api/auth/me returns 401 without session", async () => {
    const app = createApp();

    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "not_authenticated" });
  });

  it("GET /api/auth/me returns 200 with session", async () => {
    const app = createApp();

    await request(app).post("/api/auth/register").send(validUser);
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: validUser.password });
    const cookie = getCookie(loginResponse.headers["set-cookie"], "accessToken");

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

    await request(app).post("/api/auth/register").send(validUser);
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: validUser.password });
    const cookie = getCookie(loginResponse.headers["set-cookie"], "refreshToken");

    const response = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", cookie as string);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
    const accessCookie = getCookie(response.headers["set-cookie"], "accessToken");
    const refreshCookie = getCookie(
      response.headers["set-cookie"],
      "refreshToken"
    );
    expect(accessCookie).toContain("accessToken=");
    expect(accessCookie).toContain("Max-Age=0");
    expect(refreshCookie).toContain("refreshToken=");
    expect(refreshCookie).toContain("Max-Age=0");
  });
});
