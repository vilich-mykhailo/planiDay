import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.routes.js";
import { ownerRouter } from "./routes/owner.routes.js";
import { clientRouter } from "./routes/client.routes.js";
import studioRoutes from "./routes/studio.js";
import mediaRoutes from "./routes/media.js";

const app = express();
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

app.use(cors({
  origin(origin, cb) {
    // дозволяє запити без Origin (Postman/curl)
    if (!origin) return cb(null, true);

    if (allowedOrigins.has(origin)) return cb(null, true);

    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true, // увімкни лише якщо треба
}));

app.options("*", cors());
app.use(express.json());
app.use("/client", clientRouter);
app.get("/health", (req, res) => res.json({ ok: true }));

// сторінка студії власника //
app.use(express.json({ limit: "10mb" }));
app.use("/studio", studioRoutes);
//

app.use("/auth", authRouter);
app.use("/owner", ownerRouter);

app.use("/media", mediaRoutes);

app.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});
const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));