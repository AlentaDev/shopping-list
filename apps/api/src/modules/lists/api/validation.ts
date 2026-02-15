import { z } from "zod";
import { LIST_STATUSES } from "../domain/list.js";

export const createListSchema = z.object({
  title: z.string().trim().min(3).max(35),
});

export const addCatalogItemSchema = z.object({
  source: z.literal("mercadona"),
  productId: z.string().min(1),
  qty: z.number().int().min(1).max(99).optional(),
});

export const patchItemSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  qty: z.number().int().min(1).max(99).optional(),
  checked: z.boolean().optional(),
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

export const activateListSchema = z.object({
  status: z.literal("ACTIVE"),
});

export const completeListSchema = z.object({
  checkedItemIds: z.array(z.string().min(1)),
});

const autosaveCatalogItemSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("catalog"),
  name: z.string().min(1).max(120),
  qty: z.number().int().min(1).max(99),
  checked: z.boolean(),
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
  title: z.string().trim().min(3).max(35),
  baseUpdatedAt: z.iso.datetime(),
  items: z.array(autosaveCatalogItemSchema),
});

export const editingSchema = z.object({
  isEditing: z.boolean(),
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
