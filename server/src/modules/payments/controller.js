import * as paymentService from "./service.js";
import * as invoiceService from "../invoices/service.js";
import { createPaymentSchema } from "./validation.js";

export const createPayment = async (req, res) => {
  try {
    const assignedToId = undefined;
    const invoice = await invoiceService.getInvoiceById(req.user.organizationId, req.params.id, assignedToId);
    if (!invoice) return res.status(404).json({ error: "Invoice not found or unauthorized" });

    const data = createPaymentSchema.parse(req.body);
    const payment = await paymentService.createPayment(req.user.organizationId, req.params.id, data);
    res.status(201).json(payment);
  } catch (error) {
    if (error.name === "ZodError") return res.status(400).json({ error: error.errors });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getInvoicePayments = async (req, res) => {
  try {
    const assignedToId = undefined;
    const invoice = await invoiceService.getInvoiceById(req.user.organizationId, req.params.id, assignedToId);
    if (!invoice) return res.status(404).json({ error: "Invoice not found or unauthorized" });

    const payments = await paymentService.getPaymentsByInvoice(req.user.organizationId, req.params.id);
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deletePayment = async (req, res) => {
  try {
    // Requires assignedToId passed into payment service if we want to restrict delete. 
    // Delete payment only takes payment ID, so we pass assignedToId to service to verify.
    const assignedToId = undefined;
    await paymentService.deletePayment(req.user.organizationId, req.params.id, assignedToId);
    res.status(200).json({ message: "Payment deleted" });
  } catch (error) {
    if (error.message === "Payment not found") return res.status(404).json({ error: error.message });
    res.status(500).json({ error: "Internal Server Error" });
  }
};
