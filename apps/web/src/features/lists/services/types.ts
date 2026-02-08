import type { ListStatus } from "@src/shared/domain/listStatus";

export type ListSummary = {
  id: string;
  title: string;
  itemCount: number;
  activatedAt: string | null;
  isEditing: boolean;
  updatedAt: string;
  status: ListStatus;
};

export type ListItem = {
  id: string;
  kind: "manual" | "catalog";
  name: string;
  qty: number;
  checked: boolean;
  updatedAt: string;
  note?: string;
  thumbnail?: string | null;
  price?: number | null;
  unitSize?: number | null;
  unitFormat?: string | null;
  unitPrice?: number | null;
  isApproxSize?: boolean;
  source?: "mercadona";
  sourceProductId?: string;
};

export type ListDetail = {
  id: string;
  title: string;
  itemCount: number;
  activatedAt: string | null;
  isEditing: boolean;
  items: ListItem[];
  updatedAt: string;
  status?: ListStatus;
};

export type ListStatusSummary = {
  id: string;
  status: ListStatus;
  updatedAt: string;
};

export type ListCollection = {
  lists: ListSummary[];
};
