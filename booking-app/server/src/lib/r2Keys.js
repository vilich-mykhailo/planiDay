import crypto from "crypto";
import path from "path";

function safeExt(originalName, mime) {
  const extFromName = path.extname(originalName || "").toLowerCase();
  if (extFromName) return extFromName;

  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  return ".jpg";
}

export function makeStudioKey({ studioId, kind, originalName, mime }) {
  const ext = safeExt(originalName, mime);
  const id = crypto.randomUUID();

  // 👇 Ось тут формуємо "папки"
  return `studios/${studioId}/${kind}/${id}${ext}`;
}