import { describe, expect, it } from "vitest";
import type { ShoppingListItem } from "../types";
import { groupItemsByCategory } from "./groupItemsByCategory";

const baseItem = (overrides: Partial<ShoppingListItem>): ShoppingListItem => ({
  id: overrides.id ?? "id",
  name: overrides.name ?? "Item",
  category: overrides.category ?? "",
  quantity: overrides.quantity ?? 1,
  ...overrides,
});

describe("groupItemsByCategory", () => {
  it("groups by categorySnapshot/category and falls back to Sin categoría", () => {
    const groups = groupItemsByCategory([
      baseItem({ id: "1", name: "Leche", categorySnapshot: "Lácteos" }),
      baseItem({ id: "2", name: "Pan", category: "Panadería" }),
      baseItem({ id: "3", name: "Sal", categorySnapshot: "   " }),
    ]);

    expect(groups.map((group) => group.category)).toEqual([
      "Lácteos",
      "Panadería",
      "Sin categoría",
    ]);
    expect(groups[2]?.items.map((item) => item.id)).toEqual(["3"]);
  });

  it("keeps stable order when names are equal", () => {
    const groups = groupItemsByCategory([
      baseItem({ id: "1", name: "Manzana", categorySnapshot: "Fruta" }),
      baseItem({ id: "2", name: "Manzana", categorySnapshot: "Fruta" }),
    ]);

    expect(groups[0]?.items.map((item) => item.id)).toEqual(["1", "2"]);
  });

  it("does not use subcategory as grouping axis", () => {
    const groups = groupItemsByCategory([
      baseItem({
        id: "1",
        name: "Leche",
        categorySnapshot: "Lácteos",
        subcategorySnapshot: "Bebidas frías",
      }),
      baseItem({
        id: "2",
        name: "Yogur",
        categorySnapshot: "Lácteos",
        subcategorySnapshot: "Postres",
      }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.category).toBe("Lácteos");
  });
});
