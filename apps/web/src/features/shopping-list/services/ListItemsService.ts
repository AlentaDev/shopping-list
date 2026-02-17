import { fetchWithAuth } from "@src/shared/services/http/fetchWithAuth";
type DeleteListItemInput = {
  listId: string;
  itemId: string;
};

type ListItemsServiceOptions = {
  errorMessage?: string;
};

export const deleteListItem = async (
  { listId, itemId }: DeleteListItemInput,
  options: ListItemsServiceOptions = {},
): Promise<void> => {
  const response = await fetchWithAuth(`/api/lists/${listId}/items/${itemId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(options.errorMessage ?? "Unable to delete list item.");
  }
};
