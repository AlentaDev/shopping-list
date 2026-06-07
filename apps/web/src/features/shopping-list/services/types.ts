import type { ListStatus } from "@src/shared/domain/listStatus";

export const DEFAULT_DRAFT_PROVIDER_ID = "mercadona";

export type AutosaveCatalogItemInput = {
  id: string;
  kind: "catalog";
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
  categorySnapshot?: string | null;
  subcategorySnapshot?: string | null;
};

export type AutosaveDraftInput = {
  title: string;
  providerId: string;
  items: AutosaveCatalogItemInput[];
  isEditing?: boolean;
  editingTargetListId?: string | null;
};

export type LocalDraft = AutosaveDraftInput & {
  updatedAt: string;
};

export type AutosaveItem = AutosaveCatalogItemInput & {
  updatedAt: string;
};

export type AutosaveDraft = {
  id: string;
  title: string;
  providerId: string;
  isEditing: boolean;
  editingTargetListId: string | null;
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
  autosaveDraft?: {
    id: string;
    title: string;
    updatedAt: string;
  };
};
