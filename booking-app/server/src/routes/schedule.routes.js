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
  return hh * 60 + mm;
};

function buildWorkingHoursText(days) {
  const order = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const labelUA = { MON: "Пн", TUE: "Вт", WED: "Ср", THU: "Чт", FRI: "Пт", SAT: "Сб", SUN: "Нд" };

  const enabled = order
    .map((d) => days.find((x) => x.day === d))
    .filter(Boolean)
    .filter((x) => x.enabled);

  if (enabled.length === 0) return "Зачинено";

  // group consecutive days with same time
  const groups = [];
  for (const x of enabled) {
    const time = `${minToTime(x.startMin)}–${minToTime(x.endMin)}`;
    const last = groups[groups.length - 1];
    if (last && last.time === time) last.days.push(x.day);
    else groups.push({ time, days: [x.day] });
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

// (опційно) створює дефолтні 7 днів, якщо їх немає
async function ensureDefaultDays(studioId) {
  const existing = await prisma.studioScheduleDay.findMany({ where: { studioId } });
  if (existing.length > 0) return;

  const defaults = [
    { day: "MON", enabled: true,  startMin: 600, endMin: 1080 },
    { day: "TUE", enabled: true,  startMin: 600, endMin: 1080 },
    { day: "WED", enabled: true,  startMin: 600, endMin: 1080 },
    { day: "THU", enabled: true,  startMin: 600, endMin: 1080 },
    { day: "FRI", enabled: true,  startMin: 600, endMin: 1080 },
    { day: "SAT", enabled: false, startMin: 600, endMin: 1080 },
    { day: "SUN", enabled: false, startMin: 600, endMin: 1080 },
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
        select: { slotDuration: true, scheduleDays: true },
      });

      if (!studio) return res.status(404).json({ message: "Studio not found" });

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
      res.status(500).json({ message: e?.message || "Load schedule failed" });
    }
  }
);

/**
 * PATCH /studio/:studioId/schedule
 * body: { slotDuration, schedule }
 */
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
          return res.status(400).json({ message: "slotDuration is invalid" });
        }
        await prisma.studio.update({
          where: { id: studioId },
          data: { slotDuration: n },
        });
      }

      if (!schedule || typeof schedule !== "object") {
        return res.status(400).json({ message: "schedule must be an object" });
      }

      const ops = Object.entries(keyToEnum).map(([key, dayEnum]) => {
        const cfg = schedule[key];
        if (!cfg) return null;

        const enabled = Boolean(cfg.enabled);
        const startMin = timeToMin(cfg.start);
        const endMin = timeToMin(cfg.end);

        if (!Number.isFinite(startMin) || !Number.isFinite(endMin)) {
          throw new Error(`Invalid time for ${key}`);
        }
        if (startMin < 0 || startMin > 1439 || endMin < 0 || endMin > 1440) {
          throw new Error(`Time out of range for ${key}`);
        }
        if (endMin <= startMin) {
          throw new Error(`End must be after start for ${key}`);
        }

        return prisma.studioScheduleDay.upsert({
          where: { studioId_day: { studioId, day: dayEnum } },
          update: { enabled, startMin, endMin },
          create: { studioId, day: dayEnum, enabled, startMin, endMin },
        });
      }).filter(Boolean);

      await prisma.$transaction(ops);

      // повернемо summary для UI
      const days = await prisma.studioScheduleDay.findMany({ where: { studioId } });

      res.json({
        ok: true,
        workingHoursText: buildWorkingHoursText(days),
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: e?.message || "Save schedule failed" });
    }
  }
);

export default router;