import { Router } from "express";
import * as controller from "./controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.post("/invoices/:id/payments", controller.createPayment);
router.get("/invoices/:id/payments", controller.getInvoicePayments);
router.delete("/payments/:id", controller.deletePayment);

export default router;
