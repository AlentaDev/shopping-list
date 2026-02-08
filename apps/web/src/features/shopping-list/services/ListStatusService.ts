import { adaptListStatusResponse } from "./adapters/ListStatusAdapter";
import {
  LIST_STATUS,
  canActivateList,
  type ListStatus,
} from "./listStatus";
import { syncLocalDraftToRemoteList } from "./LocalDraftSyncService";
import type { ListStatusSummary } from "./types";

const LISTS_ENDPOINT = "/api/lists";

type ActivateListInput = {
  listId: string | null;
  status: ListStatus;
};

const resolveListIdForActivation = async (
  status: ListStatus,
  listId: string | null,
): Promise<string> => {
  if (status === LIST_STATUS.LOCAL_DRAFT) {
    const syncResult = await syncLocalDraftToRemoteList();
    if (!syncResult) {
      throw new Error("Unable to activate list without local draft");
    }

    return syncResult.listId;
  }

  if (!listId) {
    throw new Error("Unable to activate list without id");
  }

  return listId;
};

export const activateList = async ({
  listId,
  status,
}: ActivateListInput): Promise<ListStatusSummary> => {
  if (!canActivateList(status)) {
    throw new Error("List status cannot be activated");
  }

  const targetListId = await resolveListIdForActivation(status, listId);
  const response = await fetch(`${LISTS_ENDPOINT}/${targetListId}/activate`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: LIST_STATUS.ACTIVE }),
  });

  if (!response.ok) {
    throw new Error("Unable to activate list");
  }

  const payload = await response.json();

  return adaptListStatusResponse(payload);
};
