import { z } from "zod";
import { PASSWORD_RULES, isPasswordValid } from "../domain/password";

const passwordSchema = z
  .string()
  .min(PASSWORD_RULES.min)
  .max(PASSWORD_RULES.max)
  .refine(isPasswordValid, {
    message:
      "Password must include uppercase, lowercase, number, and special characters.",
  });

export const signupSchema = z.object({
  name: z.string().min(3).max(20),
  email: z.string().email(),
  password: passwordSchema,
  postalCode: z
    .string()
    .regex(/^\d{5}$/)
    .optional()
    .or(z.literal("")),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
