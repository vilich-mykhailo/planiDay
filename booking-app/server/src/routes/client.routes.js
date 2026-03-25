// client.routes.js //
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireClient } from "../middleware/auth.js";

export const clientRouter = Router();

clientRouter.get("/me", requireAuth, requireClient, async (req, res) => {
  const me = await prisma.clientAccount.findUnique({
    where: { id: req.auth.sub },
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      firstName: true,
      lastName: true,
      birthDate: true,
      gender: true,
      photoUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!me) return res.status(404).json({ message: "Client not found" });
  res.json(me);
});

// ✅ PUBLIC: list published studios for клиентский каталог
clientRouter.get("/", async (req, res) => {
  try {
    const studios = await prisma.studio.findMany({
      where: { published: true },
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        city: true,
        street: true,
        building: true,
        coverUrl: true,
        logoUrl: true,
        premium: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    const ids = studios.map((s) => s.id);

    const mins = ids.length
      ? await prisma.service.groupBy({
          by: ["studioId"],
          where: { studioId: { in: ids } },
          _min: { price: true },
        })
      : [];

    const minMap = new Map(mins.map((x) => [x.studioId, x._min.price ?? null]));

    res.json({
      studios: studios.map((s) => ({
        ...s,
        slug: s.id,
        priceFrom: minMap.get(s.id) ?? null,
        premium: Boolean(s.premium),
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Load studios failed" });
  }
});

// ✅ PUBLIC: studio details for public page
clientRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

const studio = await prisma.studio.findFirst({
  where: { id, published: true },
  select: {
    id: true,
    name: true,
    category: true,
    description: true,
    city: true,
    street: true,
    building: true,
    apartment: true,
    phone: true,
    coverUrl: true,
    logoUrl: true,
    portfolioUrls: true,
    slotDuration: true,
    premium: true,

    scheduleDays: {
      select: { day: true, enabled: true, startMin: true, endMin: true },
      orderBy: { day: "asc" },
    },

    scheduleExceptions: {
      select: {
        id: true,
        date: true,
        enabled: true,
        startMin: true,
        endMin: true,
      },
      orderBy: { date: "asc" },
    },

    masters: {
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        role: true,
        bio: true,
        photoUrl: true,
        createdAt: true,

        scheduleDays: {
          select: {
            day: true,
            enabled: true,
            startMin: true,
            endMin: true,
          },
          orderBy: { day: "asc" },
        },

        scheduleExceptions: {
          select: {
            id: true,
            date: true,
            enabled: true,
            startMin: true,
            endMin: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { date: "asc" },
        },
      },
    },

    serviceCategories: {
      select: {
        id: true,
        name: true,
services: {
  select: {
    id: true,
    name: true,
    price: true,
    duration: true,
    allMasters: true,
    masters: {
      select: {
        master: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    },
  },
  orderBy: { createdAt: "asc" },
},
      },
      orderBy: { createdAt: "asc" },
    },
  },
});

    if (!studio) return res.status(404).json({ message: "Studio not found" });

    // ✅ послуги без категорії
const uncategorizedServices = await prisma.service.findMany({
  where: { studioId: studio.id, categoryId: null },
  select: {
    id: true,
    name: true,
    price: true,
    duration: true,
    allMasters: true,
    masters: {
      select: {
        master: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    },
  },
  orderBy: { createdAt: "asc" },
});

    // min price
    const min = await prisma.service.aggregate({
      where: { studioId: studio.id },
      _min: { price: true },
    });

    // helpers
    const minToTime = (m) => {
      const hh = String(Math.floor(m / 60)).padStart(2, "0");
      const mm = String(m % 60).padStart(2, "0");
      return `${hh}:${mm}`;
    };

    const dayToKey = (d) =>
      (
        {
          MON: "mon",
          TUE: "tue",
          WED: "wed",
          THU: "thu",
          FRI: "fri",
          SAT: "sat",
          SUN: "sun",
        }[d] || null
      );

    // ✅ scheduleDays[] -> schedule{}
    const schedule = {};
    for (const row of studio.scheduleDays || []) {
      const key = dayToKey(row.day);
      if (!key) continue;
      schedule[key] = {
        enabled: Boolean(row.enabled),
        start: minToTime(row.startMin ?? 600),
        end: minToTime(row.endMin ?? 1080),
      };
    }

        const scheduleExceptions = (studio.scheduleExceptions || []).map((item) => ({
      id: item.id,
      date: new Date(item.date).toISOString().slice(0, 10),
      enabled: Boolean(item.enabled),
      start: item.startMin != null ? minToTime(item.startMin) : null,
      end: item.endMin != null ? minToTime(item.endMin) : null,
    }));
    
    const masters = (studio.masters || []).map((master) => {
  const masterSchedule = {};

  for (const row of master.scheduleDays || []) {
    const key = dayToKey(row.day);
    if (!key) continue;

    masterSchedule[key] = {
      enabled: Boolean(row.enabled),
      start: minToTime(row.startMin ?? 600),
      end: minToTime(row.endMin ?? 1080),
    };
  }

  const masterScheduleExceptions = (master.scheduleExceptions || []).map(
    (item) => ({
      id: item.id,
      date: new Date(item.date).toISOString().slice(0, 10),
      enabled: Boolean(item.enabled),
      start: item.startMin != null ? minToTime(item.startMin) : null,
      end: item.endMin != null ? minToTime(item.endMin) : null,
    }),
  );

  return {
    id: master.id,
    name: master.name,
    role: master.role,
    bio: master.bio,
    photoUrl: master.photoUrl,
    createdAt: master.createdAt,
    schedule: masterSchedule,
    scheduleExceptions: masterScheduleExceptions,
  };
});

const normalizeService = (service) => ({
  ...service,
  masters: Array.isArray(service?.masters)
    ? service.masters
        .map((item) => item?.master)
        .filter(Boolean)
        .map((master) => {
          const full = masters.find((m) => m.id === master.id);
          return full || master;
        })
    : [],
});

const services = [
  ...(uncategorizedServices || []).map(normalizeService),
  ...(studio.serviceCategories?.flatMap((c) =>
    (c.services || []).map(normalizeService),
  ) || []),
];

const serviceCategories = (studio.serviceCategories || []).map((category) => ({
  ...category,
  services: (category.services || []).map(normalizeService),
}));

res.json({
  studio: {
    ...studio,
    slug: studio.id,
    priceFrom: min?._min?.price ?? null,
    premium: Boolean(studio.premium),
    schedule,
    scheduleExceptions,
    services,
    uncategorizedServices: (uncategorizedServices || []).map(normalizeService),
    serviceCategories,
    masters,
  },
});
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Load studio failed" });
  }
});

clientRouter.patch("/me", requireAuth, requireClient, async (req, res) => {
  const { firstName, lastName, birthDate, gender, photoUrl } = req.body;

  const updated = await prisma.clientAccount.update({
    where: { id: req.auth.sub },
    data: {
      ...(firstName !== undefined ? { firstName: firstName || null } : {}),
      ...(lastName !== undefined ? { lastName: lastName || null } : {}),
      ...(gender !== undefined ? { gender: gender || null } : {}),
      ...(photoUrl !== undefined ? { photoUrl: photoUrl || null } : {}),
      ...(birthDate !== undefined
        ? { birthDate: birthDate ? new Date(birthDate) : null }
        : {}),
    },
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      firstName: true,
      lastName: true,
      birthDate: true,
      gender: true,
      photoUrl: true,
      updatedAt: true,
    },
  });

  res.json(updated);
});