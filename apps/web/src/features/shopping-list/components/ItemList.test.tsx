// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ItemList from "./ItemList";

describe("ItemList", () => {
  it("renders grouped sections by category", () => {
    render(
      <ItemList
        items={[]}
        groupedItems={[
          {
            category: "Bebidas",
            items: [
              { id: "1", name: "Leche", category: "Bebidas", quantity: 1 },
            ],
          },
          {
            category: "Sin categoría",
            items: [
              { id: "2", name: "Pan", category: "Sin categoría", quantity: 1 },
            ],
          },
        ]}
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Bebidas" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sin categoría" })).toBeInTheDocument();
    expect(screen.getByText("Leche")).toBeInTheDocument();
    expect(screen.getByText("Pan")).toBeInTheDocument();
  });
});
