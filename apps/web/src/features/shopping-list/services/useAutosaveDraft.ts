import { useEffect, useMemo, useRef, useState } from "react";
import type { ListItem } from "@src/context/ListContextValue";
import {
  createAutosaveScheduler,
  loadLocalDraft,
  saveLocalDraft,
} from "./AutosaveService";
import { createAutosaveTabSyncService } from "./AutosaveTabSyncService";
import type { AutosaveCatalogItemInput, AutosaveDraftInput } from "./types";

type UseAutosaveDraftOptions = {
  enabled?: boolean;
  debounceMs?: number;
  onRehydrate?: (draft: AutosaveDraftInput) => void;
  persistLocal?: boolean;
  skipInitialLocalRehydrate?: boolean;
};

type UseAutosaveDraftParams = {
  title: string;
  items: ListItem[];
};

type AutosaveScheduler = ReturnType<typeof createAutosaveScheduler>;

const normalizeSourceProductId = (item: ListItem): string => {
  const sourceProductId = item.sourceProductId?.trim();

  if (!sourceProductId) {
    return item.id;
  }

  const prefixedItemId = `${item.id}:`;

  if (sourceProductId.startsWith(prefixedItemId)) {
    return sourceProductId.slice(prefixedItemId.length);
  }

  return sourceProductId;
};

const mapListItemToAutosave = (item: ListItem): AutosaveCatalogItemInput => ({
  id: item.id,
  kind: "catalog",
  name: item.name,
  qty: item.quantity,
  checked: false,
  source: "mercadona",
  sourceProductId: normalizeSourceProductId(item),
  categorySnapshot: item.categorySnapshot ?? item.category ?? null,
  subcategorySnapshot: item.subcategorySnapshot ?? null,
  thumbnail: item.thumbnail ?? null,
  price: item.price ?? null,
});

const buildAutosaveDraft = (
  title: string,
  items: ListItem[],
): AutosaveDraftInput => {
  const deduped = new Map<string, AutosaveCatalogItemInput>();

  for (const item of items.map(mapListItemToAutosave)) {
    const key = item.sourceProductId.trim();
    const existing = deduped.get(key);

    if (!existing) {
      deduped.set(key, item);
      continue;
    }

    deduped.set(key, {
      ...existing,
      ...item,
      id: item.id.includes(":") || !existing.id ? item.id : existing.id,
      qty: Math.max(existing.qty, item.qty),
      checked: existing.checked || item.checked,
      sourceProductId: existing.sourceProductId,
    });
  }

  return {
    title,
    items: [...deduped.values()],
  };
};

const mapLocalDraftToInput = (
  draft: AutosaveDraftInput & { updatedAt?: string },
): AutosaveDraftInput => {
  const metadata =
    draft.isEditing === true || typeof draft.editingTargetListId === "string"
      ? {
          isEditing: draft.isEditing === true,
          editingTargetListId: draft.editingTargetListId ?? null,
        }
      : {};

  return {
    title: draft.title,
    items: draft.items,
    ...metadata,
  };
};

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

let tabSequence = 0;

const createTabId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  tabSequence += 1;

  return `tab-${Date.now()}-${tabSequence}`;
};

const getIsTabActive = () => {
  if (typeof document === "undefined") {
    return true;
  }

  return document.visibilityState !== "hidden";
};

export const useAutosaveDraft = (
  { title, items }: UseAutosaveDraftParams,
  options: UseAutosaveDraftOptions = {},
) => {
  const { enabled = true, debounceMs, onRehydrate, persistLocal = true } =
    options;
  const { skipInitialLocalRehydrate = false } = options;

  const schedulerRef = useRef<AutosaveScheduler | null>(null);
  const hasRehydratedRef = useRef(false);
  const baseDraftRef = useRef<AutosaveDraftInput | null>(null);
  const draftRef = useRef<AutosaveDraftInput | null>(null);
  const tabIdRef = useRef<string>(createTabId());
  const skipFirstPersistRef = useRef(true);
  const isApplyingRemoteDraftRef = useRef(false);

  const [remoteChangesAvailable, setRemoteChangesAvailable] = useState(false);
  const [isTabActive, setIsTabActive] = useState(getIsTabActive);

  const draft = useMemo(() => buildAutosaveDraft(title, items), [title, items]);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    schedulerRef.current = createAutosaveScheduler({
      debounceMs,
      persistLocal: false,
      sourceTabId: tabIdRef.current,
    });

    return () => {
      schedulerRef.current?.cancel();
      schedulerRef.current = null;
    };
  }, [debounceMs]);

  useEffect(() => {
    if (hasRehydratedRef.current) {
      return;
    }

    const localDraft = skipInitialLocalRehydrate ? null : loadLocalDraft();

    if (localDraft) {
      const normalizedDraft = mapLocalDraftToInput(localDraft);
      baseDraftRef.current = normalizedDraft;
      isApplyingRemoteDraftRef.current = true;

      if (onRehydrate) {
        onRehydrate(normalizedDraft);
      }
    } else {
      baseDraftRef.current = draftRef.current;
    }

    hasRehydratedRef.current = true;
  }, [onRehydrate, skipInitialLocalRehydrate]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabActive(getIsTabActive());
    };

    window.addEventListener("focus", handleVisibilityChange);
    window.addEventListener("blur", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleVisibilityChange);
      window.removeEventListener("blur", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

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
        isApplyingRemoteDraftRef.current = true;
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
    if (!persistLocal || !hasRehydratedRef.current) {
      return;
    }

    if (skipFirstPersistRef.current) {
      skipFirstPersistRef.current = false;
      return;
    }

    if (isApplyingRemoteDraftRef.current) {
      isApplyingRemoteDraftRef.current = false;

      if (areDraftsEqual(draft, baseDraftRef.current)) {
        return;
      }
    }

    saveLocalDraft(draft);
    baseDraftRef.current = draft;
  }, [draft, persistLocal]);

  useEffect(() => {
    if (!enabled || !isTabActive || draft.items.length === 0) {
      schedulerRef.current?.cancel();
      return;
    }

    schedulerRef.current?.schedule(draft);
  }, [draft, enabled, isTabActive]);

  return {
    remoteChangesAvailable,
  };
};
