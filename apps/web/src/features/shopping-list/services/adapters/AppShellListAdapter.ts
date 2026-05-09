import {
  LIST_STATUS,
  type ListStatus as ShoppingListStatus,
} from "@src/shared/domain/listStatus";
import type { ShoppingListItem } from "../../types";

type AppShellListItemPayload = {
  id: string;
  name: string;
  qty: number;
  thumbnail?: string | null;
  price?: number | null;
};

export const adaptListDetailItemsToShoppingListItems = (
  items: AppShellListItemPayload[],
): ShoppingListItem[] =>
  items.map((item) => ({
    id: item.id,
    name: item.name,
    category: "",
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
