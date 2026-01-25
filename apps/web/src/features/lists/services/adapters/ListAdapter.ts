import { LIST_STATUS } from "../listActions";
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
  status?: string;
};

type ListCollectionPayload = {
  lists?: ListSummaryPayload[];
};

type ListItemPayload = {
  id?: string;
  kind?: "manual" | "catalog";
  name?: string;
  qty?: number;
  checked?: boolean;
  updatedAt?: string;
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

type ListDetailPayload = {
  id?: string;
  title?: string;
  items?: ListItemPayload[];
  updatedAt?: string;
  status?: string;
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

const adaptListItem = (item: ListItemPayload): ListItem => ({
  id: item.id ?? "",
  kind: item.kind ?? "manual",
  name: item.name ?? "",
  qty: item.qty ?? 0,
  checked: item.checked ?? false,
  updatedAt: item.updatedAt ?? "",
  note: item.note,
  thumbnail: item.thumbnail ?? null,
  price: item.price ?? null,
  unitSize: item.unitSize ?? null,
  unitFormat: item.unitFormat ?? null,
  unitPrice: item.unitPrice ?? null,
  isApproxSize: item.isApproxSize ?? false,
  source: item.source,
  sourceProductId: item.sourceProductId,
});

const adaptListSummary = (list: ListSummaryPayload): ListSummary => ({
  id: list.id ?? "",
  title: list.title ?? "",
  updatedAt: list.updatedAt ?? "",
  status: resolveStatus(list.status),
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
    items,
    status: data.status ? resolveStatus(data.status) : undefined,
  };
};
