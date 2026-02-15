import { loadLocalDraft } from "./AutosaveService";
import type { AutosaveDraftInput } from "./types";

export const DRAFT_STORAGE_KEY = "lists.localDraft";
export const DRAFT_SYNC_STORAGE_KEY = "lists.localDraftSync";

type DraftChangedCallback = (draft: AutosaveDraftInput | null) => void;
type BaseUpdatedAtChangedCallback = (baseUpdatedAt: string | null) => void;

type CreateAutosaveTabSyncServiceOptions = {
  tabId: string;
};

type DraftSyncPayload = {
  baseUpdatedAt?: string | null;
  sourceTabId?: string;
};

const parseBaseUpdatedAt = (value: string | null): DraftSyncPayload | null => {
  if (!value) {
    return { baseUpdatedAt: null };
  }

  try {
    const parsed = JSON.parse(value) as DraftSyncPayload;

    return {
      baseUpdatedAt:
        typeof parsed.baseUpdatedAt === "string" ? parsed.baseUpdatedAt : null,
      sourceTabId:
        typeof parsed.sourceTabId === "string" ? parsed.sourceTabId : undefined,
    };
  } catch {
    return null;
  }
};

export const createAutosaveTabSyncService = ({
  tabId,
}: CreateAutosaveTabSyncServiceOptions) => {
  const draftChangedCallbacks = new Set<DraftChangedCallback>();
  const baseUpdatedAtCallbacks = new Set<BaseUpdatedAtChangedCallback>();

  const onStorage = (event: StorageEvent) => {
    if (event.key === DRAFT_STORAGE_KEY) {
      const draft = loadLocalDraft();

      draftChangedCallbacks.forEach((callback) => {
        callback(draft ? { title: draft.title, items: draft.items } : null);
      });
      return;
    }

    if (event.key !== DRAFT_SYNC_STORAGE_KEY) {
      return;
    }

    const payload = parseBaseUpdatedAt(event.newValue);

    if (!payload) {
      return;
    }

    if (payload.sourceTabId && payload.sourceTabId === tabId) {
      return;
    }

    baseUpdatedAtCallbacks.forEach((callback) => {
      callback(payload.baseUpdatedAt ?? null);
    });
  };

  window.addEventListener("storage", onStorage);

  return {
    onDraftChanged: (callback: DraftChangedCallback) => {
      draftChangedCallbacks.add(callback);

      return () => {
        draftChangedCallbacks.delete(callback);
      };
    },
    onBaseUpdatedAtChanged: (callback: BaseUpdatedAtChangedCallback) => {
      baseUpdatedAtCallbacks.add(callback);

      return () => {
        baseUpdatedAtCallbacks.delete(callback);
      };
    },
    dispose: () => {
      window.removeEventListener("storage", onStorage);
      draftChangedCallbacks.clear();
      baseUpdatedAtCallbacks.clear();
    },
  };
};
