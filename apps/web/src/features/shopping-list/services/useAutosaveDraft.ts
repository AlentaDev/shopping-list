import { useEffect, useMemo, useRef, useState } from "react";
import type { ListItem } from "@src/context/ListContextValue";
import {
  createAutosaveScheduler,
  loadLocalDraft,
  saveLocalDraft,
} from "./AutosaveService";
import {
  createAutosaveTabSyncService,
} from "./AutosaveTabSyncService";
import type { AutosaveCatalogItemInput, AutosaveDraftInput } from "./types";

type UseAutosaveDraftOptions = {
  enabled?: boolean;
  debounceMs?: number;
  onRehydrate?: (draft: AutosaveDraftInput) => void;
  persistLocal?: boolean;
};

type UseAutosaveDraftParams = {
  title: string;
  items: ListItem[];
};

type AutosaveScheduler = ReturnType<typeof createAutosaveScheduler>;

const mapListItemToAutosave = (
  item: ListItem,
): AutosaveCatalogItemInput => ({
  id: item.id,
  kind: "catalog",
  name: item.name,
  qty: item.quantity,
  checked: false,
  source: "mercadona",
  sourceProductId: item.id,
  thumbnail: item.thumbnail ?? null,
  price: item.price ?? null,
});

const buildAutosaveDraft = (
  title: string,
  items: ListItem[],
): AutosaveDraftInput => ({
  title,
  items: items.map(mapListItemToAutosave),
});

const mapLocalDraftToInput = (
  draft: AutosaveDraftInput & { updatedAt?: string },
): AutosaveDraftInput => ({
  title: draft.title,
  items: draft.items,
});

const areDraftsEqual = (
  current: AutosaveDraftInput | null,
  base: AutosaveDraftInput | null,
): boolean => {
  if (!current && !base) {
    return true;
  }

  if (!current || !base) {
    return false;
  }

  return JSON.stringify(current) === JSON.stringify(base);
};

const createTabId = () => `tab-${Date.now()}`;

export const useAutosaveDraft = (
  { title, items }: UseAutosaveDraftParams,
  options: UseAutosaveDraftOptions = {},
) => {
  const { enabled = true, debounceMs, onRehydrate, persistLocal = true } =
    options;
  const schedulerRef = useRef<AutosaveScheduler | null>(null);
  const hasRehydratedRef = useRef(false);
  const baseDraftRef = useRef<AutosaveDraftInput | null>(null);
  const draftRef = useRef<AutosaveDraftInput | null>(null);
  const tabIdRef = useRef<string>(createTabId());
  const [remoteChangesAvailable, setRemoteChangesAvailable] = useState(false);

  const draft = useMemo(() => buildAutosaveDraft(title, items), [title, items]);


  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    schedulerRef.current = createAutosaveScheduler({
      debounceMs,
      persistLocal,
    });

    return () => {
      schedulerRef.current?.cancel();
      schedulerRef.current = null;
    };
  }, [debounceMs, persistLocal]);

  useEffect(() => {
    if (hasRehydratedRef.current) {
      return;
    }

    const localDraft = loadLocalDraft();

    if (localDraft) {
      const normalizedDraft = mapLocalDraftToInput(localDraft);
      baseDraftRef.current = normalizedDraft;

      if (onRehydrate) {
        onRehydrate(normalizedDraft);
      }
    } else {
      baseDraftRef.current = draftRef.current;
    }

    hasRehydratedRef.current = true;
  }, [onRehydrate]);

  useEffect(() => {
    const tabSyncService = createAutosaveTabSyncService({
      tabId: tabIdRef.current,
    });

    const unsubscribeDraft = tabSyncService.onDraftChanged((remoteDraft) => {
      const hasPendingLocalChanges = !areDraftsEqual(
        draftRef.current,
        baseDraftRef.current,
      );

      if (hasPendingLocalChanges) {
        setRemoteChangesAvailable(Boolean(remoteDraft));
        return;
      }

      if (remoteDraft && onRehydrate) {
        onRehydrate(remoteDraft);
      }

      baseDraftRef.current = remoteDraft;
      setRemoteChangesAvailable(false);
    });

    const unsubscribeBaseUpdatedAt = tabSyncService.onBaseUpdatedAtChanged(() => {
      const hasPendingLocalChanges = !areDraftsEqual(
        draftRef.current,
        baseDraftRef.current,
      );

      if (hasPendingLocalChanges) {
        setRemoteChangesAvailable(true);
      }
    });

    return () => {
      unsubscribeDraft();
      unsubscribeBaseUpdatedAt();
      tabSyncService.dispose();
    };
  }, [onRehydrate]);

  useEffect(() => {
    if (!enabled) {
      if (persistLocal) {
        saveLocalDraft(draft);
      }
      return;
    }

    schedulerRef.current?.schedule(draft);
  }, [draft, enabled, persistLocal]);

  return {
    remoteChangesAvailable,
  };
};
