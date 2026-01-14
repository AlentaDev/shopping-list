import { z } from "zod";

export const POSTAL_CODE_MESSAGES = {
  invalid: "El código postal debe tener 5 dígitos.",
} as const;

export const postalCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{5}$/, POSTAL_CODE_MESSAGES.invalid)
  .or(z.literal(""));

export type PostalCode = string & { readonly __brand: "PostalCode" };

export function toPostalCode(value: string): PostalCode {
  return postalCodeSchema.parse(value) as PostalCode;
}
