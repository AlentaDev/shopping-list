// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useCatalog } from "./useCatalog";

type FetchResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
};

const rootCategoriesUrl = "/api/catalog/categories";
const categoryDetailUrl = (id: string) => `/api/catalog/categories/${id}`;

const productFixtures = {
  ensaimada: {
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
  yogur: {
    id: "prod-2",
    name: "Yogur natural",
    thumbnail: null,
    packaging: null,
    price: 0.9,
    unitSize: null,
    unitFormat: null,
    unitPrice: null,
    isApproxSize: false,
  },
};

const CatalogHarness = () => {
  const { categoryDetail, selectCategory } = useCatalog();

  return (
    <div>
      <button type="button" onClick={() => selectCategory("child-2")}>
        Select second
      </button>
      {categoryDetail ? (
        <div>
          <h1>{categoryDetail.categoryName}</h1>
          {categoryDetail.sections.map((section) => (
            <div key={section.subcategoryName}>
              <h2>{section.subcategoryName}</h2>
              {section.products.map((product) => (
                <span key={product.id}>{product.name}</span>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

describe("useCatalog", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("loads products for the default category and updates on selection", async () => {
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async (input) => {
        if (input === rootCategoriesUrl) {
          return {
            ok: true,
            json: async () => ({
              categories: [
                { id: "root-1", name: "Panadería", order: 1, level: 0 },
                { id: "root-2", name: "Lácteos", order: 2, level: 0 },
                {
                  id: "child-1",
                  name: "Bollería",
                  order: 1,
                  level: 1,
                  parentId: "root-1",
                },
                {
                  id: "child-2",
                  name: "Yogures",
                  order: 1,
                  level: 1,
                  parentId: "root-2",
                },
              ],
            }),
          };
        }

        if (input === categoryDetailUrl("child-1")) {
          return {
            ok: true,
            json: async () => ({
              id: "child-1",
              name: "Bollería",
              subcategories: [
                {
                  id: "sub-1",
                  name: "Dulces",
                  products: [productFixtures.ensaimada],
                },
              ],
            }),
          };
        }

        if (input === categoryDetailUrl("child-2")) {
          return {
            ok: true,
            json: async () => ({
              id: "child-2",
              name: "Yogures",
              subcategories: [
                {
                  id: "sub-2",
                  name: "Fríos",
                  products: [productFixtures.yogur],
                },
              ],
            }),
          };
        }

        throw new Error("Unexpected request");
      }
    );

    vi.stubGlobal("fetch", fetchMock);

    render(<CatalogHarness />);

    expect(await screen.findByText("Bollería")).toBeInTheDocument();
    expect(await screen.findByText("Ensaimada")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Select second" })
    );

    expect(await screen.findByText("Yogures")).toBeInTheDocument();
    expect(await screen.findByText("Yogur natural")).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        rootCategoriesUrl,
        expect.objectContaining({ credentials: "include" }),
      );
      expect(fetchMock).toHaveBeenCalledWith(
        categoryDetailUrl("child-1"),
        expect.objectContaining({ credentials: "include" }),
      );
      expect(fetchMock).toHaveBeenCalledWith(
        categoryDetailUrl("child-2"),
        expect.objectContaining({ credentials: "include" }),
      );
    });
  });

  it("handles error when loading categories", async () => {
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async () => ({
        ok: false,
        json: async () => ({}),
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    const ErrorHarness = () => {
      const { categoriesError, categoriesStatus } = useCatalog();

      return (
        <div>
          <span data-testid="status">{categoriesStatus}</span>
          <span data-testid="error">{categoriesError}</span>
        </div>
      );
    };

    render(<ErrorHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("error");
      expect(screen.getByTestId("error")).toHaveTextContent(
        "No se pudieron cargar las categorías."
      );
    });
  });

  it("handles error when loading category detail", async () => {
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async (input) => {
        if (input === rootCategoriesUrl) {
          return {
            ok: true,
            json: async () => ({
              categories: [
                { id: "root-1", name: "Panadería", order: 1, level: 0 },
                {
                  id: "child-1",
                  name: "Bollería",
                  order: 1,
                  level: 1,
                  parentId: "root-1",
                },
              ],
            }),
          };
        }

        return {
          ok: false,
          json: async () => ({}),
        };
      }
    );

    vi.stubGlobal("fetch", fetchMock);

    const ErrorHarness = () => {
      const { detailError, detailStatus } = useCatalog();

      return (
        <div>
          <span data-testid="detail-status">{detailStatus}</span>
          <span data-testid="detail-error">{detailError}</span>
        </div>
      );
    };

    render(<ErrorHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("detail-status")).toHaveTextContent("error");
      expect(screen.getByTestId("detail-error")).toHaveTextContent(
        "No se pudieron cargar los productos."
      );
    });
  });

  it("handles empty categories gracefully", async () => {
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async () => ({
        ok: true,
        json: async () => ({
          categories: [],
        }),
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    const EmptyHarness = () => {
      const { categoryDetail, categoriesStatus } = useCatalog();

      return (
        <div>
          <span data-testid="status">{categoriesStatus}</span>
          <span data-testid="detail">
            {categoryDetail?.categoryName ?? "no-detail"}
          </span>
        </div>
      );
    };

    render(<EmptyHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("success");
      expect(screen.getByTestId("detail")).toHaveTextContent("");
    });
  });

  it("allows manual reload of categories and detail", async () => {
    let callCount = 0;

    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async (input) => {
        if (input === rootCategoriesUrl) {
          callCount++;
          return {
            ok: true,
            json: async () => ({
              categories: [
                { id: "root-1", name: "Panadería", order: 1, level: 0 },
                {
                  id: "child-1",
                  name: "Bollería",
                  order: 1,
                  level: 1,
                  parentId: "root-1",
                },
              ],
            }),
          };
        }

        callCount++;
        return {
          ok: true,
          json: async () => ({
            id: "child-1",
            name: "Bollería",
            subcategories: [],
          }),
        };
      }
    );

    vi.stubGlobal("fetch", fetchMock);

    const ReloadHarness = () => {
      const { reloadCategories, reloadDetail, categoryDetail } = useCatalog();

      return (
        <div>
          <button type="button" onClick={() => reloadCategories()}>
            Reload categories
          </button>
          <button type="button" onClick={() => reloadDetail()}>
            Reload detail
          </button>
          {categoryDetail && <span>{categoryDetail.categoryName}</span>}
        </div>
      );
    };

    render(<ReloadHarness />);

    await waitFor(() => {
      expect(screen.getByText("Bollería")).toBeInTheDocument();
    });

    const initialCalls = callCount;

    await userEvent.click(
      screen.getByRole("button", { name: "Reload categories" })
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Reload detail" })
    );

    await waitFor(() => {
      expect(callCount).toBeGreaterThan(initialCalls);
    });
  });

  it("does not reload detail when no category is selected", async () => {
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async () => ({
        ok: true,
        json: async () => ({
          categories: [],
        }),
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    const NoSelectionHarness = () => {
      const { reloadDetail } = useCatalog();

      return (
        <div>
          <button type="button" onClick={() => reloadDetail()}>
            Try reload
          </button>
        </div>
      );
    };

    render(<NoSelectionHarness />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        rootCategoriesUrl,
        expect.objectContaining({ credentials: "include" }),
      );
    });

    const callsBefore = fetchMock.mock.calls.length;

    await userEvent.click(screen.getByRole("button", { name: "Try reload" }));

    // Should not make additional calls since no category is selected
    expect(fetchMock.mock.calls.length).toBe(callsBefore);
  });
});
