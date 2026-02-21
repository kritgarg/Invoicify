import { z } from "zod";

export const revenueQuerySchema = z.object({
  range: z.enum(["7d", "30d", "90d", "all"]).default("30d"),
});
