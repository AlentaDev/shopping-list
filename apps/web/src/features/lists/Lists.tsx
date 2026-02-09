import { useEffect, useState } from "react";
import ListsScreen from "./components/ListsScreen";
import type { ListActionKey } from "./services/listActions";
import type { ListSummary } from "./services/types";
import { getLists } from "./services/ListsService";

type ListsProps = {
  onAction: (list: ListSummary, action: ListActionKey) => void;
  hasDraftItems?: boolean;
  actionLoading?: {
    listId: string;
    action: ListActionKey;
  } | null;
  refreshToken?: number;
};

const Lists = ({
  onAction,
  hasDraftItems = false,
  actionLoading = null,
  refreshToken = 0,
}: ListsProps) => {
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
  }, [refreshToken]);

  return (
    <ListsScreen
      lists={lists}
      onAction={onAction}
      hasDraftItems={hasDraftItems}
      isLoading={isLoading}
      actionLoading={actionLoading}
    />
  );
};

export default Lists;
