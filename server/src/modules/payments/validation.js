import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().min(0.01, "Amount must be positive"),
  method: z.string().optional().nullable(),
});
