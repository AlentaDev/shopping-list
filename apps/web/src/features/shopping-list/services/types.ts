import type { ListStatus } from "./listStatus";

export type AutosaveManualItemInput = {
  id: string;
  kind: "manual";
  name: string;
  qty: number;
  checked: boolean;
  note?: string | null;
};

export type AutosaveCatalogItemInput = {
  id: string;
  kind: "catalog";
  name: string;
  qty: number;
  checked: boolean;
  note?: string | null;
  source: "mercadona";
  sourceProductId: string;
  thumbnail?: string | null;
  price?: number | null;
  unitSize?: number | null;
  unitFormat?: string | null;
  unitPrice?: number | null;
  isApproxSize?: boolean;
};

export type AutosaveItemInput =
  | AutosaveManualItemInput
  | AutosaveCatalogItemInput;

export type AutosaveDraftInput = {
  title: string;
  items: AutosaveItemInput[];
};

export type AutosaveItem = AutosaveItemInput & {
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
