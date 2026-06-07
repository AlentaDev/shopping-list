import { useCallback } from "react";
import { useList } from "@src/context/useList";
import { UI_TEXT } from "@src/shared/constants/ui";
import { getProviderDisplayName } from "@src/shared/constants/providers";

type ConfirmAndResetOptions = {
  requestedProviderId: string;
  requestedProviderName?: string;
};

type UseDraftProviderConflictResult = {
  confirmAndReset: (opts: ConfirmAndResetOptions) => Promise<boolean>;
  shouldSilentSwitch: boolean;
};

const buildConflictMessage = (
  currentProviderName: string,
  requestedProviderName: string,
): string =>
  UI_TEXT.CATALOG.DRAFT_PROVIDER_CONFLICT
    .replace("{currentProvider}", currentProviderName)
    .replace("{requestedProvider}", requestedProviderName);

export const useDraftProviderConflict = (): UseDraftProviderConflictResult => {
  const { draftProviderId, items, resetDraft, setDraftProviderId } = useList();
  const shouldSilentSwitch = items.length === 0;

  const confirmAndReset = useCallback(
    async ({
      requestedProviderId,
      requestedProviderName,
    }: ConfirmAndResetOptions): Promise<boolean> => {
      if (draftProviderId === requestedProviderId) {
        return true;
      }

      if (items.length === 0) {
        setDraftProviderId(requestedProviderId);
        return true;
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
    [draftProviderId, items.length, resetDraft, setDraftProviderId],
  );

  return { confirmAndReset, shouldSilentSwitch };
};
