import {
  LIST_STATUS,
  type ListStatus as ShoppingListStatus,
} from "@src/shared/domain/listStatus";
import type { ShoppingListItem } from "../../types";

type AppShellListItemPayload = {
  id: string;
  source?: "mercadona" | "bonpreuesclat";
  sourceProductId?: string;
  name: string;
  qty: number;
  categorySnapshot?: string | null;
  subcategorySnapshot?: string | null;
  thumbnail?: string | null;
  price?: number | null;
};

type AppShellListPayload = {
  id: string;
  title: string;
  status?: string;
  providerId?: string;
  provider?: {
    slug?: string;
  };
  isEditing: boolean;
  items: AppShellListItemPayload[];
};

export type AppShellShoppingListState = {
  listId: string;
  listTitle: string;
  listStatus: ShoppingListStatus;
  isEditing: boolean;
  items: ShoppingListItem[];
};

export const adaptListDetailItemsToShoppingListItems = (
  items: AppShellListItemPayload[],
  fallbackSource: "mercadona" | "bonpreuesclat" = "mercadona",
): ShoppingListItem[] =>
  items.map((item) => ({
    id: item.id,
    source: item.source ?? fallbackSource,
    sourceProductId: item.sourceProductId ?? item.id,
    name: item.name,
    category: item.categorySnapshot?.trim() || "Sin categoría",
    categorySnapshot: item.categorySnapshot ?? null,
    subcategorySnapshot: item.subcategorySnapshot ?? null,
    thumbnail: item.thumbnail ?? null,
    price: item.price ?? null,
    quantity: item.qty,
  }));

export const adaptListStatusToShoppingListStatus = (
  status?: string,
): ShoppingListStatus => {
  switch (status) {
    case LIST_STATUS.ACTIVE:
      return LIST_STATUS.ACTIVE;
    case LIST_STATUS.COMPLETED:
      return LIST_STATUS.COMPLETED;
    case LIST_STATUS.DRAFT:
      return LIST_STATUS.DRAFT;
    default:
      return LIST_STATUS.DRAFT;
  }
};

export const adaptListToShoppingListState = (
  list: AppShellListPayload,
): AppShellShoppingListState => ({
  listId: list.id,
  listTitle: list.title,
  listStatus: adaptListStatusToShoppingListStatus(list.status),
  isEditing: list.isEditing,
  items: adaptListDetailItemsToShoppingListItems(
    list.items,
    list.provider?.slug === "bonpreuesclat" ? "bonpreuesclat" : "mercadona",
  ),
});
