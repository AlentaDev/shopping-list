// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Catalog from "./Catalog";
import { ListProvider } from "@src/context/ListContext";
import { ToastProvider } from "@src/context/ToastContext";

vi.mock("./services/useCatalog", () => ({
  useCatalog: () => ({
    categoriesStatus: "success",
    categoriesError: null,
    categories: [],
    detailStatus: "success",
    detailError: null,
    categoryDetail: {
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
        {
          subcategoryName: "Salados",
          products: [
            {
              id: "prod-2",
              name: "Empanada",
              thumbnail: null,
              packaging: null,
              price: 2.1,
              unitSize: null,
              unitFormat: null,
              unitPrice: null,
              isApproxSize: false,
            },
          ],
        },
      ],
    },
    selectedCategoryId: "child-1",
    selectCategory: vi.fn(),
    reloadCategories: vi.fn(),
    reloadDetail: vi.fn(),
  }),
}));

describe("Catalog", () => {
  it("renders the category title with all subcategories and products", () => {
    render(
      <ToastProvider>
        <ListProvider>
          <Catalog />
        </ListProvider>
      </ToastProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "Bollería", level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Dulces", level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Salados", level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ensaimada")).toBeInTheDocument();
    expect(screen.getByText("Empanada")).toBeInTheDocument();
  });
});
