import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchWithAuth } from "@src/infrastructure/http/fetchWithAuthRuntime";
import { getCategoryDetail, getRootCategories } from "./CatalogService";

vi.mock("@src/infrastructure/http/fetchWithAuthRuntime", () => ({
  fetchWithAuth: vi.fn(),
}));

const fetchWithAuthMock = vi.mocked(fetchWithAuth);

type FetchResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
};

describe("CatalogService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("requests the provider-aware root categories endpoint", async () => {
    const responsePayload = {
      categories: [{ id: "root-1", name: "Panadería", order: 1, level: 0 }],
    };
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async () => ({
        ok: true,
        json: async () => responsePayload,
      })
    );

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

    await expect(getRootCategories("mercadona")).resolves.toEqual(responsePayload);
    expect(fetchWithAuthMock).toHaveBeenCalledWith("/api/catalog/mercadona/categories");
  });

  it("requests the provider-aware category detail endpoint", async () => {
    const responsePayload = {
      id: "child-1",
      name: "Bollería",
      subcategories: [
        {
          id: "sub-1",
          name: "Dulces",
          products: [
            {
              id: "prod-1",
              name: "Ensaimada",
              thumbnail: null,
              packaging: null,
              price: 1.5,
              unitSize: null,
              unitFormat: null,
              unitPrice: null,
              isApproxSize: false,
            },
          ],
        },
      ],
    };
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async () => ({
        ok: true,
        json: async () => responsePayload,
      })
    );

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

    await expect(getCategoryDetail("mercadona", "child-1")).resolves.toEqual({
      categoryName: "Bollería",
      sections: [
        {
          subcategoryId: "sub-1",
          subcategoryName: "Dulces",
          products: [
            {
              id: "prod-1",
              name: "Ensaimada",
              thumbnail: null,
              packaging: null,
              price: 1.5,
              unitSize: null,
              unitFormat: null,
              unitPrice: null,
              isApproxSize: false,
            },
          ],
        },
      ],
    });
    expect(fetchWithAuthMock).toHaveBeenCalledWith(
      "/api/catalog/mercadona/categories/child-1",
    );
  });

  it("throws error when getRootCategories fails", async () => {
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async () => ({
        ok: false,
        json: async () => ({}),
      })
    );

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

    await expect(getRootCategories("mercadona")).rejects.toThrow(
      "Unable to load categories."
    );
  });

  it("throws error when getCategoryDetail fails", async () => {
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async () => ({
        ok: false,
        json: async () => ({}),
      })
    );

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

    await expect(getCategoryDetail("mercadona", "child-1")).rejects.toThrow(
      "Unable to load category detail."
    );
  });
});
