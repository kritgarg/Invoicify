import express from "express";
import { createUser, deactivateUser, activateUser, getCurrentUser, getUsers, updateOrganization } from "./controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/rbac.middleware.js";

const router = express.Router();

// Apply global requireAuth middleware for all routes in this file
router.use(requireAuth);

// GET /users - Admin only
router.get("/", requirePermission("user:view"), getUsers);

// GET /me
router.get("/me", getCurrentUser);

// PATCH /organization - Admin only
router.patch("/organization", updateOrganization);

// POST /users - Admin only
router.post(
  "/",
  requirePermission("user:create"),
  createUser
);

// PATCH /users/:id/deactivate - Admin only
router.patch(
  "/:id/deactivate",
  requirePermission("user:deactivate"),
  deactivateUser
);

// PATCH /users/:id/activate - Admin only
router.patch(
  "/:id/activate",
  requirePermission("user:activate"),
  activateUser
);

export default router;
