import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth/auth.js";
import usersRoutes from "./modules/users/routes.js";

// Import custom modules
import customerRoutes from "./modules/customers/routes.js";
import itemRoutes from "./modules/items/routes.js";
import invoiceRoutes from "./modules/invoices/routes.js";
import paymentRoutes from "./modules/payments/routes.js";
import dashboardRoutes from "./modules/dashboard/routes.js";

const app = express();

app.set("trust proxy", true);

app.use(cors({
  origin: (origin, callback) => {
    // Allow all origins
    callback(null, true);
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Better Auth Native Endpoints Handled By Built-in Handlers
// This supports email&password login, session mgmt, cookies, password hashing automatically
app.all("/api/auth/*", toNodeHandler(auth));

// Protected Custom Application Routes
// Incorporates endpoints for /me, /users, and /users/:id/deactivate
app.use("/api/users", usersRoutes);

// General health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

// Module Routes
app.use("/api/customers", customerRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api", paymentRoutes); // Mounted at /api because payment routes include /invoices/:id/payments
app.use("/api/dashboard", dashboardRoutes);

// Generic Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Express Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 8080;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`[Server] running on port ${PORT}`);
  });
}

export default app;
