import type { ShoppingListItem } from "../../types";

type ShoppingListItemPayload = {
  id?: string;
  sourceProductId?: string;
  name?: string;
  qty?: number;
  thumbnail?: string | null;
  price?: number | null;
};

const normalizeSourceProductId = ({
  id,
  sourceProductId,
}: {
  id: string;
  sourceProductId?: string;
}): string => {
  const normalizedSourceProductId = sourceProductId?.trim();

  if (!normalizedSourceProductId) {
    return id;
  }

  const prefixedId = `${id}:`;

  if (normalizedSourceProductId.startsWith(prefixedId)) {
    return normalizedSourceProductId.slice(prefixedId.length);
  }

  return normalizedSourceProductId;
};

export const adaptShoppingListItems = (
  items: ShoppingListItemPayload[] | null | undefined,
): ShoppingListItem[] => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => ({
    id: item.id ?? "",
    sourceProductId: normalizeSourceProductId({
      id: item.id ?? "",
      sourceProductId: item.sourceProductId,
    }),
    name: item.name ?? "",
    category: "",
    thumbnail: item.thumbnail ?? null,
    price: item.price ?? null,
    quantity: item.qty ?? 0,
  }));
};
