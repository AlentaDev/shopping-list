import type { ShoppingListItem } from "../types";

const FALLBACK_CATEGORY = "Sin categoría";

export type ShoppingListCategoryGroup = {
  category: string;
  items: ShoppingListItem[];
};

const normalizeCategory = (item: ShoppingListItem): string => {
  const snapshot = item.categorySnapshot?.trim();

  if (snapshot) {
    return snapshot;
  }

  const legacyCategory = item.category.trim();
  return legacyCategory || FALLBACK_CATEGORY;
};

export const groupItemsByCategory = (
  items: ShoppingListItem[],
): ShoppingListCategoryGroup[] => {
  const grouped = new Map<string, Array<{ item: ShoppingListItem; index: number }>>();

  items.forEach((item, index) => {
    const category = normalizeCategory(item);
    const current = grouped.get(category) ?? [];
    current.push({ item, index });
    grouped.set(category, current);
  });

  return Array.from(grouped.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([category, groupedItems]) => ({
      category,
      items: [...groupedItems]
        .sort((left, right) => {
          const nameDiff = left.item.name.localeCompare(right.item.name);

          if (nameDiff !== 0) {
            return nameDiff;
          }

          return left.index - right.index;
        })
        .map(({ item }) => item),
    }));
};
