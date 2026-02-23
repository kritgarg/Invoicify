import { Router } from "express";
import * as controller from "./controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.post("/", controller.createQuote);
router.get("/", controller.getQuotes);
router.get("/:id", controller.getQuoteById);
router.patch("/:id", controller.updateQuote);
router.delete("/:id", controller.deleteQuote);

export default router;
