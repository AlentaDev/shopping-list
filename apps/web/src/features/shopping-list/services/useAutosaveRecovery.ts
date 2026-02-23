import { useCallback, useEffect, useState } from "react";
import {
  getAutosave,
  loadLocalDraft,
  putAutosave,
  saveLocalDraft,
} from "./AutosaveService";
import type {
  AutosaveDraft,
  AutosaveDraftInput,
  LocalDraft,
} from "./types";
import { UI_TEXT } from "@src/shared/constants/ui";
import { saveAutosaveSyncMetadata } from "./AutosaveSyncMetadataService";

type UseAutosaveRecoveryOptions = {
  enabled?: boolean;
  onRehydrate?: (draft: AutosaveDraftInput) => void;
  onAutoRestore?: (draft: AutosaveDraftInput) => void;
  onKeepLocalConflict?: () => void;
  onRecoverEditSession?: (listId: string) => void;
  checkEditSessionOnBootstrap?: boolean;
};

const AUTOSAVE_CHECKED_KEY = "lists.autosaveChecked";
const EDIT_SESSION_STORAGE_KEY = "lists.editSession";

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


const saveEditSessionMarker = (listId: string) => {
  try {
    localStorage.setItem(
      EDIT_SESSION_STORAGE_KEY,
      JSON.stringify({
        listId,
        isEditing: true,
      }),
    );
  } catch (error) {
    console.warn("No se pudo guardar el marcador local de edición.", error);
  }
};

const clearEditSessionMarker = () => {
  try {
    localStorage.removeItem(EDIT_SESSION_STORAGE_KEY);
  } catch (error) {
    console.warn("No se pudo limpiar el marcador local de edición.", error);
  }
};


const hasStoredEditSessionMarker = () => {
  try {
    const stored = localStorage.getItem(EDIT_SESSION_STORAGE_KEY);

    if (!stored) {
      return false;
    }

    const parsed = JSON.parse(stored) as {
      listId?: unknown;
      isEditing?: unknown;
    };

    return typeof parsed.listId === "string" && parsed.listId.length > 0;
  } catch {
    return false;
  }
};

const mapAutosaveToDraftInput = (draft: AutosaveDraft): AutosaveDraftInput => ({
  title: draft.title,
  items: draft.items.map((item) => ({
    id: item.id,
    kind: "catalog",
    name: item.name,
    qty: item.qty,
    checked: item.checked,
    source: item.source ?? "mercadona",
    sourceProductId: item.sourceProductId ?? item.id,
    thumbnail: item.thumbnail ?? null,
    price: item.price ?? null,
    unitSize: item.unitSize ?? null,
    unitFormat: item.unitFormat ?? null,
    unitPrice: item.unitPrice ?? null,
    isApproxSize: item.isApproxSize ?? false,
  })),
});

const mapLocalDraftToInput = (draft: LocalDraft): AutosaveDraftInput => ({
  title: draft.title,
  items: draft.items,
});

const normalizeDraftTitle = (draft: AutosaveDraftInput) =>
  draft.title.trim() || UI_TEXT.SHOPPING_LIST.DEFAULT_LIST_TITLE;

const normalizeDraftForComparison = (draft: AutosaveDraftInput) => ({
  title: normalizeDraftTitle(draft),
  items: [...draft.items]
    .map((item) => ({
      id: item.id,
      kind: item.kind,
      name: item.name,
      qty: item.qty,
      checked: item.checked,
      source: item.source,
      sourceProductId: item.sourceProductId,
      thumbnail: item.thumbnail ?? null,
      price: item.price ?? null,
      unitSize: item.unitSize ?? null,
      unitFormat: item.unitFormat ?? null,
      unitPrice: item.unitPrice ?? null,
      isApproxSize: item.isApproxSize ?? false,
    }))
    .sort((left, right) => left.id.localeCompare(right.id)),
});

const areDraftsEqual = (
  left: AutosaveDraftInput,
  right: AutosaveDraftInput
) => {
  const normalizedLeft = normalizeDraftForComparison(left);
  const normalizedRight = normalizeDraftForComparison(right);
  return JSON.stringify(normalizedLeft) === JSON.stringify(normalizedRight);
};

const parseUpdatedAt = (value?: string) => {
  if (!value) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const hasItems = (draft: AutosaveDraftInput | null) =>
  Boolean(draft && draft.items.length > 0);

const mergeDraftWithPendingLocalItems = (
  remoteDraft: AutosaveDraftInput,
  localDraft: AutosaveDraftInput,
): AutosaveDraftInput => {
  const remoteIds = new Set(remoteDraft.items.map((item) => item.id));
  const pendingLocalItems = localDraft.items.filter(
    (item) => !remoteIds.has(item.id),
  );

  return {
    title: localDraft.title,
    items: [...remoteDraft.items, ...pendingLocalItems],
  };
};

type AutosaveConflict = {
  local: LocalDraft;
  remote: AutosaveDraft;
};

const DECISION_NONE = "none";
const DECISION_RESTORE_REMOTE = "restore-remote";
const DECISION_SYNC_LOCAL = "sync-local";
const DECISION_CONFLICT = "conflict";

type RecoveryDecision =
  | { type: typeof DECISION_NONE }
  | {
      type: typeof DECISION_RESTORE_REMOTE;
      draft: AutosaveDraftInput;
      shouldToast: boolean;
    }
  | { type: typeof DECISION_SYNC_LOCAL; draft: AutosaveDraftInput }
  | { type: typeof DECISION_CONFLICT; conflict: AutosaveConflict };

const buildRestoreRemoteDecision = (
  draft: AutosaveDraftInput,
  shouldToast: boolean
): RecoveryDecision => ({
  type: DECISION_RESTORE_REMOTE,
  draft,
  shouldToast,
});

const buildSyncLocalDecision = (
  draft: AutosaveDraftInput
): RecoveryDecision => ({
  type: DECISION_SYNC_LOCAL,
  draft,
});

const buildConflictDecision = (
  local: LocalDraft,
  remote: AutosaveDraft
): RecoveryDecision => ({
  type: DECISION_CONFLICT,
  conflict: { local, remote },
});

const resolveDecisionForBothDrafts = (
  localDraft: LocalDraft,
  remoteDraft: AutosaveDraft,
  localInput: AutosaveDraftInput,
  remoteInput: AutosaveDraftInput
): RecoveryDecision => {
  if (remoteDraft.isEditing && remoteDraft.editingTargetListId) {
    return buildRestoreRemoteDecision(localInput, false);
  }

  const localUpdatedAt = parseUpdatedAt(localDraft.updatedAt);
  const remoteUpdatedAt = parseUpdatedAt(remoteDraft.updatedAt);
  const hasUpdatedAtDifference =
    localUpdatedAt !== null &&
    remoteUpdatedAt !== null &&
    localUpdatedAt !== remoteUpdatedAt;

  if (hasUpdatedAtDifference) {
    if (localUpdatedAt > remoteUpdatedAt) {
      return buildSyncLocalDecision(localInput);
    }

    return buildRestoreRemoteDecision(remoteInput, false);
  }

  if (!areDraftsEqual(localInput, remoteInput)) {
    return buildConflictDecision(localDraft, remoteDraft);
  }

  return { type: DECISION_NONE };
};


const syncEditSessionWithRemoteDraft = ({
  remoteDraft,
  onRecoverEditSession,
}: {
  remoteDraft: AutosaveDraft | null;
  onRecoverEditSession?: (listId: string) => void;
}) => {
  if (remoteDraft?.isEditing && remoteDraft.editingTargetListId) {
    saveEditSessionMarker(remoteDraft.editingTargetListId);
    onRecoverEditSession?.(remoteDraft.editingTargetListId);
    if (remoteDraft.updatedAt) {
      saveAutosaveSyncMetadata(remoteDraft.updatedAt);
    }
    return;
  }

  clearEditSessionMarker();
};

const resolveRecoveryDecision = (
  localDraft: LocalDraft | null,
  remoteDraft: AutosaveDraft | null
): RecoveryDecision => {
  const localInput = localDraft ? mapLocalDraftToInput(localDraft) : null;
  const remoteInput = remoteDraft ? mapAutosaveToDraftInput(remoteDraft) : null;

  if (!localDraft && !remoteDraft) {
    return { type: DECISION_NONE };
  }

  if (
    remoteDraft &&
    remoteInput &&
    !hasItems(localInput) &&
    hasItems(remoteInput)
  ) {
    return buildRestoreRemoteDecision(remoteInput, true);
  }

  if (!remoteDraft && localInput) {
    return buildSyncLocalDecision(localInput);
  }

  if (localDraft && remoteDraft && localInput && remoteInput) {
    return resolveDecisionForBothDrafts(
      localDraft,
      remoteDraft,
      localInput,
      remoteInput
    );
  }

  return { type: DECISION_NONE };
};

export const useAutosaveRecovery = (
  options: UseAutosaveRecoveryOptions = {},
) => {
  const {
    enabled = true,
    onRehydrate,
    onAutoRestore,
    onKeepLocalConflict,
    onRecoverEditSession,
    checkEditSessionOnBootstrap = false,
  } = options;
  const [conflict, setConflict] = useState<AutosaveConflict | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPendingConflict, setHasPendingConflict] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setConflict(null);
      return;
    }

    let isActive = true;
    setIsLoading(true);

    const loadAutosave = async () => {
      const autosaveChecked = getAutosaveChecked();
      const shouldSyncCheckedEditSession =
        autosaveChecked &&
        (hasStoredEditSessionMarker() || checkEditSessionOnBootstrap);
      let shouldMarkChecked = !autosaveChecked;
      try {
        const localDraft = loadLocalDraft();
        setConflict(null);
        setHasPendingConflict(false);
        if (autosaveChecked && !shouldSyncCheckedEditSession) {
          return;
        }

        const remoteDraft = await getAutosave({
          errorMessage: "No se pudo recuperar el borrador.",
        });

        if (!isActive) {
          return;
        }

        syncEditSessionWithRemoteDraft({
          remoteDraft,
          onRecoverEditSession,
        });

        if (autosaveChecked) {
          return;
        }

        const decision = resolveRecoveryDecision(localDraft, remoteDraft);

        if (decision.type === DECISION_RESTORE_REMOTE) {
          onRehydrate?.(decision.draft);
          if (decision.shouldToast) {
            onAutoRestore?.(decision.draft);
          }
          return;
        }

        if (decision.type === DECISION_SYNC_LOCAL) {
          await putAutosave({
            ...decision.draft,
            title: normalizeDraftTitle(decision.draft),
          });
          return;
        }

        if (decision.type === DECISION_CONFLICT) {
          setConflict(decision.conflict);
          shouldMarkChecked = false;
        }
      } catch (error) {
        console.warn("No se pudo recuperar el borrador remoto.", error);
      } finally {
        if (isActive) {
          setIsLoading(false);
          if (shouldMarkChecked) {
            setAutosaveChecked();
          }
        }
      }
    };

    loadAutosave();

    return () => {
      isActive = false;
    };
  }, [
    checkEditSessionOnBootstrap,
    enabled,
    onAutoRestore,
    onRecoverEditSession,
    onRehydrate,
  ]);

  const handleUpdateFromServerFirst = useCallback(async () => {
    if (!conflict) {
      return;
    }

    const localInput = mapLocalDraftToInput(conflict.local);

    try {
      const latestRemoteDraft = await getAutosave({
        errorMessage: "No se pudo recuperar el borrador.",
      });

      if (!latestRemoteDraft) {
        return;
      }

      const remoteInput = mapAutosaveToDraftInput(latestRemoteDraft);
      saveLocalDraft(remoteInput);
      onRehydrate?.(remoteInput);

      const mergedDraft = mergeDraftWithPendingLocalItems(remoteInput, localInput);
      saveLocalDraft(mergedDraft);
      onRehydrate?.(mergedDraft);

      await putAutosave({
        ...mergedDraft,
        title: normalizeDraftTitle(mergedDraft),
      });

      setConflict(null);
      setHasPendingConflict(false);
      setAutosaveChecked();
    } catch (error) {
      console.warn("No se pudo sincronizar el borrador con base remota.", error);
    }
  }, [conflict, onRehydrate]);

  const handleKeepLocalDraft = useCallback(() => {
    if (!conflict) {
      return;
    }

    const localInput = mapLocalDraftToInput(conflict.local);
    saveLocalDraft(localInput);
    onRehydrate?.(localInput);
    setConflict(null);
    setHasPendingConflict(true);
    onKeepLocalConflict?.();
  }, [conflict, onKeepLocalConflict, onRehydrate]);

  return {
    conflict,
    isLoading,
    hasPendingConflict,
    handleUpdateFromServerFirst,
    handleKeepLocalDraft,
  };
};
