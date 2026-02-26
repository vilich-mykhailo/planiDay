// auth.js //
import { verifyToken } from "../lib/jwt.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [, token] = header.split(" ");

  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }

  try {
    const payload = verifyToken(token);
    req.auth = payload; // { sub, kind }
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function requireOwner(req, res, next) {
  if (req.auth?.kind !== "owner") {
    return res.status(403).json({ message: "Owner access required" });
  }
  next();
}

export function requireClient(req, res, next) {
  if (req.auth?.kind !== "client") {
    return res.status(403).json({ message: "Client access required" });
  }
  next();
}