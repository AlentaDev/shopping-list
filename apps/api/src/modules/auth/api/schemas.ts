import { z } from "zod";
import {
  emailSchema,
  nameSchema,
  postalCodeSchema,
} from "../../../core/value-objects";
import { AUTH_MESSAGES } from "../../../shared/constants/authMessages";
import { PASSWORD_RULES, isPasswordValid } from "../domain/password";

const passwordSchema = z
  .string()
  .min(1, AUTH_MESSAGES.passwordRequired)
  .min(PASSWORD_RULES.min, AUTH_MESSAGES.passwordLength)
  .max(PASSWORD_RULES.max, AUTH_MESSAGES.passwordLength)
  .refine(isPasswordValid, {
    message: AUTH_MESSAGES.passwordComplexity,
  });

export const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  postalCode: postalCodeSchema.optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
