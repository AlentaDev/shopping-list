import {
  DEFAULT_DRAFT_PROVIDER_ID,
  type AutosaveDraft,
  type AutosaveItem,
  type AutosaveSummary,
} from "../types";

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
  categorySnapshot?: string | null;
  subcategorySnapshot?: string | null;
  source?: "mercadona" | "bonpreuesclat";
  sourceProductId?: string;
};

type AutosavePayload = {
  id?: string;
  title?: string;
  providerId?: string;
  isEditing?: boolean;
  editingTargetListId?: string | null;
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
  categorySnapshot: item.categorySnapshot ?? null,
  subcategorySnapshot: item.subcategorySnapshot ?? null,
});

const mergeAutosaveItems = (
  current: AutosaveItem,
  incoming: AutosaveItem,
): AutosaveItem => ({
  ...current,
  ...incoming,
  id:
    incoming.id.includes(":") || !current.id
      ? incoming.id
      : current.id,
  qty: Math.max(current.qty, incoming.qty),
  checked: current.checked || incoming.checked,
  sourceProductId: current.sourceProductId,
});

const dedupeAutosaveItems = (items: AutosaveItem[]): AutosaveItem[] => {
  const deduped = new Map<string, AutosaveItem>();

  for (const item of items) {
    const key = item.sourceProductId.trim();
    const existing = deduped.get(key);

    if (!existing) {
      deduped.set(key, item);
      continue;
    }

    deduped.set(key, mergeAutosaveItems(existing, item));
  }

  return [...deduped.values()];
};

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
    providerId: data.providerId ?? DEFAULT_DRAFT_PROVIDER_ID,
    isEditing: data.isEditing === true,
    editingTargetListId:
      typeof data.editingTargetListId === "string" ? data.editingTargetListId : null,
    items: Array.isArray(data.items)
      ? dedupeAutosaveItems(data.items.map(adaptAutosaveItem))
      : [],
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
