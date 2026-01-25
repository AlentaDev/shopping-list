import { LIST_STATUS, type ListStatus } from "../listStatus";
import type { ListStatusSummary } from "../types";

type ListStatusPayload = {
  id?: string;
  status?: ListStatus;
  updatedAt?: string;
};

const resolveStatus = (status?: ListStatus): ListStatus => {
  if (!status) {
    return LIST_STATUS.DRAFT;
  }

  return Object.values(LIST_STATUS).includes(status)
    ? status
    : LIST_STATUS.DRAFT;
};

export const adaptListStatusResponse = (
  payload: unknown,
): ListStatusSummary => {
  const data = payload as ListStatusPayload;

  return {
    id: data.id ?? "",
    status: resolveStatus(data.status),
    updatedAt: data.updatedAt ?? "",
  };
};
