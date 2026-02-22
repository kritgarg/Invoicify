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
    // Allow all origins for dynamic deployment support
    callback(null, true);
  },
  credentials: true
}));

// Debug: Intercept and log Set-Cookie headers
app.use((req, res, next) => {
  const originalSetHeader = res.setHeader;
  res.setHeader = function (name, value) {
    if (name.toLowerCase() === 'set-cookie') {
      console.log(`[Cookie Debug] Setting Cookie for ${req.url}:`, value);
    }
    return originalSetHeader.apply(this, arguments);
  };
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Better Auth Native Endpoints
app.all("/api/auth/*", toNodeHandler(auth));

// Protected Custom Application Routes
app.use("/api/users", usersRoutes);

// General health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

// Debug endpoint to check env (temporary)
app.get("/api/debug-env", (req, res) => {
  res.status(200).json({
    NODE_ENV: process.env.NODE_ENV,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    HAS_SECRET: !!process.env.BETTER_AUTH_SECRET,
    FRONTEND_URL: process.env.FRONTEND_URL,
    PORT: process.env.PORT
  });
});

// Module Routes
app.use("/api/customers", customerRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api", paymentRoutes);
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
