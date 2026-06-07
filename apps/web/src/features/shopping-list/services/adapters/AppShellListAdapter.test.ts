import { describe, expect, it } from "vitest";
import { LIST_STATUS } from "@src/shared/domain/listStatus";
import {
  adaptListDetailItemsToShoppingListItems,
  adaptListStatusToShoppingListStatus,
} from "./AppShellListAdapter";

describe("AppShellListAdapter", () => {
  it("adapta items remotos de lista para shopping-list", () => {
    const items = adaptListDetailItemsToShoppingListItems([
      {
        id: "item-1",
        kind: "catalog",
        source: "bonpreuesclat",
        sourceProductId: "sku-1",
        name: "Pan",
        qty: 2,
        checked: false,
        updatedAt: "2024-02-01T10:00:00.000Z",
        categorySnapshot: "L1",
        thumbnail: "https://example.com/pan.png",
        price: 1.5,
      },
    ]);

    expect(items).toEqual([
      {
        id: "item-1",
        source: "bonpreuesclat",
        sourceProductId: "sku-1",
        name: "Pan",
        category: "L1",
        categorySnapshot: "L1",
        subcategorySnapshot: null,
        thumbnail: "https://example.com/pan.png",
        price: 1.5,
        quantity: 2,
      },
    ]);
  });

  it("tolera valores nulos en item remoto", () => {
    const items = adaptListDetailItemsToShoppingListItems([
      {
        id: "item-2",
        kind: "catalog",
        source: "mercadona",
        name: "Leche",
        qty: 1,
        checked: false,
        updatedAt: "2024-02-01T10:00:00.000Z",
        thumbnail: null,
        price: null,
      },
    ]);

    expect(items).toEqual([
      {
        id: "item-2",
        source: "mercadona",
        sourceProductId: "item-2",
        name: "Leche",
        category: "Sin categoría",
        categorySnapshot: null,
        subcategorySnapshot: null,
        thumbnail: null,
        price: null,
        quantity: 1,
      },
    ]);
  });

  it("mapea estados válidos para shopping-list", () => {
    expect(adaptListStatusToShoppingListStatus(LIST_STATUS.ACTIVE)).toBe(
      LIST_STATUS.ACTIVE,
    );
    expect(adaptListStatusToShoppingListStatus(LIST_STATUS.COMPLETED)).toBe(
      LIST_STATUS.COMPLETED,
    );
  });

  it("usa DRAFT cuando el estado no está soportado", () => {
    expect(adaptListStatusToShoppingListStatus(undefined)).toBe(
      LIST_STATUS.DRAFT,
    );
    expect(adaptListStatusToShoppingListStatus("unexpected")).toBe(
      LIST_STATUS.DRAFT,
    );
  });
});
