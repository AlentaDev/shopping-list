import { LIST_STATUS, type ListStatus } from "@src/shared/domain/listStatus";

export const canActivateList = (status: ListStatus): boolean =>
  status === LIST_STATUS.LOCAL_DRAFT || status === LIST_STATUS.DRAFT;
