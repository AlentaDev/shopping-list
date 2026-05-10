export type ShoppingListItem = {
  id: string;
  sourceProductId?: string;
  serverItemId?: string | null;
  checked?: boolean;
  name: string;
  category: string;
  thumbnail?: string | null;
  price?: number | null;
  quantity: number;
};
