import { useState } from "react";
import type { ListActionKey } from "./services/listActions";
import type { ListDetail, ListSummary } from "./services/types";
import {
  activateList,
  completeList,
  deleteList,
  reuseList,
  getListDetail,
} from "./services/ListsService";
import Lists from "./Lists";

type ListsContainerProps = {
  onOpenList: (list: ListDetail) => void;
  onStartOpenList?: (list: ListSummary) => void;
  hasDraftItems?: boolean;
};

const ListsContainer = ({
  onOpenList,
  onStartOpenList,
  hasDraftItems = false,
}: ListsContainerProps) => {
  const [actionLoading, setActionLoading] = useState<{
    listId: string;
    action: ListActionKey;
  } | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const refreshLists = () => {
    setRefreshToken((prev) => prev + 1);
  };

  const handleAction = async (list: ListSummary, action: ListActionKey) => {
    setActionLoading({ listId: list.id, action });

    try {
      if (action === "activate") {
        await activateList(list.id);
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
        return;
      }

      if (action === "delete") {
        await deleteList(list.id);
        refreshLists();
        return;
      }

      if (action === "view" || action === "edit") {
        onStartOpenList?.(list);
        const listDetail = await getListDetail(list.id);
        onOpenList(listDetail);
      }
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Lists
      onAction={handleAction}
      hasDraftItems={hasDraftItems}
      actionLoading={actionLoading}
      refreshToken={refreshToken}
    />
  );
};

export default ListsContainer;
