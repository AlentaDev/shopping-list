import { describe, expect, it } from "vitest";
import { mapCheckedItemsToTechnicalIds } from "./checkedItemIds";

describe("mapCheckedItemsToTechnicalIds", () => {
  it("maps checked canonical items to technical ids deterministically", () => {
    const result = mapCheckedItemsToTechnicalIds([
      {
        id: "4706",
        sourceProductId: "4706",
        kind: "catalog",
        name: "Leche",
        qty: 1,
        checked: true,
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "active-1:4706",
        sourceProductId: "4706",
        kind: "catalog",
        name: "Leche",
        qty: 2,
        checked: true,
        updatedAt: "2024-01-01T00:00:01.000Z",
      },
      {
        id: "active-1:4707",
        sourceProductId: "4707",
        kind: "catalog",
        name: "Pan",
        qty: 1,
        checked: true,
        updatedAt: "2024-01-01T00:00:02.000Z",
      },
    ]);

    expect(result).toEqual(["active-1:4706", "active-1:4707"]);
  });

  it("returns empty list when there are no checked items", () => {
    const result = mapCheckedItemsToTechnicalIds([
      {
        id: "active-1:4706",
        sourceProductId: "4706",
        kind: "catalog",
        name: "Leche",
        qty: 1,
        checked: false,
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    ]);

    expect(result).toEqual([]);
  });
});
