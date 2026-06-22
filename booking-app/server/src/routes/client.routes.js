// client.routes.js //
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireClient } from "../middleware/auth.js";

export const clientRouter = Router();

function pad2(n) {
  return String(n).padStart(2, "0");
}

function timeToMinutes(t) {
  const [hh, mm] = String(t || "00:00")
    .split(":")
    .map(Number);

  return (hh || 0) * 60 + (mm || 0);
}

function minutesToTime(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

function weekdayEnumToKey(v) {
  const s = String(v || "").toUpperCase();

  return (
    {
      MON: "mon",
      TUE: "tue",
      WED: "wed",
      THU: "thu",
      FRI: "fri",
      SAT: "sat",
      SUN: "sun",
    }[s] || null
  );
}

function formatLocalDate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function combineLocalDateAndTime(dateStr, timeStr) {
  const [y, m, d] = String(dateStr).split("-").map(Number);
  const [hh, mm] = String(timeStr || "00:00").split(":").map(Number);

  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
}

function formatNotificationDateTime(value) {
  const d = new Date(value);

  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function resolveClientDisplayName(client) {
  if (!client) return "Клієнт";

  const fullName = [client.firstName, client.lastName].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;
  if (client.name) return client.name;

  return "Клієнт";
}

function studioScheduleToMap(scheduleDays = []) {
  const out = {};

  for (const d of scheduleDays) {
    const key = weekdayEnumToKey(d.weekday || d.day);
    if (!key) continue;

out[key] = {
  enabled: Boolean(d.enabled),
  start: minutesToTime(Number(d.startMin || 0)),
  end: minutesToTime(Number(d.endMin || 0)),
  breakStart:
    d.breakStartMin == null ? "" : minutesToTime(Number(d.breakStartMin)),
  breakEnd:
    d.breakEndMin == null ? "" : minutesToTime(Number(d.breakEndMin)),
};
  }

  return out;
}

function exceptionsToList(exceptions = []) {
  return exceptions.map((item) => ({
    ...item,
    date: String(item?.date || "").slice(0, 10),
    start:
      item?.startMin == null
        ? null
        : minutesToTime(Number(item.startMin || 0)),
    end:
      item?.endMin == null
        ? null
        : minutesToTime(Number(item.endMin || 0)),
    breakStart:
      item?.breakStartMin == null
        ? ""
        : minutesToTime(Number(item.breakStartMin)),
    breakEnd:
      item?.breakEndMin == null
        ? ""
        : minutesToTime(Number(item.breakEndMin)),
  }));
}

function getDayKeyFromDateObj(date) {
  const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[date.getDay()];
}

function normalizeScheduleEntry(entry) {
  if (!entry || typeof entry !== "object") return null;

  if (entry.enabled === false) return null;

  const start =
    entry.start ??
    entry.startTime ??
    entry.from ??
    entry.openTime ??
    entry.startMin;

  const end =
    entry.end ??
    entry.endTime ??
    entry.to ??
    entry.closeTime ??
    entry.endMin;

  const normalizedStart =
    typeof start === "string" && start.includes(":")
      ? start
      : Number.isFinite(Number(start))
        ? minutesToTime(Number(start))
        : "";

  const normalizedEnd =
    typeof end === "string" && end.includes(":")
      ? end
      : Number.isFinite(Number(end))
        ? minutesToTime(Number(end))
        : "";

  if (!normalizedStart || !normalizedEnd) return null;

  return {
    ...entry,
    enabled: true,
    start: normalizedStart,
    end: normalizedEnd,
    breakStart: getBreakStart(entry),
    breakEnd: getBreakEnd(entry),
  };
}

function getScheduleForDate(date, schedule, exceptions = []) {
  if (!date) return null;

  const iso = formatDateLocal(date);

  const exactException = Array.isArray(exceptions)
    ? exceptions.find((item) => String(item?.date || "").slice(0, 10) === iso)
    : null;

  if (exactException) {
    return normalizeScheduleEntry(exactException);
  }

  const dayKey = getDayKeyFromDateObj(date);
  const fallback =
    schedule && typeof schedule === "object" ? schedule?.[dayKey] : null;

  return normalizeScheduleEntry(fallback);
}

function intersectSchedules(a, b) {
  if (!a?.enabled || !b?.enabled) return null;

  const start = Math.max(timeToMinutes(a.start), timeToMinutes(b.start));
  const end = Math.min(timeToMinutes(a.end), timeToMinutes(b.end));

  if (end <= start) return null;

  return {
    enabled: true,
    start: minutesToTime(start),
    end: minutesToTime(end),
  };
}

function getMasterSchedule(master) {
  return studioScheduleToMap(master?.scheduleDays || []);
}

function getMasterExceptions(master) {
  return exceptionsToList(master?.scheduleExceptions || []);
}

function resolveMasterDayForDate(date, master) {
  if (!date || !master) return null;

  const masterSchedule = getMasterSchedule(master);
  const masterExceptions = getMasterExceptions(master);
  const iso = formatLocalDate(date);

  const exactException = masterExceptions.find(
    (item) => String(item?.date || "").slice(0, 10) === iso,
  );

  if (exactException) {
    if (!exactException.enabled) return null;

    return {
      enabled: true,
      start: exactException.start,
      end: exactException.end,
    };
  }

  if (masterSchedule && Object.keys(masterSchedule).length > 0) {
    return getScheduleForDate(date, masterSchedule, []);
  }

  return "__USE_STUDIO_SCHEDULE__";
}

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

scheduleDays: {
  select: {
    day: true,
    enabled: true,
    startMin: true,
    endMin: true,
    breakStartMin: true,
    breakEndMin: true,
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
    breakStartMin: true,
    breakEndMin: true,
  },
},
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
        schedule: studioScheduleToMap(s.scheduleDays || []),
        scheduleExceptions: exceptionsToList(s.scheduleExceptions || []),
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

scheduleDays: {
  select: {
    day: true,
    enabled: true,
    startMin: true,
    endMin: true,
    breakStartMin: true,
    breakEndMin: true,
  },
},

scheduleExceptions: {
  select: {
    id: true,
    date: true,
    enabled: true,
    startMin: true,
    endMin: true,
    breakStartMin: true,
    breakEndMin: true,
  },
},
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
            duration: true,
          },
        },
        master: {
          select: {
            id: true,
            name: true,
            photoUrl: true,
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
        duration: b.service?.duration ?? null,

        masterId: b.master?.id || null,
        masterName: b.master?.name || "",
        masterPhotoUrl: b.master?.photoUrl || "",
        master: b.master
          ? {
              id: b.master.id,
              name: b.master.name,
              photoUrl: b.master.photoUrl || "",
            }
          : null,
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

      const clientData = await prisma.clientAccount.findUnique({
  where: { id: updated.clientId },
  select: {
    name: true,
    firstName: true,
    lastName: true,
  },
});

const serviceData = await prisma.service.findUnique({
  where: { id: updated.serviceId },
  select: {
    name: true,
  },
});

const clientDisplayName =
  [clientData?.firstName, clientData?.lastName]
    .filter(Boolean)
    .join(" ")
    || clientData?.name
    || "Клієнт";

const bookingDate = formatNotificationDateTime(updated.startAt);

const notification = await prisma.notification.create({
  data: {
    studioId: updated.studioId,
    clientId: updated.clientId,
    bookingId: updated.id,
    type: "BOOKING_CANCELED",

    title: "Скасування запису",

    message: `Клієнт ${clientDisplayName} скасував запис на ${serviceData?.name || "Послуга"}`,

    clientName: clientDisplayName,
    serviceName: serviceData?.name || "Послуга",

    newDate: bookingDate,
  },
  select: {
    id: true,
    studioId: true,
    clientId: true,
    bookingId: true,
    type: true,
    title: true,
    message: true,
    isRead: true,
    createdAt: true,
    clientName: true,
    serviceName: true,
    newDate: true,
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
        io.to(`studio:${updated.studioId}`).emit("notification:new", notification);
         
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

clientRouter.patch(
  "/bookings/:bookingId/reschedule",
  requireAuth,
  requireClient,
  async (req, res) => {
    try {
      const clientId = req.auth.sub;
      const { bookingId } = req.params;
      const { date, time, serviceId, masterId } = req.body || {};

      if (!date || !time || !serviceId) {
        return res.status(400).json({
          message: "Потрібно передати serviceId, date і time",
        });
      }

      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          clientId,
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
            },
          },
          studio: {
            select: {
              id: true,
              slotDuration: true,
scheduleDays: {
  select: {
    day: true,
    enabled: true,
    startMin: true,
    endMin: true,
    breakStartMin: true,
    breakEndMin: true,
  },
},
scheduleExceptions: {
  select: {
    id: true,
    date: true,
    enabled: true,
    startMin: true,
    endMin: true,
    breakStartMin: true,
    breakEndMin: true,
  },
},
            },
          },
        },
      });

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.status === "CANCELED") {
        return res.status(400).json({
          message: "Скасований запис не можна перенести",
        });
      }

      if (new Date(booking.startAt).getTime() < Date.now()) {
        return res.status(400).json({
          message: "Минулий запис не можна перенести",
        });
      }

      const service = await prisma.service.findFirst({
        where: {
          id: serviceId,
          studioId: booking.studioId,
        },
        include: {
          masters: {
            select: {
              masterId: true,
              master: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });

      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      let selectedMaster = null;

      if (masterId) {
        selectedMaster = await prisma.master.findFirst({
          where: {
            id: masterId,
            studioId: booking.studioId,
          },
          include: {
scheduleDays: {
  select: {
    day: true,
    enabled: true,
    startMin: true,
    endMin: true,
    breakStartMin: true,
    breakEndMin: true,
  },
},
scheduleExceptions: {
  select: {
    id: true,
    date: true,
    enabled: true,
    startMin: true,
    endMin: true,
    breakStartMin: true,
    breakEndMin: true,
  },
},
          },
        });

        if (!selectedMaster) {
          return res.status(404).json({ message: "Master not found" });
        }

        if (!service.allMasters) {
          const allowedMasterIds = (service.masters || [])
            .map((item) => item?.masterId || item?.master?.id)
            .filter(Boolean)
            .map(String);

          if (!allowedMasterIds.includes(String(masterId))) {
            return res.status(400).json({
              message: "Цей майстер недоступний для вибраної послуги",
            });
          }
        }
      }

      const bookingDate = combineLocalDateAndTime(date, time);

      if (Number.isNaN(bookingDate.getTime())) {
        return res.status(400).json({ message: "Некоректна дата або час" });
      }

      const now = new Date();
      if (bookingDate.getTime() <= now.getTime()) {
        return res.status(400).json({
          message: "Не можна перенести запис у минулий час",
        });
      }

      const duration =
        Number(service.duration) > 0
          ? Number(service.duration)
          : Number(booking.studio?.slotDuration) > 0
            ? Number(booking.studio.slotDuration)
            : 60;

      const endAt = new Date(bookingDate.getTime() + duration * 60 * 1000);

      const studioSchedule = studioScheduleToMap(
        booking.studio?.scheduleDays || [],
      );
      const studioExceptions = exceptionsToList(
        booking.studio?.scheduleExceptions || [],
      );

      const studioDay = getScheduleForDate(
        bookingDate,
        studioSchedule,
        studioExceptions,
      );

      if (!studioDay?.enabled) {
        return res.status(400).json({
          message: "Студія не працює у вибраний час",
        });
      }

      const startMin = timeToMinutes(time);
      const endMin = startMin + duration;

      if (
        startMin < timeToMinutes(studioDay.start) ||
        endMin > timeToMinutes(studioDay.end)
      ) {
        return res.status(400).json({
          message: "Час виходить за межі графіка студії",
        });
      }

      if (selectedMaster) {
        const resolvedMasterDay = resolveMasterDayForDate(
          bookingDate,
          selectedMaster,
        );

        if (!resolvedMasterDay) {
          return res.status(400).json({
            message: "Майстер недоступний у вибраний день",
          });
        }

        const finalMasterDay =
          resolvedMasterDay === "__USE_STUDIO_SCHEDULE__"
            ? studioDay
            : intersectSchedules(studioDay, resolvedMasterDay);

        if (!finalMasterDay?.enabled) {
          return res.status(400).json({
            message: "Майстер недоступний у вибраний час",
          });
        }

        if (
          startMin < timeToMinutes(finalMasterDay.start) ||
          endMin > timeToMinutes(finalMasterDay.end)
        ) {
          return res.status(400).json({
            message: "Час виходить за межі графіка майстра",
          });
        }
      }

      const overlapWhere = {
        id: { not: bookingId },
        studioId: booking.studioId,
        status: { not: "CANCELED" },
        startAt: { lt: endAt },
        endAt: { gt: bookingDate },
        ...(selectedMaster ? { masterId: selectedMaster.id } : {}),
      };

      const overlapped = await prisma.booking.findFirst({
        where: overlapWhere,
        select: {
          id: true,
          masterId: true,
        },
      });

      if (overlapped) {
        return res.status(409).json({
          message: selectedMaster
            ? "Цей час уже зайнятий у майстра"
            : "Цей час уже недоступний",
        });
      }
      const oldStartAt = new Date(booking.startAt);
      const newStartAt = new Date(bookingDate);

      const clientDisplayName = resolveClientDisplayName(booking.client);
      const oldServiceName = booking.service?.name || "Послуга";

      const notificationMessage =
        `Клієнт ${clientDisplayName} переніс  послугу ${oldServiceName} ` +
        `з ${formatNotificationDateTime(oldStartAt)} ` +
        `на ${formatNotificationDateTime(newStartAt)}`;

      const notificationTitle = "Перенесення запису";
      const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          serviceId: service.id,
          masterId: selectedMaster?.id || null,
          startAt: bookingDate,
          endAt,
          status: booking.status === "CONFIRMED" ? "PENDING" : booking.status,
          canceledBy: null,
        },
        include: {
          studio: {
            select: {
              id: true,
              name: true,
              phone: true,
              city: true,
              street: true,
              building: true,
              apartment: true,
              logoUrl: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              price: true,
              duration: true,
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
const notification = await prisma.notification.create({
  data: {
    studioId: updated.studioId,
    clientId: updated.clientId,
    bookingId: updated.id,
    type: "BOOKING_RESCHEDULED",
    title: notificationTitle,
    message: notificationMessage,
    clientName: clientDisplayName,
    serviceName: oldServiceName,
    oldDate: formatNotificationDateTime(oldStartAt),
    newDate: formatNotificationDateTime(newStartAt),
  },
  select: {
    id: true,
    studioId: true,
    clientId: true,
    bookingId: true,
    type: true,
    title: true,
    message: true,
    isRead: true,
    createdAt: true,
    clientName: true,
    serviceName: true,
    oldDate: true,
    newDate: true,
  },
});

      const io = req.app.get("io");

      if (io) {
        const payload = {
          id: updated.id,
          bookingId: updated.id,
          status:
            updated.status === "PENDING"
              ? "new"
              : updated.status === "CONFIRMED"
                ? "confirmed"
                : updated.status === "CANCELED"
                  ? "canceled"
                  : "new",
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
                io.to(`studio:${updated.studioId}`).emit("notification:new", notification);
      }

      res.json({
        ok: true,
        booking: updated,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        message: e?.message || "Reschedule client booking failed",
      });
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
  select: {
    day: true,
    enabled: true,
    startMin: true,
    endMin: true,
    breakStartMin: true,
    breakEndMin: true,
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
    breakStartMin: true,
    breakEndMin: true,
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
    breakStartMin: true,
    breakEndMin: true,
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
    breakStartMin: true,
    breakEndMin: true,
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
  breakStart:
    row.breakStartMin == null ? "" : minToTime(row.breakStartMin),
  breakEnd:
    row.breakEndMin == null ? "" : minToTime(row.breakEndMin),
};
    }

const scheduleExceptions = (studio.scheduleExceptions || []).map(
  (item) => ({
    id: item.id,
    date: new Date(item.date).toISOString().slice(0, 10),
    enabled: Boolean(item.enabled),
    start: item.startMin != null ? minToTime(item.startMin) : null,
    end: item.endMin != null ? minToTime(item.endMin) : null,
    breakStart:
      item.breakStartMin == null ? "" : minToTime(item.breakStartMin),
    breakEnd:
      item.breakEndMin == null ? "" : minToTime(item.breakEndMin),
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
  breakStart:
    row.breakStartMin == null ? "" : minToTime(row.breakStartMin),
  breakEnd:
    row.breakEndMin == null ? "" : minToTime(row.breakEndMin),
};
      }

const masterScheduleExceptions = (master.scheduleExceptions || []).map(
  (item) => ({
    id: item.id,
    date: new Date(item.date).toISOString().slice(0, 10),
    enabled: Boolean(item.enabled),
    start: item.startMin != null ? minToTime(item.startMin) : null,
    end: item.endMin != null ? minToTime(item.endMin) : null,
    breakStart:
      item.breakStartMin == null ? "" : minToTime(item.breakStartMin),
    breakEnd:
      item.breakEndMin == null ? "" : minToTime(item.breakEndMin),
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

