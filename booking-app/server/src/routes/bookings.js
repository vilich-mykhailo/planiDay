import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireOwner } from "../middleware/auth.js";
import { requireClient } from "../middleware/auth.js"; // якщо в тебе є такий middleware
const router = Router();

function pad2(n) {
  return String(n).padStart(2, "0");
}

// формат під твій UI: date "YYYY-MM-DD", time "HH:MM"
function toUiDateTime(startAt) {
  const d = new Date(startAt);
  const date = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  return { date, time };
}

function uiStatus(status) {
  // підлаштуй під свій enum:
  if (status === "PENDING") return "new";
  if (status === "CONFIRMED") return "confirmed";
  if (status === "CANCELED") return "canceled";
  return "new";
}

// GET /bookings/studio/:studioId  (для owner)
router.get("/studio/:studioId", requireAuth, requireOwner, async (req, res) => {
  try {
    const { studioId } = req.params;
    const ownerId = req.auth.sub;

    // 🔒 захист: студія має належати owner
    const studio = await prisma.studio.findFirst({
      where: { id: studioId, ownerId },
      select: { id: true },
    });
    if (!studio) return res.status(403).json({ message: "Forbidden" });

    const items = await prisma.booking.findMany({
      where: { studioId },
      orderBy: { startAt: "asc" },
      include: {
        client: { select: { name: true, phone: true } }, // ⚠️ якщо інші назви — заміниш
        service: { select: { name: true } },             // ⚠️ якщо нема relation — скажи
        master: { select: { name: true } },              // ⚠️ якщо нема relation — скажи
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

router.post("/studio/:studioId", requireAuth, async (req, res) => {
  try {
    const { studioId } = req.params;
    const clientId = req.auth.sub; // якщо client теж сидить у auth

    const s = req.body || {};
    const serviceId = s.serviceId ? String(s.serviceId) : null;
    const masterId = s.masterId ? String(s.masterId) : null;

    const date = String(s.date || "").trim();  // "YYYY-MM-DD"
    const time = String(s.time || "").trim();  // "HH:MM"
    const durationMin = Number(s.duration || 60);

    if (!serviceId) return res.status(400).json({ message: "serviceId required" });
    if (!date || !time) return res.status(400).json({ message: "date/time required" });
    if (!Number.isFinite(durationMin) || durationMin <= 0)
      return res.status(400).json({ message: "duration invalid" });

    const startAt = new Date(`${date}T${time}:00`);
    if (Number.isNaN(startAt.getTime()))
      return res.status(400).json({ message: "Invalid datetime" });

    const endAt = new Date(startAt.getTime() + durationMin * 60_000);

    // TODO: перевірка перетинів (пізніше додамо)
    const created = await prisma.booking.create({
      data: {
        studioId,
        clientId,
        serviceId,
        masterId,
        startAt,
        endAt,
        status: "PENDING",
      },
    });

    res.json({ booking: created });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e?.message || "Create booking failed" });
  }
});

router.get("/studio/:studioId/busy", requireAuth, async (req, res) => {
  try {
    const { studioId } = req.params;
    const date = String(req.query.date || "").trim(); // YYYY-MM-DD
    if (!date) return res.status(400).json({ message: "date required" });

    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59.999`);

    const items = await prisma.booking.findMany({
      where: {
        studioId,
        status: { not: "CANCELED" },
        startAt: { gte: dayStart, lte: dayEnd },
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