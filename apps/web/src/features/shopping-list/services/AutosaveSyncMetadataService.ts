const LOCAL_DRAFT_SYNC_STORAGE_KEY = "lists.localDraftSync";

type AutosaveSyncMetadata = {
  baseUpdatedAt: string | null;
};

export const saveAutosaveSyncMetadata = (updatedAt: string): void => {
  try {
    const payload: AutosaveSyncMetadata = {
      baseUpdatedAt: updatedAt,
    };

    localStorage.setItem(LOCAL_DRAFT_SYNC_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("No se pudo guardar baseUpdatedAt tras activar la lista.", error);
  }
};

