import { z } from "zod";
import {
  emailSchema,
  nameSchema,
  postalCodeSchema,
} from "@src/core/value-objects/index.js";
import { AUTH_MESSAGES } from "@src/shared/constants/authMessages.js";
import { PASSWORD_RULES, isPasswordValid } from "../domain/password.js";

const passwordSchema = z
  .string()
  .min(1, AUTH_MESSAGES.passwordRequired)
  .min(PASSWORD_RULES.min, AUTH_MESSAGES.passwordLength)
  .max(PASSWORD_RULES.max, AUTH_MESSAGES.passwordLength)
  .refine(isPasswordValid, {
    message: AUTH_MESSAGES.passwordComplexity,
  });

const fingerprintSchema = z
  .string()
  .min(1, AUTH_MESSAGES.fingerprintRequired);

export const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  postalCode: postalCodeSchema.optional(),
  fingerprint: fingerprintSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fingerprint: fingerprintSchema,
});
