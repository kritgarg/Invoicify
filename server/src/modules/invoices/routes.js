import { Router } from "express";
import * as controller from "./controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/rbac.middleware.js";

const router = Router();

router.use(requireAuth);

router.post("/", requirePermission("invoice:create"), controller.createInvoice);
router.get("/", requirePermission("invoice:view"), controller.getInvoices);
router.get("/:id", requirePermission("invoice:view"), controller.getInvoiceById);
router.patch("/:id", requirePermission("invoice:update"), controller.updateInvoice);
router.patch("/:id/status", requirePermission("invoice:update"), controller.updateInvoiceStatus);
router.delete("/:id", requirePermission("invoice:delete"), controller.deleteInvoice);

export default router;
