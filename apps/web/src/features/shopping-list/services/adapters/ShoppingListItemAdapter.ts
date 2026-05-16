import type { ShoppingListItem } from "../../types";

type ShoppingListItemPayload = {
  id?: string;
  sourceProductId?: string;
  name?: string;
  qty?: number;
  thumbnail?: string | null;
  price?: number | null;
  categorySnapshot?: string | null;
  subcategorySnapshot?: string | null;
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
    const [, productId] = id.split(":");

    return productId?.trim() || id;
  }

  const prefixedId = `${id}:`;

  if (normalizedSourceProductId.startsWith(prefixedId)) {
    return normalizedSourceProductId.slice(prefixedId.length);
  }

  if (normalizedSourceProductId.includes(":")) {
    const segments = normalizedSourceProductId.split(":");
    return segments[segments.length - 1] ?? normalizedSourceProductId;
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
    id: normalizeSourceProductId({
      id: item.id ?? "",
      sourceProductId: item.sourceProductId,
    }),
    sourceProductId: normalizeSourceProductId({
      id: item.id ?? "",
      sourceProductId: item.sourceProductId,
    }),
    serverItemId: item.id ?? null,
    name: item.name ?? "",
    category: item.categorySnapshot?.trim() || "Sin categoría",
    categorySnapshot: item.categorySnapshot ?? null,
    subcategorySnapshot: item.subcategorySnapshot ?? null,
    thumbnail: item.thumbnail ?? null,
    price: item.price ?? null,
    quantity: item.qty ?? 0,
  }));
};
