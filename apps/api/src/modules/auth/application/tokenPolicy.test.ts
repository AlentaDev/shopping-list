import { describe, expect, it } from "vitest";
import {
  ACCESS_TOKEN_TTL_MS,
  REFRESH_TOKEN_TTL_MS,
  getAccessTokenExpiresAt,
  getRefreshTokenExpiresAt,
} from "./tokenPolicy.js";

describe("tokenPolicy", () => {
  it("define un TTL de 1 minuto para access token", () => {
    expect(ACCESS_TOKEN_TTL_MS).toBe(60 * 1000);
  });

  it("calcula expiración de access token con el TTL configurado", () => {
    const now = new Date("2024-01-01T10:00:00.000Z");

    expect(getAccessTokenExpiresAt(now)).toEqual(
      new Date("2024-01-01T10:01:00.000Z"),
    );
  });

  it("mantiene refresh token con TTL de 7 días", () => {
    expect(REFRESH_TOKEN_TTL_MS).toBe(7 * 24 * 60 * 60 * 1000);

    const now = new Date("2024-01-01T10:00:00.000Z");
    expect(getRefreshTokenExpiresAt(now)).toEqual(
      new Date("2024-01-08T10:00:00.000Z"),
    );
  });
});
