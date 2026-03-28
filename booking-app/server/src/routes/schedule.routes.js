// schedule.routes.js
import express from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireOwner } from "../middleware/auth.js";

const router = express.Router();

const keyToEnum = {
  mon: "MON",
  tue: "TUE",
  wed: "WED",
  thu: "THU",
  fri: "FRI",
  sat: "SAT",
  sun: "SUN",
};

const dayNamesUa = {
  mon: "понеділка",
  tue: "вівторка",
  wed: "середи",
  thu: "четверга",
  fri: "п’ятниці",
  sat: "суботи",
  sun: "неділі",
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

const pad2 = (n) => String(n).padStart(2, "0");

const minToTime = (m) => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;

const timeToMin = (t) => {
  const [hh, mm] = String(t || "").split(":").map(Number);

  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return NaN;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return NaN;

  return hh * 60 + mm;
};

function parseDateOnly(value) {
  if (!value || typeof value !== "string") return null;

  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;

  const [, y, mo, d] = m;
  const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function formatDateOnly(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function toExceptionDto(item) {
  return {
    id: item.id,
    date: formatDateOnly(item.date),
    enabled: item.enabled,
    start: item.startMin != null ? minToTime(item.startMin) : null,
    end: item.endMin != null ? minToTime(item.endMin) : null,
  };
}

function buildWorkingHoursText(days) {
  const order = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const labelUA = {
    MON: "Пн",
    TUE: "Вт",
    WED: "Ср",
    THU: "Чт",
    FRI: "Пт",
    SAT: "Сб",
    SUN: "Нд",
  };

  const enabled = order
    .map((d) => days.find((x) => x.day === d))
    .filter(Boolean)
    .filter((x) => x.enabled);

  if (enabled.length === 0) return "Зачинено";

  const groups = [];

  for (const x of enabled) {
    const time = `${minToTime(x.startMin)}–${minToTime(x.endMin)}`;
    const last = groups[groups.length - 1];

    if (last && last.time === time) {
      last.days.push(x.day);
    } else {
      groups.push({ time, days: [x.day] });
    }
  }

  return groups
    .map((g) => {
      const first = labelUA[g.days[0]];
      const last = labelUA[g.days[g.days.length - 1]];
      const dayStr = g.days.length === 1 ? first : `${first}–${last}`;
      return `${dayStr} ${g.time}`;
    })
    .join(", ");
}

async function ensureDefaultDays(studioId) {
  const existing = await prisma.studioScheduleDay.findMany({
    where: { studioId },
  });

  if (existing.length > 0) return;

  const defaults = [
    { day: "MON", enabled: true, startMin: 480, endMin: 1020 },
    { day: "TUE", enabled: true, startMin: 480, endMin: 1020 },
    { day: "WED", enabled: true, startMin: 480, endMin: 1020 },
    { day: "THU", enabled: true, startMin: 480, endMin: 1020 },
    { day: "FRI", enabled: true, startMin: 480, endMin: 1020 },
    { day: "SAT", enabled: false, startMin: 480, endMin: 1020 },
    { day: "SUN", enabled: false, startMin: 480, endMin: 1020 },
  ];

  await prisma.studioScheduleDay.createMany({
    data: defaults.map((d) => ({ studioId, ...d })),
    skipDuplicates: true,
  });
}

router.get(
  "/:studioId/schedule",
  requireAuth,
  requireOwner,
  async (req, res) => {
    try {
      const { studioId } = req.params;

      await ensureDefaultDays(studioId);

      const studio = await prisma.studio.findUnique({
        where: { id: studioId },
        select: {
          slotDuration: true,
          scheduleDays: true,
        },
      });

      if (!studio) {
        return res.status(404).json({ message: "Studio not found" });
      }

      const schedule = {};

      for (const d of studio.scheduleDays) {
        schedule[enumToKey[d.day]] = {
          enabled: d.enabled,
          start: minToTime(d.startMin),
          end: minToTime(d.endMin),
        };
      }

      res.json({
        slotDuration: studio.slotDuration ?? 15,
        schedule,
        workingHoursText: buildWorkingHoursText(studio.scheduleDays),
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        message: e?.message || "Load schedule failed",
      });
    }
  },
);

router.patch(
  "/:studioId/schedule",
  requireAuth,
  requireOwner,
  async (req, res) => {
    try {
      const { studioId } = req.params;
      const schedule = req.body?.schedule;
      const slotDuration = req.body?.slotDuration;

      await ensureDefaultDays(studioId);

      if (slotDuration !== undefined) {
        const n = Number(slotDuration);

        if (!Number.isFinite(n) || n <= 0 || n > 240) {
          return res.status(400).json({
            message: "Невірне значення тривалості слота",
          });
        }

        await prisma.studio.update({
          where: { id: studioId },
          data: { slotDuration: n },
        });
      }

      if (!schedule || typeof schedule !== "object") {
        return res.status(400).json({
          message: "Розклад має бути об'єктом",
        });
      }

      const ops = Object.entries(keyToEnum)
        .map(([key, dayEnum]) => {
          const cfg = schedule[key];
          if (!cfg) return null;

          const dayName = dayNamesUa[key] || key;
          const enabled = Boolean(cfg.enabled);
          const startMin = timeToMin(cfg.start);
          const endMin = timeToMin(cfg.end);

          if (enabled) {
            if (!Number.isFinite(startMin) || !Number.isFinite(endMin)) {
              return Promise.reject(
                new Error(`Невірний формат часу для ${dayName}`),
              );
            }

            if (
              startMin < 0 ||
              startMin > 1439 ||
              endMin < 0 ||
              endMin > 1440
            ) {
              return Promise.reject(
                new Error(`Час поза допустимим діапазоном для ${dayName}`),
              );
            }

            if (endMin <= startMin) {
              return Promise.reject(
                new Error(
                  `Час завершення має бути пізніше за час початку для ${dayName}`,
                ),
              );
            }
          }

          return prisma.studioScheduleDay.upsert({
            where: {
              studioId_day: { studioId, day: dayEnum },
            },
            update: {
              enabled,
              startMin,
              endMin,
            },
            create: {
              studioId,
              day: dayEnum,
              enabled,
              startMin,
              endMin,
            },
          });
        })
        .filter(Boolean);

      await prisma.$transaction(ops);

      const days = await prisma.studioScheduleDay.findMany({
        where: { studioId },
      });

      res.json({
        ok: true,
        workingHoursText: buildWorkingHoursText(days),
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        message: e?.message || "Не вдалося зберегти розклад",
      });
    }
  },
);

router.get(
  "/:studioId/schedule/exceptions",
  requireAuth,
  requireOwner,
  async (req, res) => {
    try {
      const { studioId } = req.params;

      const exceptions = await prisma.studioScheduleException.findMany({
        where: { studioId },
        orderBy: { date: "asc" },
      });

      res.json({
        exceptions: exceptions.map(toExceptionDto),
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        message: e?.message || "Не вдалося завантажити особливі дати",
      });
    }
  },
);

router.post(
  "/:studioId/schedule/exceptions",
  requireAuth,
  requireOwner,
  async (req, res) => {
    try {
      const { studioId } = req.params;
      const { date, enabled, start, end } = req.body || {};

      const parsedDate = parseDateOnly(date);

      if (!parsedDate) {
        return res.status(400).json({
          message: "Невірна дата",
        });
      }

      const isEnabled = Boolean(enabled);

      let startMin = null;
      let endMin = null;

      if (isEnabled) {
        startMin = timeToMin(start);
        endMin = timeToMin(end);

        if (!Number.isFinite(startMin) || !Number.isFinite(endMin)) {
          return res.status(400).json({
            message: "Невірний формат часу",
          });
        }

        if (startMin < 0 || startMin > 1439 || endMin < 0 || endMin > 1440) {
          return res.status(400).json({
            message: "Час поза допустимим діапазоном",
          });
        }

        if (endMin <= startMin) {
          return res.status(400).json({
            message: "Час завершення має бути пізніше за час початку",
          });
        }
      }

      const saved = await prisma.studioScheduleException.upsert({
        where: {
          studioId_date: {
            studioId,
            date: parsedDate,
          },
        },
        update: {
          enabled: isEnabled,
          startMin,
          endMin,
        },
        create: {
          studioId,
          date: parsedDate,
          enabled: isEnabled,
          startMin,
          endMin,
        },
      });

      res.json({
        ok: true,
        exception: toExceptionDto(saved),
      });
    } catch (e) {
      console.error(e);

      if (e?.code === "P2002") {
        return res.status(400).json({
          message: "Для цієї дати виняток уже існує",
        });
      }

      res.status(500).json({
        message: e?.message || "Не вдалося зберегти особливу дату",
      });
    }
  },
);

router.patch(
  "/:studioId/schedule/exceptions/:exceptionId",
  requireAuth,
  requireOwner,
  async (req, res) => {
    try {
      const { studioId, exceptionId } = req.params;
      const { date, enabled, start, end } = req.body || {};

      const current = await prisma.studioScheduleException.findFirst({
        where: {
          id: exceptionId,
          studioId,
        },
      });

      if (!current) {
        return res.status(404).json({
          message: "Особливу дату не знайдено",
        });
      }

      const nextDate =
        date !== undefined ? parseDateOnly(date) : new Date(current.date);

      if (!nextDate) {
        return res.status(400).json({
          message: "Невірна дата",
        });
      }

      const isEnabled =
        enabled !== undefined ? Boolean(enabled) : current.enabled;

      let startMin = current.startMin;
      let endMin = current.endMin;

      if (isEnabled) {
        if (start !== undefined) startMin = timeToMin(start);
        if (end !== undefined) endMin = timeToMin(end);

        if (!Number.isFinite(startMin) || !Number.isFinite(endMin)) {
          return res.status(400).json({
            message: "Невірний формат часу",
          });
        }

        if (startMin < 0 || startMin > 1439 || endMin < 0 || endMin > 1440) {
          return res.status(400).json({
            message: "Час поза допустимим діапазоном",
          });
        }

        if (endMin <= startMin) {
          return res.status(400).json({
            message: "Час завершення має бути пізніше за час початку",
          });
        }
      } else {
        startMin = null;
        endMin = null;
      }

      const updated = await prisma.studioScheduleException.update({
        where: { id: exceptionId },
        data: {
          date: nextDate,
          enabled: isEnabled,
          startMin,
          endMin,
        },
      });

      res.json({
        ok: true,
        exception: toExceptionDto(updated),
      });
    } catch (e) {
      console.error(e);

      if (e?.code === "P2002") {
        return res.status(400).json({
          message: "Для цієї дати виняток уже існує",
        });
      }

      res.status(500).json({
        message: e?.message || "Не вдалося оновити особливу дату",
      });
    }
  },
);

router.delete(
  "/:studioId/schedule/exceptions/:exceptionId",
  requireAuth,
  requireOwner,
  async (req, res) => {
    try {
      const { studioId, exceptionId } = req.params;

      const current = await prisma.studioScheduleException.findFirst({
        where: {
          id: exceptionId,
          studioId,
        },
      });

      if (!current) {
        return res.status(404).json({
          message: "Особливу дату не знайдено",
        });
      }

      await prisma.studioScheduleException.delete({
        where: { id: exceptionId },
      });

      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        message: e?.message || "Не вдалося видалити особливу дату",
      });
    }
  },
);

export default router;
