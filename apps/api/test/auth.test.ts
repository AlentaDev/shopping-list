import request from "supertest";
import { createApp } from "../src/app";

const validUser = {
  name: "Alice",
  email: "alice@example.com",
  password: "Password12!A",
  postalCode: "12345",
};

function extractCookieValue(setCookie: string, name: string) {
  const [cookie] = setCookie.split(";");
  const [cookieName, value] = cookie.split("=");
  if (cookieName !== name) {
    return null;
  }
  return value ?? null;
}

function getSetCookies(response: request.Response): string[] {
  const header = response.headers["set-cookie"];
  if (!header) {
    return [];
  }
  return Array.isArray(header) ? header : [header];
}

describe("auth endpoints", () => {
  it("POST /api/auth/register returns 201 and user", async () => {
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
  });

  it.each([
    {
      name: "Al",
      email: "alice@example.com",
      password: "Password12!A",
      postalCode: "12345",
    },
    {
      name: "Alice",
      email: "not-an-email",
      password: "Password12!A",
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
      password: "Password12!A",
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
    const cookies = getSetCookies(response);
    expect(cookies.find((cookie) => cookie.startsWith("access_token=")))
      .toBeTruthy();
    expect(cookies.find((cookie) => cookie.startsWith("refresh_token=")))
      .toBeTruthy();
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

  it("GET /api/users/me returns 401 without access token", async () => {
    const app = createApp();

    const response = await request(app).get("/api/users/me");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "not_authenticated" });
  });

  it("GET /api/auth/me returns 410 as deprecated", async () => {
    const app = createApp();

    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(410);
    expect(response.body).toEqual({ error: "deprecated_endpoint" });
  });

  it("GET /api/users/me returns 200 with access token", async () => {
    const app = createApp();

    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send(validUser);
    const accessCookie = getSetCookies(registerResponse).find((cookie) =>
      cookie.startsWith("access_token=")
    );

    if (!accessCookie) {
      throw new Error("Missing access_token cookie");
    }

    const response = await request(app)
      .get("/api/users/me")
      .set("Cookie", accessCookie);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: expect.any(String),
      name: validUser.name,
      email: validUser.email,
      postalCode: validUser.postalCode,
    });
  });

  it("POST /api/auth/logout clears auth cookies", async () => {
    const app = createApp();

    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send(validUser);
    const cookies = getSetCookies(registerResponse);

    const response = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", cookies);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
    const clearedCookies = getSetCookies(response);
    expect(
      clearedCookies.find((cookie) => cookie.startsWith("access_token="))
    ).toContain("Max-Age=0");
    expect(
      clearedCookies.find((cookie) => cookie.startsWith("refresh_token="))
    ).toContain("Max-Age=0");
  });
});

describe("auth token endpoints", () => {
  it("POST /api/auth/register sets access and refresh cookies", async () => {
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

    const cookies = getSetCookies(response);
    expect(cookies.find((cookie) => cookie.startsWith("access_token=")))
      .toBeTruthy();
    expect(cookies.find((cookie) => cookie.startsWith("refresh_token=")))
      .toBeTruthy();
  });

  it("POST /api/auth/login sets access and refresh cookies", async () => {
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

    const cookies = getSetCookies(response);
    expect(cookies.find((cookie) => cookie.startsWith("access_token=")))
      .toBeTruthy();
    expect(cookies.find((cookie) => cookie.startsWith("refresh_token=")))
      .toBeTruthy();
  });

  it("POST /api/auth/refresh rotates refresh token cookies", async () => {
    const app = createApp();

    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send(validUser);

    const registerCookies = getSetCookies(registerResponse);
    const refreshCookie = registerCookies.find((cookie) =>
      cookie.startsWith("refresh_token=")
    );
    if (!refreshCookie) {
      throw new Error("Missing auth cookies");
    }

    const response = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", refreshCookie);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });

    const refreshedCookies = getSetCookies(response);
    const newRefreshCookie = refreshedCookies.find((cookie) =>
      cookie.startsWith("refresh_token=")
    );

    expect(newRefreshCookie).toBeTruthy();
    expect(newRefreshCookie).not.toEqual(refreshCookie);

    const previousValue = extractCookieValue(
      refreshCookie as string,
      "refresh_token"
    );
    const nextValue = extractCookieValue(
      newRefreshCookie as string,
      "refresh_token"
    );
    expect(previousValue).not.toBe(nextValue);
  });
});
