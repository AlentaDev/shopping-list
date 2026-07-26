// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

describe("web test storage setup", () => {
  it("stores values in the canonical test storage", () => {
    localStorage.setItem("setup-test-key", "value");

    expect(localStorage.getItem("setup-test-key")).toBe("value");
  });

  it("starts each test with isolated storage", () => {
    expect(localStorage.getItem("setup-test-key")).toBeNull();
  });
});
