import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.routes.js";
import { ownerRouter } from "./routes/owner.routes.js";
import { clientRouter } from "./routes/client.routes.js";

const app = express();

app.use(cors({ origin: "http://127.0.0.1:5173", credentials: true }));
app.use(express.json());
app.use("/client", clientRouter);
app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/auth", authRouter);
app.use("/owner", ownerRouter);
app.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});
const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));