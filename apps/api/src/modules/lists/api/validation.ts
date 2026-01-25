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

export const updateListStatusSchema = z
  .object({
    status: z.enum(LIST_STATUSES),
    checkedItemIds: z.array(z.string().min(1)).optional(),
  })
  .superRefine((value, context) => {
    if (value.status === "COMPLETED" && !value.checkedItemIds) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "checkedItemIds is required when completing a list.",
        path: ["checkedItemIds"],
      });
    }
  });

export const completeListSchema = z.object({
  checkedItemIds: z.array(z.string().min(1)),
});

const autosaveManualItemSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("manual"),
  name: z.string().min(1).max(120),
  qty: z.number().int().min(1).max(999),
  checked: z.boolean(),
  note: z.string().max(240).optional(),
});

const autosaveCatalogItemSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("catalog"),
  name: z.string().min(1).max(120),
  qty: z.number().int().min(1).max(999),
  checked: z.boolean(),
  note: z.string().max(240).optional(),
  source: z.literal("mercadona"),
  sourceProductId: z.string().min(1),
  thumbnail: z.string().optional().nullable(),
  price: z.number().optional().nullable(),
  unitSize: z.number().optional().nullable(),
  unitFormat: z.string().optional().nullable(),
  unitPrice: z.number().optional().nullable(),
  isApproxSize: z.boolean().optional(),
});

export const upsertAutosaveSchema = z.object({
  title: z.string().min(1).max(60),
  items: z.array(
    z.discriminatedUnion("kind", [
      autosaveManualItemSchema,
      autosaveCatalogItemSchema,
    ]),
  ),
});

export const listParamsSchema = z.object({
  id: z.string().min(1),
});

export const listQuerySchema = z.object({
  status: z.enum(LIST_STATUSES).optional(),
});

export const itemParamsSchema = z.object({
  id: z.string().min(1),
  itemId: z.string().min(1),
});
