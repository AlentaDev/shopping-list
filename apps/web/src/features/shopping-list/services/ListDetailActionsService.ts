type ListActionOptions = {
  errorMessage?: string;
};

type ReuseListResponse = {
  id: string;
  title: string;
  status?: string;
  items?: Array<{
    id?: string;
    kind?: "manual" | "catalog";
    name?: string;
    qty?: number;
    checked?: boolean;
    thumbnail?: string | null;
    price?: number | null;
  }>;
};

export const startListEditing = async (
  listId: string,
  options: ListActionOptions = {},
): Promise<void> => {
  const response = await fetch(`/api/lists/${listId}/editing`, {
    method: "PATCH",
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
  const response = await fetch(`/api/lists/${listId}/reuse`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(options.errorMessage ?? "Unable to reuse list.");
  }

  return (await response.json()) as ReuseListResponse;
};

export const deleteList = async (
  listId: string,
  options: ListActionOptions = {},
): Promise<void> => {
  const response = await fetch(`/api/lists/${listId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(options.errorMessage ?? "Unable to delete list.");
  }
};
