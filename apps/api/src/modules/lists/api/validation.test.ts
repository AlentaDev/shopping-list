import { describe, expect, it } from "vitest";
import { createListSchema, upsertAutosaveSchema } from "./validation.js";

describe("list title validation", () => {
  it("accepts titles between 3 and 35 characters", () => {
    expect(() => createListSchema.parse({ title: "abc" })).not.toThrow();
    expect(() => createListSchema.parse({ title: "a".repeat(35) })).not.toThrow();
  });

  it("rejects titles shorter than 3 characters", () => {
    expect(() => createListSchema.parse({ title: "ab" })).toThrow();
    expect(() =>
      upsertAutosaveSchema.parse({
        title: "ab",
        baseUpdatedAt: new Date().toISOString(),
        items: [],
      }),
    ).toThrow();
  });

  it("rejects titles longer than 35 characters", () => {
    expect(() => createListSchema.parse({ title: "a".repeat(36) })).toThrow();
    expect(() =>
      upsertAutosaveSchema.parse({
        title: "a".repeat(36),
        baseUpdatedAt: new Date().toISOString(),
        items: [],
      }),
    ).toThrow();
  });
});
