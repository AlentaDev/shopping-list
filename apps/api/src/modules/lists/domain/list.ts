export type ManualListItem = {
  id: string;
  listId: string;
  kind: "manual";
  name: string;
  qty: number;
  checked: boolean;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CatalogListItem = {
  id: string;
  listId: string;
  kind: "catalog";
  source: "mercadona";
  sourceProductId: string;
  nameSnapshot: string;
  thumbnailSnapshot: string | null;
  priceSnapshot: number | null;
  unitSizeSnapshot: number | null;
  unitFormatSnapshot: string | null;
  unitPricePerUnitSnapshot: number | null;
  isApproxSizeSnapshot: boolean;
  qty: number;
  checked: boolean;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ListItem = ManualListItem | CatalogListItem;

export type List = {
  id: string;
  ownerUserId: string;
  title: string;
  items: ListItem[];
  createdAt: Date;
  updatedAt: Date;
};
