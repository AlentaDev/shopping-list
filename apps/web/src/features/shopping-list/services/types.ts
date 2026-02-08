import type { ListStatus } from "@src/shared/domain/listStatus";

export type AutosaveCatalogItemInput = {
  id: string;
  name: string;
  qty: number;
  checked: boolean;
  source: "mercadona";
  sourceProductId: string;
  thumbnail?: string | null;
  price?: number | null;
  unitSize?: number | null;
  unitFormat?: string | null;
  unitPrice?: number | null;
  isApproxSize?: boolean;
};

export type AutosaveDraftInput = {
  title: string;
  items: AutosaveCatalogItemInput[];
};

export type AutosaveItem = AutosaveCatalogItemInput & {
  updatedAt: string;
};

export type AutosaveDraft = {
  id: string;
  title: string;
  items: AutosaveItem[];
  updatedAt: string;
};

export type AutosaveSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

export type ListStatusSummary = {
  id: string;
  status: ListStatus;
  updatedAt: string;
};
