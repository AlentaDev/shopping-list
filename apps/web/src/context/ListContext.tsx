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

type DraftState = {
  items: ListItem[];
  draftProviderId: string;
};

type DraftAction =
  | ListAction
  | { type: "SET_DRAFT_PROVIDER"; providerId: string }
  | { type: "RESET_DRAFT"; providerId?: string };

const DEFAULT_DRAFT_PROVIDER_ID = "mercadona";

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

const listReducer = (state: DraftState, action: DraftAction): DraftState => {
  switch (action.type) {
    case "ADD_ITEM": {
      const normalizedIncoming = dedupeByCanonicalId([action.item])[0] as ListItem;
      const existingItem = state.items.find(
        (item) => canonicalKey(item) === canonicalKey(normalizedIncoming)
      );

      if (existingItem) {
        return {
          ...state,
          items: state.items.map((item) =>
            canonicalKey(item) === canonicalKey(normalizedIncoming)
              ? {
                  ...item,
                  quantity: Math.min(MAX_QUANTITY, item.quantity + 1),
                }
              : item,
          ),
        };
      }

      return {
        ...state,
        items: [...state.items, { ...normalizedIncoming, quantity: 1 }],
      };
    }
    case "SET_ITEMS":
      return {
        ...state,
        items: dedupeByCanonicalId(action.items),
      };
    case "UPDATE_QUANTITY":
      return {
        ...state,
        items: state.items.map((item) =>
          matchesIdentity(item, action.itemId)
            ? {
                ...item,
                quantity: Math.min(
                  MAX_QUANTITY,
                  Math.max(MIN_QUANTITY, action.quantity),
                ),
              }
            : item,
        ),
      };
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((item) => !matchesIdentity(item, action.itemId)),
      };
    case "SET_DRAFT_PROVIDER":
      return {
        ...state,
        draftProviderId: action.providerId,
      };
    case "RESET_DRAFT":
      return {
        items: [],
        draftProviderId: action.providerId ?? state.draftProviderId,
      };
    default:
      return state;
  }
};

type ListProviderProps = {
  children: ReactNode;
  initialItems?: ListItem[];
  initialDraftProviderId?: string;
};

export function ListProvider({
  children,
  initialItems,
  initialDraftProviderId = DEFAULT_DRAFT_PROVIDER_ID,
}: ListProviderProps) {
  const [state, dispatch] = useReducer(listReducer, {
    items: initialItems ?? [],
    draftProviderId: initialDraftProviderId,
  });

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

  const setDraftProviderId = useCallback((providerId: string) => {
    dispatch({ type: "SET_DRAFT_PROVIDER", providerId });
  }, []);

  const resetDraft = useCallback((providerId?: string) => {
    dispatch({ type: "RESET_DRAFT", providerId });
  }, []);

  const linesCount = state.items.length;
  const total = useMemo(
    () =>
      state.items.reduce(
        (sum, item) => sum + (item.price ?? 0) * item.quantity,
        0
      ),
    [state.items]
  );

  const value: ListContextType = {
    items: state.items,
    linesCount,
    total,
    draftProviderId: state.draftProviderId,
    addItem,
    setItems,
    updateQuantity,
    removeItem,
    setDraftProviderId,
    resetDraft,
  };

  return <ListContext.Provider value={value}>{children}</ListContext.Provider>;
}
