import type {
  AutosaveDraft,
  AutosaveItem,
  AutosaveSummary,
} from "../types";

type AutosaveItemPayload = {
  id?: string;
  kind?: "manual" | "catalog";
  name?: string;
  qty?: number;
  checked?: boolean;
  note?: string | null;
  updatedAt?: string;
  thumbnail?: string | null;
  price?: number | null;
  unitSize?: number | null;
  unitFormat?: string | null;
  unitPrice?: number | null;
  isApproxSize?: boolean;
  source?: "mercadona";
  sourceProductId?: string;
};

type AutosavePayload = {
  id?: string;
  title?: string;
  items?: AutosaveItemPayload[];
  updatedAt?: string;
};

type AutosaveSummaryPayload = {
  id?: string;
  title?: string;
  updatedAt?: string;
};

const adaptAutosaveItem = (item: AutosaveItemPayload): AutosaveItem => ({
  id: item.id ?? "",
  kind: item.kind ?? "manual",
  name: item.name ?? "",
  qty: item.qty ?? 0,
  checked: item.checked ?? false,
  note: item.note ?? null,
  updatedAt: item.updatedAt ?? "",
  thumbnail: item.thumbnail ?? null,
  price: item.price ?? null,
  unitSize: item.unitSize ?? null,
  unitFormat: item.unitFormat ?? null,
  unitPrice: item.unitPrice ?? null,
  isApproxSize: item.isApproxSize ?? false,
  source: item.source,
  sourceProductId: item.sourceProductId,
});

export const adaptAutosaveResponse = (payload: unknown): AutosaveDraft | null => {
  if (payload === null) {
    return null;
  }

  const data = payload as AutosavePayload;

  return {
    id: data.id ?? "",
    title: data.title ?? "",
    items: Array.isArray(data.items)
      ? data.items.map(adaptAutosaveItem)
      : [],
    updatedAt: data.updatedAt ?? "",
  };
};

export const adaptAutosaveSummaryResponse = (
  payload: unknown
): AutosaveSummary => {
  const data = payload as AutosaveSummaryPayload;

  return {
    id: data.id ?? "",
    title: data.title ?? "",
    updatedAt: data.updatedAt ?? "",
  };
};
