import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Import modules
import authRoutes from "./modules/auth/routes.js";
import usersRoutes from "./modules/users/routes.js";
import customerRoutes from "./modules/customers/routes.js";
import itemRoutes from "./modules/items/routes.js";
import invoiceRoutes from "./modules/invoices/routes.js";
import dashboardRoutes from "./modules/dashboard/routes.js";

const app = express();

app.set("trust proxy", true);

app.use(cors({
  origin: (origin, callback) => {
    // Dynamic origin allowance based on FRONTEND_URL or allow all for development
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = [process.env.FRONTEND_URL];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth Routes
app.use("/api/auth", authRoutes);

// User Routes
app.use("/api/users", usersRoutes);

// Business Module Routes
app.use("/api/customers", customerRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/dashboard", dashboardRoutes);

// General health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

// Generic Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 8080;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`[Server] running on port ${PORT}`);
  });
}

export default app;
