import { adaptListCollectionResponse, adaptListDetailResponse } from "./adapters/ListAdapter";
import type { ListCollection, ListDetail } from "./types";

type ListsServiceOptions = {
  errorMessage?: string;
};

export const getLists = async (
  options: ListsServiceOptions = {}
): Promise<ListCollection> => {
  const response = await fetch("/api/lists");

  if (!response.ok) {
    throw new Error(options.errorMessage ?? "Unable to load lists.");
  }

  const payload = await response.json();

  return adaptListCollectionResponse(payload);
};

export const getListDetail = async (
  listId: string,
  options: ListsServiceOptions = {}
): Promise<ListDetail> => {
  const response = await fetch(`/api/lists/${listId}`);

  if (!response.ok) {
    throw new Error(options.errorMessage ?? "Unable to load list detail.");
  }

  const payload = await response.json();

  return adaptListDetailResponse(payload);
};

export const duplicateList = async (
  listId: string,
  options: ListsServiceOptions = {}
): Promise<ListDetail> => {
  const response = await fetch(`/api/lists/${listId}/duplicate`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(options.errorMessage ?? "Unable to duplicate list.");
  }

  const payload = await response.json();

  return adaptListDetailResponse(payload);
};

export const deleteList = async (
  listId: string,
  options: ListsServiceOptions = {}
): Promise<void> => {
  const response = await fetch(`/api/lists/${listId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(options.errorMessage ?? "Unable to delete list.");
  }
};
