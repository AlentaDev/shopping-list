import { useCallback, useEffect, useState } from "react";
import { deleteAutosave, getAutosave } from "./AutosaveService";
import type { AutosaveDraft, AutosaveDraftInput } from "./types";

type UseAutosaveRecoveryOptions = {
  enabled?: boolean;
  onRehydrate?: (draft: AutosaveDraftInput) => void;
};

const mapAutosaveToDraftInput = (
  draft: AutosaveDraft,
): AutosaveDraftInput => ({
  title: draft.title,
  items: draft.items.map((item) => ({
    id: item.id,
    kind: item.kind,
    name: item.name,
    qty: item.qty,
    checked: item.checked,
    note: item.note ?? null,
  })),
});

export const useAutosaveRecovery = (
  options: UseAutosaveRecoveryOptions = {},
) => {
  const { enabled = true, onRehydrate } = options;
  const [draft, setDraft] = useState<AutosaveDraft | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setDraft(null);
      return;
    }

    let isActive = true;
    setIsLoading(true);

    const loadAutosave = async () => {
      try {
        const response = await getAutosave({
          errorMessage: "No se pudo recuperar el borrador.",
        });

        if (isActive) {
          setDraft(response);
        }
      } catch (error) {
        console.warn("No se pudo recuperar el borrador remoto.", error);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadAutosave();

    return () => {
      isActive = false;
    };
  }, [enabled]);

  const handleContinue = useCallback(() => {
    if (!draft) {
      return;
    }

    onRehydrate?.(mapAutosaveToDraftInput(draft));
    setDraft(null);
  }, [draft, onRehydrate]);

  const handleDiscard = useCallback(async () => {
    if (!draft) {
      return;
    }

    try {
      await deleteAutosave({
        errorMessage: "No se pudo descartar el borrador.",
      });
      setDraft(null);
    } catch (error) {
      console.warn("No se pudo descartar el borrador remoto.", error);
    }
  }, [draft]);

  return {
    draft,
    isLoading,
    handleContinue,
    handleDiscard,
  };
};
