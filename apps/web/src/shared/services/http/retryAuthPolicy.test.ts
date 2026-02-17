import { describe, expect, it } from "vitest";
import {
  AUTH_401_RETRY_PRESETS,
  shouldRetryOnAuth401,
} from "./retryAuthPolicy";

describe("shouldRetryOnAuth401", () => {
  it("allows retry by default for safe GET routes", () => {
    expect(shouldRetryOnAuth401("/api/lists", { method: "GET" })).toBe(true);
    expect(shouldRetryOnAuth401("/api/lists/list-1", { method: "GET" })).toBe(true);
    expect(shouldRetryOnAuth401("/api/users/me", { method: "GET" })).toBe(true);
  });

  it("blocks default retry for high-risk list mutations", () => {
    expect(shouldRetryOnAuth401("/api/lists", { method: "POST" })).toBe(false);
    expect(shouldRetryOnAuth401("/api/lists/list-1", { method: "DELETE" })).toBe(false);
    expect(
      shouldRetryOnAuth401("/api/lists/list-1/items/item-1", { method: "PATCH" })
    ).toBe(false);
  });

  it("supports explicit opt-in for non-idempotent operations", () => {
    expect(
      shouldRetryOnAuth401("/api/lists", {
        method: "POST",
        retryOnAuth401: true,
      })
    ).toBe(true);
  });

  it("supports strict preset disabling all retries unless explicitly enabled", () => {
    expect(
      shouldRetryOnAuth401("/api/lists", {
        method: "GET",
        retryPolicyPreset: AUTH_401_RETRY_PRESETS.STRICT,
      })
    ).toBe(false);
    expect(
      shouldRetryOnAuth401("/api/lists", {
        method: "GET",
        retryPolicyPreset: AUTH_401_RETRY_PRESETS.STRICT,
        retryOnAuth401: true,
      })
    ).toBe(true);
  });
});
