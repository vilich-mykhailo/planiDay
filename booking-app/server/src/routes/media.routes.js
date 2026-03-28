import { Router } from "express";
import multer from "multer";
import { requireAuth, requireClient } from "../middleware/auth.js";
import { putObject } from "../lib/r2.js"; // або твоя функція upload в R2

export const mediaRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

mediaRouter.post(
  "/client",
  requireAuth,
  requireClient,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Файл не передано" });
      }

      const clientId = req.auth.sub;
      const ext =
        req.file.originalname?.split(".").pop()?.toLowerCase() || "jpg";

      const key = `client/${clientId}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      await putObject({
        key,
        body: req.file.buffer,
        contentType: req.file.mimetype,
      });

      return res.json({
        key,
        url: key,
      });
    } catch (err) {
      console.error("POST /media/client error:", err);
      return res.status(500).json({ message: "Upload failed" });
    }
  },
);