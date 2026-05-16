import type { ListItem } from "../types";
import { groupItemsByCategory } from "@src/features/shopping-list/services/groupItemsByCategory";

export const adaptListDetailItemsToCategoryGroups = (items: ListItem[]) =>
  groupItemsByCategory(
    items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.qty,
      category: item.categorySnapshot?.trim() || "Sin categoría",
      categorySnapshot: item.categorySnapshot ?? null,
      subcategorySnapshot: item.subcategorySnapshot ?? null,
      price: item.price ?? null,
      thumbnail: item.thumbnail ?? null,
    })),
  );
