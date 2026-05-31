import { z } from "zod";

export const SUPPORTED_PROVIDER_SLUGS = ["mercadona", "bonpreuesclat"] as const;

export const providerIdSchema = z.enum(SUPPORTED_PROVIDER_SLUGS);

export const providerSlugSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-z0-9-]+$/i);

export const providerParamsSchema = z.object({
  provider: providerSlugSchema,
});

export const categoryDetailParamsSchema = z.object({
  provider: providerSlugSchema,
  id: z.string().trim().min(1).regex(/^[a-zA-Z0-9_-]+$/),
});
