import type {
  AutosaveDraft,
  AutosaveItem,
  AutosaveSummary,
} from "../types";

type AutosaveItemPayload = {
  id?: string;
  kind?: "manual";
  name?: string;
  qty?: number;
  checked?: boolean;
  note?: string | null;
  updatedAt?: string;
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
