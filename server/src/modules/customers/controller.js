import * as customerService from "./service.js";
import { createCustomerSchema, updateCustomerSchema } from "./validation.js";

export const createCustomer = async (req, res) => {
  try {
    if (!req.user.organizationId) {
      return res.status(403).json({ error: "User is not assigned to an organization" });
    }

    const data = createCustomerSchema.parse(req.body);
    if (req.user.role === "staff") {
      data.assignedToId = req.user.id;
    }
    const customer = await customerService.createCustomer(req.user.organizationId, data);
    res.status(201).json(customer);
  } catch (error) {
    import('fs').then(fs => fs.appendFileSync('error.log', `[createCustomer] ${error.message}\n${error.stack}\n`));
    if (error.name === "ZodError") return res.status(400).json({ error: error.errors });
    console.error("createCustomer Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    
    const filters = {};
    
    const result = await customerService.getCustomers(req.user.organizationId, { page, limit, search, filters });
    res.status(200).json(result);
  } catch (error) {
    console.error("getCustomers Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const filters = {};
    const customer = await customerService.getCustomerById(req.user.organizationId, req.params.id, filters);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const data = updateCustomerSchema.parse(req.body);
    
    const filters = {};
    const customer = await customerService.getCustomerById(req.user.organizationId, req.params.id, filters);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    await customerService.updateCustomer(req.user.organizationId, req.params.id, data, filters);
    res.status(200).json({ message: "Customer updated" });
  } catch (error) {
    if (error.name === "ZodError") return res.status(400).json({ error: error.errors });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const filters = {};
    const customer = await customerService.getCustomerById(req.user.organizationId, req.params.id, filters);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    await customerService.deleteCustomer(req.user.organizationId, req.params.id, filters);
    res.status(200).json({ message: "Customer deleted" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
