import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";
import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";

import { connectDB } from "./lib/db.js";
import { connectRedis } from "./lib/redis.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const __dirname = path.resolve();

// Request body size limit to prevent DoS attacks
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);

// Serve static files and handle SPA routing in production
// In production, serve the built frontend from the dist folder
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

app.get("/api/hello", (req, res) => {
  console.log("hello");
  res.send("hello");
});
app.listen(PORT, async () => {
  console.log("Server is running on http://localhost:" + PORT);
  await connectDB();
  await connectRedis();
});

// Graceful shutdown handlers for production deployments
// SIGTERM: Sent by process managers (PM2, Kubernetes, Docker) during deployments
// SIGINT: Sent when manually stopping the process (Ctrl+C)
// Ensures clean disconnection of external services before process termination
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received: closing HTTP server");
  const { disconnectRedis } = await import("./lib/redis.js");
  await disconnectRedis();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT signal received: closing HTTP server");
  const { disconnectRedis } = await import("./lib/redis.js");
  await disconnectRedis();
  process.exit(0);
});
