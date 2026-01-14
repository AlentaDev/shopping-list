import { z } from "zod";

import { USERS_MESSAGES } from "../../shared/constants/usersMessages";

export const EMAIL_REGEX =
  /^(?=.{1,254}$)(?=.{1,64}@)[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export const emailSchema = z
  .string()
  .trim()
  .min(1, USERS_MESSAGES.emailRequired)
  .toLowerCase()
  .regex(EMAIL_REGEX, USERS_MESSAGES.emailInvalid);

export type Email = string & { readonly __brand: "Email" };

export function toEmail(value: string): Email {
  return emailSchema.parse(value) as Email;
}
