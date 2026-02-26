// media.js //
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

      // спочатку переносимо послуги
      await prisma.service.updateMany({
        where: { studioId, categoryId },
        data: { categoryId: null },
      });

      // потім видаляємо категорію
      await prisma.serviceCategory.delete({ where: { id: categoryId } });

      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: e?.message || "Delete category failed" });
    }
  }
);

router.post(
  "/studio/:studioId/services",
  requireAuth,
  requireOwner,
  async (req, res) => {
    try {
      const { studioId } = req.params;
      const s = req.body?.service || {};

      const name = String(s.name || "").trim();
      const duration = Number(s.duration || 60);
      const price = Number(s.price || 0);
      const allMasters = Boolean(s.allMasters);
      const categoryId = s.categoryId ?? null; // null = без категорії
      const masters = Array.isArray(s.masters) ? s.masters.map(String) : [];

      if (!name) return res.status(400).json({ message: "Name is required" });
      if (!Number.isFinite(duration) || duration <= 0)
        return res.status(400).json({ message: "Duration is invalid" });
      if (!Number.isFinite(price) || price < 0)
        return res.status(400).json({ message: "Price is invalid" });
      if (!allMasters && masters.length === 0)
        return res.status(400).json({ message: "Pick masters or set allMasters=true" });

      const created = await prisma.service.create({
        data: {
          studioId,
          name,
          duration,
          price,
          allMasters,
          categoryId,
          masters: allMasters
            ? undefined
            : {
                createMany: {
                  data: masters.map((masterId) => ({ masterId })),
                  skipDuplicates: true,
                },
              },
        },
      });

      res.json({ service: created });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: e?.message || "Create service failed" });
    }
  }
);


router.patch(
  "/services/:serviceId",
  requireAuth,
  requireOwner,
  async (req, res) => {
    try {
      const { serviceId } = req.params;
      const s = req.body?.service || {};

      const name = String(s.name || "").trim();
      const duration = Number(s.duration || 60);
      const price = Number(s.price || 0);
      const allMasters = Boolean(s.allMasters);
      const categoryId = s.categoryId ?? null;
      const masters = Array.isArray(s.masters) ? s.masters.map(String) : [];

      if (!name) return res.status(400).json({ message: "Name is required" });
      if (!Number.isFinite(duration) || duration <= 0)
        return res.status(400).json({ message: "Duration is invalid" });
      if (!Number.isFinite(price) || price < 0)
        return res.status(400).json({ message: "Price is invalid" });
      if (!allMasters && masters.length === 0)
        return res.status(400).json({ message: "Pick masters or set allMasters=true" });

      // 1) оновити базові поля
      const updated = await prisma.service.update({
        where: { id: serviceId },
        data: { name, duration, price, allMasters, categoryId },
      });

      // 2) синхронізувати зв’язки master<->service
      // просто: видалити всі і створити заново (надійно)
      await prisma.serviceMaster.deleteMany({ where: { serviceId } });

      if (!allMasters && masters.length > 0) {
        await prisma.serviceMaster.createMany({
          data: masters.map((masterId) => ({ serviceId, masterId })),
          skipDuplicates: true,
        });
      }

      res.json({ service: updated });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: e?.message || "Update service failed" });
    }
  }
);

router.delete(
  "/studio/services/:serviceId",
  requireAuth,
  requireOwner,
  async (req, res) => {
    try {
      const { serviceId } = req.params;

      // каскад по ServiceMaster є, але можна явно:
      await prisma.serviceMaster.deleteMany({ where: { serviceId } });
      await prisma.service.delete({ where: { id: serviceId } });

      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: e?.message || "Delete service failed" });
    }
  }
);



// GET /studio/:studioId/services
router.get(
  "/studio/:studioId/services",
  requireAuth,
  requireOwner,
  async (req, res) => {
    try {
      const { studioId } = req.params;

      const categories = await prisma.serviceCategory.findMany({
        where: { studioId },
        orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
        include: {
          services: {
            orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
            include: {
              masters: { select: { masterId: true } }, // ServiceMaster rows
            },
          },
        },
      });

      // перетворюємо masters: [{masterId}] -> masters: [id]
      const serviceCategories = categories.map((c) => ({
        ...c,
        services: (c.services || []).map((s) => ({
          ...s,
          masters: (s.masters || []).map((x) => String(x.masterId)),
        })),
      }));

      const uncategorized = await prisma.service.findMany({
        where: { studioId, categoryId: null },
        orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
        include: { masters: { select: { masterId: true } } },
      });

      const uncategorizedServices = uncategorized.map((s) => ({
        ...s,
        masters: (s.masters || []).map((x) => String(x.masterId)),
      }));

      res.json({ serviceCategories, uncategorizedServices });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: e?.message || "Load services failed" });
    }
  }
);

router.patch(
  "/categories/:categoryId",
  requireAuth,
  requireOwner,
  async (req, res) => {
    try {
      const { categoryId } = req.params;
      const name = String(req.body?.name || "").trim();
      if (!name) return res.status(400).json({ message: "Name is required" });

      const category = await prisma.serviceCategory.update({
        where: { id: categoryId },
        data: { name },
      });

      res.json({ category });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: e?.message || "Update category failed" });
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

// ✅ POST /media/studio/:studioId/master-photo
router.post(
  "/studio/:studioId/master-photo",
  requireAuth,
  requireOwner,
  upload.single("file"),
  async (req, res) => {
    try {
      const { studioId } = req.params;
      const file = req.file;

      if (!file) return res.status(400).json({ message: "No file uploaded" });
      if (!file.mimetype.startsWith("image/")) {
        return res.status(400).json({ message: "Only images allowed" });
      }

      const id = crypto.randomUUID();
      const ext = extFromMime(file.mimetype);

      // ключ під студію + masters
      const key = `studios/${studioId}/masters/master_${id}.${ext}`;

      await putImage({
        bucket: process.env.R2_BUCKET,
        key,
        buffer: file.buffer,
        mimetype: file.mimetype,
      });

      const base = process.env.R2_PUBLIC_BASE_URL;
      if (!base) {
  return res.status(500).json({ message: "R2_PUBLIC_BASE_URL is not set" });
}
      const url = base ? `${base}/${key}` : null;

      res.json({ key, url });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: e?.message || "Upload master photo failed" });
    }
  }
);

export default router;