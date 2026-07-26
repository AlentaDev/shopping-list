// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CategoriesPanel from "./CategoriesPanel";
import type { CatalogCategoryNode } from "@src/features/catalog/services/types";

describe("CategoriesPanel", () => {
  const categories: CatalogCategoryNode[] = [
    { id: "root-1", name: "Frutas", order: 1, level: 0 },
    { id: "root-2", name: "Verduras", order: 2, level: 0 },
    {
      id: "child-1",
      name: "Cítricos",
      order: 1,
      level: 1,
      parentId: "root-1",
    },
    {
      id: "child-2",
      name: "Hojas",
      order: 1,
      level: 1,
      parentId: "root-2",
    },
  ];

  const deepCategories: CatalogCategoryNode[] = [
    { id: "root-1", name: "Frescos", order: 1, level: 0 },
    { id: "root-2", name: "Bebidas", order: 2, level: 0 },
    { id: "l1-a", name: "Frutas", order: 1, level: 1, parentId: "root-1" },
    { id: "l1-b", name: "Verduras", order: 2, level: 1, parentId: "root-1" },
    { id: "l2-a", name: "Cítricos", order: 1, level: 2, parentId: "l1-a" },
    { id: "l2-b", name: "Tropicales", order: 2, level: 2, parentId: "l1-a" },
    { id: "leaf-a", name: "Naranjas", order: 1, level: 3, parentId: "l2-a" },
    { id: "leaf-b", name: "Mandarinas", order: 2, level: 3, parentId: "l2-a" },
    { id: "leaf-c", name: "Plátanos", order: 1, level: 3, parentId: "l2-b" },
    { id: "l1-c", name: "Refrescos", order: 1, level: 1, parentId: "root-2" },
    { id: "leaf-d", name: "Agua", order: 1, level: 2, parentId: "l1-c" },
  ];

  afterEach(() => {
    cleanup();
  });

  it("does not render when closed", () => {
    render(
      <CategoriesPanel
        open={false}
        categories={categories}
        selectedCategoryId={null}
        onSelectCategory={vi.fn()}
      />,
    );

    expect(screen.queryByText("Categorías")).toBeNull();
  });

  it("expands the selected parent category", () => {
    render(
      <CategoriesPanel
        open
        categories={categories}
        selectedCategoryId="child-1"
        onSelectCategory={vi.fn()}
      />,
    );

    expect(screen.getByText("Frutas")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cítricos" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hojas" })).toBeNull();
  });

  it("selects the first child when expanding another category on desktop", async () => {
    const onSelectCategory = vi.fn();

    render(
      <CategoriesPanel
        open
        categories={categories}
        selectedCategoryId={"child-1"}
        onSelectCategory={onSelectCategory}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Verduras" }));

    expect(onSelectCategory).toHaveBeenCalledWith("child-2");
  });

  it("renders a root leaf as a root card without chevron and selects it directly", async () => {
    const onSelectCategory = vi.fn();

    const { container } = render(
      <CategoriesPanel
        open
        categories={[{ id: "root-leaf", name: "Ofertas", order: 1, level: 0 }]}
        selectedCategoryId={null}
        onSelectCategory={onSelectCategory}
      />,
    );

    const button = screen.getByRole("button", { name: "Ofertas" });

    expect(button.parentElement).toHaveClass(
      "rounded-xl",
      "border",
      "border-slate-200",
      "bg-white",
    );
    expect(button).toHaveClass("text-sm", "font-semibold");
    expect(
      container.querySelector('svg polyline[points="9 6 15 12 9 18"]'),
    ).toBeNull();

    const placeholder = button.querySelector(
      '[data-testid="category-chevron-placeholder"]',
    );
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveClass("invisible", "h-4", "w-4");

    await userEvent.click(button);

    expect(onSelectCategory).toHaveBeenCalledWith("root-leaf");
  });

  it("highlights a selected root leaf with the green active state", () => {
    render(
      <CategoriesPanel
        open
        categories={[{ id: "root-leaf", name: "Ofertas", order: 1, level: 0 }]}
        selectedCategoryId="root-leaf"
        onSelectCategory={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: "Ofertas" });
    expect(button).toHaveClass("bg-emerald-50", "text-emerald-700");
  });

  it("on mobile, parent click does not select category and reveals children", async () => {
    const onSelectCategory = vi.fn();

    render(
      <CategoriesPanel
        open
        isMobile
        categories={categories}
        selectedCategoryId={"child-1"}
        onSelectCategory={onSelectCategory}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Verduras" }));

    expect(onSelectCategory).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Hojas" })).toBeInTheDocument();
  });

  it("on mobile, parent click selects a root leaf when no children exist", async () => {
    const onSelectCategory = vi.fn();

    render(
      <CategoriesPanel
        open
        isMobile
        categories={[{ id: "root-leaf", name: "Ofertas", order: 1, level: 0 }]}
        selectedCategoryId={null}
        onSelectCategory={onSelectCategory}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Ofertas" }));

    expect(onSelectCategory).toHaveBeenCalledWith("root-leaf");
  });

  it("renders categories skeleton while loading and hides loading copy", () => {
    render(
      <CategoriesPanel
        open
        categories={[]}
        selectedCategoryId={null}
        onSelectCategory={vi.fn()}
        loadingCategories
      />,
    );

    expect(screen.getAllByTestId("categories-loading-skeleton-item")).toHaveLength(14);
    expect(screen.queryByText("Cargando categorías...")).toBeNull();
  });

  it("renders a close control in the panel header when onClose is provided", async () => {
    const onClose = vi.fn();

    render(
      <CategoriesPanel
        open
        categories={categories}
        selectedCategoryId={null}
        onSelectCategory={vi.fn()}
        onClose={onClose}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Cerrar categorías" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("clicking a root selects the first deepest leaf in a four-level tree", async () => {
    const onSelectCategory = vi.fn();

    render(
      <CategoriesPanel
        open
        categories={deepCategories}
        selectedCategoryId={null}
        onSelectCategory={onSelectCategory}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Frescos" }));

    expect(onSelectCategory).toHaveBeenCalledWith("leaf-a");
  });

  it("only expands the active branch and highlights the selected leaf in green", () => {
    render(
      <CategoriesPanel
        open
        categories={deepCategories}
        selectedCategoryId="leaf-a"
        onSelectCategory={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Frescos" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bebidas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Frutas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verduras" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cítricos" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tropicales" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Naranjas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mandarinas" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Plátanos" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Refrescos" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Agua" })).toBeNull();

    const selectedLeaf = screen.getByRole("button", { name: "Naranjas" });
    expect(selectedLeaf).toHaveClass("bg-emerald-50", "text-emerald-700");
  });

  it("clicking a leaf sibling updates the selected category", async () => {
    const onSelectCategory = vi.fn();

    render(
      <CategoriesPanel
        open
        categories={deepCategories}
        selectedCategoryId="leaf-a"
        onSelectCategory={onSelectCategory}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Mandarinas" }));

    expect(onSelectCategory).toHaveBeenCalledWith("leaf-b");
  });

  it("clicking an intermediate parent on the active branch selects its first deepest leaf", async () => {
    const onSelectCategory = vi.fn();

    render(
      <CategoriesPanel
        open
        categories={deepCategories}
        selectedCategoryId="leaf-a"
        onSelectCategory={onSelectCategory}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Frutas" }));

    expect(onSelectCategory).toHaveBeenCalledWith("leaf-a");
  });

  it("keeps the panel shell fixed-height while only the categories body scrolls", () => {
    render(
      <CategoriesPanel
        open
        categories={categories}
        selectedCategoryId={null}
        onSelectCategory={vi.fn()}
      />,
    );

    expect(screen.getByTestId("categories-panel-shell")).toHaveClass(
      "h-[calc(100vh-144px)]",
      "max-h-[calc(100vh-144px)]",
      "overflow-hidden",
    );
    expect(screen.getByTestId("categories-panel-scroll")).toHaveClass("overflow-y-auto");
  });
});
