import { z } from "zod";

export const categoryDetailParamsSchema = z.object({
  id: z.string().min(1),
});
