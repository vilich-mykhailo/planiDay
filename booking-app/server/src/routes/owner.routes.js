//owner.routes.js //
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireOwner } from "../middleware/auth.js";
import { io } from "../index.js";
export const ownerRouter = Router();

// CREATE studio
ownerRouter.post("/", requireAuth, requireOwner, async (req, res) => {
  const { name, address, city } = req.body;
  if (!name)
    return res.status(400).json({ message: "Studio name is required" });

  const studio = await prisma.studio.create({
    data: {
      ownerId: req.auth.sub,
      name,
      address: address || null,
      city: city || null,
    },
  });

  res.status(201).json(studio);
});

// ✅ LIST my studios
ownerRouter.get("/", requireAuth, requireOwner, async (req, res) => {
  const studios = await prisma.studio.findMany({
    where: { ownerId: req.auth.sub },
    orderBy: { createdAt: "desc" },
  });

  res.json(studios);
});

// ✅ LIST studio notifications
ownerRouter.get(
  "/studio/:studioId/notifications",
  requireAuth,
  requireOwner,
  async (req, res) => {
    try {
      const ownerId = req.auth.sub;
      const { studioId } = req.params;

      const studio = await prisma.studio.findFirst({
        where: {
          id: studioId,
          ownerId,
        },
        select: { id: true },
      });

      if (!studio) {
        return res.status(404).json({ message: "Studio not found" });
      }

      const notifications = await prisma.notification.findMany({
        where: { studioId },
        orderBy: { createdAt: "desc" },
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

      res.json({ notifications });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        message: e?.message || "Load notifications failed",
      });
    }
  },
);

// ✅ MARK notification as read
ownerRouter.patch(
  "/studio/:studioId/notifications/:notificationId/read",
  requireAuth,
  requireOwner,
  async (req, res) => {
    try {
      const ownerId = req.auth.sub;
      const { studioId, notificationId } = req.params;

      const studio = await prisma.studio.findFirst({
        where: {
          id: studioId,
          ownerId,
        },
        select: { id: true },
      });

      if (!studio) {
        return res.status(404).json({ message: "Studio not found" });
      }

      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          studioId,
        },
        select: { id: true },
      });

      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      const updated = await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
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
        },
      });
      io.to(`studio:${studioId}`).emit("notifications:updated");
      res.json({ notification: updated });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        message: e?.message || "Update notification failed",
      });
    }
  },
);

// ✅ MARK all studio notifications as read
ownerRouter.patch(
  "/studio/:studioId/notifications/read-all",
  requireAuth,
  requireOwner,
  async (req, res) => {
    try {
      const ownerId = req.auth.sub;
      const { studioId } = req.params;

      const studio = await prisma.studio.findFirst({
        where: {
          id: studioId,
          ownerId,
        },
        select: { id: true },
      });

      if (!studio) {
        return res.status(404).json({ message: "Studio not found" });
      }

      const result = await prisma.notification.updateMany({
        where: {
          studioId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
      io.to(`studio:${studioId}`).emit("notifications:updated");
      res.json({
        ok: true,
        updatedCount: result.count,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        message: e?.message || "Mark all notifications as read failed",
      });
    }
  },
);

// ✅ LIST studio clients CRM
ownerRouter.get(
  "/studio/:studioId/clients",
  requireAuth,
  requireOwner,
  async (req, res) => {
    try {
      const ownerId = req.auth.sub;
      const { studioId } = req.params;

      const studio = await prisma.studio.findFirst({
        where: {
          id: studioId,
          ownerId,
        },
        select: { id: true },
      });

      if (!studio) {
        return res.status(404).json({ message: "Studio not found" });
      }

      const bookings = await prisma.booking.findMany({
        where: { studioId },
        orderBy: { startAt: "desc" },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
              photoUrl: true,
              createdAt: true,
              birthDate: true,
              isVip: true,
              vipSince: true,
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

      const map = new Map();

      for (const booking of bookings) {
        const client = booking.client;
        if (!client?.id) continue;

        if (!map.has(client.id)) {
map.set(client.id, {
  id: client.id,

  firstName: client.firstName || "",
  lastName: client.lastName || "",

  name:
    [client.firstName, client.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    client.name ||
    "Клієнт",

  phone: client.phone || null,
  email: client.email || null,
  birthDate: client.birthDate || null,
  photoUrl: client.photoUrl || "",
  registeredAt: client.createdAt,
  isVip: client.isVip || false,
  vipSince: client.vipSince || null,
  bookings: 0,
  cancellations: 0,
  noShows: 0,
  spent: 0,
  servicesCount: {},
  mastersCount: {},
  allBookings: [],
});
        }

        const item = map.get(client.id);

        item.bookings += 1;

        if (booking.status === "CANCELED") {
          item.cancellations += 1;
        }

        if (booking.status !== "CANCELED") {
          item.spent += booking.service?.price || 0;
        }

        const serviceName = booking.service?.name || "—";
        const masterName = booking.master?.name || "—";

        if (booking.status !== "CANCELED") {
          item.servicesCount[serviceName] =
            (item.servicesCount[serviceName] || 0) + 1;

          item.mastersCount[masterName] =
            (item.mastersCount[masterName] || 0) + 1;
        }

        const startAt = booking.startAt ? new Date(booking.startAt) : null;
const isPast =
  booking.startAt &&
  new Date(booking.startAt).getTime() < Date.now();

let bookingStatus = booking.status;

if (
  booking.status !== "CANCELED" &&
  isPast
) {
  bookingStatus = "COMPLETED";
}
        item.allBookings.push({
          id: booking.id,
          date: booking.startAt,
          time: startAt
            ? `${String(startAt.getHours()).padStart(2, "0")}:${String(
                startAt.getMinutes(),
              ).padStart(2, "0")}`
            : "",
          service: serviceName,
          master: masterName,
          price: booking.service?.price || 0,
         status: bookingStatus,
          canceledBy: booking.canceledBy || null,
        });
      }

      const clientIds = Array.from(map.keys());

      const notes = clientIds.length
        ? await prisma.clientNote.findMany({
            where: {
              studioId,
              clientId: {
                in: clientIds,
              },
            },
            orderBy: {
              createdAt: "desc",
            },
            select: {
              id: true,
              clientId: true,
              text: true,
              createdAt: true,
            },
          })
        : [];

      const notesByClientId = new Map();

      const salonStatuses = clientIds.length
        ? await prisma.clientSalonStatus.findMany({
            where: {
              studioId,
              clientId: {
                in: clientIds,
              },
            },
            select: {
              clientId: true,
              isFavorite: true,
              favoriteSince: true,
            },
          })
        : [];

      const salonStatusByClientId = new Map();

      for (const status of salonStatuses) {
        salonStatusByClientId.set(status.clientId, status);
      }

      for (const note of notes) {
        if (!notesByClientId.has(note.clientId)) {
          notesByClientId.set(note.clientId, []);
        }

        notesByClientId.get(note.clientId).push({
          id: note.id,
          text: note.text,
          createdAt: note.createdAt,
        });
      }

      const clients = Array.from(map.values()).map((client) => {
        const completedBookings = client.allBookings.filter(
          (booking) => booking.status !== "CANCELED",
        );
        const currentDate = new Date();
const lastCompletedBooking =
  client.allBookings
    .filter(
      (booking) =>
        booking.status !== "CANCELED" &&
        booking.date &&
        new Date(booking.date) <= currentDate,
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0] || null;
        const lastBooking =
        completedBookings[0] || client.allBookings[0] || null;
        const nextBooking =
          client.allBookings
            .filter(
              (booking) =>
                booking.status !== "CANCELED" &&
                booking.date &&
                new Date(booking.date) > currentDate
            )
            .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null;
        const averageCheck = Math.round(
          client.spent / Math.max(completedBookings.length, 1),
        );

        const serviceEntries = Object.entries(client.servicesCount);

        let favoriteService = "Ще не сформовано";

        if (serviceEntries.length === 1) {
          favoriteService = serviceEntries[0][0];
        } else if (serviceEntries.length > 1) {
          const sortedServices = [...serviceEntries].sort(
            (a, b) => b[1] - a[1],
          );

          const maxCount = sortedServices[0][1];

          const leaders = sortedServices.filter(
            ([, count]) => count === maxCount,
          );

          if (leaders.length === 1) {
            favoriteService = leaders[0][0];
          }
        }

        const favoriteMaster =
          Object.entries(client.mastersCount).sort(
            (a, b) => b[1] - a[1],
          )[0]?.[0] || "—";

        let status = "new";

        const activeBookingsCount = completedBookings.length;
        const nowTs = Date.now();

        const lastActiveBooking = completedBookings[0] || null;

        const lastVisitTime = lastActiveBooking?.date
          ? new Date(lastActiveBooking.date).getTime()
          : 0;

        const daysSinceLastVisit = lastVisitTime
          ? Math.floor((nowTs - lastVisitTime) / (1000 * 60 * 60 * 24))
          : null;

        if (activeBookingsCount <= 1) {
          status = "new";
        } else if (daysSinceLastVisit !== null && daysSinceLastVisit <= 30) {
          status = "loyal";
        } else if (
          daysSinceLastVisit !== null &&
          daysSinceLastVisit > 30 &&
          daysSinceLastVisit <= 60
        ) {
          status = "attention";
        } else if (daysSinceLastVisit !== null && daysSinceLastVisit > 60) {
          status = "risk";
        }
        return {
          id: client.id,
          // name: client.name,
            firstName: client.firstName,
  lastName: client.lastName,
          phone: client.phone,
          email: client.email,
          photoUrl: client.photoUrl,
          registeredAt: client.registeredAt,
          birthDate: client.birthDate,
          status,
          isVip: client.isVip,
          vipSince: client.vipSince,
          isFavorite: salonStatusByClientId.get(client.id)?.isFavorite || false,
          favoriteSince:
            salonStatusByClientId.get(client.id)?.favoriteSince || null,
          bookings: client.bookings,
          cancellations: client.cancellations,
          noShows: client.noShows,
          lastVisit: lastCompletedBooking?.date || null,
          nextBooking: nextBooking
  ? {
      date: nextBooking.date,
      service: nextBooking.service,
      master: nextBooking.master,
    }
  : null,
          lastBooking: {
            date: lastBooking?.date || null,
            master: lastBooking?.master || "—",
            service: lastBooking?.service || "—",
            price: lastBooking?.price || 0,
            status: lastBooking?.status || "—",
          },
          favoriteMaster,
          favoriteService,
          spent: client.spent,
          averageCheck,
          notes: notesByClientId.get(client.id) || [],
          history: client.allBookings,
        };
      });

      res.json({ clients });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        message: e?.message || "Load clients failed",
      });
    }
  },
);

// ✅ ADD client note
ownerRouter.post(
  "/studio/:studioId/clients/:clientId/notes",
  requireAuth,
  requireOwner,
  async (req, res) => {
    try {
      const ownerId = req.auth.sub;
      const { studioId, clientId } = req.params;
      const text = String(req.body?.text || "").trim();

      if (!text) {
        return res.status(400).json({ message: "Note text is required" });
      }

      if (text.length > 100) {
        return res.status(400).json({ message: "Note is too long" });
      }

      const studio = await prisma.studio.findFirst({
        where: {
          id: studioId,
          ownerId,
        },
        select: { id: true },
      });

      if (!studio) {
        return res.status(404).json({ message: "Studio not found" });
      }

      const clientInStudio = await prisma.booking.findFirst({
        where: {
          studioId,
          clientId,
        },
        select: { id: true },
      });

      if (!clientInStudio) {
        return res.status(404).json({
          message: "Client not found in this studio",
        });
      }

      const note = await prisma.clientNote.create({
        data: {
          studioId,
          clientId,
          text,
        },
        select: {
          id: true,
          text: true,
          createdAt: true,
        },
      });

      res.status(201).json({ note });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        message: e?.message || "Create client note failed",
      });
    }
  },
);

// ✅ DELETE client note
ownerRouter.delete(
  "/studio/:studioId/clients/:clientId/notes/:noteId",
  requireAuth,
  requireOwner,
  async (req, res) => {
    try {
      const ownerId = req.auth.sub;
      const { studioId, clientId, noteId } = req.params;

      const studio = await prisma.studio.findFirst({
        where: {
          id: studioId,
          ownerId,
        },
        select: { id: true },
      });

      if (!studio) {
        return res.status(404).json({ message: "Studio not found" });
      }

      const note = await prisma.clientNote.findFirst({
        where: {
          id: noteId,
          studioId,
          clientId,
        },
        select: { id: true },
      });

      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }

      await prisma.clientNote.delete({
        where: { id: noteId },
      });

      res.json({ ok: true, deletedId: noteId });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        message: e?.message || "Delete client note failed",
      });
    }
  },
);

// ✅ SET salon favorite
ownerRouter.patch(
  "/studio/:studioId/clients/:clientId/favorite",
  requireAuth,
  requireOwner,
  async (req, res) => {
    try {
      const ownerId = req.auth.sub;
      const { studioId, clientId } = req.params;

      const studio = await prisma.studio.findFirst({
        where: {
          id: studioId,
          ownerId,
        },
        select: { id: true },
      });

      if (!studio) {
        return res.status(404).json({ message: "Studio not found" });
      }

      const clientInStudio = await prisma.booking.findFirst({
        where: {
          studioId,
          clientId,
        },
        select: { id: true },
      });

      if (!clientInStudio) {
        return res.status(404).json({
          message: "Client not found in this studio",
        });
      }

      const favorite = await prisma.clientSalonStatus.upsert({
        where: {
          studioId_clientId: {
            studioId,
            clientId,
          },
        },
        update: {
          isFavorite: true,
          favoriteSince: new Date(),
        },
        create: {
          studioId,
          clientId,
          isFavorite: true,
          favoriteSince: new Date(),
        },
        select: {
          clientId: true,
          isFavorite: true,
          favoriteSince: true,
        },
      });

      res.json({ favorite });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        message: e?.message || "Set salon favorite failed",
      });
    }
  },
);

// ✅ REMOVE salon favorite
ownerRouter.delete(
  "/studio/:studioId/clients/:clientId/favorite",
  requireAuth,
  requireOwner,
  async (req, res) => {
    try {
      const ownerId = req.auth.sub;
      const { studioId, clientId } = req.params;

      const studio = await prisma.studio.findFirst({
        where: {
          id: studioId,
          ownerId,
        },
        select: { id: true },
      });

      if (!studio) {
        return res.status(404).json({ message: "Studio not found" });
      }

      const clientInStudio = await prisma.booking.findFirst({
        where: {
          studioId,
          clientId,
        },
        select: { id: true },
      });

      if (!clientInStudio) {
        return res.status(404).json({
          message: "Client not found in this studio",
        });
      }

      const favorite = await prisma.clientSalonStatus.upsert({
        where: {
          studioId_clientId: {
            studioId,
            clientId,
          },
        },
        update: {
          isFavorite: false,
          favoriteSince: null,
        },
        create: {
          studioId,
          clientId,
          isFavorite: false,
          favoriteSince: null,
        },
        select: {
          clientId: true,
          isFavorite: true,
          favoriteSince: true,
        },
      });

      res.json({ favorite });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        message: e?.message || "Remove salon favorite failed",
      });
    }
  },
);

// ✅ UPDATE my studio
ownerRouter.patch("/:id", requireAuth, requireOwner, async (req, res) => {
  const { id } = req.params;
  const { name, address, city } = req.body;

  // перевіряємо, що студія належить owner
  const studio = await prisma.studio.findFirst({
    where: { id, ownerId: req.auth.sub },
  });

  if (!studio) return res.status(404).json({ message: "Studio not found" });

  const updated = await prisma.studio.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(address !== undefined ? { address: address || null } : {}),
      ...(city !== undefined ? { city: city || null } : {}),
    },
  });

  res.json(updated);
});
