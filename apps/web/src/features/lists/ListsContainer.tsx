import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@src/context/useToast";
import { useDraftProviderConflict } from "@src/context/useDraftProviderConflict";
import { UI_TEXT } from "@src/shared/constants/ui";
import { LIST_STATUS } from "@src/shared/domain/listStatus";
import type { ListActionKey } from "./services/listActions";
import type { ListDetail, ListSummary } from "./services/types";
import {
  activateList,
  completeList,
  deleteList,
  reuseList,
  getListDetail,
  startListEditing,
} from "./services/ListsService";
import { mapCheckedItemsToTechnicalIds } from "./services/checkedItemIds";
import {
  createListTabSyncSourceId,
  publishListTabSyncEvent,
  subscribeToListTabSyncEvents,
} from "@src/shared/services/tab-sync/listTabSyncContract";
import Lists from "./Lists";

type ListsContainerProps = {
  onOpenList: (list: ListDetail) => void;
  onStartOpenList?: (list: ListSummary) => void;
  hasDraftItems?: boolean;
  onRequestActiveEditConflict?: (input: {
    currentProviderId: string;
    requestedProviderId: string;
  }) => void;
  onRequestDraftProviderConflict?: (input: {
    currentProviderId: string;
    requestedProviderId: string;
    requestedProviderName?: string;
    message: string;
  }) => Promise<boolean>;
};

const isEmptyLocalDraftPayload = (value: string | null): boolean => {
  if (!value) {
    return false;
  }

  try {
    const parsed = JSON.parse(value) as {
      title?: unknown;
      items?: unknown;
    };

    return (
      typeof parsed.title === "string" &&
      parsed.title.trim() === "" &&
      Array.isArray(parsed.items) &&
      parsed.items.length === 0
    );
  } catch {
    return false;
  }
};

const clearLocalDraftForAllTabs = () => {
  localStorage.setItem(
    "lists.localDraft",
    JSON.stringify({
      title: "",
      items: [],
      updatedAt: new Date().toISOString(),
    }),
  );
};

type ListActionDependencies = {
  sourceTabId: string;
  confirmAndReset: (input: {
    requestedProviderId: string;
    requestedProviderName?: string;
  }) => Promise<boolean>;
  refreshLists: () => void;
  onOpenList: (list: ListDetail) => void;
  onStartOpenList?: (list: ListSummary) => void;
  onCloseDetail: () => void;
  onOpenDetail: (list: ListSummary) => Promise<void>;
};

const executeListAction = async (
  list: ListSummary,
  action: ListActionKey,
  {
    sourceTabId,
    confirmAndReset,
    refreshLists,
    onOpenList,
    onStartOpenList,
    onCloseDetail,
    onOpenDetail,
  }: ListActionDependencies,
) => {
  switch (action) {
    case "activate":
      await activateList(list.id);
      clearLocalDraftForAllTabs();
      publishListTabSyncEvent({ type: "list-activated", sourceTabId });
      refreshLists();
      return;
    case "complete": {
      const listDetail = await getListDetail(list.id);
      const checkedItemIds = mapCheckedItemsToTechnicalIds(listDetail.items);
      await completeList(list.id, { checkedItemIds });
      refreshLists();
      return;
    }
    case "reuse": {
      const requestedProviderId = list.provider?.slug;

      if (requestedProviderId) {
        const canProceed = await confirmAndReset({
          requestedProviderId,
          requestedProviderName: list.provider?.displayName,
        });

        if (!canProceed) {
          return;
        }
      }

      const reusedList = await reuseList(list.id);
      publishListTabSyncEvent({ type: "list-reused", sourceTabId });
      refreshLists();
      onOpenList(reusedList);
      onCloseDetail();
      return;
    }
    case "delete":
      await deleteList(list.id);
      publishListTabSyncEvent({ type: "list-deleted", sourceTabId });
      refreshLists();
      onCloseDetail();
      return;
    case "view":
      await onOpenDetail(list);
      return;
    case "edit": {
      await startListEditing(list.id);
      publishListTabSyncEvent({ type: "editing-started", sourceTabId });
      refreshLists();
      onStartOpenList?.(list);
      const listDetail = await getListDetail(list.id);
      onOpenList({ ...listDetail, status: LIST_STATUS.DRAFT, isEditing: true });
      onCloseDetail();
      return;
    }
  }
};

const ListsContainer = ({
  onOpenList,
  onStartOpenList,
  hasDraftItems = false,
  onRequestActiveEditConflict,
  onRequestDraftProviderConflict,
}: ListsContainerProps) => {
  const { showToast } = useToast();
  const { confirmAndReset } = useDraftProviderConflict({
    onActiveEditConflict: ({ currentProviderId, requestedProviderId }) => {
      onRequestActiveEditConflict?.({ currentProviderId, requestedProviderId });
    },
    onDraftProviderConflict: onRequestDraftProviderConflict,
  });
  const sourceTabId = useMemo(() => createListTabSyncSourceId(), []);
  const [actionLoading, setActionLoading] = useState<{
    listId: string;
    action: ListActionKey;
  } | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [selectedList, setSelectedList] = useState<ListSummary | null>(null);
  const [selectedListDetail, setSelectedListDetail] = useState<ListDetail | null>(
    null,
  );

  const refreshLists = useCallback(() => {
    setRefreshToken((prev) => prev + 1);
  }, []);

  useEffect(() => {
    return subscribeToListTabSyncEvents({
      sourceTabId,
      onListActivated: refreshLists,
      onListDeleted: refreshLists,
      onListReused: refreshLists,
      onEditingStarted: refreshLists,
      onEditingFinished: refreshLists,
      onEditingCancelled: refreshLists,
    });
  }, [refreshLists, sourceTabId]);

  useEffect(() => {
    const onStorage = (storageEvent: StorageEvent) => {
      if (storageEvent.key !== "lists.localDraft") {
        return;
      }

      if (!isEmptyLocalDraftPayload(storageEvent.newValue)) {
        return;
      }

      refreshLists();
    };

    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, [refreshLists]);

  const handleCloseDetail = () => {
    setSelectedList(null);
    setSelectedListDetail(null);
  };

  const handleOpenDetail = async (list: ListSummary) => {
    setActionLoading({ listId: list.id, action: "view" });

    try {
      const listDetail = await getListDetail(list.id);
      setSelectedList(list);
      setSelectedListDetail(listDetail);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAction = async (list: ListSummary, action: ListActionKey) => {
    if (action === "activate" && list.itemCount === 0) {
      showToast({
        message: UI_TEXT.LISTS.ACTIVATE_DISABLED_MESSAGE,
        productName: list.title,
      });
      return;
    }

    setActionLoading({ listId: list.id, action });

    try {
      await executeListAction(list, action, {
        sourceTabId,
        confirmAndReset,
        refreshLists,
        onOpenList,
        onStartOpenList,
        onCloseDetail: handleCloseDetail,
        onOpenDetail: handleOpenDetail,
      });
    } catch (error) {
      showToast({
        message:
          error instanceof Error
            ? error.message
            : "No se pudo ejecutar la acción de lista.",
        productName: list.title,
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Lists
      onAction={handleAction}
      onOpenDetail={handleOpenDetail}
      onCloseDetail={handleCloseDetail}
      selectedList={selectedList}
      selectedListDetail={selectedListDetail}
      hasDraftItems={hasDraftItems}
      actionLoading={actionLoading}
      refreshToken={refreshToken}
    />
  );
};

export default ListsContainer;
