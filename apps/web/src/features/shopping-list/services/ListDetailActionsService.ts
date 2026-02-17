import type { ShoppingListItem } from "../types";
import { adaptShoppingListItems } from "./adapters/ShoppingListItemAdapter";
import { fetchWithAuth } from "@src/shared/services/http/fetchWithAuth";

type ListActionOptions = {
  errorMessage?: string;
};

type ReuseListItemPayload = {
  id?: string;
  kind?: "catalog";
  name?: string;
  qty?: number;
  checked?: boolean;
  thumbnail?: string | null;
  price?: number | null;
};

type ReuseListPayload = {
  id?: string;
  title?: string;
  status?: string;
  items?: ReuseListItemPayload[];
};

type ReuseListResponse = {
  id: string;
  title: string;
  status?: string;
  items: ShoppingListItem[];
};

export const startListEditing = async (
  listId: string,
  options: ListActionOptions = {},
): Promise<void> => {
  const response = await fetchWithAuth(`/api/lists/${listId}/editing`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ isEditing: true }),
  });

  if (!response.ok) {
    throw new Error(options.errorMessage ?? "Unable to start list editing.");
  }

  await response.json();
};

export const reuseList = async (
  listId: string,
  options: ListActionOptions = {},
): Promise<ReuseListResponse> => {
  const response = await fetchWithAuth(`/api/lists/${listId}/reuse`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(options.errorMessage ?? "Unable to reuse list.");
  }

  const data = (await response.json()) as ReuseListPayload;

  return {
    id: data.id ?? "",
    title: data.title ?? "",
    status: data.status,
    items: adaptShoppingListItems(data.items),
  };
};

export const deleteList = async (
  listId: string,
  options: ListActionOptions = {},
): Promise<void> => {
  const response = await fetchWithAuth(`/api/lists/${listId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(options.errorMessage ?? "Unable to delete list.");
  }
};
