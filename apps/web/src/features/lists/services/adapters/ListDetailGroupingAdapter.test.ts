import { describe, expect, it } from "vitest";
import { adaptListDetailItemsToCategoryGroups } from "./ListDetailGroupingAdapter";

describe("adaptListDetailItemsToCategoryGroups", () => {
  it("agrupa por categorySnapshot y usa fallback Sin categoría", () => {
    const groups = adaptListDetailItemsToCategoryGroups([
      {
        id: "item-1",
        kind: "catalog",
        name: "Leche",
        qty: 1,
        checked: false,
        updatedAt: "2026-01-01",
        categorySnapshot: "Lácteos",
      },
      {
        id: "item-2",
        kind: "catalog",
        name: "Pan",
        qty: 2,
        checked: false,
        updatedAt: "2026-01-01",
        categorySnapshot: "Panadería",
      },
      {
        id: "item-3",
        kind: "catalog",
        name: "Salsa",
        qty: 3,
        checked: false,
        updatedAt: "2026-01-01",
      },
    ]);

    expect(groups.map((group) => group.category)).toEqual([
      "Lácteos",
      "Panadería",
      "Sin categoría",
    ]);
    expect(groups[2]?.items.map((item) => item.name)).toEqual(["Salsa"]);
  });
});
