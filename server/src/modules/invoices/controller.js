import * as invoiceService from "./service.js";
import { createInvoiceSchema, updateInvoiceStatusSchema, updateInvoiceSchema } from "./validation.js";

export const createInvoice = async (req, res) => {
  try {
    if (!req.user.organizationId) {
      return res.status(403).json({ error: "User is not assigned to an organization" });
    }

    const data = createInvoiceSchema.parse(req.body);
    const invoice = await invoiceService.createInvoice(req.user.organizationId, data);
    res.status(201).json(invoice);
  } catch (error) {
    if (error.name === "ZodError") return res.status(400).json({ error: error.errors });
    console.error("createInvoice Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getInvoices = async (req, res) => {
  try {
    const { status, startDate, endDate, customerId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const assignedToId = undefined;
    
    const result = await invoiceService.getInvoices(req.user.organizationId, { 
      status, startDate, endDate, customerId, assignedToId, page, limit 
    });
    res.status(200).json(result);
  } catch (error) {
    console.error("getInvoices Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const assignedToId = undefined;
    const invoice = await invoiceService.getInvoiceById(req.user.organizationId, req.params.id, assignedToId);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.status(200).json(invoice);
  } catch (error) {
    console.error("getInvoiceById Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = updateInvoiceStatusSchema.parse(req.body);
    
    const assignedToId = undefined;
    const invoice = await invoiceService.getInvoiceById(req.user.organizationId, req.params.id, assignedToId);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    await invoiceService.updateInvoiceStatusMany(req.user.organizationId, req.params.id, status);
    res.status(200).json({ message: "Invoice status updated" });
  } catch (error) {
    if (error.name === "ZodError") return res.status(400).json({ error: error.errors });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateInvoice = async (req, res) => {
  try {
    const data = updateInvoiceSchema.parse(req.body);
    const assignedToId = undefined;
    const invoice = await invoiceService.getInvoiceById(req.user.organizationId, req.params.id, assignedToId);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    const updated = await invoiceService.updateInvoice(req.user.organizationId, req.params.id, data, assignedToId);
    res.status(200).json(updated);
  } catch (error) {
    if (error.name === "ZodError") return res.status(400).json({ error: error.errors });
    console.error("updateInvoice Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    const assignedToId = undefined;
    const invoice = await invoiceService.getInvoiceById(req.user.organizationId, req.params.id, assignedToId);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    await invoiceService.deleteInvoice(req.user.organizationId, req.params.id, assignedToId);
    res.status(200).json({ message: "Invoice deleted" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
