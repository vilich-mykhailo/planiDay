//owner.routes.js //
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireOwner } from "../middleware/auth.js";
import { io } from "../index.js";
export const ownerRouter = Router();

// CREATE studio
ownerRouter.post("/", requireAuth, requireOwner, async (req, res) => {
  const { name, address, city } = req.body;
  if (!name) return res.status(400).json({ message: "Studio name is required" });

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