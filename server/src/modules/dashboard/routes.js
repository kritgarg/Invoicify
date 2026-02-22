import { Router } from "express";
import * as controller from "./controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/summary", controller.getSummary);
router.get("/revenue", controller.getRevenue);

export default router;
