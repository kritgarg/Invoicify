import { Router } from "express";
import * as controller from "./controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/rbac.middleware.js";

const router = Router();

router.use(requireAuth);

router.post("/", requirePermission("customer:create"), controller.createCustomer);
router.get("/", requirePermission("customer:view"), controller.getCustomers);
router.get("/:id", requirePermission("customer:view"), controller.getCustomerById);
router.patch("/:id", requirePermission("customer:update"), controller.updateCustomer);
router.delete("/:id", requirePermission("customer:delete"), controller.deleteCustomer);

export default router;
