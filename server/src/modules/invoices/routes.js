import { Router } from "express";
import * as controller from "./controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.post("/", controller.createInvoice);
router.get("/", controller.getInvoices);
router.get("/:id", controller.getInvoiceById);
router.patch("/:id", controller.updateInvoice);
router.patch("/:id/status", controller.updateInvoiceStatus);
router.delete("/:id", controller.deleteInvoice);

export default router;
