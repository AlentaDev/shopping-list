import { useCallback } from "react";
import { useList } from "@src/context/useList";
import { UI_TEXT } from "@src/shared/constants/ui";
import { getProviderDisplayName } from "@src/shared/constants/providers";

type ActiveEditConflictInput = {
  currentProviderId: string;
  requestedProviderId: string;
};

type ConfirmAndResetOptions = {
  requestedProviderId: string;
  requestedProviderName?: string;
  onActiveEditConflict?: (input: ActiveEditConflictInput) => void;
};

type UseDraftProviderConflictOptions = {
  onActiveEditConflict?: (input: ActiveEditConflictInput) => void;
};

type UseDraftProviderConflictResult = {
  confirmAndReset: (opts: ConfirmAndResetOptions) => Promise<boolean>;
  shouldSilentSwitch: boolean;
};

const EDIT_SESSION_STORAGE_KEY = "lists.editSession";

const hasActiveEditSession = (): boolean => {
  try {
    const stored = localStorage.getItem(EDIT_SESSION_STORAGE_KEY);

    if (!stored) {
      return false;
    }

    const parsed = JSON.parse(stored) as {
      isEditing?: unknown;
    };

    return parsed.isEditing === true;
  } catch {
    return false;
  }
};

const buildConflictMessage = (
  currentProviderName: string,
  requestedProviderName: string,
): string =>
  UI_TEXT.CATALOG.DRAFT_PROVIDER_CONFLICT
    .replace("{currentProvider}", currentProviderName)
    .replace("{requestedProvider}", requestedProviderName);

export const useDraftProviderConflict = (
  options: UseDraftProviderConflictOptions = {},
): UseDraftProviderConflictResult => {
  const { draftProviderId, items, resetDraft, setDraftProviderId } = useList();
  const shouldSilentSwitch = items.length === 0;

  const confirmAndReset = useCallback(
    async ({
      requestedProviderId,
      requestedProviderName,
      onActiveEditConflict,
    }: ConfirmAndResetOptions): Promise<boolean> => {
      if (draftProviderId === requestedProviderId) {
        return true;
      }

      if (items.length === 0) {
        setDraftProviderId(requestedProviderId);
        return true;
      }

      const handleActiveEditConflict = onActiveEditConflict ?? options.onActiveEditConflict;

      if (handleActiveEditConflict && hasActiveEditSession()) {
        handleActiveEditConflict({
          currentProviderId: draftProviderId,
          requestedProviderId,
        });
        return false;
      }

      const resolvedRequestedName =
        requestedProviderName ?? getProviderDisplayName(requestedProviderId);
      const currentName = getProviderDisplayName(draftProviderId);
      const accepted = window.confirm(
        buildConflictMessage(currentName, resolvedRequestedName),
      );

      if (!accepted) {
        return false;
      }

      resetDraft(requestedProviderId);
      return true;
    },
    [
      draftProviderId,
      items.length,
      options.onActiveEditConflict,
      resetDraft,
      setDraftProviderId,
    ],
  );

  return { confirmAndReset, shouldSilentSwitch };
};
