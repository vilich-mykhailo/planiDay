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

clientRouter.get(
  "/favourites",
  requireAuth,
  requireClient,
  async (req, res) => {
    try {
      const clientId = req.auth.sub;

      const items = await prisma.favouriteStudio.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        include: {
          studio: {
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
              premium: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

      const studioIds = items.map((item) => item.studio?.id).filter(Boolean);

      const mins = studioIds.length
        ? await prisma.service.groupBy({
            by: ["studioId"],
            where: { studioId: { in: studioIds } },
            _min: { price: true },
          })
        : [];

      const minMap = new Map(
        mins.map((row) => [row.studioId, row._min.price ?? null]),
      );

      const favourites = items
        .map((item) => item.studio)
        .filter(Boolean)
        .map((studio) => ({
          ...studio,
          slug: studio.id,
          priceFrom: minMap.get(studio.id) ?? null,
          premium: Boolean(studio.premium),
        }));

      res.json({ favourites });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Load favourites failed" });
    }
  },
);

clientRouter.post(
  "/favourites/:studioId",
  requireAuth,
  requireClient,
  async (req, res) => {
    try {
      const clientId = req.auth.sub;
      const { studioId } = req.params;

      const studio = await prisma.studio.findFirst({
        where: {
          id: studioId,
          published: true,
        },
        select: { id: true },
      });

      if (!studio) {
        return res.status(404).json({ message: "Studio not found" });
      }

      await prisma.favouriteStudio.upsert({
        where: {
          clientId_studioId: {
            clientId,
            studioId,
          },
        },
        update: {},
        create: {
          clientId,
          studioId,
        },
      });

      res.json({ ok: true, isFavourite: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Add favourite failed" });
    }
  },
);

clientRouter.delete(
  "/favourites/:studioId",
  requireAuth,
  requireClient,
  async (req, res) => {
    try {
      const clientId = req.auth.sub;
      const { studioId } = req.params;

      await prisma.favouriteStudio.deleteMany({
        where: {
          clientId,
          studioId,
        },
      });

      res.json({ ok: true, isFavourite: false });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Remove favourite failed" });
    }
  },
);

clientRouter.get("/bookings", requireAuth, requireClient, async (req, res) => {
  try {
    const clientId = req.auth.sub;

    const items = await prisma.booking.findMany({
      where: { clientId },
      orderBy: { startAt: "desc" },
      include: {
        studio: {
          select: {
            id: true,
            name: true,
            city: true,
            street: true,
            building: true,
            apartment: true,
            phone: true,
            logoUrl: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        master: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const bookings = items.map((b) => {
      const d = new Date(b.startAt);

      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

      const address = [
        b.studio?.street,
        b.studio?.building,
        b.studio?.apartment,
        b.studio?.city,
      ]
        .filter(Boolean)
        .join(", ");

      const status =
        b.status === "PENDING"
          ? "new"
          : b.status === "CONFIRMED"
            ? "confirmed"
            : b.status === "CANCELED"
              ? "canceled"
              : "new";

      return {
        id: b.id,
        canceledBy: b.canceledBy || null,
        status,
        date,
        time,
        createdAt: b.createdAt,
        studioId: b.studio?.id || null,
        studioSlug: b.studio?.id || null,
        studioName: b.studio?.name || "Студія",
        studioPhone: b.studio?.phone || "",
        studioLogo: b.studio?.logoUrl || "",
        address,
        studioAddress: address,
        serviceId: b.service?.id || null,
        serviceName: b.service?.name || "Послуга",
        price: b.service?.price ?? null,
        masterId: b.master?.id || null,
        masterName: b.master?.name || "",
      };
    });

    res.json({ bookings });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ message: e?.message || "Load client bookings failed" });
  }
});

clientRouter.patch(
  "/bookings/:bookingId/cancel",
  requireAuth,
  requireClient,
  async (req, res) => {
    try {
      const clientId = req.auth.sub;
      const { bookingId } = req.params;

      const booking = await prisma.booking.findFirst({
        where: { id: bookingId, clientId },
        select: {
          id: true,
          status: true,
          canceledBy: true,
          startAt: true,
          endAt: true,
          studioId: true,
          clientId: true,
          serviceId: true,
          masterId: true,
        },
      });

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.status === "CANCELED") {
        return res.json({ ok: true });
      }

      const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: "CANCELED",
          canceledBy: "client",
        },
        select: {
          id: true,
          status: true,
          canceledBy: true,
          startAt: true,
          endAt: true,
          studioId: true,
          clientId: true,
          serviceId: true,
          masterId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const io = req.app.get("io");

      if (io) {
const payload = {
  id: updated.id,
  bookingId: updated.id,
  status: "canceled",
  canceledBy: updated.canceledBy || null,
  startAt: updated.startAt,
  endAt: updated.endAt,
  studioId: updated.studioId,
  clientId: updated.clientId,
  serviceId: updated.serviceId,
  masterId: updated.masterId,
  createdAt: updated.createdAt,
  updatedAt: updated.updatedAt,
};

        io.to(`studio:${updated.studioId}`).emit("booking:updated", payload);
        io.to(`client:${updated.clientId}`).emit("booking:updated", payload);
      }

      res.json({ booking: updated });
    } catch (e) {
      console.error(e);
      res
        .status(500)
        .json({ message: e?.message || "Cancel client booking failed" });
    }
  },
);

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
      ({
        MON: "mon",
        TUE: "tue",
        WED: "wed",
        THU: "thu",
        FRI: "fri",
        SAT: "sat",
        SUN: "sun",
      })[d] || null;

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

    const scheduleExceptions = (studio.scheduleExceptions || []).map(
      (item) => ({
        id: item.id,
        date: new Date(item.date).toISOString().slice(0, 10),
        enabled: Boolean(item.enabled),
        start: item.startMin != null ? minToTime(item.startMin) : null,
        end: item.endMin != null ? minToTime(item.endMin) : null,
      }),
    );

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

    const serviceCategories = (studio.serviceCategories || []).map(
      (category) => ({
        ...category,
        services: (category.services || []).map(normalizeService),
      }),
    );

    res.json({
      studio: {
        ...studio,
        slug: studio.id,
        priceFrom: min?._min?.price ?? null,
        premium: Boolean(studio.premium),
        schedule,
        scheduleExceptions,
        services,
        uncategorizedServices: (uncategorizedServices || []).map(
          normalizeService,
        ),
        serviceCategories,
        masters,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Load studio failed" });
  }
});

