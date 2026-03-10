//owner.routes.js //
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireOwner } from "../middleware/auth.js";

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