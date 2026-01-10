import { useCallback, useMemo, useReducer, type ReactNode } from "react";
import {
  ListContext,
  type ListContextType,
  type ListItem,
} from "./ListContextValue";

type ListAction =
  | { type: "ADD_ITEM"; item: ListItem }
  | { type: "UPDATE_QUANTITY"; itemId: string; quantity: number }
  | { type: "REMOVE_ITEM"; itemId: string };

const MIN_QUANTITY = 1;

const listReducer = (state: ListItem[], action: ListAction): ListItem[] => {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItem = state.find((item) => item.id === action.item.id);

      if (existingItem) {
        return state.map((item) =>
          item.id === action.item.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...state, { ...action.item, quantity: 1 }];
    }
    case "UPDATE_QUANTITY":
      return state.map((item) =>
        item.id === action.itemId
          ? { ...item, quantity: Math.max(MIN_QUANTITY, action.quantity) }
          : item
      );
    case "REMOVE_ITEM":
      return state.filter((item) => item.id !== action.itemId);
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
    updateQuantity,
    removeItem,
  };

  return <ListContext.Provider value={value}>{children}</ListContext.Provider>;
}
