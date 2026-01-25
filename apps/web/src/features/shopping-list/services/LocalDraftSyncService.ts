import { clearLocalDraft, loadLocalDraft } from "./AutosaveService";
import type { AutosaveDraftInput, AutosaveItemInput } from "./types";

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
  const response = await fetch(LISTS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title: draft.title }),
  });

  if (!response.ok) {
    throw new Error("Unable to create list");
  }

  return (await response.json()) as ListSummaryResponse;
};

const buildItemPayload = (item: AutosaveItemInput) => {
  const payload: { name: string; qty: number; note?: string } = {
    name: item.name,
    qty: item.qty,
  };

  if (item.note) {
    payload.note = item.note;
  }

  return payload;
};

const createListItem = async (listId: string, item: AutosaveItemInput) => {
  const response = await fetch(`${LISTS_ENDPOINT}/${listId}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildItemPayload(item)),
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
