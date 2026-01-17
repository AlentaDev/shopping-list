import { z } from "zod";

import { USERS_MESSAGES } from "@src/shared/constants/usersMessages.js";

export const nameSchema = z
  .string()
  .trim()
  .min(1, USERS_MESSAGES.nameRequired)
  .max(25, USERS_MESSAGES.nameLength)
  .refine((value) => value.length >= 2, {
    message: USERS_MESSAGES.nameLength,
  });

export type Name = string & { readonly __brand: "Name" };

export function toName(value: string): Name {
  return nameSchema.parse(value) as Name;
}
