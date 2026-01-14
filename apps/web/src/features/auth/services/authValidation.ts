import { z } from "zod";
import { UI_TEXT } from "../../../shared/constants/ui";

export const EMAIL_REGEX =
  /^(?=.{1,254}$)(?=.{1,64}@)[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const PASSWORD_COMPLEXITY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':",.<>/?\\|`~]).+$/;

export const emailSchema = z
  .string()
  .trim()
  .min(1, UI_TEXT.AUTH.VALIDATION.EMAIL_REQUIRED)
  .toLowerCase()
  .regex(EMAIL_REGEX, UI_TEXT.AUTH.VALIDATION.EMAIL_INVALID);

export const passwordSchema = z
  .string()
  .min(1, UI_TEXT.AUTH.VALIDATION.PASSWORD_REQUIRED)
  .min(12, UI_TEXT.AUTH.VALIDATION.PASSWORD_LENGTH)
  .max(20, UI_TEXT.AUTH.VALIDATION.PASSWORD_LENGTH)
  .regex(PASSWORD_COMPLEXITY_REGEX, UI_TEXT.AUTH.VALIDATION.PASSWORD_COMPLEXITY);

export const nameSchema = z
  .string()
  .trim()
  .min(1, UI_TEXT.AUTH.VALIDATION.NAME_REQUIRED)
  .max(25, UI_TEXT.AUTH.VALIDATION.NAME_LENGTH)
  .refine((value) => value.length >= 2, {
    message: UI_TEXT.AUTH.VALIDATION.NAME_LENGTH,
  });

export const postalCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{5}$/, UI_TEXT.AUTH.VALIDATION.POSTAL_CODE_INVALID)
  .or(z.literal(""));

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  postalCode: postalCodeSchema,
});
