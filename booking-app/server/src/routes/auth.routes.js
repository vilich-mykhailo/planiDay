import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { signToken } from "../lib/jwt.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

function validateEmailPassword(email, password) {
  if (!email || !password) return "Email and password are required";
  if (password.length < 6) return "Password must be at least 6 characters";
  return null;
}

// OWNER register
authRouter.post("/owner/register", async (req, res) => {
  const { email, password, name, phone } = req.body;
  const err = validateEmailPassword(email, password);
  if (err) return res.status(400).json({ message: err });

  const exists = await prisma.ownerAccount.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ message: "Email already used" });

  const passwordHash = await hashPassword(password);
  const owner = await prisma.ownerAccount.create({
    data: { email, passwordHash, name, phone }
  });

  const token = signToken({ sub: owner.id, kind: "owner" });
  res.json({ token, kind: "owner" });
});

// OWNER login
authRouter.post("/owner/login", async (req, res) => {
  const { email, password } = req.body;
  const err = validateEmailPassword(email, password);
  if (err) return res.status(400).json({ message: err });

  const owner = await prisma.ownerAccount.findUnique({ where: { email } });
  if (!owner) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await verifyPassword(password, owner.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken({ sub: owner.id, kind: "owner" });
  res.json({ token, kind: "owner" });
});

// CLIENT register
authRouter.post("/client/register", async (req, res) => {
  const { email, password, name, phone } = req.body;
  const err = validateEmailPassword(email, password);
  if (err) return res.status(400).json({ message: err });

  const exists = await prisma.clientAccount.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ message: "Email already used" });

  const passwordHash = await hashPassword(password);
  const client = await prisma.clientAccount.create({
    data: { email, passwordHash, name, phone }
  });

  const token = signToken({ sub: client.id, kind: "client" });
  res.json({ token, kind: "client" });
});

// CLIENT login
authRouter.post("/client/login", async (req, res) => {
  const { email, password } = req.body;
  const err = validateEmailPassword(email, password);
  if (err) return res.status(400).json({ message: err });

  const client = await prisma.clientAccount.findUnique({ where: { email } });
  if (!client) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await verifyPassword(password, client.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken({ sub: client.id, kind: "client" });
  res.json({ token, kind: "client" });
});

// ME
authRouter.get("/me", requireAuth, async (req, res) => {
  const { sub, kind } = req.auth;

  if (kind === "owner") {
    const owner = await prisma.ownerAccount.findUnique({
      where: { id: sub },
      select: { id: true, email: true, name: true, phone: true, createdAt: true }
    });
    return res.json({ kind, account: owner });
  }

  const client = await prisma.clientAccount.findUnique({
    where: { id: sub },
    select: { id: true, email: true, name: true, phone: true, createdAt: true }
  });
  return res.json({ kind, account: client });
});