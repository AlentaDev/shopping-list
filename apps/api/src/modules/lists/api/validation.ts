import { z } from "zod";
import { LIST_STATUSES } from "../domain/list.js";

export const createListSchema = z.object({
  title: z.string().min(1).max(60),
});

export const addItemSchema = z.object({
  name: z.string().min(1).max(120),
  qty: z.number().int().min(1).max(999).optional(),
  note: z.string().max(240).optional(),
});

export const addCatalogItemSchema = z.object({
  source: z.literal("mercadona"),
  productId: z.string().min(1),
  qty: z.number().int().min(1).max(999).optional(),
  note: z.string().max(240).optional(),
});

export const patchItemSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  qty: z.number().int().min(1).max(999).optional(),
  checked: z.boolean().optional(),
  note: z.string().max(240).optional(),
});

export const updateListStatusSchema = z.object({
  status: z.enum(LIST_STATUSES),
});

export const listParamsSchema = z.object({
  id: z.string().min(1),
});

export const itemParamsSchema = z.object({
  id: z.string().min(1),
  itemId: z.string().min(1),
});
