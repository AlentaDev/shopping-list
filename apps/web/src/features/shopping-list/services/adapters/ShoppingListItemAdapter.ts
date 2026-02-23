import type { ShoppingListItem } from "../../types";

type ShoppingListItemPayload = {
  id?: string;
  sourceProductId?: string;
  name?: string;
  qty?: number;
  thumbnail?: string | null;
  price?: number | null;
};

export const adaptShoppingListItems = (
  items: ShoppingListItemPayload[] | null | undefined,
): ShoppingListItem[] => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => ({
    id: item.id ?? "",
    sourceProductId: item.sourceProductId ?? item.id ?? "",
    name: item.name ?? "",
    category: "",
    thumbnail: item.thumbnail ?? null,
    price: item.price ?? null,
    quantity: item.qty ?? 0,
  }));
};
