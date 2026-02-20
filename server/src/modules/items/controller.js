import * as itemService from "./service.js";
import { createItemSchema, updateItemSchema } from "./validation.js";

export const createItem = async (req, res) => {
  try {
    if (!req.user.organizationId) {
      return res.status(403).json({ error: "User is not assigned to an organization" });
    }

    const data = createItemSchema.parse(req.body);
    const item = await itemService.createItem(req.user.organizationId, data);
    res.status(201).json(item);
  } catch (error) {
    if (error.name === "ZodError") return res.status(400).json({ error: error.errors });
    console.error("createItem Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    
    const result = await itemService.getItems(req.user.organizationId, { page, limit, search });
    res.status(200).json(result);
  } catch (error) {
    console.error("getItems Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getItemById = async (req, res) => {
  try {
    const item = await itemService.getItemById(req.user.organizationId, req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateItem = async (req, res) => {
  try {
    const data = updateItemSchema.parse(req.body);
    
    const item = await itemService.getItemById(req.user.organizationId, req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    await itemService.updateItem(req.user.organizationId, req.params.id, data);
    res.status(200).json({ message: "Item updated" });
  } catch (error) {
    if (error.name === "ZodError") return res.status(400).json({ error: error.errors });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const item = await itemService.getItemById(req.user.organizationId, req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    await itemService.deleteItem(req.user.organizationId, req.params.id);
    res.status(200).json({ message: "Item deleted" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
