import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCategoryDetail, getRootCategories } from "./CatalogService";

type FetchResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
};

describe("CatalogService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("requests the root categories endpoint", async () => {
    const responsePayload = {
      categories: [{ id: "root-1", name: "Panadería", order: 1, level: 0 }],
    };
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async () => ({
        ok: true,
        json: async () => responsePayload,
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(getRootCategories()).resolves.toEqual(responsePayload);
    expect(fetchMock).toHaveBeenCalledWith("/api/catalog/categories");
  });

  it("requests the category detail endpoint", async () => {
    const responsePayload = {
      id: "child-1",
      name: "Bollería",
      subcategories: [],
    };
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async () => ({
        ok: true,
        json: async () => responsePayload,
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(getCategoryDetail("child-1")).resolves.toEqual(responsePayload);
    expect(fetchMock).toHaveBeenCalledWith("/api/catalog/categories/child-1");
  });
});
