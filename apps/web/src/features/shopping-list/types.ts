export type ShoppingListItem = {
  id: string;
  name: string;
  category: string;
  thumbnail?: string | null;
  price?: number | null;
  quantity: number;
};
