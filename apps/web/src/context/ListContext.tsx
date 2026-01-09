import { useCallback, useMemo, useReducer, type ReactNode } from "react";
import {
  ListContext,
  type ListContextType,
  type ListItem,
} from "./ListContextValue";

type ListAction =
  | { type: "UPDATE_QUANTITY"; itemId: string; quantity: number }
  | { type: "REMOVE_ITEM"; itemId: string };

const MIN_QUANTITY = 1;

const INITIAL_ITEMS: ListItem[] = [
  {
    id: "item-1",
    name: "Manzanas Fuji",
    category: "Frutas",
    thumbnail:
      "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=120&q=80",
    price: 1.2,
    quantity: 1,
  },
  {
    id: "item-2",
    name: "Leche entera",
    category: "Bebidas",
    thumbnail: null,
    price: 0.95,
    quantity: 2,
  },
  {
    id: "item-3",
    name: "Pan integral multicereal extra largo",
    category: "Panadería",
    thumbnail:
      "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=120&q=80",
    price: 1.5,
    quantity: 1,
  },
];

const listReducer = (state: ListItem[], action: ListAction): ListItem[] => {
  switch (action.type) {
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
};

export function ListProvider({ children }: ListProviderProps) {
  const [items, dispatch] = useReducer(listReducer, INITIAL_ITEMS);

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
    updateQuantity,
    removeItem,
  };

  return <ListContext.Provider value={value}>{children}</ListContext.Provider>;
}
