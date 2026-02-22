import express from "express";
import * as userController from "./controller.js";
import { authenticate, requireRole } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/", userController.getUsers);
router.post("/", requireRole(["admin"]), userController.createUser);
router.patch("/organization", requireRole(["admin"]), userController.updateOrganization);
router.patch("/:id/deactivate", requireRole(["admin"]), userController.deactivateUser);
router.patch("/:id/activate", requireRole(["admin"]), userController.activateUser);

export default router;
