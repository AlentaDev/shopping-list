// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { AppProviders } from "./providers/AppProviders";

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

describe("App", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("loads default category products on mount", async () => {
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

        throw new Error("Unexpected request");
      }
    );

    vi.stubGlobal("fetch", fetchMock);

    render(
      <AppProviders>
        <App />
      </AppProviders>
    );

    expect(await screen.findByText("Ensaimada")).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(rootCategoriesUrl);
      expect(fetchMock).toHaveBeenCalledWith(categoryDetailUrl("child-1"));
    });
  });

  it("updates products when selecting another category", async () => {
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
                  name: "Clásicos",
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

    render(
      <AppProviders>
        <App />
      </AppProviders>
    );

    expect(await screen.findByText("Ensaimada")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Categorías" }));
    await userEvent.click(screen.getByRole("button", { name: "Lácteos" }));
    await userEvent.click(
      await screen.findByRole("button", { name: "Yogures" })
    );

    expect(await screen.findByText("Yogur natural")).toBeInTheDocument();
  });
});
