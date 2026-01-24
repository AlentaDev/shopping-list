export const LIST_STATUS = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
} as const;

export type ListStatus = (typeof LIST_STATUS)[keyof typeof LIST_STATUS];

export type ListActionKey =
  | "edit"
  | "activate"
  | "complete"
  | "view"
  | "duplicate"
  | "delete";

const ACTIONS_BY_STATUS: Record<ListStatus, ListActionKey[]> = {
  [LIST_STATUS.DRAFT]: ["edit", "activate", "delete"],
  [LIST_STATUS.ACTIVE]: ["edit", "complete", "delete"],
  [LIST_STATUS.COMPLETED]: ["view", "duplicate", "delete"],
};

export const getListActions = (status: ListStatus): ListActionKey[] =>
  ACTIONS_BY_STATUS[status];
