import { LIST_STATUS } from "@src/shared/domain/listStatus";
import { getProviderDisplayName } from "@src/shared/constants/providers";
import type {
  ListCollection,
  ListDetail,
  ListItem,
  ListStatusSummary,
  ListSummary,
} from "../types";

const STATUS_VALUES: Set<string> = new Set(Object.values(LIST_STATUS));

type ListSummaryPayload = {
  id?: string;
  title?: string;
  updatedAt?: string;
  itemCount?: number;
  activatedAt?: string | null;
  isEditing?: boolean;
  status?: string;
  providerId?: string;
  provider?: {
    slug?: string;
    displayName?: string;
  };
};

type ListCollectionPayload = {
  lists?: ListSummaryPayload[];
};

type ListItemPayload = {
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
  categorySnapshot?: string | null;
  subcategorySnapshot?: string | null;
};

type ListDetailPayload = {
  id?: string;
  title?: string;
  items?: ListItemPayload[];
  updatedAt?: string;
  itemCount?: number;
  activatedAt?: string | null;
  isEditing?: boolean;
  status?: string;
  providerId?: string;
  provider?: {
    slug?: string;
    displayName?: string;
  };
};

type ListStatusSummaryPayload = {
  id?: string;
  status?: string;
  updatedAt?: string;
};

const resolveStatus = (status?: string): ListSummary["status"] => {
  if (status && STATUS_VALUES.has(status)) {
    return status as ListSummary["status"];
  }
  return LIST_STATUS.DRAFT;
};

const resolveProviderSlug = (providerId?: string, slug?: string): string | undefined => {
  if (typeof slug === "string" && slug.trim().length > 0) {
    return slug;
  }

  if (typeof providerId === "string" && providerId.startsWith("provider-")) {
    return providerId.replace(/^provider-/, "");
  }

  return typeof providerId === "string" && providerId.trim().length > 0
    ? providerId
    : undefined;
};

const adaptProvider = (
  payload: Pick<ListSummaryPayload, "providerId" | "provider">,
): ListSummary["provider"] | undefined => {
  const slug = resolveProviderSlug(payload.providerId, payload.provider?.slug);

  if (!slug) {
    return undefined;
  }

  return {
    slug,
    displayName: payload.provider?.displayName ?? getProviderDisplayName(slug),
  };
};

const adaptListItem = (item: ListItemPayload): ListItem => ({
  id: item.id ?? "",
  kind: item.kind ?? "catalog",
  name: item.name ?? "",
  qty: item.qty ?? 0,
  checked: item.checked ?? false,
  updatedAt: item.updatedAt ?? "",
  thumbnail: item.thumbnail ?? null,
  price: item.price ?? null,
  unitSize: item.unitSize ?? null,
  unitFormat: item.unitFormat ?? null,
  unitPrice: item.unitPrice ?? null,
  isApproxSize: item.isApproxSize ?? false,
  source: item.source,
  sourceProductId: item.sourceProductId,
  categorySnapshot: item.categorySnapshot ?? null,
  subcategorySnapshot: item.subcategorySnapshot ?? null,
});

const adaptListSummary = (list: ListSummaryPayload): ListSummary => ({
  id: list.id ?? "",
  title: list.title ?? "",
  updatedAt: list.updatedAt ?? "",
  itemCount: list.itemCount ?? 0,
  activatedAt: list.activatedAt ?? null,
  isEditing: list.isEditing ?? false,
  status: resolveStatus(list.status),
  providerId: list.providerId,
  provider: adaptProvider(list),
});

export const adaptListSummaryResponse = (payload: unknown): ListSummary =>
  adaptListSummary(payload as ListSummaryPayload);

export const adaptListStatusSummaryResponse = (
  payload: unknown,
): ListStatusSummary => {
  const data = payload as ListStatusSummaryPayload;

  return {
    id: data.id ?? "",
    status: resolveStatus(data.status),
    updatedAt: data.updatedAt ?? "",
  };
};

export const adaptListCollectionResponse = (
  payload: unknown,
): ListCollection => {
  const data = payload as ListCollectionPayload;
  const lists = Array.isArray(data.lists)
    ? data.lists.map(adaptListSummary)
    : [];

  return { lists };
};

export const adaptListDetailResponse = (payload: unknown): ListDetail => {
  const data = payload as ListDetailPayload;
  const items = Array.isArray(data.items) ? data.items.map(adaptListItem) : [];

  return {
    id: data.id ?? "",
    title: data.title ?? "",
    updatedAt: data.updatedAt ?? "",
    itemCount: data.itemCount ?? 0,
    activatedAt: data.activatedAt ?? null,
    isEditing: data.isEditing ?? false,
    items,
    status: data.status ? resolveStatus(data.status) : undefined,
    providerId: data.providerId,
    provider: adaptProvider(data),
  };
};
