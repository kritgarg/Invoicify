import * as dashboardService from "./service.js";
import { revenueQuerySchema } from "./validation.js";

export const getSummary = async (req, res) => {
  try {
    const summary = await dashboardService.getSummary(req.user.organizationId);
    res.status(200).json(summary);
  } catch (error) {
    console.error("getSummary Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getRevenue = async (req, res) => {
  try {
    const reqData = req.query.range ? req.query : { range: "30d" };
    const { range } = revenueQuerySchema.parse(reqData);
    const revenue = await dashboardService.getRevenue(req.user.organizationId, range);
    res.status(200).json(revenue);
  } catch (error) {
    console.error("getRevenue Error:", error);
    if (error.name === "ZodError") return res.status(400).json({ error: error.errors });
    res.status(500).json({ error: "Internal Server Error" });
  }
};
