export type ShoppingListItem = {
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
