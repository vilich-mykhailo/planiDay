// studio.js //
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireOwner } from "../middleware/auth.js";

const router = Router();

router.get("/me", requireAuth, requireOwner, async (req, res) => {
  try {
    const ownerId = req.auth.sub;

    let studio = await prisma.studio.findUnique({ where: { ownerId } });

    if (!studio) {
      const owner = await prisma.ownerAccount.findUnique({
        where: { id: ownerId },
        select: { name: true, phone: true, email: true },
      });

      studio = await prisma.studio.create({
        data: {
          ownerId,
          name: owner?.name ?? "",
          phone: owner?.phone ?? "",
          email: owner?.email ?? "",
        },
      });
    }

    if (studio && (!studio.name || !studio.phone || !studio.email)) {
      const owner = await prisma.ownerAccount.findUnique({
        where: { id: ownerId },
        select: { name: true, phone: true, email: true },
      });

      const patch = {};
      if (!studio.name && owner?.name) patch.name = owner.name;
      if (!studio.phone && owner?.phone) patch.phone = owner.phone;
      if (!studio.email && owner?.email) patch.email = owner.email;

      if (Object.keys(patch).length) {
        studio = await prisma.studio.update({
          where: { ownerId },
          data: patch,
        });
      }
    }

    // (опціонально) якщо студія є, але порожня — можна один раз “дозаповнити”
    if (studio && (!studio.name || !studio.phone)) {
      const owner = await prisma.ownerAccount.findUnique({
        where: { id: ownerId },
        select: { name: true, phone: true, email: true },
      });

      const patch = {};
      if (!studio.name && owner?.name) patch.name = owner.name;
      if (!studio.phone && owner?.phone) patch.phone = owner.phone;
      if (!studio.email && owner?.email) patch.email = owner.email;

      if (Object.keys(patch).length) {
        studio = await prisma.studio.update({
          where: { ownerId },
          data: patch,
        });
      }
    }

  const owner = await prisma.ownerAccount.findUnique({
  where: { id: ownerId },
  select: { createdAt: true },
});

res.json({
  ...studio,
  ownerCreatedAt: owner?.createdAt || null,
});
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/me", requireAuth, requireOwner, async (req, res) => {
  try {
    const ownerId = req.auth.sub;
    const payload = req.body || {};

    const portfolioUrls = Array.isArray(payload.portfolioUrls)
      ? payload.portfolioUrls
      : [];

    const studio = await prisma.studio.upsert({
      where: { ownerId },
      create: {
        ownerId,
        name: payload.name ?? "",
        category: payload.category ?? "",
        phone: payload.phone ?? "",
        email: payload.email ?? "",
        description: payload.description ?? "",
        city: payload.city ?? "",
        street: payload.street ?? "",
        building: payload.building ?? "",
        apartment: payload.apartment ?? "",
        coverUrl: payload.coverUrl ?? "",
        logoUrl: payload.logoUrl ?? "",
        portfolioUrls,
        published: Boolean(payload.published),
        premium: Boolean(payload.premium),
      },
      update: {
        name: payload.name ?? "",
        category: payload.category ?? "",
        phone: payload.phone ?? "",
        email: payload.email ?? "",
        description: payload.description ?? "",
        city: payload.city ?? "",
        street: payload.street ?? "",
        building: payload.building ?? "",
        apartment: payload.apartment ?? "",
        coverUrl: payload.coverUrl ?? "",
        logoUrl: payload.logoUrl ?? "",
        portfolioUrls,
        ...(typeof payload.published === "boolean"
          ? { published: payload.published }
          : {}),
        ...(typeof payload.premium === "boolean"
          ? { premium: payload.premium }
          : {}),
      },
    });

    res.json(studio);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id/services", requireAuth, requireOwner, async (req, res) => {
  const { id } = req.params;

  const categories = await prisma.serviceCategory.findMany({
    where: { studioId: id },
    include: {
      services: {
        include: {
          masters: true,
        },
      },
    },
    orderBy: { sort: "asc" },
  });

  const uncategorized = await prisma.service.findMany({
    where: {
      studioId: id,
      categoryId: null,
    },
    include: {
      masters: true,
    },
  });

  res.json({
    serviceCategories: categories.map((c) => ({
      ...c,
      services: c.services.map(formatService),
    })),
    uncategorizedServices: uncategorized.map(formatService),
  });
});

function formatService(s) {
  return {
    id: s.id,
    name: s.name,
    duration: s.duration,
    price: s.price,
    allMasters: s.allMasters,
    masters: s.masters.map((m) => m.masterId),
  };
}

router.post("/:id/categories", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  const category = await prisma.serviceCategory.create({
    data: {
      name,
      studioId: id,
    },
  });

  res.json(category);
});

router.post("/:id/services", requireAuth, requireOwner, async (req, res) => {
  const { id } = req.params;
  const service = req.body?.service; // ✅ краще так

  if (!service) {
    return res.status(400).json({ message: "service is required" });
  }

  const created = await prisma.service.create({
    data: {
      name: service.name,
      duration: service.duration,
      price: service.price,
      allMasters: service.allMasters,
      studioId: id,
      categoryId: service.categoryId || null,
      masters: service.allMasters
        ? undefined
        : {
            create: service.masters.map((masterId) => ({
              masterId,
            })),
          },
    },
  });

  res.json(created);
});

router.patch(
  "/services/:serviceId",
  requireAuth,
  requireOwner,
  async (req, res) => {
    const { serviceId } = req.params;
    const { service } = req.body;

    await prisma.service.update({
      where: { id: serviceId },
      data: {
        name: service.name,
        duration: service.duration,
        price: service.price,
        categoryId: service.categoryId || null,
        allMasters: service.allMasters,
        masters: {
          deleteMany: {},
          ...(service.allMasters
            ? {}
            : {
                create: service.masters.map((masterId) => ({
                  masterId,
                })),
              }),
        },
      },
    });

    res.json({ ok: true });
  },
);

router.delete("/services/:id", requireAuth, requireOwner, async (req, res) => {
  const id = req.params.id;

  await prisma.serviceMaster.deleteMany({ where: { serviceId: id } });
  await prisma.service.delete({ where: { id } });

  res.json({ ok: true });
});

router.patch("/categories/:id", requireAuth, requireOwner, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  const updated = await prisma.serviceCategory.update({
    where: { id },
    data: { name: String(name || "").trim() },
  });

  res.json(updated);
});

router.delete(
  "/categories/:id",
  requireAuth,
  requireOwner,
  async (req, res) => {
    const { id } = req.params;

    await prisma.service.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });

    await prisma.serviceCategory.delete({
      where: { id },
    });

    res.json({ ok: true });
  },
);

router.post(
  "/:studioId/masters",
  requireAuth,
  requireOwner,
  async (req, res) => {
    console.log("POST masters", req.params.studioId, req.body, req.auth);
    try {
      const { studioId } = req.params;
      const { name, role, bio, photoUrl, photoKey } = req.body;

      if (!name?.trim()) {
        return res.status(400).json({ message: "Name is required" });
      }

      const master = await prisma.master.create({
        data: {
          studioId,
          name: name.trim(),
          role: role || "",
          bio: bio || "",
          photoUrl: photoUrl || "",
          photoKey: photoKey || null,
        },
      });

      res.json({ master });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Create master failed" });
    }
  },
);

// PATCH /studio/masters/:id
router.patch("/masters/:id", requireAuth, requireOwner, async (req, res) => {
  try {
    const id = req.params.id;
    const { name, role, bio, photoUrl, photoKey } = req.body;

    if (!String(name || "").trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    const updated = await prisma.master.update({
      where: { id },
      data: {
        name: String(name).trim(),
        role: role ?? "",
        bio: bio ?? "",
        photoUrl: photoUrl ?? "",
        photoKey: photoKey ?? null,
      },
    });

    res.json({ master: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e?.message || "Update master failed" });
  }
});

// GET /studio/:studioId/masters
router.get(
  "/:studioId/masters",
  requireAuth,
  requireOwner,
  async (req, res) => {
    try {
      const { studioId } = req.params;

const masters = await prisma.master.findMany({
  where: { studioId },
  include: {
    scheduleExceptions: {
      select: {
        id: true,
        date: true,
        enabled: true,
      },
    },
  },
  orderBy: { createdAt: "asc" },
});

const mastersWithCounts = masters.map((master) => ({
  ...master,
  exceptionsCount: master.scheduleExceptions.length,
}));

     res.json({ masters: mastersWithCounts });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Load masters failed" });
    }
  },
);

// DELETE /studio/masters/:id
router.delete("/masters/:id", requireAuth, requireOwner, async (req, res) => {
  try {
    const id = req.params.id;

    await prisma.master.delete({
      where: { id },
    });

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Delete master failed" });
  }
});
export default router;
