import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireOwner } from "../middleware/auth.js";

const router = Router();

function pad2(n) {
  return String(n).padStart(2, "0");
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

function getDayEnumFromDate(date) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const map = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return map[day];
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

  const dayEnum = getDayEnumFromDate(`${dateStr}T00:00:00.000Z`);
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

// GET /bookings/studio/:studioId  (для owner)
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
      where: { studioId },
      orderBy: { startAt: "asc" },
      include: {
        client: { select: { name: true, phone: true } },
        service: { select: { name: true } },
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
        clientName: b.client?.name || "—",
        clientPhone: b.client?.phone || "—",
        serviceName: b.service?.name || "—",
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
router.post("/studio/:studioId", async (req, res) => {
  try {
    console.log("BOOKING BODY:", req.body);
console.log("MASTER ID:", req.body?.masterId);
    const { studioId } = req.params;
    const body = req.body || {};

    const serviceId = body.serviceId ? String(body.serviceId) : null;
    const masterId = body.masterId ? String(body.masterId) : null;
    const date = String(body.date || "").trim();   // YYYY-MM-DD
    const time = String(body.time || "").trim();   // HH:MM
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();

    if (!serviceId || !date || !time || !name || !phone) {
      return res.status(400).json({
        message: "Не всі обов’язкові поля заповнені",
      });
    }

    const requestedStartMin = timeToMin(time);
    if (!Number.isFinite(requestedStartMin)) {
      return res.status(400).json({ message: "Некоректний час" });
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

    let effectiveSchedule = studioSchedule;

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

      const masterSchedule = getScheduleForDate(
        date,
        master.scheduleDays || [],
        master.scheduleExceptions || [],
      );

      if (!masterSchedule) {
        return res.status(400).json({
          message: "Майстер не працює у цей день",
        });
      }

      effectiveSchedule = intersectSchedules(studioSchedule, masterSchedule);

      if (!effectiveSchedule) {
        return res.status(400).json({
          message: "У цей час майстер недоступний",
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

    const overlapWhere = {
      studioId,
      status: { not: "CANCELED" },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
      ...(masterId ? { masterId } : {}),
    };

    const existing = await prisma.booking.findFirst({
      where: overlapWhere,
      select: { id: true },
    });

    if (existing) {
      return res.status(409).json({
        message: masterId
          ? "Цей час уже зайнятий у майстра"
          : "Цей час уже зайнятий",
      });
    }

    const created = await prisma.booking.create({
      data: {
        studioId,
        serviceId,
        masterId: masterId || null,
        startAt,
        endAt,
        status: "PENDING",
        name,
        phone,
      },
    });

    res.status(201).json({ booking: created });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e?.message || "Create booking failed" });
  }
});

// GET BUSY SLOTS
router.get("/studio/:studioId/busy", async (req, res) => {
  try {
    const { studioId } = req.params;
    const date = String(req.query.date || "").trim();
    const masterId = String(req.query.masterId || "").trim();

    if (!date) {
      return res.status(400).json({ message: "date required" });
    }

    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59.999`);

    const items = await prisma.booking.findMany({
      where: {
        studioId,
        status: { not: "CANCELED" },
        startAt: { gte: dayStart, lte: dayEnd },
        ...(masterId ? { masterId } : {}),
      },
      select: { startAt: true },
      orderBy: { startAt: "asc" },
    });

    const busy = items.map((b) => {
      const d = new Date(b.startAt);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    });

    res.json({ busy });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Load busy failed" });
  }
});

export default router;