// bookings.js
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireOwner, requireClient } from "../middleware/auth.js";
import { io } from "../index.js";

const router = Router();

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatNotificationDateTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");

  return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
}

async function createRescheduleNotification({
  studioId,
  clientName,
  serviceName,
  oldStartAt,
  newStartAt,
}) {
  const oldDate = formatNotificationDateTime(oldStartAt);
  const newDate = formatNotificationDateTime(newStartAt);

  const created = await prisma.notification.create({
    data: {
      studioId,
      title: "Перенесення запису",
      message: `Клієнт ${clientName} переніс послугу ${serviceName} з ${oldDate} на ${newDate}`,
      isRead: false,
      clientName,
      serviceName,
      oldDate,
      newDate,
    },
  });

  io.to(`studio:${studioId}`).emit("notification:new", {
    id: created.id,
    studioId: created.studioId,
    title: created.title,
    message: created.message,
    isRead: created.isRead,
    createdAt: created.createdAt,
    clientName: created.clientName,
    serviceName: created.serviceName,
    oldDate: created.oldDate,
    newDate: created.newDate,
  });
}

function toUiDateTime(startAt) {
  const d = new Date(startAt);
  const date = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  return { date, time };
}

function uiStatus(status) {
  if (status === "PENDING") return "new";
  if (status === "CONFIRMED") return "confirmed";
  if (status === "CANCELED") return "canceled";
  return "new";
}

function emitBookingUpdated(booking, extra = {}) {
  if (!booking?.id) return;

  const payload = {
    id: booking.id,
    bookingId: booking.id,
    studioId: booking.studioId || null,
    clientId: booking.clientId || null,
   status: uiStatus(booking.status),
canceledBy: booking.canceledBy || null,
    ...extra,
  };

  if (booking.clientId) {
    io.to(`user:${booking.clientId}`).emit("booking:updated", payload);
    io.to(`client:${booking.clientId}`).emit("booking:updated", payload);
  }

  if (booking.studioId) {
    io.to(`studio:${booking.studioId}`).emit("booking:updated", payload);
  }
}

function emitBookingDeleted(booking) {
  if (!booking?.id) return;

  const payload = {
    id: booking.id,
    bookingId: booking.id,
    studioId: booking.studioId || null,
    clientId: booking.clientId || null,
    deleted: true,
  };

  if (booking.clientId) {
    io.to(`user:${booking.clientId}`).emit("booking:updated", payload);
    io.to(`client:${booking.clientId}`).emit("booking:updated", payload);
  }

  if (booking.studioId) {
    io.to(`studio:${booking.studioId}`).emit("booking:updated", payload);
  }
}

function timeToMin(value) {
  if (typeof value !== "string") return NaN;
  const [hh, mm] = value.split(":").map(Number);

  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return NaN;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return NaN;

  return hh * 60 + mm;
}

function formatDateOnly(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function resolveEffectiveMasterSchedule(dateStr, studioSchedule, masterDays = [], masterExceptions = []) {
  const hasCustomMasterSchedule =
    (Array.isArray(masterDays) && masterDays.length > 0) ||
    (Array.isArray(masterExceptions) && masterExceptions.length > 0);

  if (!hasCustomMasterSchedule) {
    return studioSchedule;
  }

  const masterSchedule = getScheduleForDate(dateStr, masterDays, masterExceptions);

  if (!masterSchedule) {
    return null;
  }

  return intersectSchedules(studioSchedule, masterSchedule);
}

function getDayEnumFromDate(dateStr) {
  const [year, month, day] = String(dateStr).split("-").map(Number);
  const d = new Date(year, (month || 1) - 1, day || 1);
  const weekDay = d.getDay();
  const map = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return map[weekDay];
}

function getScheduleForDate(dateStr, days = [], exceptions = []) {
  const exception = exceptions.find(
    (x) => formatDateOnly(x.date) === dateStr,
  );

  if (exception) {
    if (!exception.enabled) return null;

    return {
      enabled: true,
      startMin: exception.startMin,
      endMin: exception.endMin,
    };
  }

  const dayEnum = getDayEnumFromDate(dateStr);
  const dayRow = days.find((x) => x.day === dayEnum);

  if (!dayRow || !dayRow.enabled) return null;

  return {
    enabled: true,
    startMin: dayRow.startMin,
    endMin: dayRow.endMin,
  };
}

function intersectSchedules(a, b) {
  if (!a || !b) return null;

  const startMin = Math.max(a.startMin, b.startMin);
  const endMin = Math.min(a.endMin, b.endMin);

  if (endMin <= startMin) return null;

  return {
    enabled: true,
    startMin,
    endMin,
  };
}

// GET /bookings/studio/:studioId
router.get("/studio/:studioId", requireAuth, requireOwner, async (req, res) => {
  try {
    const { studioId } = req.params;
    const ownerId = req.auth.sub;

    const studio = await prisma.studio.findFirst({
      where: { id: studioId, ownerId },
      select: { id: true },
    });

    if (!studio) {
      return res.status(403).json({ message: "Forbidden" });
    }

const items = await prisma.booking.findMany({
  where: {
    studioId,
    ownerHiddenAt: null,
  },
  orderBy: { startAt: "asc" },
  include: {
    client: { select: { name: true, phone: true } },
    service: {
      select: {
        name: true,
        price: true,
        duration: true,
      },
    },
    master: { select: { name: true } },
  },
});

const bookings = items.map((b) => {
  const { date, time } = toUiDateTime(b.startAt);

  return {
    id: b.id,
    date,
    time,
    status: uiStatus(b.status),
    canceledBy: b.canceledBy || null,
    clientName: b.client?.name || "—",
    clientPhone: b.client?.phone || "—",
    serviceName: b.service?.name || "—",
    price: b.service?.price ?? null,
    duration: b.service?.duration ?? null,
    masterName: b.master?.name || "",
    createdAt: b.createdAt,
  };
});

    res.json({ bookings });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e?.message || "Load bookings failed" });
  }
});

// CREATE BOOKING
router.post("/studio/:studioId", requireAuth, requireClient, async (req, res) => {
  try {
    const { studioId } = req.params;
    const body = req.body || {};
    const clientId = req.auth.sub;

    const serviceId = body.serviceId ? String(body.serviceId) : null;
    const masterId = body.masterId ? String(body.masterId) : null;
    const date = String(body.date || "").trim();
    const time = String(body.time || "").trim();

    if (!serviceId || !date || !time) {
      return res.status(400).json({
        message: "Не всі обов’язкові поля заповнені",
      });
    }

    const requestedStartMin = timeToMin(time);
    if (!Number.isFinite(requestedStartMin)) {
      return res.status(400).json({ message: "Некоректний час" });
    }

    const client = await prisma.clientAccount.findUnique({
      where: { id: clientId },
      select: { id: true, name: true, phone: true },
    });

    if (!client) {
      return res.status(404).json({ message: "Клієнта не знайдено" });
    }

    const studio = await prisma.studio.findUnique({
      where: { id: studioId },
      select: {
        id: true,
        published: true,
        slotDuration: true,
        scheduleDays: true,
        scheduleExceptions: true,
      },
    });

    if (!studio || !studio.published) {
      return res.status(404).json({ message: "Студію не знайдено" });
    }

    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        studioId,
      },
      select: {
        id: true,
        duration: true,
        allMasters: true,
      },
    });

    if (!service) {
      return res.status(404).json({ message: "Послугу не знайдено" });
    }

    const durationMin = Number(service.duration || studio.slotDuration || 60);
    if (!Number.isFinite(durationMin) || durationMin <= 0) {
      return res.status(400).json({ message: "Некоректна тривалість послуги" });
    }

    const requestedEndMin = requestedStartMin + durationMin;

    const studioSchedule = getScheduleForDate(
      date,
      studio.scheduleDays || [],
      studio.scheduleExceptions || [],
    );

    if (!studioSchedule) {
      return res.status(400).json({
        message: "Студія не працює у цей день",
      });
    }

    if (
      requestedStartMin < studioSchedule.startMin ||
      requestedEndMin > studioSchedule.endMin
    ) {
      return res.status(400).json({
        message: "Час запису виходить за межі графіка студії",
      });
    }

    if (masterId) {
      const master = await prisma.master.findFirst({
        where: {
          id: masterId,
          studioId,
        },
        select: {
          id: true,
          scheduleDays: true,
          scheduleExceptions: true,
        },
      });

      if (!master) {
        return res.status(404).json({ message: "Майстра не знайдено" });
      }

      const effectiveSchedule = resolveEffectiveMasterSchedule(
        date,
        studioSchedule,
        master.scheduleDays || [],
        master.scheduleExceptions || [],
      );

      if (!effectiveSchedule) {
        return res.status(400).json({
          message: "Майстер не працює у цей день",
        });
      }

      if (
        requestedStartMin < effectiveSchedule.startMin ||
        requestedEndMin > effectiveSchedule.endMin
      ) {
        return res.status(400).json({
          message: "Час запису виходить за межі графіка майстра",
        });
      }
    }

    const startAt = new Date(`${date}T${time}:00`);
    if (Number.isNaN(startAt.getTime())) {
      return res.status(400).json({ message: "Некоректна дата або час" });
    }

    const endAt = new Date(startAt.getTime() + durationMin * 60_000);

    let finalMasterId = masterId || null;

    if (masterId) {
      const existing = await prisma.booking.findFirst({
        where: {
          studioId,
          masterId,
          status: { not: "CANCELED" },
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
        select: { id: true },
      });

      if (existing) {
        return res.status(409).json({
          message: "Цей час уже зайнятий у майстра",
        });
      }
    } else {
      const serviceMastersLinks = await prisma.serviceMaster.findMany({
        where: { serviceId },
        select: { masterId: true },
      });

      let candidateMasters = [];

      if (service.allMasters) {
        candidateMasters = await prisma.master.findMany({
          where: { studioId },
          select: {
            id: true,
            scheduleDays: true,
            scheduleExceptions: true,
          },
        });
      } else {
        const allowedIds = serviceMastersLinks.map((x) => x.masterId);

        candidateMasters = await prisma.master.findMany({
          where: {
            studioId,
            id: { in: allowedIds },
          },
          select: {
            id: true,
            scheduleDays: true,
            scheduleExceptions: true,
          },
        });
      }

      let foundFreeMaster = null;

      for (const candidate of candidateMasters) {
        const effectiveSchedule = resolveEffectiveMasterSchedule(
          date,
          studioSchedule,
          candidate.scheduleDays || [],
          candidate.scheduleExceptions || [],
        );

        if (!effectiveSchedule) continue;

        if (
          requestedStartMin < effectiveSchedule.startMin ||
          requestedEndMin > effectiveSchedule.endMin
        ) {
          continue;
        }

        const busy = await prisma.booking.findFirst({
          where: {
            studioId,
            masterId: candidate.id,
            status: { not: "CANCELED" },
            startAt: { lt: endAt },
            endAt: { gt: startAt },
          },
          select: { id: true },
        });

        if (!busy) {
          foundFreeMaster = candidate;
          break;
        }
      }

      if (!foundFreeMaster) {
        return res.status(409).json({
          message: "На цей час немає вільного майстра",
        });
      }

      finalMasterId = foundFreeMaster.id;
    }

    const created = await prisma.booking.create({
      data: {
        studioId,
        clientId,
        serviceId,
        masterId: finalMasterId,
        startAt,
        endAt,
        status: "PENDING",
      },
      select: {
        id: true,
        status: true,
        clientId: true,
        studioId: true,
      },
    });

    emitBookingUpdated(created);

    res.status(201).json({ booking: created });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e?.message || "Create booking failed" });
  }
});

// CONFIRM BOOKING
router.patch("/studio/:studioId/:bookingId/confirm", requireAuth, requireOwner, async (req, res) => {
  try {
    const { studioId, bookingId } = req.params;
    const ownerId = req.auth.sub;

    const studio = await prisma.studio.findFirst({
      where: { id: studioId, ownerId },
      select: { id: true },
    });

    if (!studio) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, studioId },
      select: {
        id: true,
        status: true,
        clientId: true,
        studioId: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CONFIRMED" },
      select: {
        id: true,
        status: true,
        clientId: true,
        studioId: true,
      },
    });

    emitBookingUpdated(updated);

    res.json({ booking: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e?.message || "Confirm booking failed" });
  }
});

// CANCEL BOOKING
router.patch("/studio/:studioId/:bookingId/cancel", requireAuth, requireOwner, async (req, res) => {
  try {
    const { studioId, bookingId } = req.params;
    const ownerId = req.auth.sub;

    const studio = await prisma.studio.findFirst({
      where: { id: studioId, ownerId },
      select: { id: true },
    });

    if (!studio) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, studioId },
      select: {
        id: true,
        status: true,
        clientId: true,
        studioId: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
  status: "CANCELED",
  canceledBy: "owner",
},
      select: {
        id: true,
        status: true,
        clientId: true,
        studioId: true,
      },
    });

    emitBookingUpdated(updated);

    res.json({ booking: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e?.message || "Cancel booking failed" });
  }
});

// DELETE BOOKING
router.delete("/studio/:studioId/:bookingId", requireAuth, requireOwner, async (req, res) => {
  try {
    const { studioId, bookingId } = req.params;
    const ownerId = req.auth.sub;

    const studio = await prisma.studio.findFirst({
      where: { id: studioId, ownerId },
      select: { id: true },
    });

    if (!studio) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, studioId },
      select: {
        id: true,
        clientId: true,
        studioId: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        ownerHiddenAt: new Date(),
      },
      select: {
        id: true,
        clientId: true,
        studioId: true,
      },
    });

    emitBookingUpdated(updated, { hiddenForOwner: true });

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e?.message || "Delete booking failed" });
  }
});

// GET BUSY SLOTS
router.get("/studio/:studioId/busy", async (req, res) => {
  try {
    const { studioId } = req.params;
const date = String(req.query.date || "").trim();
const masterId = String(req.query.masterId || "").trim();
const serviceId = String(req.query.serviceId || "").trim();
const excludeBookingId = String(req.query.excludeBookingId || "").trim();

    if (!date) {
      return res.status(400).json({ message: "date required" });
    }

    const studio = await prisma.studio.findUnique({
      where: { id: studioId },
      select: {
        id: true,
        slotDuration: true,
        scheduleDays: true,
        scheduleExceptions: true,
      },
    });

    if (!studio) {
      return res.status(404).json({ message: "Studio not found" });
    }

    const slotStep = Number(studio.slotDuration || 15);

    const studioSchedule = getScheduleForDate(
      date,
      studio.scheduleDays || [],
      studio.scheduleExceptions || [],
    );

    if (!studioSchedule) {
      return res.json({ busy: [] });
    }

    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59.999`);

    function buildSlotsByMinutes(startMin, endMin, step) {
      const out = [];
      let cursor = startMin;

      while (cursor + step <= endMin) {
        out.push(cursor);
        cursor += step;
      }

      return out;
    }

    function minToTime(total) {
      const h = Math.floor(total / 60);
      const m = total % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }

    function overlaps(aStart, aEnd, bStart, bEnd) {
      return aStart < bEnd && aEnd > bStart;
    }

    if (masterId) {
      const master = await prisma.master.findFirst({
        where: { id: masterId, studioId },
        select: {
          id: true,
          scheduleDays: true,
          scheduleExceptions: true,
        },
      });

      if (!master) {
        return res.status(404).json({ message: "Master not found" });
      }

      const effectiveSchedule = resolveEffectiveMasterSchedule(
        date,
        studioSchedule,
        master.scheduleDays || [],
        master.scheduleExceptions || [],
      );

      if (!effectiveSchedule) {
        return res.json({ busy: [] });
      }

const bookings = await prisma.booking.findMany({
  where: {
    studioId,
    masterId,
    status: { not: "CANCELED" },
    startAt: { lte: dayEnd },
    endAt: { gte: dayStart },
    ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
  },
  select: {
    id: true,
    startAt: true,
    endAt: true,
  },
});

      const slots = buildSlotsByMinutes(
        effectiveSchedule.startMin,
        effectiveSchedule.endMin,
        slotStep,
      );

      const busy = slots
        .filter((slotStartMin) => {
          const slotEndMin = slotStartMin + slotStep;
          const slotStart = new Date(`${date}T${minToTime(slotStartMin)}:00`);
          const slotEnd = new Date(`${date}T${minToTime(slotEndMin)}:00`);

          return bookings.some((b) =>
            overlaps(slotStart, slotEnd, new Date(b.startAt), new Date(b.endAt)),
          );
        })
        .map(minToTime);

      return res.json({ busy });
    }

    if (!serviceId) {
      return res.status(400).json({ message: "serviceId required for ANY master mode" });
    }

    const service = await prisma.service.findFirst({
      where: { id: serviceId, studioId },
      select: {
        id: true,
        duration: true,
        allMasters: true,
      },
    });

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    let candidateMasters = [];

    if (service.allMasters) {
      candidateMasters = await prisma.master.findMany({
        where: { studioId },
        select: {
          id: true,
          scheduleDays: true,
          scheduleExceptions: true,
        },
      });
    } else {
      const links = await prisma.serviceMaster.findMany({
        where: { serviceId },
        select: { masterId: true },
      });

      const allowedIds = links.map((x) => x.masterId);

      candidateMasters = await prisma.master.findMany({
        where: {
          studioId,
          id: { in: allowedIds },
        },
        select: {
          id: true,
          scheduleDays: true,
          scheduleExceptions: true,
        },
      });
    }

    if (!candidateMasters.length) {
      return res.json({ busy: [] });
    }

    const serviceDuration = Number(service.duration || slotStep || 60);

const allBookings = await prisma.booking.findMany({
  where: {
    studioId,
    status: { not: "CANCELED" },
    startAt: { lte: dayEnd },
    endAt: { gte: dayStart },
    masterId: { in: candidateMasters.map((m) => m.id) },
    ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
  },
  select: {
    id: true,
    masterId: true,
    startAt: true,
    endAt: true,
  },
});

    const studioSlots = buildSlotsByMinutes(
      studioSchedule.startMin,
      studioSchedule.endMin,
      slotStep,
    );

    const busy = [];

    for (const slotStartMin of studioSlots) {
      const slotEndMin = slotStartMin + serviceDuration;

      if (slotEndMin > studioSchedule.endMin) continue;

      let hasFreeMaster = false;

      for (const master of candidateMasters) {
        const effectiveSchedule = resolveEffectiveMasterSchedule(
          date,
          studioSchedule,
          master.scheduleDays || [],
          master.scheduleExceptions || [],
        );

        if (!effectiveSchedule) continue;
        if (slotStartMin < effectiveSchedule.startMin) continue;
        if (slotEndMin > effectiveSchedule.endMin) continue;

        const slotStart = new Date(`${date}T${minToTime(slotStartMin)}:00`);
        const slotEnd = new Date(`${date}T${minToTime(slotEndMin)}:00`);

        const masterBusy = allBookings.some(
          (b) =>
            String(b.masterId) === String(master.id) &&
            overlaps(slotStart, slotEnd, new Date(b.startAt), new Date(b.endAt)),
        );

        if (!masterBusy) {
          hasFreeMaster = true;
          break;
        }
      }

      if (!hasFreeMaster) {
        busy.push(minToTime(slotStartMin));
      }
    }

    return res.json({ busy });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Load busy failed" });
  }
});

// RESCHEDULE BOOKING
router.patch("/studio/:studioId/:bookingId/reschedule", requireAuth, requireClient, async (req, res) => {
  try {
    const { studioId, bookingId } = req.params;
    const clientId = req.auth.sub;
    const { newDate, newTime } = req.body;

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, studioId, clientId },
      include: { client: true, service: true }
    });

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const oldStartAt = booking.startAt;
    const startAt = new Date(`${newDate}T${newTime}:00`);
    const endAt = new Date(startAt.getTime() + (booking.endAt - booking.startAt));

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { startAt, endAt },
    });

    // Створюємо нотифікацію власнику
    await createRescheduleNotification({
      studioId: booking.studioId,
      clientName: booking.client.name,
      serviceName: booking.service?.name || "Послуга",
      oldStartAt,
      newStartAt: startAt,
    });

    // Відправляємо оновлення через сокет
    emitBookingUpdated(updated);

    res.json({ booking: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e?.message || "Reschedule failed" });
  }
});


export default router;