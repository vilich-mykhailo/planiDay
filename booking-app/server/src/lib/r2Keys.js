// r2Keys.js
import crypto from "crypto";
import path from "path";

function safeExt(originalName, mime) {
  const extFromName = path.extname(originalName || "").toLowerCase();
  if (extFromName) return extFromName;

  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  return ".jpg";
}

// ✅ STUDIOS
export function makeStudioKey({ studioId, kind, originalName, mime }) {
  const ext = safeExt(originalName, mime);
  const id = crypto.randomUUID();

  return `studios/${studioId}/${kind}/${id}${ext}`;
}

// ✅ CLIENTS (НОВЕ)
export function makeClientKey({ clientId, kind, originalName, mime }) {
  const ext = safeExt(originalName, mime);
  const id = crypto.randomUUID();

  return `clients/${clientId}/${kind}/${id}${ext}`;
}