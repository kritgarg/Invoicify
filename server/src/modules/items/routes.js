import { Router } from "express";
import * as controller from "./controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/rbac.middleware.js";

const router = Router();

router.use(requireAuth);

router.post("/", requirePermission("item:create"), controller.createItem);
router.get("/", requirePermission("item:view"), controller.getItems);
router.get("/:id", requirePermission("item:view"), controller.getItemById);
router.patch("/:id", requirePermission("item:update"), controller.updateItem);
router.delete("/:id", requirePermission("item:delete"), controller.deleteItem);

export default router;
