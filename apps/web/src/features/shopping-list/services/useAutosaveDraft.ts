import { useEffect, useMemo, useRef } from "react";
import type { ListItem } from "@src/context/ListContextValue";
import {
  createAutosaveScheduler,
  loadLocalDraft,
  saveLocalDraft,
} from "./AutosaveService";
import type { AutosaveDraftInput, AutosaveItemInput } from "./types";

type UseAutosaveDraftOptions = {
  enabled?: boolean;
  debounceMs?: number;
  onRehydrate?: (draft: AutosaveDraftInput) => void;
};

type UseAutosaveDraftParams = {
  title: string;
  items: ListItem[];
};

type AutosaveScheduler = ReturnType<typeof createAutosaveScheduler>;

const mapListItemToAutosave = (item: ListItem): AutosaveItemInput => ({
  id: item.id,
  kind: "manual",
  name: item.name,
  qty: item.quantity,
  checked: false,
  note: null,
});

const buildAutosaveDraft = (
  title: string,
  items: ListItem[]
): AutosaveDraftInput => ({
  title,
  items: items.map(mapListItemToAutosave),
});

export const useAutosaveDraft = (
  { title, items }: UseAutosaveDraftParams,
  options: UseAutosaveDraftOptions = {}
) => {
  const { enabled = true, debounceMs, onRehydrate } = options;
  const schedulerRef = useRef<AutosaveScheduler | null>(null);
  const hasRehydratedRef = useRef(false);

  const draft = useMemo(
    () => buildAutosaveDraft(title, items),
    [title, items]
  );

  useEffect(() => {
    schedulerRef.current = createAutosaveScheduler({ debounceMs });

    return () => {
      schedulerRef.current?.cancel();
      schedulerRef.current = null;
    };
  }, [debounceMs]);

  useEffect(() => {
    if (hasRehydratedRef.current) {
      return;
    }

    const localDraft = loadLocalDraft();

    if (localDraft && onRehydrate) {
      onRehydrate(localDraft);
    }

    hasRehydratedRef.current = true;
  }, [onRehydrate]);

  useEffect(() => {
    if (!enabled) {
      saveLocalDraft(draft);
      return;
    }

    schedulerRef.current?.schedule(draft);
  }, [draft, enabled]);
};
