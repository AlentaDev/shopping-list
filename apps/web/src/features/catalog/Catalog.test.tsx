// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Catalog from "./Catalog";
import { ListProvider } from "@src/context/ListContext";
import { ToastProvider } from "@src/context/ToastContext";
import Toast from "@src/shared/components/toast/Toast";

const addItemMock = vi.fn();
const selectCategoryMock = vi.fn();
const reloadCategoriesMock = vi.fn();
const reloadDetailMock = vi.fn();

type CategoryNode = {
  id: string;
  name: string;
  order: number;
  level: number;
  parentId?: string;
};

const categoriesFixture: CategoryNode[] = [
  { id: "root-1", name: "Frutas", order: 1, level: 0 },
  {
    id: "child-1",
    name: "Cítricos",
    order: 1,
    level: 1,
    parentId: "root-1",
  },
  {
    id: "child-2",
    name: "Tropicales",
    order: 2,
    level: 1,
    parentId: "root-1",
  },
];

let selectedCategoryIdMock = "child-1";
let isMobileCatalogInteractionModeMock = false;
let categoriesStatusMock = "success";
let detailStatusMock = "success";
let categoryDetailMock = {
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
};

vi.mock("@src/context/useList", () => ({
  useList: () => ({
    addItem: addItemMock,
  }),
}));

vi.mock("@src/context/useAuth", () => ({
  useAuth: () => ({
    authUser: { id: "user-1" },
  }),
}));

vi.mock("./services/useCatalog", () => ({
  useCatalog: () => ({
    categoriesStatus: categoriesStatusMock,
    categoriesError: null,
    categories: categoriesFixture,
    detailStatus: detailStatusMock,
    detailError: null,
    categoryDetail: categoryDetailMock,
    selectedCategoryId: selectedCategoryIdMock,
    selectCategory: selectCategoryMock,
    reloadCategories: reloadCategoriesMock,
    reloadDetail: reloadDetailMock,
  }),
}));

vi.mock("@src/shared/utils/isMobileCatalogInteractionMode", () => ({
  isMobileCatalogInteractionMode: () => isMobileCatalogInteractionModeMock,
}));

describe("Catalog", () => {
  it("setea snapshots al agregar producto desde catálogo", async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <ListProvider>
          <Catalog />
          <Toast />
        </ListProvider>
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Añadir Ensaimada" }));

    expect(addItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "prod-1",
        category: "Dulces",
        categorySnapshot: "Bollería",
        subcategorySnapshot: "Dulces",
      }),
    );
  });

  it("renders the category title with all subcategories and products", () => {
    render(
      <ToastProvider>
        <ListProvider>
          <Catalog />
          <Toast />
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

  it("shows a toast when adding a product", async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <ListProvider>
          <Catalog />
          <Toast />
        </ListProvider>
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Añadir Ensaimada" }));

    const toastStack = screen.getByTestId("toast-stack");

    expect(
      within(toastStack).getByText("Añadido a la lista"),
    ).toBeInTheDocument();
    expect(within(toastStack).getByText("Ensaimada")).toBeInTheDocument();
  });

  it("uses a 2-column mobile product grid while preserving md+ classes", () => {
    render(
      <ToastProvider>
        <ListProvider>
          <Catalog />
          <Toast />
        </ListProvider>
      </ToastProvider>,
    );

    const dulcesHeading = screen.getByRole("heading", {
      name: "Dulces",
      level: 2,
    });
    const productGrid = dulcesHeading.nextElementSibling;

    expect(productGrid).toHaveClass("grid-cols-2");
    expect(productGrid).toHaveClass("md:grid-cols-3");
    expect(productGrid).toHaveClass("lg:grid-cols-4");
  });

  it("keeps desktop panel hidden on mobile classes and opens mobile overlay from external trigger", () => {
    isMobileCatalogInteractionModeMock = true;
    render(
      <ToastProvider>
        <ListProvider>
          <Catalog isCategoriesOpen openMobileCategoriesRequestKey={1} />
          <Toast />
        </ListProvider>
      </ToastProvider>,
    );

    expect(
      screen.queryByRole("button", {
        name: "Categorías",
      }),
    ).not.toBeInTheDocument();

    const desktopPanelContainer = screen
      .getAllByText("Categorías")
      .map((element) => element.closest("div.pointer-events-none"))
      .find(Boolean);
    expect(desktopPanelContainer).toHaveClass("hidden", "md:block");

    const mobileOverlay = screen.getByTestId("mobile-categories-overlay");
    expect(mobileOverlay).toHaveClass("fixed", "inset-0", "z-50", "md:hidden");
  });

  it("uses 3 columns on mobile-landscape mode even with categories open", () => {
    isMobileCatalogInteractionModeMock = true;

    render(
      <ToastProvider>
        <ListProvider>
          <Catalog isCategoriesOpen />
          <Toast />
        </ListProvider>
      </ToastProvider>,
    );

    const dulcesHeading = screen.getByRole("heading", {
      name: "Dulces",
      level: 2,
    });
    const productGrid = dulcesHeading.nextElementSibling;

    expect(productGrid).toHaveClass("grid-cols-2");
    expect(productGrid).toHaveClass("md:grid-cols-3");
    expect(productGrid).toHaveClass("lg:grid-cols-4");
    expect(productGrid).not.toHaveClass("md:grid-cols-1");
  });

  it("preserves desktop open-categories grid classes", () => {
    isMobileCatalogInteractionModeMock = false;

    render(
      <ToastProvider>
        <ListProvider>
          <Catalog isCategoriesOpen />
          <Toast />
        </ListProvider>
      </ToastProvider>,
    );

    const dulcesHeading = screen.getByRole("heading", {
      name: "Dulces",
      level: 2,
    });
    const productGrid = dulcesHeading.nextElementSibling;

    expect(productGrid).toHaveClass("grid-cols-2");
    expect(productGrid).toHaveClass("md:grid-cols-1");
    expect(productGrid).toHaveClass("lg:grid-cols-2");
  });

  it("keeps mobile panel open on parent click and closes + scrolls on subcategory click", async () => {
    const user = userEvent.setup();
    selectedCategoryIdMock = "child-1";
    document.documentElement.scrollTop = 999;
    document.body.scrollTop = 999;

    render(
      <ToastProvider>
        <ListProvider>
          <Catalog isCategoriesOpen openMobileCategoriesRequestKey={1} />
          <Toast />
        </ListProvider>
      </ToastProvider>,
    );

    await user.click(screen.getAllByRole("button", { name: "Frutas" })[1]);

    expect(selectCategoryMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("mobile-categories-overlay")).toBeInTheDocument();
    const subcategoryButtons = screen.getAllByRole("button", {
      name: "Cítricos",
    });
    await user.click(subcategoryButtons[1]);

    expect(selectCategoryMock).toHaveBeenCalledWith("child-1");
    expect(screen.getAllByRole("button", { name: "Cítricos" })).toHaveLength(1);
    expect(document.documentElement.scrollTop).toBe(0);
    expect(document.body.scrollTop).toBe(0);
  });

  it("keeps current products visible while loading a new category detail", () => {
    const { rerender } = render(
      <ToastProvider>
        <ListProvider>
          <Catalog />
          <Toast />
        </ListProvider>
      </ToastProvider>,
    );

    expect(screen.getByText("Ensaimada")).toBeInTheDocument();

    detailStatusMock = "loading";

    rerender(
      <ToastProvider>
        <ListProvider>
          <Catalog />
          <Toast />
        </ListProvider>
      </ToastProvider>,
    );

    expect(screen.getByText("Ensaimada")).toBeInTheDocument();
    expect(
      screen.getByText("Cargando productos de la categoría seleccionada..."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Cargando productos...")).not.toBeInTheDocument();
  });

  it("preserves categories panel scroll position on category route updates", () => {
    const { rerender } = render(
      <ToastProvider>
        <ListProvider>
          <Catalog isCategoriesOpen />
          <Toast />
        </ListProvider>
      </ToastProvider>,
    );

    const scrollContainer = screen.getByTestId("categories-panel-scroll");
    scrollContainer.scrollTop = 180;
    selectedCategoryIdMock = "child-2";

    rerender(
      <ToastProvider>
        <ListProvider>
          <Catalog isCategoriesOpen />
          <Toast />
        </ListProvider>
      </ToastProvider>,
    );

    expect(screen.getByTestId("categories-panel-scroll").scrollTop).toBe(180);
  });

  it("keeps h1 title and shows loading message as h2 with skeleton state", () => {
    detailStatusMock = "loading";
    categoryDetailMock = null;

    render(
      <ToastProvider>
        <ListProvider>
          <Catalog />
          <Toast />
        </ListProvider>
      </ToastProvider>,
    );

    expect(screen.getByTestId("catalog-product-skeleton-grid")).toBeInTheDocument();
    expect(screen.getByTestId("catalog-product-skeleton-card-0")).toHaveClass("animate-pulse");
    expect(
      screen.getByRole("heading", { name: "Catálogo", level: 1 }),
    ).toBeInTheDocument();
    const loadingTitle = screen.getByRole("heading", {
      name: "Cargando productos...",
      level: 2,
    });
    expect(loadingTitle).toHaveClass("text-lg");
    expect(screen.getByTestId("catalog-product-skeleton-name-0")).toHaveClass(
      "min-h-[2.5rem]",
    );
  });

  it("shows categories loading skeleton and hides categories loading text", () => {
    categoriesStatusMock = "loading";

    render(
      <ToastProvider>
        <ListProvider>
          <Catalog isCategoriesOpen />
          <Toast />
        </ListProvider>
      </ToastProvider>,
    );

    expect(screen.getAllByTestId("categories-loading-skeleton-item")).toHaveLength(14);
    expect(screen.queryByText("Cargando categorías...")).not.toBeInTheDocument();
  });

  afterEach(() => {
    addItemMock.mockReset();
    selectCategoryMock.mockReset();
    reloadCategoriesMock.mockReset();
    reloadDetailMock.mockReset();
    selectedCategoryIdMock = "child-1";
    isMobileCatalogInteractionModeMock = false;
    categoriesStatusMock = "success";
    detailStatusMock = "success";
    categoryDetailMock = {
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
    };
  });
});
