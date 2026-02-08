import { LIST_STATUS, type ListStatus } from "@src/shared/domain/listStatus";

export type ListActionKey =
  | "edit"
  | "activate"
  | "complete"
  | "view"
  | "reuse"
  | "delete";

const ACTIONS_BY_STATUS: Record<ListStatus, ListActionKey[]> = {
  [LIST_STATUS.LOCAL_DRAFT]: ["edit", "activate", "delete"],
  [LIST_STATUS.DRAFT]: ["edit", "activate", "delete"],
  [LIST_STATUS.ACTIVE]: ["edit", "complete", "delete"],
  [LIST_STATUS.COMPLETED]: ["view", "reuse", "delete"],
};

export const getListActions = (status: ListStatus): ListActionKey[] =>
  ACTIONS_BY_STATUS[status];
