import { describe, expect, it } from "vitest";
import { addCatalogItemSchema, createListSchema, upsertAutosaveSchema } from "./validation.js";

describe("list title validation", () => {
  it("accepts titles between 3 and 25 characters", () => {
    expect(() => createListSchema.parse({ title: "abc" })).not.toThrow();
    expect(() => createListSchema.parse({ title: "a".repeat(25) })).not.toThrow();
    expect(() =>
      upsertAutosaveSchema.parse({
        title: "a".repeat(25),
        providerId: "mercadona",
        baseUpdatedAt: new Date().toISOString(),
        items: [],
      }),
    ).not.toThrow();
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

  it("rejects titles longer than 25 characters", () => {
    expect(() => createListSchema.parse({ title: "a".repeat(26) })).toThrow();
    expect(() =>
      upsertAutosaveSchema.parse({
        title: "a".repeat(26),
        providerId: "mercadona",
        baseUpdatedAt: new Date().toISOString(),
        items: [],
      }),
    ).toThrow();
  });

  it("accepts persisted Bonpreu snapshots for list compatibility", () => {
    expect(() =>
      upsertAutosaveSchema.parse({
        title: "Autosave",
        providerId: "bonpreuesclat",
        baseUpdatedAt: new Date().toISOString(),
        items: [
          {
            id: "item-1",
            kind: "catalog",
            name: "Leche",
            qty: 1,
            checked: false,
            source: "bonpreuesclat",
            sourceProductId: "4706",
            categorySnapshot: "Lácteos",
            subcategorySnapshot: null,
          },
        ],
      }),
    ).not.toThrow();
  });

  it("requires providerId in autosave payload", () => {
    expect(() =>
      upsertAutosaveSchema.parse({
        title: "Autosave",
        baseUpdatedAt: new Date().toISOString(),
        items: [],
      }),
    ).toThrow();
  });
});

describe("add catalog item validation", () => {
  it("requires provider in payload", () => {
    expect(() =>
      addCatalogItemSchema.parse({ source: "mercadona", productId: "4706" }),
    ).toThrow();
  });

  it("rejects unsupported provider slug", () => {
    expect(() =>
      addCatalogItemSchema.parse({
        source: "mercadona",
        provider: "otro-provider",
        productId: "4706",
      }),
    ).toThrow();
  });

  it("rejects Bonpreu catalogue mutations", () => {
    expect(() =>
      addCatalogItemSchema.parse({
        source: "bonpreuesclat",
        provider: "bonpreuesclat",
        productId: "4706",
      }),
    ).toThrow();
  });
});
