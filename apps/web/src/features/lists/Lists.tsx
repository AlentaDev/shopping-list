import { useCallback, useEffect, useState } from "react";
import ListsScreen from "./components/ListsScreen";
import type { ListActionKey } from "./services/listActions";
import type { ListSummary } from "./services/types";
import {
  activateList,
  completeList,
  createList,
  deleteList,
  duplicateList,
  getListDetail,
  getLists,
} from "./services/ListsService";
import { APP_EVENTS } from "@src/shared/constants/appState";

const Lists = () => {
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

    if (action === "duplicate") {
      await duplicateList(listId);
      await loadLists();
      return;
    }

    if (action === "delete") {
      await deleteList(listId);
      await loadLists();
      return;
    }

    if (action === "view" || action === "edit") {
      await getListDetail(listId);
    }
  };

  const handleCreate = async () => {
    await createList();
    await loadLists();
    window.dispatchEvent(new Event(APP_EVENTS.OPEN_CART));
  };

  return (
    <ListsScreen lists={lists} onAction={handleAction} onCreate={handleCreate} />
  );
};

export default Lists;
