import { useEffect, useMemo, useRef } from "react";
import type { ListItem } from "@src/context/ListContextValue";
import {
  createAutosaveScheduler,
  loadLocalDraft,
  saveLocalDraft,
} from "./AutosaveService";
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
  items: ListItem[]
): AutosaveDraftInput => ({
  title,
  items: items.map(mapListItemToAutosave),
});

const mapLocalDraftToInput = (
  draft: AutosaveDraftInput & { updatedAt?: string }
): AutosaveDraftInput => ({
  title: draft.title,
  items: draft.items,
});

export const useAutosaveDraft = (
  { title, items }: UseAutosaveDraftParams,
  options: UseAutosaveDraftOptions = {}
) => {
  const { enabled = true, debounceMs, onRehydrate, persistLocal = true } =
    options;
  const schedulerRef = useRef<AutosaveScheduler | null>(null);
  const hasRehydratedRef = useRef(false);

  const draft = useMemo(
    () => buildAutosaveDraft(title, items),
    [title, items]
  );

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

    if (localDraft && onRehydrate) {
      onRehydrate(mapLocalDraftToInput(localDraft));
    }

    hasRehydratedRef.current = true;
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
};
