import * as quotesService from "./service.js";
import { createQuoteSchema, updateQuoteSchema } from "./validation.js";

export const createQuote = async (req, res) => {
  try {
    if (!req.user.organizationId) {
      return res.status(403).json({ error: "User is not assigned to an organization" });
    }

    const data = createQuoteSchema.parse(req.body);
    const quote = await quotesService.createQuote(req.user.organizationId, req.user.id, data);
    res.status(201).json(quote);
  } catch (error) {
    if (error.name === "ZodError") return res.status(400).json({ error: error.errors });
    console.error("createQuote Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};

export const getQuotes = async (req, res) => {
  try {
    const result = await quotesService.getQuotes(req.user.organizationId, req.query, req.user.id, req.user.role);
    res.status(200).json(result);
  } catch (error) {
    console.error("getQuotes Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getQuoteById = async (req, res) => {
  try {
    const quote = await quotesService.getQuoteById(req.user.organizationId, req.params.id);
    if (!quote) return res.status(404).json({ error: "Quote not found" });
    res.status(200).json(quote);
  } catch (error) {
    console.error("getQuoteById Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateQuote = async (req, res) => {
  try {
    const data = updateQuoteSchema.parse(req.body);
    const updated = await quotesService.updateQuote(req.user.organizationId, req.params.id, req.user.id, req.user.role, data);
    res.status(200).json(updated);
  } catch (error) {
    if (error.name === "ZodError") return res.status(400).json({ error: error.errors });
    console.error("updateQuote Error:", error.message);
    if (error.message.includes("Forbidden")) return res.status(403).json({ error: error.message });
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};

export const deleteQuote = async (req, res) => {
  try {
    await quotesService.deleteQuote(req.user.organizationId, req.params.id, req.user.id, req.user.role);
    res.status(200).json({ message: "Quote deleted" });
  } catch (error) {
    if (error.message.includes("Forbidden")) return res.status(403).json({ error: error.message });
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};

