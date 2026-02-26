import "dotenv/config";
import express from "express";
import cors from "cors";

import { authRouter } from "./routes/auth.routes.js";
import { ownerRouter } from "./routes/owner.routes.js";
import { clientRouter } from "./routes/client.routes.js";

import studioRoutes from "./routes/studio.js";
import mediaRoutes from "./routes/media.js";
import scheduleRoutes from "./routes/schedule.routes.js";

const app = express();

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

// ✅ 1) CORS один раз
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // Postman/curl
      if (allowedOrigins.has(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// ✅ 2) preflight
app.options("*", cors());

// ✅ 3) body parser один раз
app.use(express.json({ limit: "10mb" }));

// ✅ 4) routes з префіксами
app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/auth", authRouter);
app.use("/owner", ownerRouter);
app.use("/client", clientRouter);

app.use("/studio", studioRoutes);
app.use("/media", mediaRoutes);

// ⚠️ дуже важливо: schedule або всередині studioRoutes, або з /studio префіксом
app.use("/studio", scheduleRoutes); // ✅ щоб було /studio/:id/schedule

app.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));