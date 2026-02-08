import { useCallback, useEffect, useState } from "react";
import ListsScreen from "./components/ListsScreen";
import type { ListActionKey } from "./services/listActions";
import type { ListDetail, ListSummary } from "./services/types";
import {
  activateList,
  completeList,
  deleteList,
  reuseList,
  getListDetail,
  getLists,
} from "./services/ListsService";

type ListsProps = {
  onOpenList: (list: ListDetail) => void;
  hasDraftItems?: boolean;
  onStartOpenList?: (list: ListSummary) => void;
};

const Lists = ({
  onOpenList,
  hasDraftItems = false,
  onStartOpenList,
}: ListsProps) => {
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<{
    listId: string;
    action: ListActionKey;
  } | null>(null);

  const loadLists = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getLists();
      setLists(response.lists);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const fetchLists = async () => {
      try {
        setIsLoading(true);
        const response = await getLists();
        if (isActive) {
          setLists(response.lists);
        }
      } catch {
        if (isActive) {
          setLists([]);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void fetchLists();

    return () => {
      isActive = false;
    };
  }, []);

  const handleAction = async (listId: string, action: ListActionKey) => {
    const targetList = lists.find((list) => list.id === listId);
    setActionLoading({ listId, action });

    if (action === "activate") {
      try {
        await activateList(listId);
        await loadLists();
        return;
      } finally {
        setActionLoading(null);
      }
    }

    if (action === "complete") {
      try {
        const listDetail = await getListDetail(listId);
        const checkedItemIds = listDetail.items
          .filter((item) => item.checked)
          .map((item) => item.id);
        await completeList(listId, { checkedItemIds });
        await loadLists();
        return;
      } finally {
        setActionLoading(null);
      }
    }

    if (action === "reuse") {
      try {
        await reuseList(listId);
        await loadLists();
        return;
      } finally {
        setActionLoading(null);
      }
    }

    if (action === "delete") {
      try {
        await deleteList(listId);
        await loadLists();
        return;
      } finally {
        setActionLoading(null);
      }
    }

    if (action === "view" || action === "edit") {
      try {
        if (targetList) {
          onStartOpenList?.(targetList);
        }
        const listDetail = await getListDetail(listId);
        onOpenList(listDetail);
      } finally {
        setActionLoading(null);
      }
    }
  };

  return (
    <ListsScreen
      lists={lists}
      onAction={handleAction}
      hasDraftItems={hasDraftItems}
      isLoading={isLoading}
      actionLoading={actionLoading}
    />
  );
};

export default Lists;
