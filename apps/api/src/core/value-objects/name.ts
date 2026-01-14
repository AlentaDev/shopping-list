import { z } from "zod";

export const NAME_MESSAGES = {
  required: "El nombre es obligatorio.",
  length: "El nombre debe tener entre 2 y 25 caracteres.",
} as const;

export const nameSchema = z
  .string()
  .trim()
  .min(1, NAME_MESSAGES.required)
  .max(25, NAME_MESSAGES.length)
  .refine((value) => value.length >= 2, {
    message: NAME_MESSAGES.length,
  });

export type Name = string & { readonly __brand: "Name" };

export function toName(value: string): Name {
  return nameSchema.parse(value) as Name;
}
