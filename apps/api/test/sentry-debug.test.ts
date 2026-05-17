import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "@src/app.js";

describe("GET /debug/sentry", () => {
  it("returns 500 in non-production environments", async () => {
    const app = createApp();

    const response = await request(app).get("/debug/sentry");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "internal_server_error" });
  });
});
