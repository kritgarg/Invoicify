import { Router } from "express";
import * as controller from "./controller.js";
import { authenticate, requireRole } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.post("/", controller.createCustomer);
router.get("/", controller.getCustomers);
router.get("/:id", controller.getCustomerById);
router.patch("/:id", controller.updateCustomer);
router.delete("/:id", controller.deleteCustomer);

export default router;
