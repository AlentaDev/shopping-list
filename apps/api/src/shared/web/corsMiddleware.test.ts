import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createCorsMiddleware } from "./corsMiddleware.js";

function createTestApp(allowedOrigins: string[]) {
  const app = express();
  app.use(createCorsMiddleware(allowedOrigins));
  app.get("/test", (_req, res) => {
    res.status(200).json({ ok: true });
  });
  return app;
}

describe("createCorsMiddleware", () => {
  it("allows requests from allowed origin", async () => {
    const app = createTestApp(["https://allowed.example.com"]);

    const response = await request(app)
      .get("/test")
      .set("Origin", "https://allowed.example.com");

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "https://allowed.example.com",
    );
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
    expect(response.headers.vary).toBe("Origin");
  });

  it("rejects requests from disallowed origin", async () => {
    const app = createTestApp(["https://allowed.example.com"]);

    const response = await request(app)
      .get("/test")
      .set("Origin", "https://blocked.example.com");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "origin_not_allowed" });
  });

  it("handles OPTIONS for allowed and disallowed origins", async () => {
    const app = createTestApp(["https://allowed.example.com"]);

    const allowedResponse = await request(app)
      .options("/test")
      .set("Origin", "https://allowed.example.com");
    expect(allowedResponse.status).toBe(200);

    const disallowedResponse = await request(app)
      .options("/test")
      .set("Origin", "https://blocked.example.com");
    expect(disallowedResponse.status).toBe(403);
  });

  it("allows missing origin without Access-Control-Allow-Origin", async () => {
    const app = createTestApp(["https://allowed.example.com"]);

    const response = await request(app).get("/test");

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    expect(response.headers["access-control-allow-methods"]).toBe(
      "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    );
    expect(response.headers["access-control-allow-headers"]).toBe(
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
  });
});
