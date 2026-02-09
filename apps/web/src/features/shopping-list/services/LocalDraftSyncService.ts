import {
  clearLocalDraft,
  loadLocalDraft,
  putAutosave,
} from "./AutosaveService";
import type { AutosaveDraftInput, LocalDraft } from "./types";
import { UI_TEXT } from "@src/shared/constants/ui";

type SyncResult = {
  listId: string;
  itemsCreated: number;
};

const normalizeDraftTitle = (draft: AutosaveDraftInput) =>
  draft.title.trim() || UI_TEXT.SHOPPING_LIST.DEFAULT_LIST_TITLE;

const mapLocalDraftToInput = (draft: LocalDraft): AutosaveDraftInput => ({
  title: draft.title,
  items: draft.items,
});

export const syncLocalDraftToRemoteList = async (): Promise<SyncResult | null> => {
  const localDraft = loadLocalDraft();

  if (!localDraft) {
    return null;
  }

  const draftToSync: AutosaveDraftInput = {
    ...mapLocalDraftToInput(localDraft),
    title: normalizeDraftTitle(localDraft),
  };
  const autosaveSummary = await putAutosave(draftToSync);

  clearLocalDraft();

  return {
    listId: autosaveSummary.id,
    itemsCreated: localDraft.items.length,
  };
};
