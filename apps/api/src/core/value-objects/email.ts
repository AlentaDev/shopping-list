import { z } from "zod";

export const EMAIL_REGEX =
  /^(?=.{1,254}$)(?=.{1,64}@)[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export const EMAIL_MESSAGES = {
  required: "El email es obligatorio.",
  invalid: "Introduce un email válido.",
} as const;

export const emailSchema = z
  .string()
  .trim()
  .min(1, EMAIL_MESSAGES.required)
  .toLowerCase()
  .regex(EMAIL_REGEX, EMAIL_MESSAGES.invalid);

export type Email = string & { readonly __brand: "Email" };

export function toEmail(value: string): Email {
  return emailSchema.parse(value) as Email;
}
