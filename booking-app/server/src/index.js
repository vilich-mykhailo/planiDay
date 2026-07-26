// index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { verifyMailerConnection } from "./lib/mailer.js";
import { authRouter } from "./routes/auth.routes.js";
import { ownerRouter } from "./routes/owner.routes.js";
import { clientRouter } from "./routes/client.routes.js";
import studioRoutes from "./routes/studio.js";
import mediaRoutes from "./routes/media.js";
import scheduleRoutes from "./routes/schedule.routes.js";
import { masterScheduleRouter } from "./routes/masterSchedule.routes.js";
import bookingsRoutes from "./routes/bookings.js";

const app = express();

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://192.168.1.24:5173",
]);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowedOrigins.has(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(masterScheduleRouter);

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/bookings", bookingsRoutes);
app.use("/auth", authRouter);
app.use("/owner", ownerRouter);
app.use("/client", clientRouter);
app.use("/studio", studioRoutes);
app.use("/media", mediaRoutes);
app.use("/studio", scheduleRoutes);

app.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

const port = process.env.PORT || 4000;

// --- socket.io ---
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowedOrigins.has(origin)) return cb(null, true);
      return cb(new Error(`Socket CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  socket.on("auth:join", ({ userId, studioId, role }) => {
    if (userId) {
      socket.join(`user:${userId}`);
    }

    if (role === "client" && userId) {
      socket.join(`client:${userId}`);
    }

    if (studioId) {
      socket.join(`studio:${studioId}`);
    }
  });

  socket.on("join:client", ({ clientId }) => {
    if (clientId) {
      socket.join(`client:${clientId}`);
    }
  });

  socket.on("join:studio", ({ studioId }) => {
    if (studioId) {
      socket.join(`studio:${studioId}`);
    }
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`API running on http://0.0.0.0:${port}`);
});