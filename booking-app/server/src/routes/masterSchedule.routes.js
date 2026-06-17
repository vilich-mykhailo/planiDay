// routes/masterSchedule.routes.js
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireOwner } from "../middleware/auth.js";

export const masterScheduleRouter = Router();

const keyToEnum = {
  mon: "MON",
  tue: "TUE",
  wed: "WED",
  thu: "THU",
  fri: "FRI",
  sat: "SAT",
  sun: "SUN",
};

const enumToKey = {
  MON: "mon",
  TUE: "tue",
  WED: "wed",
  THU: "thu",
  FRI: "fri",
  SAT: "sat",
  SUN: "sun",
};

function timeToMin(value) {
  if (typeof value !== "string") return NaN;
  const [hh, mm] = value.split(":").map(Number);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return NaN;
  return hh * 60 + mm;
}

function minToTime(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatDateOnly(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function getDayEnumFromDate(dateStr) {
  const [year, month, day] = String(dateStr).split("-").map(Number);
  const d = new Date(year, (month || 1) - 1, day || 1);
  const weekDay = d.getDay();
  const map = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return map[weekDay];
}

function getScheduleForDate(dateStr, days, exceptions) {
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

  return { enabled: true, startMin, endMin };
}

function normalizeDateOnly(value) {
  const s = String(value || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
}

function getBreakMinutes({ enabled, startMin, endMin, breakStart, breakEnd }) {
  if (!enabled) {
    return {
      breakStartMin: null,
      breakEndMin: null,
    };
  }

  const hasBreakStart = typeof breakStart === "string" && breakStart.trim();
  const hasBreakEnd = typeof breakEnd === "string" && breakEnd.trim();

  if (!hasBreakStart && !hasBreakEnd) {
    return {
      breakStartMin: null,
      breakEndMin: null,
    };
  }

  if (!hasBreakStart || !hasBreakEnd) {
    throw new Error("Заповніть початок і кінець перерви");
  }

  const breakStartMin = timeToMin(breakStart);
  const breakEndMin = timeToMin(breakEnd);

  if (!Number.isFinite(breakStartMin) || !Number.isFinite(breakEndMin)) {
    throw new Error("Некоректний формат часу перерви");
  }

  if (
    breakStartMin <= startMin ||
    breakEndMin >= endMin ||
    breakEndMin <= breakStartMin
  ) {
    throw new Error("Перерва має бути всередині робочого часу");
  }

  return {
    breakStartMin,
    breakEndMin,
  };
}

async function ensureMasterBelongsToOwner(masterId, ownerId) {
  const master = await prisma.master.findFirst({
    where: {
      id: masterId,
      studio: {
        ownerId,
      },
    },
    include: {
      studio: true,
    },
  });

  return master;
}

async function ensureDefaultMasterDays(masterId) {
  const existing = await prisma.masterScheduleDay.findMany({
    where: { masterId },
    select: { day: true },
  });

  const existingSet = new Set(existing.map((x) => x.day));

  const defaults = [
    { day: "MON", enabled: true, startMin: 480, endMin: 1080 },
    { day: "TUE", enabled: true, startMin: 480, endMin: 1080 },
    { day: "WED", enabled: true, startMin: 480, endMin: 1080 },
    { day: "THU", enabled: true, startMin: 480, endMin: 1080 },
    { day: "FRI", enabled: true, startMin: 480, endMin: 1080 },
    { day: "SAT", enabled: false, startMin: 480, endMin: 1080 },
    { day: "SUN", enabled: false, startMin: 480, endMin: 1080 },
  ];

  const missing = defaults.filter((d) => !existingSet.has(d.day));

  if (missing.length) {
    await prisma.masterScheduleDay.createMany({
      data: missing.map((d) => ({
        masterId,
        day: d.day,
        enabled: d.enabled,
        startMin: d.startMin,
        endMin: d.endMin,
      })),
    });
  }
}

function formatSchedule(days) {
  const base = {
    mon: { enabled: true, start: "08:00", end: "18:00", breakStart: "", breakEnd: "" },
    tue: { enabled: true, start: "08:00", end: "18:00", breakStart: "", breakEnd: "" },
    wed: { enabled: true, start: "08:00", end: "18:00", breakStart: "", breakEnd: "" },
    thu: { enabled: true, start: "08:00", end: "18:00", breakStart: "", breakEnd: "" },
    fri: { enabled: true, start: "08:00", end: "18:00", breakStart: "", breakEnd: "" },
    sat: { enabled: false, start: "08:00", end: "18:00", breakStart: "", breakEnd: "" },
    sun: { enabled: false, start: "08:00", end: "18:00", breakStart: "", breakEnd: "" },
  };

  for (const row of days) {
    const key = enumToKey[row.day];
    if (!key) continue;

    base[key] = {
      enabled: Boolean(row.enabled),
      start: minToTime(row.startMin),
      end: minToTime(row.endMin),
      breakStart: row.breakStartMin == null ? "" : minToTime(row.breakStartMin),
      breakEnd: row.breakEndMin == null ? "" : minToTime(row.breakEndMin),
    };
  }

  return base;
}
function formatException(row) {
  return {
    id: row.id,
    date: row.date.toISOString().slice(0, 10),
    enabled: row.enabled,
    start: row.startMin == null ? null : minToTime(row.startMin),
    end: row.endMin == null ? null : minToTime(row.endMin),
    breakStart: row.breakStartMin == null ? "" : minToTime(row.breakStartMin),
    breakEnd: row.breakEndMin == null ? "" : minToTime(row.breakEndMin),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * GET /studio/masters/:masterId/schedule
 */
masterScheduleRouter.get(
  "/studio/masters/:masterId/schedule",
  requireAuth,
  requireOwner,
  async (req, res) => {
    try {
      const { masterId } = req.params;

      const master = await ensureMasterBelongsToOwner(masterId, req.auth.sub);
      if (!master) {
        return res.status(404).json({ message: "Майстра не знайдено" });
      }

      await ensureDefaultMasterDays(masterId);

      const days = await prisma.masterScheduleDay.findMany({
        where: { masterId },
        orderBy: { day: "asc" },
      });

      res.json({
        masterId,
        schedule: formatSchedule(days),
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Не вдалося завантажити графік майстра" });
    }
  },
);

/**
 * PATCH /studio/masters/:masterId/schedule
 */
masterScheduleRouter.patch(
  "/studio/masters/:masterId/schedule",
  requireAuth,
  requireOwner,
  async (req, res) => {
    try {
      const { masterId } = req.params;
      const schedule = req.body?.schedule;

      const master = await ensureMasterBelongsToOwner(masterId, req.auth.sub);
      if (!master) {
        return res.status(404).json({ message: "Майстра не знайдено" });
      }

      await ensureDefaultMasterDays(masterId);

      if (!schedule || typeof schedule !== "object") {
        return res.status(400).json({ message: "schedule must be an object" });
      }

      await prisma.$transaction(
        Object.entries(keyToEnum).map(([key, dayEnum]) => {
          const cfg = schedule[key];
          if (!cfg) return prisma.$executeRaw`SELECT 1`;

          const enabled = Boolean(cfg.enabled);
          const startMin = timeToMin(cfg.start);
          const endMin = timeToMin(cfg.end);
const { breakStartMin, breakEndMin } = getBreakMinutes({
  enabled,
  startMin,
  endMin,
  breakStart: cfg.breakStart,
  breakEnd: cfg.breakEnd,
});
          if (
            !Number.isFinite(startMin) ||
            !Number.isFinite(endMin) ||
            startMin < 0 ||
            endMin > 24 * 60 ||
            endMin <= startMin
          ) {
            throw new Error(`Некоректний час для ${key}`);
          }

return prisma.masterScheduleDay.upsert({
  where: {
    masterId_day: {
      masterId,
      day: dayEnum,
    },
  },
  update: {
    enabled,
    startMin,
    endMin,
    breakStartMin,
    breakEndMin,
  },
  create: {
    masterId,
    day: dayEnum,
    enabled,
    startMin,
    endMin,
    breakStartMin,
    breakEndMin,
  },
});
        }),
      );

      const days = await prisma.masterScheduleDay.findMany({
        where: { masterId },
        orderBy: { day: "asc" },
      });

      res.json({
        message: "Графік майстра оновлено",
        masterId,
        schedule: formatSchedule(days),
      });
    } catch (err) {
      console.error(err);
      res.status(400).json({
        message: err?.message || "Не вдалося оновити графік майстра",
      });
    }
  },
);

/**
 * GET /studio/masters/:masterId/schedule/exceptions
 */
masterScheduleRouter.get(
  "/studio/masters/:masterId/schedule/exceptions",
  requireAuth,
  requireOwner,
  async (req, res) => {
    try {
      const { masterId } = req.params;

      const master = await ensureMasterBelongsToOwner(masterId, req.auth.sub);
      if (!master) {
        return res.status(404).json({ message: "Майстра не знайдено" });
      }

      const exceptions = await prisma.masterScheduleException.findMany({
        where: { masterId },
        orderBy: { date: "asc" },
      });

      res.json({
        exceptions: exceptions.map(formatException),
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Не вдалося завантажити додаткові вихідні" });
    }
  },
);

/**
 * POST /studio/masters/:masterId/schedule/exceptions
 */
masterScheduleRouter.post(
  "/studio/masters/:masterId/schedule/exceptions",
  requireAuth,
  requireOwner,
  async (req, res) => {
    try {
      const { masterId } = req.params;
      const { date, enabled, start, end, breakStart, breakEnd } = req.body || {};

      const master = await ensureMasterBelongsToOwner(masterId, req.auth.sub);
      if (!master) {
        return res.status(404).json({ message: "Майстра не знайдено" });
      }

      const isoDate = normalizeDateOnly(date);
      if (!isoDate) {
        return res.status(400).json({ message: "Некоректна дата" });
      }

      const isEnabled = enabled !== false;

      let startMin = null;
      let endMin = null;
      let breakStartMin = null;
      let breakEndMin = null;

      if (isEnabled) {
        startMin = timeToMin(start);
        endMin = timeToMin(end);

        if (
          !Number.isFinite(startMin) ||
          !Number.isFinite(endMin) ||
          startMin < 0 ||
          endMin > 24 * 60 ||
          endMin <= startMin
        ) {
          return res.status(400).json({
            message: "Час завершення має бути пізніше за час початку",
          });
        }

        const breakMinutes = getBreakMinutes({
          enabled: isEnabled,
          startMin,
          endMin,
          breakStart,
          breakEnd,
        });

        breakStartMin = breakMinutes.breakStartMin;
        breakEndMin = breakMinutes.breakEndMin;
      }

      const exception = await prisma.masterScheduleException.create({
        data: {
          masterId,
          date: new Date(`${isoDate}T12:00:00`),
          enabled: isEnabled,
          startMin,
          endMin,
          breakStartMin,
          breakEndMin,
        },
      });

      res.status(201).json({
        message: "Особливу дату створено",
        exception: formatException(exception),
      });
    } catch (err) {
      console.error(err);

      if (err?.code === "P2002") {
        return res.status(409).json({
          message: "Для цієї дати вже існує особливий графік",
        });
      }

      res.status(400).json({
        message: err?.message || "Не вдалося створити особливу дату",
      });
    }
  },
);

/**
 * PATCH /studio/masters/:masterId/schedule/exceptions/:exceptionId
 */
masterScheduleRouter.patch(
  "/studio/masters/:masterId/schedule/exceptions/:exceptionId",
  requireAuth,
  requireOwner,
  async (req, res) => {
    try {
      const { masterId, exceptionId } = req.params;
      const { date, enabled, start, end, breakStart, breakEnd } = req.body || {};

      const master = await ensureMasterBelongsToOwner(masterId, req.auth.sub);
      if (!master) {
        return res.status(404).json({ message: "Майстра не знайдено" });
      }

      const existing = await prisma.masterScheduleException.findFirst({
        where: {
          id: exceptionId,
          masterId,
        },
      });

      if (!existing) {
        return res.status(404).json({ message: "Особливу дату не знайдено" });
      }

      const isoDate = normalizeDateOnly(date);
      if (!isoDate) {
        return res.status(400).json({ message: "Некоректна дата" });
      }

      const isEnabled = enabled !== false;

      let startMin = null;
      let endMin = null;
      let breakStartMin = null;
      let breakEndMin = null;

      if (isEnabled) {
        startMin = timeToMin(start);
        endMin = timeToMin(end);

        if (
          !Number.isFinite(startMin) ||
          !Number.isFinite(endMin) ||
          startMin < 0 ||
          endMin > 24 * 60 ||
          endMin <= startMin
        ) {
          return res.status(400).json({
            message: "Час завершення має бути пізніше за час початку",
          });
        }

        const breakMinutes = getBreakMinutes({
          enabled: isEnabled,
          startMin,
          endMin,
          breakStart,
          breakEnd,
        });

        breakStartMin = breakMinutes.breakStartMin;
        breakEndMin = breakMinutes.breakEndMin;
      }

      const updated = await prisma.masterScheduleException.update({
        where: { id: exceptionId },
        data: {
          date: new Date(`${isoDate}T00:00:00.000Z`),
          enabled: isEnabled,
          startMin,
          endMin,
          breakStartMin,
          breakEndMin,
        },
      });

      res.json({
        message: "Особливу дату оновлено",
        exception: formatException(updated),
      });
    } catch (err) {
      console.error(err);

      if (err?.code === "P2002") {
        return res.status(409).json({
          message: "Для цієї дати вже існує особливий графік",
        });
      }

      res.status(400).json({
        message: err?.message || "Не вдалося оновити особливу дату",
      });
    }
  },
);

/**
 * DELETE /studio/masters/:masterId/schedule/exceptions/:exceptionId
 */
masterScheduleRouter.delete(
  "/studio/masters/:masterId/schedule/exceptions/:exceptionId",
  requireAuth,
  requireOwner,
  async (req, res) => {
    try {
      const { masterId, exceptionId } = req.params;

      const master = await ensureMasterBelongsToOwner(masterId, req.auth.sub);
      if (!master) {
        return res.status(404).json({ message: "Майстра не знайдено" });
      }

      const existing = await prisma.masterScheduleException.findFirst({
        where: {
          id: exceptionId,
          masterId,
        },
      });

      if (!existing) {
        return res.status(404).json({ message: "Особливу дату не знайдено" });
      }

      await prisma.masterScheduleException.delete({
        where: { id: exceptionId },
      });

      res.json({ message: "Особливу дату видалено" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Не вдалося видалити особливу дату" });
    }
  },
);