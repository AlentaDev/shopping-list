import type { AutosaveDraft, AutosaveItem, AutosaveSummary } from "../types";

type AutosaveItemPayload = {
  id?: string;
  kind?: "catalog";
  name?: string;
  qty?: number;
  checked?: boolean;
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

const normalizeSourceProductId = ({
  id,
  sourceProductId,
}: {
  id: string;
  sourceProductId?: string;
}): string => {
  const normalizedSourceProductId = sourceProductId?.trim();

  if (!normalizedSourceProductId) {
    return id;
  }

  const prefixedId = `${id}:`;

  if (normalizedSourceProductId.startsWith(prefixedId)) {
    return normalizedSourceProductId.slice(prefixedId.length);
  }

  return normalizedSourceProductId;
};

const adaptAutosaveItem = (item: AutosaveItemPayload): AutosaveItem => ({
  id: item.id ?? "",
  kind: item.kind ?? "catalog",
  name: item.name ?? "",
  qty: item.qty ?? 0,
  checked: item.checked ?? false,
  updatedAt: item.updatedAt ?? "",
  source: item.source ?? "mercadona",
  sourceProductId: normalizeSourceProductId({
    id: item.id ?? "",
    sourceProductId: item.sourceProductId,
  }),
  thumbnail: item.thumbnail ?? null,
  price: item.price ?? null,
  unitSize: item.unitSize ?? null,
  unitFormat: item.unitFormat ?? null,
  unitPrice: item.unitPrice ?? null,
  isApproxSize: item.isApproxSize ?? false,
});

export const adaptAutosaveResponse = (
  payload: unknown,
): AutosaveDraft | null => {
  if (payload === null) {
    return null;
  }

  const data = payload as AutosavePayload;

  return {
    id: data.id ?? "",
    title: data.title ?? "",
    items: Array.isArray(data.items) ? data.items.map(adaptAutosaveItem) : [],
    updatedAt: data.updatedAt ?? "",
  };
};

export const adaptAutosaveSummaryResponse = (
  payload: unknown,
): AutosaveSummary => {
  if (payload === null || typeof payload !== "object") {
    return {
      id: "",
      title: "",
      updatedAt: "",
    };
  }

  const data = payload as AutosaveSummaryPayload;

  return {
    id: data.id ?? "",
    title: data.title ?? "",
    updatedAt: data.updatedAt ?? "",
  };
};
