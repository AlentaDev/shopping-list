import { describe, expect, it } from "vitest";
import { adaptShoppingListItems } from "./ShoppingListItemAdapter";

describe("ShoppingListItemAdapter", () => {
  it("adapta items de reutilización/autosave con valores por defecto", () => {
    const items = adaptShoppingListItems([
      {
        id: "item-1",
        name: "Pan",
        qty: 2,
        sourceProductId: "4706",
        thumbnail: "https://example.com/pan.png",
        price: 1.2,
      },
      {
        id: "item-2",
        name: "Leche",
        qty: 1,
        checked: false,
      },
      {},
    ]);

    expect(items).toEqual([
      {
        id: "item-1",
        name: "Pan",
        category: "",
        thumbnail: "https://example.com/pan.png",
        price: 1.2,
        quantity: 2,
        sourceProductId: "4706",
      },
      {
        id: "item-2",
        name: "Leche",
        category: "",
        thumbnail: null,
        price: null,
        quantity: 1,
        sourceProductId: "item-2",
      },
      {
        id: "",
        name: "",
        category: "",
        thumbnail: null,
        price: null,
        quantity: 0,
        sourceProductId: "",
      },
    ]);
  });

  it("devuelve una lista vacía cuando no hay items", () => {
    expect(adaptShoppingListItems(undefined)).toEqual([]);
  });
});
