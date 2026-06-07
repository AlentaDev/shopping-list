import type { ListStatus } from "@src/shared/domain/listStatus";

export type ListSummary = {
  id: string;
  title: string;
  itemCount: number;
  activatedAt: string | null;
  isEditing: boolean;
  updatedAt: string;
  status: ListStatus;
  providerId?: string;
  provider?: {
    slug: string;
    displayName: string;
  };
};

export type ListItem = {
  id: string;
  kind: "catalog";
  name: string;
  qty: number;
  checked: boolean;
  updatedAt: string;
  thumbnail?: string | null;
  price?: number | null;
  unitSize?: number | null;
  unitFormat?: string | null;
  unitPrice?: number | null;
  isApproxSize?: boolean;
  source?: "mercadona" | "bonpreuesclat";
  sourceProductId?: string;
  categorySnapshot?: string | null;
  subcategorySnapshot?: string | null;
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
  providerId?: string;
  provider?: {
    slug: string;
    displayName: string;
  };
};

export type ListStatusSummary = {
  id: string;
  status: ListStatus;
  updatedAt: string;
};

export type ListCollection = {
  lists: ListSummary[];
};
