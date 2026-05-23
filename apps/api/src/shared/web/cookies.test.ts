import { describe, expect, it } from "vitest";
import { getCookieFromRequest } from "./cookies.js";

describe("getCookieFromRequest", () => {
  it("returns null when cookie header is missing", () => {
    expect(getCookieFromRequest(undefined, "refresh_token")).toBeNull();
  });

  it("returns null when cookie is not present", () => {
    expect(getCookieFromRequest("access_token=abc", "refresh_token")).toBeNull();
  });

  it("returns cookie value when present", () => {
    expect(
      getCookieFromRequest("access_token=abc; refresh_token=def", "refresh_token"),
    ).toBe("def");
  });

  it("keeps '=' characters inside cookie value", () => {
    expect(
      getCookieFromRequest("refresh_token=part1=part2=part3", "refresh_token"),
    ).toBe("part1=part2=part3");
  });

  it("returns null when cookie value is empty", () => {
    expect(getCookieFromRequest("refresh_token=", "refresh_token")).toBeNull();
  });
});
