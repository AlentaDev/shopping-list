import { useCallback, useEffect, useState } from "react";
import {
  AutosaveConflictError,
  getAutosave,
  loadLocalDraft,
  putAutosave,
} from "./AutosaveService";
import type {
  AutosaveDraft,
  AutosaveDraftInput,
  LocalDraft,
} from "./types";
import { UI_TEXT } from "@src/shared/constants/ui";

type UseAutosaveRecoveryOptions = {
  enabled?: boolean;
  onRehydrate?: (draft: AutosaveDraftInput) => void;
  onAutoRestore?: (draft: AutosaveDraftInput) => void;
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
  const { enabled = true, onRehydrate, onAutoRestore } = options;
  const [conflict, setConflict] = useState<AutosaveConflict | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled || getAutosaveChecked()) {
      setConflict(null);
      return;
    }

    let isActive = true;
    setIsLoading(true);

    const loadAutosave = async () => {
      let shouldMarkChecked = true;
      try {
        const localDraft = loadLocalDraft();
        setConflict(null);
        const remoteDraft = await getAutosave({
          errorMessage: "No se pudo recuperar el borrador.",
        });

        if (!isActive) {
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
  }, [enabled, onAutoRestore, onRehydrate]);

  const handleKeepLocal = useCallback(async () => {
    if (!conflict) {
      return;
    }

    const localInput = mapLocalDraftToInput(conflict.local);
    try {
      await putAutosave({
        ...localInput,
        title: normalizeDraftTitle(localInput),
      });
      setConflict(null);
      setAutosaveChecked();
    } catch (error) {
      if (error instanceof AutosaveConflictError) {
        try {
          const latestRemoteDraft = await getAutosave({
            errorMessage: "No se pudo recuperar el borrador.",
          });

          if (latestRemoteDraft) {
            setConflict({
              local: conflict.local,
              remote: latestRemoteDraft,
            });
            return;
          }
        } catch (remoteError) {
          console.warn("No se pudo refrescar el borrador remoto.", remoteError);
        }
      }

      console.warn("No se pudo sincronizar el borrador local.", error);
    }
  }, [conflict]);

  const handleKeepRemote = useCallback(() => {
    if (!conflict) {
      return;
    }

    onRehydrate?.(mapAutosaveToDraftInput(conflict.remote));
    setConflict(null);
    setAutosaveChecked();
  }, [conflict, onRehydrate]);

  return {
    conflict,
    isLoading,
    handleKeepLocal,
    handleKeepRemote,
  };
};
