import { z } from "zod";
import {
  emailSchema,
  nameSchema,
  postalCodeSchema,
} from "../../../core/value-objects";
import {
  PASSWORD_MESSAGES,
  PASSWORD_RULES,
  isPasswordValid,
} from "../domain/password";

const passwordSchema = z
  .string()
  .min(1, PASSWORD_MESSAGES.required)
  .min(PASSWORD_RULES.min, PASSWORD_MESSAGES.length)
  .max(PASSWORD_RULES.max, PASSWORD_MESSAGES.length)
  .refine(isPasswordValid, {
    message: PASSWORD_MESSAGES.complexity,
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
