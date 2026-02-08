import { LIST_STATUS, type ListStatus } from "@src/shared/domain/listStatus";

export const canActivateList = (status: ListStatus): boolean =>
  status === LIST_STATUS.LOCAL_DRAFT || status === LIST_STATUS.DRAFT;

export const canCompleteList = (status: ListStatus): boolean =>
  status === LIST_STATUS.ACTIVE;

export const canEditList = (status: ListStatus): boolean =>
  status !== LIST_STATUS.COMPLETED;

export const canDuplicateList = (status: ListStatus): boolean =>
  status === LIST_STATUS.COMPLETED;

export const canDeleteList = (status: ListStatus): boolean => Boolean(status);
