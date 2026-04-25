// Profile.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import {
  Sparkles,
  Phone,
  Mail,
  CalendarDays,
  VenusAndMars,
  CheckCircle2,
  ShieldCheck,
  X,
  BadgeCheck,
  LogOut,
  CircleDashed,
  Image as ImageIcon,
  PencilLine,
  AlertTriangle,
} from "lucide-react";
import { api } from "../../api/http";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const PUBLIC = import.meta.env.VITE_R2_PUBLIC_BASE_URL;

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function toPublicUrl(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return PUBLIC ? `${PUBLIC}/${s}` : s;
}

async function fetchClientProfile() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  const data = await api("/client/me", { token });

  return {
    firstName: data?.firstName || "",
    lastName: data?.lastName || "",
    phone: data?.phone || "",
    email: data?.email || "",
    birthDate: data?.birthDate ? String(data.birthDate).slice(0, 10) : "",
    gender: data?.gender || "unknown",
    photoUrl: data?.photoUrl || "",
  };
}

function Input(props) {
  return (
    <input
      {...props}
      className={cx(
        "w-full rounded-2xl border px-4 py-3 text-[14px] outline-none transition-all duration-200",
        "border-[var(--color-mist)] bg-white text-[var(--color-ink)]",
        "placeholder:text-[color:var(--color-caramel)]/70",
        "focus:border-[var(--color-caramel)] focus:ring-4 focus:ring-[color:var(--color-caramel)]/15",
        props.disabled &&
          "cursor-not-allowed border-[var(--color-mist)] bg-[var(--color-cream)] text-[color:var(--color-caramel)]/80 placeholder:text-[color:var(--color-caramel)]/60",
        props.className,
      )}
    />
  );
}

function Select(props) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      <select
        {...props}
        onFocus={(e) => {
          setOpen(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setOpen(false);
          props.onBlur?.(e);
        }}
        onChange={(e) => {
          props.onChange?.(e);
          setOpen(false);
        }}
        className={cx(
          "w-full appearance-none rounded-2xl border px-4 py-3 pr-11 text-[14px] outline-none transition-all duration-200",
          "border-[var(--color-mist)] bg-white text-[var(--color-ink)]",
          "focus:border-[var(--color-caramel)] focus:ring-4 focus:ring-[color:var(--color-caramel)]/15",
          props.className,
        )}
      >
        {props.children}
      </select>

      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
        <svg
          className={cx(
            "h-4 w-4 text-[var(--color-caramel)] transition-transform duration-200 ease-out",
            open ? "rotate-180" : "rotate-0",
          )}
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M6 8l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-sm font-bold transition-all duration-200 active:scale-[0.98]",
        props.disabled
          ? "cursor-not-allowed border border-[var(--color-mist)] bg-[var(--color-cream)] text-[color:var(--color-caramel)]/70 shadow-none"
          : "bg-[var(--color-forest)] text-white shadow-[var(--shadow-button)] hover:bg-[var(--color-forest-dark)]",
        props.className,
      )}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[18px] border px-4 py-3 text-sm font-bold transition-all duration-200 active:scale-[0.98]",
        props.disabled
          ? "cursor-not-allowed border-[var(--color-mist)] bg-[var(--color-cream)] text-[color:var(--color-caramel)]/70"
          : "border-[var(--color-mist)] bg-white text-[var(--color-ink)] hover:border-[var(--color-sand)] hover:bg-[var(--color-cream)] hover:shadow-sm",
        props.className,
      )}
    >
      {children}
    </button>
  );
}

function GhostDangerButton({ children, ...props }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[18px] border px-4 py-3 text-sm font-bold transition-all duration-200 active:scale-[0.98]",
        props.disabled
          ? "cursor-not-allowed border-[var(--color-mist)] bg-[var(--color-cream)] text-[color:var(--color-caramel)]/70"
          : "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger)] hover:bg-[color:var(--color-danger-bg)]/80 hover:shadow-sm",
        props.className,
      )}
    >
      {children}
    </button>
  );
}

function SectionCard({ className, children }) {
  return (
    <section
      className={cx(
        "overflow-hidden rounded-[28px] border bg-white shadow-[var(--shadow-soft)]",
        "border-[var(--color-mist)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

function FormField({ label, hint, children }) {
  return (
    <label className="block space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-[var(--color-ink)]">
          {label}
        </span>
        {hint ? (
          <span className="text-[11px] font-medium text-[var(--color-caramel)]">
            {hint}
          </span>
        ) : null}
      </div>
      {children}
    </label>
  );
}

function EditModal({
  open,
  title,
  children,
  onClose,
  onSave,
  saveDisabled = false,
  saving = false,
}) {
  React.useEffect(() => {
    if (!open) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-[28px] border border-[var(--color-mist)] bg-white shadow-[0_24px_80px_rgba(20,18,16,0.18)]">
        <div className="flex items-center justify-between border-b border-[var(--color-cream)] px-5 py-4 sm:px-6">
          <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-ink)]">
            {title}
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--color-mist)] bg-white text-[var(--color-caramel)] transition hover:bg-[var(--color-cream)] hover:text-[var(--color-ink)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-5 sm:px-6">{children}</div>

        <div className="flex flex-col-reverse gap-2 border-t border-[var(--color-cream)] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <SecondaryButton type="button" onClick={onClose} className="w-full sm:w-auto">
            Скасувати
          </SecondaryButton>

          <PrimaryButton
            type="button"
            onClick={onSave}
            disabled={saveDisabled || saving}
            className="w-full sm:w-auto"
          >
            {saving ? "Збереження..." : "Зберегти"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={cx("animate-pulse rounded-2xl bg-[var(--color-cream)]", className)}
    />
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen pb-[calc(env(safe-area-inset-bottom)+68px)] sm:pb-0">
      <div className="mx-auto max-w-6xl px-2.5 pb-4 pt-0 sm:px-4 sm:pb-8 sm:pt-14 lg:pt-16">
        <div className="space-y-3 px-0 pt-2 sm:space-y-5 sm:pt-8 lg:pt-6">
          <section className="overflow-hidden rounded-[22px] border border-[var(--color-mist)] bg-white shadow-[var(--shadow-soft)] sm:rounded-3xl">
            <div className="h-[2px] bg-[linear-gradient(90deg,var(--color-forest),var(--color-caramel),var(--color-ink))] opacity-50" />

            <div className="px-3.5 pb-5 pt-5 sm:px-6 sm:pb-4 sm:pt-5 lg:px-8 lg:pt-6">
              <div className="mb-4 space-y-2.5 sm:mb-4 sm:space-y-2 lg:mb-5">
                <SkeletonBlock className="hidden h-8 w-40 rounded-full sm:block" />
                <SkeletonBlock className="h-10 w-[290px] max-w-full rounded-2xl sm:h-14 sm:w-[470px]" />
                <SkeletonBlock className="h-4 w-full max-w-[680px] rounded-xl sm:h-5" />
              </div>
            </div>
          </section>

          <div className="space-y-4">
            <section className="overflow-hidden rounded-[28px] border border-[var(--color-mist)] bg-[radial-gradient(circle_at_top_left,rgba(180,140,108,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(50,78,41,0.10),transparent_24%),linear-gradient(135deg,#ffffff_0%,#f7f5ef_48%,#fff_100%)] shadow-[var(--shadow-soft)]">
              <div className="relative p-4 sm:p-6 lg:p-7">
                <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
                  <div className="rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-[var(--shadow-soft)] backdrop-blur">
                    <div className="flex flex-col items-center text-center">
                      <SkeletonBlock className="h-32 w-32 rounded-[32px]" />

                      <SkeletonBlock className="mt-5 h-6 w-32 rounded-full" />

                      <div className="mt-3 flex items-center justify-center gap-2">
                        <SkeletonBlock className="h-8 w-40 rounded-xl" />
                        <SkeletonBlock className="h-9 w-9 rounded-xl" />
                      </div>

                      <SkeletonBlock className="mt-2 h-4 w-56 rounded-xl" />
                      <SkeletonBlock className="mt-2 h-4 w-44 rounded-xl" />

                      <div className="mt-5 flex w-full flex-col gap-2 sm:flex-row lg:flex-col">
                        <SkeletonBlock className="h-12 w-full rounded-2xl" />
                        <SkeletonBlock className="h-12 w-full rounded-2xl" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="rounded-[28px] border border-white/70 bg-white/95 p-5 shadow-[var(--shadow-soft)] backdrop-blur sm:p-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <SkeletonBlock className="h-3 w-28 rounded-xl" />
                          <SkeletonBlock className="mt-3 h-8 w-60 rounded-2xl" />
                          <SkeletonBlock className="mt-3 h-4 w-full max-w-[360px] rounded-xl" />
                        </div>

                        <SkeletonBlock className="h-10 w-44 rounded-2xl" />
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-mist)] bg-white px-3 py-3"
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <SkeletonBlock className="h-9 w-9 shrink-0 rounded-xl" />
                              <div className="min-w-0 flex-1">
                                <SkeletonBlock className="h-3 w-20 rounded-xl" />
                                <SkeletonBlock className="mt-2 h-4 w-28 rounded-xl" />
                              </div>
                            </div>

                            <SkeletonBlock className="h-8 w-20 shrink-0 rounded-xl" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-[28px] border border-[var(--color-danger-border)] bg-white shadow-[0_14px_40px_-24px_rgba(213,92,82,0.26)]">
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="min-w-0">
                  <SkeletonBlock className="h-6 w-40 rounded-xl" />
                  <SkeletonBlock className="mt-2 h-4 w-64 rounded-xl" />
                </div>

                <SkeletonBlock className="h-12 w-full rounded-2xl sm:w-[220px]" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["client-profile"],
    queryFn: fetchClientProfile,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    birthDate: "",
    gender: "unknown",
    photoUrl: "",
  });
  const [modal, setModal] = useState({
    type: "",
    open: false,
  });

  const [draft, setDraft] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    birthDate: "",
    gender: "unknown",
  });
  const [initialProfile, setInitialProfile] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    birthDate: "",
    gender: "unknown",
    photoUrl: "",
  });

  const [isSaved, setIsSaved] = useState(false);
  const loading = profileQuery.isLoading && !profileQuery.data;
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [pendingDeletePhotoKey, setPendingDeletePhotoKey] = useState("");

  const [errorModal, setErrorModal] = useState({
    open: false,
    title: "",
    message: "",
  });
  const [toast, setToast] = useState({
    id: 0,
    open: false,
    type: "success",
    title: "",
    text: "",
    duration: 2600,
  });
  const fileRef = useRef(null);

  function handleLogout() {
    queryClient.removeQueries({ queryKey: ["client-profile"] });
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/login", { replace: true });
  }

  const initials = useMemo(() => {
    const a = (profile.firstName || "").trim().slice(0, 1).toUpperCase();
    const b = (profile.lastName || "").trim().slice(0, 1).toUpperCase();
    return (a + b).trim() || "U";
  }, [profile.firstName, profile.lastName]);

  const photoSrc = photoPreviewUrl || toPublicUrl(profile.photoUrl);
  const isProfileComplete = useMemo(() => {
    return Boolean(
      initialProfile.firstName.trim() &&
        initialProfile.birthDate &&
        initialProfile.gender &&
        initialProfile.gender !== "unknown" &&
        initialProfile.photoUrl,
    );
  }, [
    initialProfile.firstName,
    initialProfile.birthDate,
    initialProfile.gender,
    initialProfile.photoUrl,
  ]);
  const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();

  const genderLabel = useMemo(() => {
    if (profile.gender === "female") return "Жіноча";
    if (profile.gender === "male") return "Чоловіча";
    if (profile.gender === "other") return "Інше";
    return "Не вказано";
  }, [profile.gender]);

  React.useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  useEffect(() => {
    if (!profileQuery.data) return;

    setProfile(profileQuery.data);
    setInitialProfile(profileQuery.data);
    setIsSaved(true);
  }, [profileQuery.data]);

  function stageDeletePhoto(key) {
    const k = String(key || "").trim();
    if (!k) return;
    if (/^https?:\/\//i.test(k)) return;
    setPendingDeletePhotoKey(k);
  }

  function showToast({ type = "success", title, text }) {
    const duration = 2600;

    setToast({
      id: Date.now(),
      open: true,
      type,
      title,
      text,
      duration,
    });

    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      setToast((prev) => ({ ...prev, open: false }));
    }, duration);
  }

  function openEditModal(type) {
    setDraft({
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      phone: profile.phone || "",
      email: profile.email || "",
      birthDate: profile.birthDate || "",
      gender: profile.gender || "unknown",
    });

    setModal({ type, open: true });
  }

  function closeEditModal() {
    setModal({ type: "", open: false });
  }

  async function saveModalChanges() {
    try {
      setSaving(true);
      setApiError("");

      const token = localStorage.getItem("token");

      const body = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        birthDate: profile.birthDate || null,
        gender: profile.gender,
        photoUrl: profile.photoUrl || null,
      };

      if (modal.type === "name") {
        body.firstName = draft.firstName;
        body.lastName = draft.lastName;
      }

      if (modal.type === "birthDate") {
        body.birthDate = draft.birthDate || null;
      }

      if (modal.type === "gender") {
        body.gender = draft.gender;
      }

      const updatedRaw = await api("/client/me", {
        method: "PATCH",
        token,
        body,
      });

      const updated = {
        firstName: updatedRaw?.firstName || "",
        lastName: updatedRaw?.lastName || "",
        phone: updatedRaw?.phone || "",
        email: updatedRaw?.email || "",
        birthDate: updatedRaw?.birthDate
          ? String(updatedRaw.birthDate).slice(0, 10)
          : "",
        gender: updatedRaw?.gender || "unknown",
        photoUrl: updatedRaw?.photoUrl || "",
      };

      queryClient.setQueryData(["client-profile"], updated);

      setProfile(updated);
      setInitialProfile(updated);
      setIsSaved(true);
      closeEditModal();
      showToast({
        type: "success",
        title: "Збережено",
        text: "Дані профілю оновлено",
      });
    } catch (e) {
      const raw = String(e?.message || "").toLowerCase();

      const isOffline =
        !navigator.onLine ||
        raw.includes("failed to fetch") ||
        raw.includes("network");

      showToast({
        type: "error",
        title: isOffline ? "Немає підключення" : "Помилка",
        text: isOffline ? "Перевірте інтернет" : "Не вдалося зберегти зміни",
      });
    } finally {
      setSaving(false);
    }
  }

  async function onPickPhoto(file) {
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE) {
      setErrorModal({
        open: true,
        title: "Файл завеликий",
        message: "Оберіть фото до 5 MB.",
      });
      return;
    }

    if (!file.type?.startsWith("image/")) {
      setErrorModal({
        open: true,
        title: "Невірний формат",
        message: "Оберіть файл зображення.",
      });
      return;
    }

    try {
      setSaving(true);
      setApiError("");
      setPhotoFile(file);

      const token = localStorage.getItem("token");
      const previousPhotoKey = String(profile.photoUrl || "").trim();

      const out = await uploadClientPhoto(file, token);
      const nextPhotoKey = out?.key || "";

      const updatedRaw = await api("/client/me", {
        method: "PATCH",
        token,
        body: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          birthDate: profile.birthDate || null,
          gender: profile.gender,
          photoUrl: nextPhotoKey || null,
        },
      });

      const updated = {
        firstName: updatedRaw?.firstName || "",
        lastName: updatedRaw?.lastName || "",
        phone: updatedRaw?.phone || "",
        email: updatedRaw?.email || "",
        birthDate: updatedRaw?.birthDate
          ? String(updatedRaw.birthDate).slice(0, 10)
          : "",
        gender: updatedRaw?.gender || "unknown",
        photoUrl: updatedRaw?.photoUrl || "",
      };

      queryClient.setQueryData(["client-profile"], updated);

      setProfile(updated);
      setInitialProfile(updated);
      setPhotoFile(null);
      setPhotoPreviewUrl("");
      setPendingDeletePhotoKey("");
      setIsSaved(true);

      showToast({
        type: "success",
        title: "Фото оновлено",
        text: "Нове фото профілю збережено",
      });

      if (
        previousPhotoKey &&
        previousPhotoKey !== nextPhotoKey &&
        !/^https?:\/\//i.test(previousPhotoKey)
      ) {
        try {
          await deleteFromR2(previousPhotoKey);
        } catch (err) {
          console.error(err);
        }
      }
    } catch (e) {
      console.error(e);
      setPhotoFile(null);
      setPhotoPreviewUrl("");

      const raw = String(e?.message || "").toLowerCase();

      const isOffline =
        !navigator.onLine ||
        raw.includes("failed to fetch") ||
        raw.includes("network");

      showToast({
        type: "error",
        title: isOffline ? "Немає підключення" : "Помилка",
        text: isOffline ? "Перевірте інтернет" : "Не вдалося оновити фото",
      });
    } finally {
      setSaving(false);
    }
  }

  async function removePhoto() {
    const currentPhotoKey = String(profile.photoUrl || "").trim();
    if (!currentPhotoKey && !photoFile) return;

    try {
      setSaving(true);
      setApiError("");

      const token = localStorage.getItem("token");

      const updatedRaw = await api("/client/me", {
        method: "PATCH",
        token,
        body: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          birthDate: profile.birthDate || null,
          gender: profile.gender,
          photoUrl: null,
        },
      });

      const updated = {
        firstName: updatedRaw?.firstName || "",
        lastName: updatedRaw?.lastName || "",
        phone: updatedRaw?.phone || "",
        email: updatedRaw?.email || "",
        birthDate: updatedRaw?.birthDate
          ? String(updatedRaw.birthDate).slice(0, 10)
          : "",
        gender: updatedRaw?.gender || "unknown",
        photoUrl: updatedRaw?.photoUrl || "",
      };

      queryClient.setQueryData(["client-profile"], updated);

      setPhotoFile(null);
      setPhotoPreviewUrl("");
      setProfile(updated);
      setInitialProfile(updated);
      setPendingDeletePhotoKey("");
      setIsSaved(true);

      showToast({
        type: "success",
        title: "Фото видалено",
        text: "Фото профілю успішно видалено",
      });

      if (currentPhotoKey && !/^https?:\/\//i.test(currentPhotoKey)) {
        try {
          await deleteFromR2(currentPhotoKey);
        } catch (err) {
          console.error(err);
        }
      }
    } catch (e) {
      console.error(e);
      const raw = String(e?.message || "").toLowerCase();

      const isOffline =
        !navigator.onLine ||
        raw.includes("failed to fetch") ||
        raw.includes("network");

      showToast({
        type: "error",
        title: isOffline ? "Немає підключення" : "Помилка",
        text: isOffline ? "Перевірте інтернет" : "Не вдалося видалити фото",
      });
    } finally {
      setSaving(false);
    }
  }

  async function uploadClientPhoto(file, token) {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch(`${import.meta.env.VITE_API_URL}/media/client`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.message || "Upload failed");
    }

    return data;
  }

  async function deleteFromR2(key) {
    const token = localStorage.getItem("token");

    const res = await fetch(`${import.meta.env.VITE_API_URL}/media/delete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ key }),
    });

    if (!res.ok) {
      throw new Error("Delete failed");
    }
  }

  async function saveProfile(e) {
    e?.preventDefault?.();

    try {
      setSaving(true);
      setApiError("");

      const token = localStorage.getItem("token");

      let nextPhotoKey = String(profile.photoUrl || "").trim();
      const deletesAfterSave = [];

      if (photoFile) {
        const previousPhotoKey = String(profile.photoUrl || "").trim();
        const out = await uploadClientPhoto(photoFile, token);
        nextPhotoKey = out?.key || "";

        if (
          previousPhotoKey &&
          previousPhotoKey !== nextPhotoKey &&
          !/^https?:\/\//i.test(previousPhotoKey)
        ) {
          deletesAfterSave.push(previousPhotoKey);
        }
      }

      if (pendingDeletePhotoKey && !/^https?:\/\//i.test(pendingDeletePhotoKey)) {
        deletesAfterSave.push(pendingDeletePhotoKey);
      }

      const updatedRaw = await api("/client/me", {
        method: "PATCH",
        token,
        body: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          birthDate: profile.birthDate || null,
          gender: profile.gender,
          photoUrl: nextPhotoKey || null,
        },
      });

      const updated = {
        firstName: updatedRaw?.firstName || "",
        lastName: updatedRaw?.lastName || "",
        phone: updatedRaw?.phone || "",
        email: updatedRaw?.email || "",
        birthDate: updatedRaw?.birthDate
          ? String(updatedRaw.birthDate).slice(0, 10)
          : "",
        gender: updatedRaw?.gender || "unknown",
        photoUrl: updatedRaw?.photoUrl || "",
      };

      queryClient.setQueryData(["client-profile"], updated);

      setProfile(updated);
      setInitialProfile(updated);
      setPhotoFile(null);
      setPhotoPreviewUrl("");
      setPendingDeletePhotoKey("");
      setIsSaved(true);

      const uniqDeletes = Array.from(new Set(deletesAfterSave)).filter(Boolean);

      for (const key of uniqDeletes) {
        try {
          await deleteFromR2(key);
        } catch (err) {
          console.error(err);
        }
      }

      showToast({
        type: "success",
        title: "Збережено",
        text: "Профіль оновлено",
      });
    } catch (e) {
      console.error(e);

      const raw = String(e?.message || "").toLowerCase();

      const isOffline =
        !navigator.onLine ||
        raw.includes("failed to fetch") ||
        raw.includes("network");

      showToast({
        type: "error",
        title: isOffline ? "Немає підключення" : "Помилка",
        text: isOffline ? "Перевірте інтернет" : "Не вдалося зберегти профіль",
      });
    } finally {
      setSaving(false);
    }
  }

  function resetProfileFields() {
    setProfile((p) => ({
      ...p,
      firstName: "",
      lastName: "",
      birthDate: "",
      gender: "unknown",
    }));
    setIsSaved(false);
  }

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="min-h-screen pb-[calc(env(safe-area-inset-bottom)+68px)] sm:pb-0">
      <div className="mx-auto max-w-6xl px-2.5 pb-4 pt-0 sm:px-4 sm:pb-8 sm:pt-14 lg:pt-16">
        <div className="space-y-3 px-0 pt-2 sm:space-y-5 sm:pt-8 lg:pt-6">
          <section className="overflow-hidden rounded-[22px] border border-[var(--color-mist)] bg-white shadow-[var(--shadow-soft)] sm:rounded-3xl">
            <div className="h-[2px] bg-[linear-gradient(90deg,var(--color-forest),var(--color-caramel),var(--color-ink))] opacity-70" />

            <div className="px-3.5 pb-5 pt-5 sm:px-6 sm:pb-4 sm:pt-5 lg:px-8 lg:pt-6">
              <div className="mb-4 space-y-2.5 sm:mb-4 sm:space-y-2 lg:mb-5">
                <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[var(--color-pending-bg)] px-3 py-1 sm:px-4 sm:py-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--color-forest)] sm:h-4 sm:w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-forest)] sm:text-xs sm:tracking-[0.22em]">
                    Особистий кабінет
                  </span>
                </div>

                <h1 className="max-w-full text-[28px] font-black leading-[1.02] tracking-[-0.035em] text-[var(--color-ink)] sm:max-w-none sm:!text-5xl lg:!text-5xl">
                  Керуйте своїм{" "}
                  <span className="text-[var(--color-caramel)]">профілем</span>
                </h1>

                <p className="max-w-2xl text-[13px] leading-5 text-[color:var(--color-caramel)]/85 sm:text-base sm:leading-7">
                  Оновлюй особисті дані, номер телефону та пошту, щоб бронювання
                  проходили швидко і без зайвих кроків.
                </p>
              </div>
            </div>
          </section>

          <div className="space-y-4">
            <SectionCard className="overflow-hidden border-0 bg-transparent shadow-none">
              <div className="relative overflow-hidden rounded-[32px] border border-[var(--color-mist)] bg-[radial-gradient(circle_at_top_left,rgba(180,140,108,0.22),transparent_28%),radial-gradient(circle_at_top_right,rgba(50,78,41,0.12),transparent_24%),linear-gradient(135deg,#ffffff_0%,#f7f5ef_48%,#fff_100%)] shadow-[var(--shadow-soft)]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(180,140,108,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(180,140,108,0.08)_1px,transparent_1px)] bg-[size:22px_22px] opacity-40" />
                <div className="absolute -left-16 top-10 h-40 w-40 rounded-full bg-[color:var(--color-sand)]/60 blur-3xl" />
                <div className="absolute -right-12 top-0 h-44 w-44 rounded-full bg-[color:var(--color-confirmed-bg)]/70 blur-3xl" />

                <div className="relative p-4 sm:p-6 lg:p-7">
                  <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
                    <div className="rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-[var(--shadow-soft)] backdrop-blur">
                      <div className="flex flex-col items-center text-center">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            className="group relative grid h-32 w-32 place-items-center overflow-hidden rounded-[32px] border border-white bg-white shadow-[0_16px_40px_rgba(0,0,0,0.12)] transition duration-200 hover:scale-[1.02]"
                            disabled={saving}
                          >
                            {photoSrc ? (
                              <img
                                src={photoSrc}
                                alt="avatar"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-4xl font-black tracking-[-0.05em] text-[var(--color-ink)]">
                                {initials}
                              </span>
                            )}

                            <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
                          </button>
                        </div>

                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            onPickPhoto(file);
                          }}
                        />

                        <div className="mt-5">
                          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-sand)] bg-[var(--color-pending-bg)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-forest)]">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Профіль клієнта
                          </div>

                          <div className="mt-3 flex items-center justify-center gap-2">
                            <h2 className="text-[24px] font-black tracking-[-0.04em] text-[var(--color-ink)]">
                              {fullName || "Ваш профіль"}
                            </h2>

                            <button
                              type="button"
                              onClick={() => openEditModal("name")}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-mist)] bg-white text-[var(--color-caramel)] transition hover:-translate-y-0.5 hover:border-[var(--color-sand)] hover:bg-[var(--color-pending-bg)] hover:text-[var(--color-forest)]"
                              title="Змінити ім’я та прізвище"
                            >
                              <PencilLine className="h-4 w-4" />
                            </button>
                          </div>

                          <p className="mt-2 text-sm leading-6 text-[color:var(--color-caramel)]/85">
                            Тут можна швидко оновити фото, особисті дані та
                            контакти.
                          </p>
                        </div>

                        <div className="mt-5 flex w-full flex-col gap-2 sm:flex-row lg:flex-col">
                          <SecondaryButton
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            className="w-full sm:flex-1 rounded-2xl"
                            disabled={saving}
                          >
                            <ImageIcon className="h-4 w-4" />
                            {saving ? "Оновлення..." : "Оновити фото"}
                          </SecondaryButton>

                          {(profile.photoUrl || photoFile) && (
                            <GhostDangerButton
                              type="button"
                              onClick={removePhoto}
                              className="w-full sm:flex-1 rounded-2xl"
                              disabled={saving}
                            >
                              <X className="h-4 w-4" />
                              {saving ? "Видалення..." : "Видалити фото"}
                            </GhostDangerButton>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[var(--shadow-soft)] backdrop-blur sm:p-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-caramel)]">
                              Особисті дані
                            </p>
                            <h3 className="mt-2 text-[26px] font-black leading-none tracking-[-0.04em] text-[var(--color-ink)]">
                              Керуйте профілем
                            </h3>
                            <p className="mt-3 max-w-xl text-sm leading-6 text-[color:var(--color-caramel)]/85">
                              Оновлюйте ключову інформацію в одному місці.
                            </p>
                          </div>

                          <div
                            className={cx(
                              "inline-flex w-fit items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold",
                              isProfileComplete
                                ? "border-[var(--color-sand)] bg-[var(--color-confirmed-bg)] text-[var(--color-forest)]"
                                : "border-[var(--color-sand)] bg-[var(--color-pending-bg)] text-[var(--color-caramel-dark)]",
                            )}
                          >
                            {isProfileComplete ? (
                              <BadgeCheck className="h-4 w-4" />
                            ) : (
                              <CircleDashed className="h-4 w-4" />
                            )}

                            {isProfileComplete
                              ? "Профіль заповнено"
                              : "Профіль не завершено"}
                          </div>
                        </div>

                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          {[
                            {
                              label: "Телефон",
                              value: profile.phone || "Не вказано",
                              icon: <Phone className="h-4 w-4" />,
                              type: "phone",
                            },
                            {
                              label: "Email",
                              value: profile.email || "Не вказано",
                              icon: <Mail className="h-4 w-4" />,
                              type: "email",
                            },
                            {
                              label: "Стать",
                              value: genderLabel,
                              icon: <VenusAndMars className="h-4 w-4" />,
                              type: "gender",
                            },
                            {
                              label: "Дата народження",
                              value: profile.birthDate || "Не вказано",
                              icon: <CalendarDays className="h-4 w-4" />,
                              type: "birthDate",
                            },
                          ].map((item) => (
                            <button
                              key={item.type}
                              type="button"
                              onClick={() => openEditModal(item.type)}
                              className="group flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-mist)] bg-white px-3 py-3 text-left transition hover:border-[var(--color-sand)] hover:bg-[color:var(--color-cream)]/80"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-cream)] text-[var(--color-caramel)] transition group-hover:bg-[var(--color-pending-bg)] group-hover:text-[var(--color-forest)]">
                                  {item.icon}
                                </div>

                                <div className="min-w-0">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-caramel)]">
                                    {item.label}
                                  </p>
                                  <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                                    {item.value}
                                  </p>
                                </div>
                              </div>

                              <span className="shrink-0 rounded-xl border border-[var(--color-mist)] bg-white px-3 py-1 text-xs font-semibold text-[var(--color-caramel)] transition group-hover:border-[var(--color-sand)] group-hover:bg-[var(--color-pending-bg)] group-hover:text-[var(--color-forest)]">
                                Змінити
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            <div className="lg:hidden sm:hidden">
              <SectionCard className="overflow-hidden border-[var(--color-danger-border)] bg-white shadow-[0_14px_40px_-24px_rgba(213,92,82,0.26)]">
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="min-w-0">
                    <h3 className="text-lg font-black tracking-[-0.03em] text-[var(--color-ink)]">
                      Вийти з акаунта
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-[color:var(--color-caramel)]/85">
                      Завершіть поточну сесію на цьому пристрої.
                    </p>
                  </div>

                  <GhostDangerButton
                    type="button"
                    onClick={handleLogout}
                    className="min-w-[220px] rounded-2xl"
                  >
                    <LogOut className="h-4 w-4" />
                    Вийти
                  </GhostDangerButton>
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      </div>

      <EditModal
        open={modal.open && modal.type === "name"}
        title="Змінити ім’я та прізвище"
        onClose={closeEditModal}
        onSave={saveModalChanges}
        saveDisabled={!draft.firstName.trim()}
        saving={saving}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Ім’я">
            <Input
              value={draft.firstName}
              onChange={(e) =>
                setDraft((p) => ({ ...p, firstName: e.target.value }))
              }
              placeholder="Наприклад, Михайло"
            />
          </FormField>

          <FormField label="Прізвище">
            <Input
              value={draft.lastName}
              onChange={(e) =>
                setDraft((p) => ({ ...p, lastName: e.target.value }))
              }
              placeholder="Наприклад, Петренко"
            />
          </FormField>
        </div>
      </EditModal>

      <EditModal
        open={modal.open && modal.type === "gender"}
        title="Змінити стать"
        onClose={closeEditModal}
        onSave={saveModalChanges}
        saveDisabled={!draft.gender}
        saving={saving}
      >
        <FormField label="Стать">
          <Select
            value={draft.gender}
            onChange={(e) =>
              setDraft((p) => ({ ...p, gender: e.target.value }))
            }
          >
            <option value="unknown">Не вказано</option>
            <option value="female">Жіноча</option>
            <option value="male">Чоловіча</option>
            <option value="other">Інше</option>
          </Select>
        </FormField>
      </EditModal>

      <EditModal
        open={modal.open && modal.type === "birthDate"}
        title="Змінити дату народження"
        onClose={closeEditModal}
        onSave={saveModalChanges}
        saveDisabled={!draft.birthDate}
        saving={saving}
      >
        <FormField label="Дата народження">
          <Input
            type="date"
            value={draft.birthDate}
            onChange={(e) =>
              setDraft((p) => ({ ...p, birthDate: e.target.value }))
            }
          />
        </FormField>
      </EditModal>

      <EditModal
        open={modal.open && modal.type === "phone"}
        title="Змінити номер телефону"
        onClose={closeEditModal}
        onSave={closeEditModal}
        saveDisabled={!draft.phone.trim()}
        saving={false}
      >
        <div className="space-y-4">
          <FormField label="Новий номер">
            <Input
              value={draft.phone}
              onChange={(e) => setDraft((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+380..."
            />
          </FormField>

          <p className="text-sm leading-6 text-[color:var(--color-caramel)]/85">
            Тут можна підключити твою існуючу логіку підтвердження через
            SMS-код.
          </p>
        </div>
      </EditModal>

      <EditModal
        open={modal.open && modal.type === "email"}
        title="Змінити email"
        onClose={closeEditModal}
        onSave={closeEditModal}
        saveDisabled={!draft.email.trim()}
        saving={false}
      >
        <div className="space-y-4">
          <FormField label="Нова пошта">
            <Input
              value={draft.email}
              onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))}
              placeholder="email@domain.com"
            />
          </FormField>

          <p className="text-sm leading-6 text-[color:var(--color-caramel)]/85">
            Тут можна підключити твою існуючу логіку підтвердження через
            email-код або лист.
          </p>
        </div>
      </EditModal>

      <div
        className={cx(
          "pointer-events-none fixed inset-x-0 top-[calc(12px+env(safe-area-inset-top))] z-[120] flex justify-center px-4",
          "md:bottom-5 md:top-auto md:justify-start md:px-5",
        )}
      >
        <div className="w-full max-w-[1400px]">
          <div
            className={cx(
              "transition-all duration-200 ease-out",
              toast.open
                ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                : "pointer-events-none -translate-y-2 scale-[0.98] opacity-0 md:translate-y-2",
            )}
          >
            <div
              className={cx(
                "relative w-fit max-w-[85vw] overflow-hidden rounded-2xl border bg-white shadow-[0_16px_40px_rgba(15,23,42,0.12)]",
                toast.type === "success" && "border-[var(--color-sand)]",
                toast.type === "error" && "border-[var(--color-danger-border)]",
                toast.type === "warning" && "border-[var(--color-sand)]",
              )}
            >
              <div className="flex items-start gap-3 px-4 py-3.5">
                <div
                  className={cx(
                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white",
                    toast.type === "success" && "bg-[var(--color-forest)]",
                    toast.type === "error" && "bg-[var(--color-danger)]",
                    toast.type === "warning" && "bg-[var(--color-caramel)]",
                  )}
                >
                  {toast.type === "success" && (
                    <CheckCircle2 className="h-4.5 w-4.5" />
                  )}
                  {toast.type === "error" && <X className="h-4.5 w-4.5" />}
                  {toast.type === "warning" && (
                    <AlertTriangle className="h-4.5 w-4.5" />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="whitespace-nowrap text-[14px] font-semibold text-[var(--color-ink)]">
                    {toast.title}
                  </p>

                  {toast.text && (
                    <p className="mt-0.5 text-[13px] text-[color:var(--color-caramel)]/85">
                      {toast.text}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setToast((prev) => ({ ...prev, open: false }))}
                  className="ml-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--color-caramel)] transition hover:bg-[var(--color-cream)] hover:text-[var(--color-ink)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div
                className={cx(
                  "h-[2px] w-full",
                  toast.type === "success" && "bg-[var(--color-confirmed-bg)]",
                  toast.type === "error" && "bg-[var(--color-danger-bg)]",
                  toast.type === "warning" && "bg-[var(--color-pending-bg)]",
                )}
              >
                <div
                  key={toast.id}
                  className={cx(
                    "h-full w-full origin-left",
                    toast.type === "success" && "bg-[var(--color-forest)]",
                    toast.type === "error" && "bg-[var(--color-danger)]",
                    toast.type === "warning" && "bg-[var(--color-caramel)]",
                  )}
                  style={{
                    animation: `toastbar ${toast.duration}ms linear forwards`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes toastbar {
            from { transform: scaleX(1); }
            to { transform: scaleX(0); }
          }
        `}</style>
      </div>

      {errorModal.open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl border border-[var(--color-mist)] bg-white p-6 shadow-[0_24px_80px_rgba(20,18,16,0.18)]">
            <h3 className="text-lg font-bold text-[var(--color-ink)]">
              {errorModal.title}
            </h3>
            <p className="mt-2 text-sm text-[color:var(--color-caramel)]/85">
              {errorModal.message}
            </p>
            <div className="mt-5 flex justify-end">
              <PrimaryButton
                type="button"
                onClick={() =>
                  setErrorModal({ open: false, title: "", message: "" })
                }
              >
                Зрозуміло
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
