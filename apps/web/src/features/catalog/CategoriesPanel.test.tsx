// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CategoriesPanel from "./CategoriesPanel";
import type { CatalogCategoryNode } from "./types";

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
      />
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
      />
    );

    expect(screen.getByText("Frutas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cítricos" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hojas" })).toBeNull();
  });

  it("selects the first child when expanding another category", async () => {
    const onSelectCategory = vi.fn();

    render(
      <CategoriesPanel
        open
        categories={categories}
        selectedCategoryId={"child-1"}
        onSelectCategory={onSelectCategory}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Verduras" }));

    expect(onSelectCategory).toHaveBeenCalledWith("child-2");
  });
});
