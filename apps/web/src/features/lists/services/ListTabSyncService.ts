export {
  LIST_TAB_SYNC_KEY,
  publishListTabSyncEvent,
  subscribeToListTabSyncEvents,
  type ListTabSyncEvent,
} from "../../../shared/services/tab-sync/listTabSyncContract";

export const createListTabId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `tab-${Date.now()}`;
};
