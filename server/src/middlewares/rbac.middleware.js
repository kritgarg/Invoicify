// Define custom RBAC roles
export const ROLES = {
  ADMIN: "admin",
  STAFF: "staff"
};

// Map roles to array of allowed actions (permissions) based on project requirements
export const PERMISSIONS = {
  [ROLES.ADMIN]: [
    "user:view",
    "user:create",
    "user:update",
    "user:deactivate",
    "user:activate",
    "customer:create",
    "customer:update",
    "customer:delete",
    "customer:view",
    "item:create",
    "item:update",
    "item:delete",
    "item:view",
    "invoice:create",
    "invoice:update",
    "invoice:delete",
    "invoice:view",
    "payment:create",
    "payment:delete",
    "payment:view",
    "report:view"
  ],
  [ROLES.STAFF]: [
    "customer:create",
    "customer:update",
    "customer:view",
    "item:create",
    "item:update",
    "item:view",
    "invoice:create",
    "invoice:update",
    "invoice:view",
    "payment:create",
    "payment:view"
  ]
};

// Middleware factory to enforce RBAC permissions
export const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized: User not attached" });
      }

      const userRole = req.user.role;
      const rolePermissions = PERMISSIONS[userRole] || [];

      // Check if user role has the needed permission
      if (!rolePermissions.includes(requiredPermission)) {
        return res.status(403).json({ error: `Forbidden: Missing required permission '${requiredPermission}'` });
      }

      next(); // authorized
    } catch (error) {
      console.error("RBAC Middleware Error:", error);
      res.status(500).json({ error: "Internal Server Error during permission check" });
    }
  };
};
