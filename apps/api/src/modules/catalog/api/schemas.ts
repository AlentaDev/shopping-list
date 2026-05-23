import { z } from "zod";

export const SUPPORTED_PROVIDER_SLUGS = ["mercadona"] as const;

export const providerIdSchema = z.enum(SUPPORTED_PROVIDER_SLUGS);

export const providerParamsSchema = z.object({
  provider: providerIdSchema,
});

export const categoryDetailParamsSchema = z.object({
  provider: providerIdSchema,
  id: z.string().trim().min(1).regex(/^[a-zA-Z0-9_-]+$/),
});
