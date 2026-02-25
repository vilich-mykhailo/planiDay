import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireOwner } from "../middleware/auth.js";

const router = Router();

router.get("/me", requireAuth, requireOwner, async (req, res) => {
  try {
    const ownerId = req.auth.sub; // ✅

    let studio = await prisma.studio.findUnique({ where: { ownerId } });

    if (!studio) {
      studio = await prisma.studio.create({ data: { ownerId } });
    }

    res.json(studio);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/me", requireAuth, requireOwner, async (req, res) => {
  try {
    const ownerId = req.auth.sub; // ✅
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
        description: payload.description ?? "",
        city: payload.city ?? "",
        street: payload.street ?? "",
        building: payload.building ?? "",
        apartment: payload.apartment ?? "",
        coverUrl: payload.coverUrl ?? "",
        logoUrl: payload.logoUrl ?? "",
        portfolioUrls,
        published: Boolean(payload.published),
      },
      update: {
        name: payload.name ?? "",
        category: payload.category ?? "",
        phone: payload.phone ?? "",
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

router.post("/:id/services", async (req, res) => {
  const { id } = req.params;
  const { service } = req.body;

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

router.patch("/services/:serviceId", async (req, res) => {
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
});

router.delete("/services/:id", requireAuth, requireOwner, async (req, res) => {
  const id = req.params.id;

  await prisma.serviceMaster.deleteMany({ where: { serviceId: id } }); // назва моделі як у тебе
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

router.delete("/categories/:id", requireAuth, requireOwner, async (req, res) => {
  const { id } = req.params;

  // 1) всі послуги цієї категорії -> в без категорії (categoryId=null)
  await prisma.service.updateMany({
    where: { categoryId: id },
    data: { categoryId: null },
  });

  // 2) видаляємо категорію
  await prisma.serviceCategory.delete({
    where: { id },
  });

  res.json({ ok: true });
});

export default router;