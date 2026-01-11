import { z } from "zod";

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 20;

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH)
  .max(PASSWORD_MAX_LENGTH)
  .regex(/[a-z]/, "password_missing_lowercase")
  .regex(/[A-Z]/, "password_missing_uppercase")
  .regex(/\d/, "password_missing_number")
  .regex(/[^A-Za-z0-9]/, "password_missing_special");

export const registerSchema = z.object({
  name: z.string().min(3).max(20),
  email: z.string().email(),
  password: passwordSchema,
  postalCode: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
});
