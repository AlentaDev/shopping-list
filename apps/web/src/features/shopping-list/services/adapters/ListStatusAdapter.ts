import { LIST_STATUS, type ListStatus } from "@src/shared/domain/listStatus";
import type { ListStatusSummary } from "../types";

type ListStatusPayload = {
  id?: string;
  status?: ListStatus;
  updatedAt?: string;
  autosaveDraft?: {
    id?: string;
    title?: string;
    updatedAt?: string;
  };
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
    autosaveDraft:
      data.autosaveDraft &&
      typeof data.autosaveDraft.id === "string" &&
      typeof data.autosaveDraft.title === "string" &&
      typeof data.autosaveDraft.updatedAt === "string"
        ? {
            id: data.autosaveDraft.id,
            title: data.autosaveDraft.title,
            updatedAt: data.autosaveDraft.updatedAt,
          }
        : undefined,
  };
};
