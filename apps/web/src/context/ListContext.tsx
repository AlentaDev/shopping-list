import { useCallback, useMemo, useReducer, type ReactNode } from "react";
import {
  ListContext,
  type ListContextType,
  type ListItem,
} from "./ListContextValue";

type ListAction =
  | { type: "ADD_ITEM"; item: ListItem }
  | { type: "SET_ITEMS"; items: ListItem[] }
  | { type: "UPDATE_QUANTITY"; itemId: string; quantity: number }
  | { type: "REMOVE_ITEM"; itemId: string };

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 99;

const normalizeSourceProductId = (item: ListItem): string => {
  const sourceProductId = item.sourceProductId?.trim();

  if (!sourceProductId) {
    const [, productId] = item.id.split(":");

    return productId?.trim() || item.id;
  }

  const prefixedId = `${item.id}:`;

  if (sourceProductId.startsWith(prefixedId)) {
    return sourceProductId.slice(prefixedId.length);
  }

  if (sourceProductId.includes(":")) {
    const segments = sourceProductId.split(":");
    return segments[segments.length - 1] ?? sourceProductId;
  }

  return sourceProductId;
};

const canonicalKey = (item: ListItem): string => normalizeSourceProductId(item);

const mergeItems = (base: ListItem, incoming: ListItem): ListItem => ({
  ...base,
  ...incoming,
  id: canonicalKey(incoming),
  sourceProductId: canonicalKey(incoming),
  serverItemId: incoming.serverItemId ?? base.serverItemId ?? incoming.id,
  quantity: Math.max(base.quantity, incoming.quantity),
  checked: Boolean(base.checked) || Boolean(incoming.checked),
});

const dedupeByCanonicalId = (items: ListItem[]): ListItem[] => {
  const mergedByKey = new Map<string, ListItem>();

  items.forEach((item) => {
    const key = canonicalKey(item);
    const normalizedItem: ListItem = {
      ...item,
      id: key,
      sourceProductId: key,
      serverItemId: item.serverItemId ?? item.id,
    };

    const existing = mergedByKey.get(key);

    if (!existing) {
      mergedByKey.set(key, normalizedItem);
      return;
    }

    mergedByKey.set(key, mergeItems(existing, normalizedItem));
  });

  return Array.from(mergedByKey.values());
};

const matchesIdentity = (item: ListItem, itemId: string): boolean =>
  item.id === itemId ||
  item.serverItemId === itemId ||
  item.sourceProductId === itemId;

const listReducer = (state: ListItem[], action: ListAction): ListItem[] => {
  switch (action.type) {
    case "ADD_ITEM": {
      const normalizedIncoming = dedupeByCanonicalId([action.item])[0] as ListItem;
      const existingItem = state.find(
        (item) => canonicalKey(item) === canonicalKey(normalizedIncoming)
      );

      if (existingItem) {
        return state.map((item) =>
          canonicalKey(item) === canonicalKey(normalizedIncoming)
            ? {
                ...item,
                quantity: Math.min(MAX_QUANTITY, item.quantity + 1),
              }
            : item
        );
      }

      return [...state, { ...normalizedIncoming, quantity: 1 }];
    }
    case "SET_ITEMS":
      return dedupeByCanonicalId(action.items);
    case "UPDATE_QUANTITY":
      return state.map((item) =>
        matchesIdentity(item, action.itemId)
          ? {
              ...item,
              quantity: Math.min(
                MAX_QUANTITY,
                Math.max(MIN_QUANTITY, action.quantity),
              ),
            }
          : item
      );
    case "REMOVE_ITEM":
      return state.filter((item) => !matchesIdentity(item, action.itemId));
    default:
      return state;
  }
};

type ListProviderProps = {
  children: ReactNode;
  initialItems?: ListItem[];
};

export function ListProvider({ children, initialItems }: ListProviderProps) {
  const [items, dispatch] = useReducer(listReducer, initialItems ?? []);

  const addItem = useCallback((item: ListItem) => {
    dispatch({ type: "ADD_ITEM", item });
  }, []);

  const setItems = useCallback((nextItems: ListItem[]) => {
    dispatch({ type: "SET_ITEMS", items: nextItems });
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", itemId, quantity });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    dispatch({ type: "REMOVE_ITEM", itemId });
  }, []);

  const linesCount = items.length;
  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + (item.price ?? 0) * item.quantity,
        0
      ),
    [items]
  );

  const value: ListContextType = {
    items,
    linesCount,
    total,
    addItem,
    setItems,
    updateQuantity,
    removeItem,
  };

  return <ListContext.Provider value={value}>{children}</ListContext.Provider>;
}
