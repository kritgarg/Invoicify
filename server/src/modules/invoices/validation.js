import { z } from "zod";

export const createInvoiceSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  issueDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  items: z.array(z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    price: z.number().min(0, "Price must be positive"),
  })).min(1, "At least one item is required"),
  taxRate: z.number().min(0).max(100).default(0),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE"]),
});

export const updateInvoiceSchema = z.object({
  customerId: z.string().min(1).optional(),
  issueDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().min(1),
    price: z.number().min(0),
  })).min(1).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE"]).optional(),
});
