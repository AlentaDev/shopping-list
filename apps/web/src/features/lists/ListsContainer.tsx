import { useEffect, useMemo, useState } from "react";
import { useToast } from "@src/context/useToast";
import { UI_TEXT } from "@src/shared/constants/ui";
import type { ListActionKey } from "./services/listActions";
import type { ListDetail, ListSummary } from "./services/types";
import {
  activateList,
  completeList,
  deleteList,
  reuseList,
  getListDetail,
} from "./services/ListsService";
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

const ListsContainer = ({
  onOpenList,
  onStartOpenList,
  hasDraftItems = false,
}: ListsContainerProps) => {
  const { showToast } = useToast();
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

  const refreshLists = () => {
    setRefreshToken((prev) => prev + 1);
  };

  useEffect(() => {
    return subscribeToListTabSyncEvents({
      sourceTabId,
      onListActivated: refreshLists,
    });
  }, [sourceTabId]);

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
  }, []);

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
      if (action === "activate") {
        await activateList(list.id);
        clearLocalDraftForAllTabs();
        publishListTabSyncEvent({
          type: "list-activated",
          sourceTabId,
        });
        refreshLists();
        return;
      }

      if (action === "complete") {
        const listDetail = await getListDetail(list.id);
        const checkedItemIds = listDetail.items
          .filter((item) => item.checked)
          .map((item) => item.id);
        await completeList(list.id, { checkedItemIds });
        refreshLists();
        return;
      }

      if (action === "reuse") {
        await reuseList(list.id);
        refreshLists();
        handleCloseDetail();
        return;
      }

      if (action === "delete") {
        await deleteList(list.id);
        refreshLists();
        handleCloseDetail();
        return;
      }

      if (action === "view") {
        await handleOpenDetail(list);
        return;
      }

      if (action === "edit") {
        onStartOpenList?.(list);
        const listDetail = await getListDetail(list.id);
        onOpenList(listDetail);
        handleCloseDetail();
      }
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
