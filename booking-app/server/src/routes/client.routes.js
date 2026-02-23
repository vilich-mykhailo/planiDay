import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireClient } from "../middleware/auth.js";

export const clientRouter = Router();

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