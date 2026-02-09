export type ManualListItem = {
  id: string;
  listId: string;
  kind: "manual";
  name: string;
  qty: number;
  checked: boolean;
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
  createdAt: Date;
  updatedAt: Date;
};

export type ListItem = ManualListItem | CatalogListItem;

export const LIST_STATUSES = ["DRAFT", "ACTIVE", "COMPLETED"] as const;
export type ListStatus = (typeof LIST_STATUSES)[number];

export type List = {
  id: string;
  ownerUserId: string;
  title: string;
  isAutosaveDraft: boolean;
  status: ListStatus;
  items: ListItem[];
  activatedAt?: Date;
  isEditing: boolean;
  createdAt: Date;
  updatedAt: Date;
};
