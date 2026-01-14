import { z } from "zod";

import { USERS_MESSAGES } from "../../shared/constants/usersMessages";

export const postalCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{5}$/, USERS_MESSAGES.postalCodeInvalid)
  .or(z.literal(""));

export type PostalCode = string & { readonly __brand: "PostalCode" };

export function toPostalCode(value: string): PostalCode {
  return postalCodeSchema.parse(value) as PostalCode;
}
