import { clearLocalDraft, loadLocalDraft } from "./AutosaveService";
import type { AutosaveDraftInput, AutosaveItemInput } from "./types";
import { UI_TEXT } from "@src/shared/constants/ui";

const LISTS_ENDPOINT = "/api/lists";

type ListSummaryResponse = {
  id: string;
};

type SyncResult = {
  listId: string;
  itemsCreated: number;
};

const createList = async (
  draft: AutosaveDraftInput,
): Promise<ListSummaryResponse> => {
  const title =
    draft.title.trim() || UI_TEXT.SHOPPING_LIST.DEFAULT_LIST_TITLE;
  const response = await fetch(LISTS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    throw new Error("Unable to create list");
  }

  return (await response.json()) as ListSummaryResponse;
};

const buildManualItemPayload = (item: AutosaveItemInput) => {
  const payload: { name: string; qty: number; checked: boolean; note?: string } = {
    name: item.name,
    qty: item.qty,
    checked: item.checked,
  };

  if (item.note) {
    payload.note = item.note;
  }

  return payload;
};

const buildCatalogItemPayload = (item: AutosaveItemInput) => ({
  source: item.kind === "catalog" ? item.source : "mercadona",
  productId:
    item.kind === "catalog" ? item.sourceProductId : item.id,
  qty: item.qty,
  note: item.note ?? undefined,
});

const createListItem = async (listId: string, item: AutosaveItemInput) => {
  const isCatalogItem = item.kind === "catalog";
  const endpoint = isCatalogItem
    ? `${LISTS_ENDPOINT}/${listId}/items/from-catalog`
    : `${LISTS_ENDPOINT}/${listId}/items`;
  const body = isCatalogItem
    ? buildCatalogItemPayload(item)
    : buildManualItemPayload(item);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error("Unable to create list items");
  }

  await response.json();
};

export const syncLocalDraftToRemoteList = async (): Promise<SyncResult | null> => {
  const localDraft = loadLocalDraft();

  if (!localDraft) {
    return null;
  }

  const listSummary = await createList(localDraft);

  for (const item of localDraft.items) {
    await createListItem(listSummary.id, item);
  }

  clearLocalDraft();

  return {
    listId: listSummary.id,
    itemsCreated: localDraft.items.length,
  };
};
