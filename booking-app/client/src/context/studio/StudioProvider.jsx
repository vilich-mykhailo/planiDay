// StudioProvider.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { StudioContext } from "./StudioContext";
import { api } from "../../api/http";

const STORAGE_KEY = "booking_app_studio_cache_v1";

function normalizeStudio(raw) {
  const s = raw || {};
  return {
    id: s.id ?? "",
    ownerId: s.ownerId ?? "",
    name: s.name ?? "",
    category: s.category ?? "",
    phone: s.phone ?? "",
    email: s.email ?? "",
    description: s.description ?? "",
    city: s.city ?? "",
    street: s.street ?? "",
    building: s.building ?? "",
    apartment: s.apartment ?? "",
    coverUrl: s.coverUrl ?? "",
    logoUrl: s.logoUrl ?? "",
    portfolioUrls: Array.isArray(s.portfolioUrls) ? s.portfolioUrls : [],
    published: Boolean(s.published),
    createdAt: s.createdAt ?? null,
    ownerCreatedAt: s.ownerCreatedAt ?? s.owner?.createdAt ?? null,
    updatedAt: s.updatedAt ?? null,
  };
}

export default function StudioProvider({ children }) {
  const [studio, setStudio] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return normalizeStudio(JSON.parse(raw));
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // завжди беремо актуальний токен (не з замикання)
  const getToken = () => localStorage.getItem("token") || "";
const getRole = () => localStorage.getItem("role") || "";

  const writeCache = useCallback((next) => {
    try {
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

const loadMyStudio = useCallback(async () => {
  const token = getToken();
  const role = getRole();

  if (!token || role !== "owner") {
    setStudio(null);
    setLoading(false);
    setError("");
    writeCache(null);
    return null;
  }

  setLoading(true);
  setError("");

  try {
    const data = await api("/studio/me", { token });
    const next = data ? normalizeStudio(data) : null;

    setStudio(next);
    writeCache(next);
    return next;
  } catch (e) {
    console.warn("Failed to load studio", e);
    setStudio(null);
    writeCache(null);
    setError(e?.message || "Failed to load studio");
    return null;
  } finally {
    setLoading(false);
  }
}, [writeCache]);

const updateStudio = useCallback(
  async (patch) => {
    const token = getToken();
    const role = getRole();

    if (!token) throw new Error("No token");
    if (role !== "owner") throw new Error("Owner access required");

    const body = {
      name: patch?.name ?? undefined,
      category: patch?.category ?? undefined,
      phone: patch?.phone ?? undefined,
      email: patch?.email ?? undefined,
      description: patch?.description ?? undefined,
      city: patch?.city ?? undefined,
      street: patch?.street ?? undefined,
      building: patch?.building ?? undefined,
      apartment: patch?.apartment ?? undefined,
      coverUrl: patch?.coverUrl ?? undefined,
      logoUrl: patch?.logoUrl ?? undefined,
      portfolioUrls: Array.isArray(patch?.portfolioUrls)
        ? patch.portfolioUrls
        : undefined,
      published:
        typeof patch?.published === "boolean" ? patch.published : undefined,
    };

    Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);

    const data = await api("/studio/me", {
      method: "PATCH",
      token,
      body,
    });

    const next = data ? normalizeStudio(data) : null;

    setStudio(next);
    writeCache(next);
    setError("");
    return next;
  },
  [writeCache],
);

  useEffect(() => {
    loadMyStudio();
  }, [loadMyStudio]);

  useEffect(() => {
    const onAuthChanged = () => loadMyStudio();
    window.addEventListener("auth-changed", onAuthChanged);
    return () => window.removeEventListener("auth-changed", onAuthChanged);
  }, [loadMyStudio]);

  const value = useMemo(
    () => ({
      studio,
      loading,
      error,
      reload: loadMyStudio,
      updateStudio,
      // createStudio не потрібен: GET /studio/me сам створює чернетку
    }),
    [studio, loading, error, loadMyStudio, updateStudio],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}