export const LIST_STATUS = {
  LOCAL_DRAFT: "LOCAL_DRAFT",
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
} as const;

export type ListStatus = (typeof LIST_STATUS)[keyof typeof LIST_STATUS];
