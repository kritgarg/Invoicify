import { Router } from "express";
import * as controller from "./controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/rbac.middleware.js";

const router = Router();

router.use(requireAuth);

router.post("/invoices/:id/payments", requirePermission("payment:create"), controller.createPayment);
router.get("/invoices/:id/payments", requirePermission("payment:view"), controller.getInvoicePayments);
router.delete("/payments/:id", requirePermission("payment:delete"), controller.deletePayment);

export default router;
