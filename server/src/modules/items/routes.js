import { Router } from "express";
import * as controller from "./controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.post("/", controller.createItem);
router.get("/", controller.getItems);
router.get("/:id", controller.getItemById);
router.patch("/:id", controller.updateItem);
router.delete("/:id", controller.deleteItem);

export default router;
