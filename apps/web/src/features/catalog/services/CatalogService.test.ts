import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchWithAuth } from "@src/shared/services/http/fetchWithAuth";
import { getCategoryDetail, getRootCategories } from "./CatalogService";

vi.mock("@src/shared/services/http/fetchWithAuth", () => ({
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

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

    await expect(getRootCategories()).resolves.toEqual(responsePayload);
    expect(fetchWithAuthMock).toHaveBeenCalledWith("/api/catalog/categories");
  });

  it("requests the category detail endpoint", async () => {
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

    await expect(getCategoryDetail("child-1")).resolves.toEqual({
      categoryName: "Bollería",
      sections: [
        {
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
    expect(fetchWithAuthMock).toHaveBeenCalledWith("/api/catalog/categories/child-1");
  });

  it("throws error when getRootCategories fails", async () => {
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async () => ({
        ok: false,
        json: async () => ({}),
      })
    );

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

    await expect(getRootCategories()).rejects.toThrow(
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

    await expect(getCategoryDetail("child-1")).rejects.toThrow(
      "Unable to load category detail."
    );
  });
});
