import type { CategoryGroup } from "@src/shared/utils/groupItemsByCategory";
import { groupItemsByCategory as groupSharedItemsByCategory } from "@src/shared/utils/groupItemsByCategory";
import type { ShoppingListItem } from "../types";

export type ShoppingListCategoryGroup = CategoryGroup<ShoppingListItem>;

export const groupItemsByCategory = (
  items: ShoppingListItem[],
): ShoppingListCategoryGroup[] => groupSharedItemsByCategory(items);
