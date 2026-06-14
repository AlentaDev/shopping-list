import { UI_TEXT } from "@src/shared/constants/ui";

type GroupableItem = {
  name: string;
  category: string;
  categorySnapshot?: string | null;
};

export const FALLBACK_CATEGORY = UI_TEXT.LISTS.CATEGORY_FALLBACK;

export type CategoryGroup<TItem extends GroupableItem> = {
  category: string;
  items: TItem[];
};

const normalizeCategory = <TItem extends GroupableItem>(item: TItem): string => {
  const snapshot = item.categorySnapshot?.trim();

  if (snapshot) {
    return snapshot;
  }

  const legacyCategory = item.category.trim();
  return legacyCategory || FALLBACK_CATEGORY;
};

export const groupItemsByCategory = <TItem extends GroupableItem>(
  items: TItem[],
): CategoryGroup<TItem>[] => {
  const grouped = new Map<string, Array<{ item: TItem; index: number }>>();

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
