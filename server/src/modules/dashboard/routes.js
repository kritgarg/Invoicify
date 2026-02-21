import { Router } from "express";
import * as controller from "./controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/rbac.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/summary", requirePermission("report:view"), controller.getSummary);
router.get("/revenue", requirePermission("report:view"), controller.getRevenue);

export default router;
