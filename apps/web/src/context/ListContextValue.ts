import { createContext } from "react";

export type ListItem = {
  id: string;
  sourceProductId?: string;
  name: string;
  category: string;
  thumbnail?: string | null;
  price?: number | null;
  quantity: number;
};

export type ListContextType = {
  items: ListItem[];
  linesCount: number;
  total: number;
  addItem: (item: ListItem) => void;
  setItems: (items: ListItem[]) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
};

export const ListContext = createContext<ListContextType | undefined>(
  undefined
);
