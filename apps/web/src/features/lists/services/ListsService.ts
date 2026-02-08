import { UI_TEXT } from "@src/shared/constants/ui";
import {
  adaptListCollectionResponse,
  adaptListDetailResponse,
  adaptListStatusSummaryResponse,
  adaptListSummaryResponse,
} from "./adapters/ListAdapter";
import { LIST_STATUS } from "./listActions";
import type {
  ListCollection,
  ListDetail,
  ListStatusSummary,
  ListSummary,
} from "./types";

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

export const reuseList = async (
  listId: string,
  options: ListsServiceOptions = {}
): Promise<ListDetail> => {
  const response = await fetch(`/api/lists/${listId}/reuse`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(options.errorMessage ?? "Unable to reuse list.");
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

export const activateList = async (
  listId: string,
  options: ListsServiceOptions = {}
): Promise<ListStatusSummary> => {
  const response = await fetch(`/api/lists/${listId}/activate`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: LIST_STATUS.ACTIVE }),
  });

  if (!response.ok) {
    throw new Error(options.errorMessage ?? "Unable to activate list.");
  }

  const payload = await response.json();

  return adaptListStatusSummaryResponse(payload);
};

type CompleteListInput = {
  checkedItemIds: string[];
};

export const completeList = async (
  listId: string,
  input: CompleteListInput,
  options: ListsServiceOptions = {}
): Promise<void> => {
  const response = await fetch(`/api/lists/${listId}/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ checkedItemIds: input.checkedItemIds }),
  });

  if (!response.ok) {
    throw new Error(options.errorMessage ?? "Unable to complete list.");
  }

  await response.json();
};

export const createList = async (
  title: string = UI_TEXT.SHOPPING_LIST.DEFAULT_LIST_TITLE,
  options: ListsServiceOptions = {}
): Promise<ListSummary> => {
  const response = await fetch("/api/lists", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    throw new Error(options.errorMessage ?? "Unable to create list.");
  }

  const payload = await response.json();

  return adaptListSummaryResponse(payload);
};
