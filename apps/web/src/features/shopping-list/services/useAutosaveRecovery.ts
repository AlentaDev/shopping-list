import { useCallback, useEffect, useState } from "react";
import { deleteAutosave, getAutosave } from "./AutosaveService";
import type { AutosaveDraft, AutosaveDraftInput } from "./types";

type UseAutosaveRecoveryOptions = {
  enabled?: boolean;
  onRehydrate?: (draft: AutosaveDraftInput) => void;
};

const AUTOSAVE_CHECKED_KEY = "lists.autosaveChecked";

const getAutosaveChecked = () => {
  try {
    return sessionStorage.getItem(AUTOSAVE_CHECKED_KEY) === "true";
  } catch (error) {
    console.warn("No se pudo leer el estado del autosave.", error);
    return false;
  }
};

const setAutosaveChecked = () => {
  try {
    sessionStorage.setItem(AUTOSAVE_CHECKED_KEY, "true");
  } catch (error) {
    console.warn("No se pudo guardar el estado del autosave.", error);
  }
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
    source: item.kind === "catalog" ? item.source ?? "mercadona" : undefined,
    sourceProductId:
      item.kind === "catalog" ? item.sourceProductId ?? item.id : undefined,
    thumbnail: item.thumbnail ?? null,
    price: item.price ?? null,
    unitSize: item.unitSize ?? null,
    unitFormat: item.unitFormat ?? null,
    unitPrice: item.unitPrice ?? null,
    isApproxSize: item.isApproxSize ?? false,
  })),
});

export const useAutosaveRecovery = (
  options: UseAutosaveRecoveryOptions = {},
) => {
  const { enabled = true, onRehydrate } = options;
  const [draft, setDraft] = useState<AutosaveDraft | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled || getAutosaveChecked()) {
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
          setAutosaveChecked();
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
    setAutosaveChecked();
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
      setAutosaveChecked();
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
