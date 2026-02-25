import express from "express";
import multer from "multer";
import crypto from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "../lib/r2.js";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { requireAuth, requireOwner } from "../middleware/auth.js";
import {prisma} from "../lib/prisma.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

function extFromMime(mime) {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  return "bin";
}

async function putImage({ bucket, key, buffer, mimetype }) {
  await r2.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
}
router.delete("/delete", async (req, res) => {
  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({ message: "Key is required" });
    }

    await r2.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
      })
    );

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Delete failed" });
  }
});

// наприклад routes/studio.js
router.delete(
  "/studio/:studioId/categories/:categoryId",
  requireAuth,
  requireOwner,
  async (req, res) => {
    try {
      const { studioId, categoryId } = req.params;

      // якщо studioId в БД Int — розкоментуй:
      // const studioIdNum = Number(studioId);

      await prisma.service.updateMany({
        where: {
          studioId,       // або studioId: studioIdNum
          categoryId,
        },
        data: { categoryId: null },
      });

      await prisma.serviceCategory.delete({
        where: { id: categoryId },
      });

      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: e?.message || "Delete category failed" });
    }
  }
);

router.post("/studio-logo/:studioId", upload.single("file"), async (req, res) => {
  try {
    const { studioId } = req.params;
    const file = req.file;

    if (!file) return res.status(400).json({ message: "No file uploaded" });
    if (!file.mimetype.startsWith("image/")) {
      return res.status(400).json({ message: "Only images allowed" });
    }

    const id = crypto.randomUUID();
    const ext = extFromMime(file.mimetype);
    const key = `studios/${studioId}/logo_${id}.${ext}`;

    await putImage({
      bucket: process.env.R2_BUCKET,
      key,
      buffer: file.buffer,
      mimetype: file.mimetype,
    });

    const base = process.env.R2_PUBLIC_BASE_URL;
    const url = base ? `${base}/${key}` : null;

    res.json({ key, url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Upload failed" });
  }
});

router.post("/studio-cover/:studioId", upload.single("file"), async (req, res) => {
  try {
    const { studioId } = req.params;
    const file = req.file;

    if (!file) return res.status(400).json({ message: "No file uploaded" });
    if (!file.mimetype.startsWith("image/")) {
      return res.status(400).json({ message: "Only images allowed" });
    }

    const id = crypto.randomUUID();
    const ext = extFromMime(file.mimetype);
    const key = `studios/${studioId}/cover_${id}.${ext}`; // ✅ id, не uuid

    await putImage({
      bucket: process.env.R2_BUCKET,
      key,
      buffer: file.buffer,
      mimetype: file.mimetype,
    });

    const base = process.env.R2_PUBLIC_BASE_URL;
    const url = base ? `${base}/${key}` : null;

    res.json({ key, url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Upload failed" });
  }
});

router.post(
  "/studio-portfolio/:studioId",
  upload.array("files", 12),
  async (req, res) => {
    try {
      const { studioId } = req.params;
      const files = req.files; // ✅ array

      if (!Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      // перевірка типів
      for (const f of files) {
        if (!f.mimetype?.startsWith("image/")) {
          return res.status(400).json({ message: "Only images allowed" });
        }
      }

      const keys = [];

      // ✅ завантажуємо кожен файл
      for (const f of files) {
        const id = crypto.randomUUID();
        const ext = extFromMime(f.mimetype);
        const key = `studios/${studioId}/portfolio_${id}.${ext}`;
        await putImage({
          bucket: process.env.R2_BUCKET,
          key,
          buffer: f.buffer,
          mimetype: f.mimetype,
        });
        keys.push(key);
      }

      const base = process.env.R2_PUBLIC_BASE_URL;
      const urls = base ? keys.map((k) => `${base}/${k}`) : null;

      res.json({ keys, urls });
    } catch (e) {
  console.error(e);
  res.status(500).json({
    name: e?.name,
    message: e?.message,
    code: e?.Code || e?.code,
    statusCode: e?.$metadata?.httpStatusCode,
  });
}
  }
);

router.get("/_r2_put_test", async (req, res) => {
    try {
    const key = `tests/ping_${Date.now()}.txt`;

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
        Body: Buffer.from("ok"),
        ContentType: "text/plain",
      })
    );

    res.json({ ok: true, key });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      name: e?.name,
      message: e?.message,
      code: e?.Code || e?.code,
      statusCode: e?.$metadata?.httpStatusCode,
    });
  }
});

export default router;