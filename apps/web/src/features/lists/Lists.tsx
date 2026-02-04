import { useCallback, useEffect, useState } from "react";
import ListsScreen from "./components/ListsScreen";
import type { ListActionKey } from "./services/listActions";
import { LIST_STATUS } from "./services/listActions";
import type { ListDetail, ListSummary } from "./services/types";
import {
  activateList,
  completeList,
  createList,
  deleteList,
  reuseList,
  getListDetail,
  getLists,
} from "./services/ListsService";

type ListsProps = {
  onOpenList: (list: ListDetail) => void;
};

const Lists = ({ onOpenList }: ListsProps) => {
  const [lists, setLists] = useState<ListSummary[]>([]);

  const loadLists = useCallback(async () => {
    const response = await getLists();
    setLists(response.lists);
  }, []);

  useEffect(() => {
    let isActive = true;

    const fetchLists = async () => {
      try {
        const response = await getLists();
        if (isActive) {
          setLists(response.lists);
        }
      } catch {
        if (isActive) {
          setLists([]);
        }
      }
    };

    void fetchLists();

    return () => {
      isActive = false;
    };
  }, []);

  const handleAction = async (listId: string, action: ListActionKey) => {
    if (action === "activate") {
      await activateList(listId);
      await loadLists();
      return;
    }

    if (action === "complete") {
      const listDetail = await getListDetail(listId);
      const checkedItemIds = listDetail.items
        .filter((item) => item.checked)
        .map((item) => item.id);
      await completeList(listId, { checkedItemIds });
      await loadLists();
      return;
    }

    if (action === "reuse") {
      await reuseList(listId);
      await loadLists();
      return;
    }

    if (action === "delete") {
      await deleteList(listId);
      await loadLists();
      return;
    }

    if (action === "view" || action === "edit") {
      const listDetail = await getListDetail(listId);
      onOpenList(listDetail);
    }
  };

  const handleCreate = async () => {
    const createdList = await createList();
    onOpenList({
      id: createdList.id,
      title: createdList.title,
      updatedAt: createdList.updatedAt,
      activatedAt: createdList.activatedAt,
      itemCount: createdList.itemCount,
      isEditing: createdList.isEditing,
      items: [],
      status: LIST_STATUS.DRAFT,
    });
    await loadLists();
  };

  return (
    <ListsScreen lists={lists} onAction={handleAction} onCreate={handleCreate} />
  );
};

export default Lists;
