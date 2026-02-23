import { z } from "zod";

const quoteItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  rate: z.number().min(0, "Rate must be non-negative"),
  tax: z.number().min(0, "Tax must be non-negative"),
  total: z.number().min(0, "Total must be non-negative")
});

export const createQuoteSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  issueDate: z.string().datetime().or(z.date()),
  expiryDate: z.string().datetime().or(z.date()).optional().nullable(),
  status: z.enum(["DRAFT", "SENT", "CONVERTED", "REJECTED"]).optional(),
  subtotal: z.number().min(0),
  tax: z.number().min(0),
  total: z.number().min(0),
  items: z.array(quoteItemSchema).min(1, "At least one item is required")
});

export const updateQuoteSchema = createQuoteSchema.partial();
