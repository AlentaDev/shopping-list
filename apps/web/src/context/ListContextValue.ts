import { createContext } from "react";

export type ListItem = {
  id: string;
  source?: "mercadona" | "bonpreuesclat";
  sourceProductId?: string;
  serverItemId?: string | null;
  checked?: boolean;
  name: string;
  category: string;
  categorySnapshot?: string | null;
  subcategorySnapshot?: string | null;
  thumbnail?: string | null;
  price?: number | null;
  quantity: number;
};

export type ListContextType = {
  items: ListItem[];
  linesCount: number;
  total: number;
  draftProviderId: string;
  addItem: (item: ListItem) => void;
  setItems: (items: ListItem[]) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  setDraftProviderId: (providerId: string) => void;
  resetDraft: (providerId?: string) => void;
};

export const ListContext = createContext<ListContextType | undefined>(
  undefined
);
