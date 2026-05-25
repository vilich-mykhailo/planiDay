import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import profileHero from "../../assets/profileHero.png";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  CreditCard,
  Heart,
  Bell,
Edit3,
Shield,
Star,
  Image as ImageIcon,
  LogOut,
  Mail,
  MapPin,
  PencilLine,
  Phone,
  Search,
  Trash2,
  UserRound,
  VenusAndMars,
  X,
} from "lucide-react";
import { api } from "../../api/http";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const PUBLIC = import.meta.env.VITE_R2_PUBLIC_BASE_URL;

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function toPublicUrl(value) {
  const src = String(value || "").trim();
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  return PUBLIC ? `${PUBLIC}/${src}` : src;
}

async function compressImage(
  file,
  { maxWidth = 900, maxHeight = 900, quality = 0.82, type = "image/jpeg" } = {},
) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas error"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Compression failed"));
            return;
          }

          resolve(
            new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
              type,
              lastModified: Date.now(),
            }),
          );
        },
        type,
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image load failed"));
    };

    img.src = objectUrl;
  });
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

const emptyProfile = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  birthDate: "",
  gender: "unknown",
  photoUrl: "",
};

function Input({ className, ...props }) {
  return (
    <input
      {...props}
      className={cx(
        "h-12 w-full rounded-xl border border-[var(--color-mist)] bg-white px-4 text-sm text-[var(--color-ink)] outline-none transition",
        "placeholder:text-[color:var(--color-caramel)]/65",
        "focus:border-[var(--color-forest)] focus:ring-4 focus:ring-[color:var(--color-forest)]/10",
        props.disabled && "cursor-not-allowed bg-[var(--color-cream)] opacity-70",
        className,
      )}
    />
  );
}

function Select({ className, children, ...props }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cx(
          "h-12 w-full appearance-none rounded-xl border border-[var(--color-mist)] bg-white px-4 pr-11 text-sm text-[var(--color-ink)] outline-none transition",
          "focus:border-[var(--color-forest)] focus:ring-4 focus:ring-[color:var(--color-forest)]/10",
          className,
        )}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-caramel)]" />
    </div>
  );
}

function PrimaryButton({ children, className, ...props }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition active:scale-[0.98]",
        props.disabled
          ? "cursor-not-allowed border border-[var(--color-mist)] bg-[var(--color-cream)] text-[color:var(--color-caramel)]/70"
          : "bg-[var(--color-forest)] text-white shadow-[0_14px_30px_-18px_rgba(50,78,41,0.7)] hover:bg-[var(--color-forest-dark)]",
        className,
      )}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, className, ...props }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[var(--border-soft)] bg-white px-4 text-sm font-bold text-[var(--color-ink)] transition",
        "hover:border-[var(--color-sand)] hover:bg-[var(--color-cream)] active:scale-[0.98]",
        props.disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}

function DangerButton({ children, className, ...props }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[var(--color-danger-border)] bg-white px-4 text-sm font-bold text-[var(--color-danger)] transition",
        "hover:bg-[var(--color-danger-bg)] active:scale-[0.98]",
        props.disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}

function FormField({ label, hint, children }) {
  return (
    <label className="block space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-[var(--color-ink)]">{label}</span>
        {hint ? (
          <span className="text-xs font-semibold text-[var(--color-caramel)]">
            {hint}
          </span>
        ) : null}
      </div>
      {children}
    </label>
  );
}

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={cx(
        "animate-pulse rounded-xl bg-[linear-gradient(90deg,var(--color-cream),#fff,var(--color-cream))] bg-[length:180%_100%]",
        className,
      )}
    />
  );
}

function ProfileSkeleton() {
  return (
    <main className="min-h-screen bg-[var(--color-cream)]/40 px-3 pb-[calc(env(safe-area-inset-bottom)+76px)] pt-3 sm:px-6 sm:pb-10 sm:pt-10">
      <div className="mx-auto max-w-6xl space-y-4">
        <section className="rounded-2xl border border-[var(--color-mist)] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-7">
          <SkeletonBlock className="h-4 w-36" />
          <SkeletonBlock className="mt-4 h-10 w-full max-w-md" />
          <SkeletonBlock className="mt-3 h-5 w-full max-w-2xl" />
        </section>

        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <section className="rounded-2xl border border-[var(--color-mist)] bg-white p-5 shadow-[var(--shadow-soft)]">
            <SkeletonBlock className="mx-auto h-36 w-36 rounded-3xl" />
            <SkeletonBlock className="mx-auto mt-5 h-7 w-44" />
            <SkeletonBlock className="mx-auto mt-3 h-4 w-52" />
            <SkeletonBlock className="mt-6 h-12 w-full" />
            <SkeletonBlock className="mt-2 h-12 w-full" />
          </section>

          <section className="rounded-2xl border border-[var(--color-mist)] bg-white p-5 shadow-[var(--shadow-soft)]">
            <SkeletonBlock className="h-8 w-56" />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonBlock key={index} className="h-24 w-full" />
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
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
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-[rgba(20,18,16,0.46)] px-3 pb-3 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--color-mist)] bg-white shadow-[0_30px_90px_rgba(20,18,16,0.24)]">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--color-cream)] px-5 py-4">
          <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-ink)]">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-xl text-[var(--color-caramel)] transition hover:bg-[var(--color-cream)] hover:text-[var(--color-ink)]"
            aria-label="Закрити"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-5">{children}</div>

        <div className="flex flex-col-reverse gap-2 border-t border-[var(--color-cream)] bg-[#f7f5ef] px-5 py-4 sm:flex-row sm:justify-end">
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

function SettingsRow({ icon, label, value, action = "Edit", onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-4 border-b border-[#eef0ee] px-4 py-4 text-left transition last:border-b-0 hover:bg-[#f8faf8] sm:px-5"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f1f4f2] text-[#111] transition group-hover:bg-[#111] group-hover:text-white">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-black text-[#111]">{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium text-[#6f7672]">
          {value}
        </p>
      </div>
      <span className="hidden rounded-full bg-[#f1f4f2] px-3 py-1 text-xs font-black text-[#111] transition group-hover:bg-[#e6f7ef] group-hover:text-[#00875a] sm:inline-flex">
        {action}
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-[#9aa19d] transition group-hover:translate-x-0.5 group-hover:text-[#111]" />
    </button>
  );
}

function NavItem({ active, icon, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-black transition",
        active
          ? "bg-[#111] text-white"
          : "text-[#4f5752] hover:bg-[#f1f4f2] hover:text-[#111]",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function ChecklistRow({ complete, children }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--color-mist)] bg-white px-4 py-3">
      <div
        className={cx(
          "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
          complete
            ? "bg-[var(--color-confirmed-bg)] text-[var(--color-forest)]"
            : "bg-[var(--color-cream)] text-[var(--color-caramel)]",
        )}
      >
        {complete ? <CheckCircle2 className="h-4 w-4" /> : <CircleDashed className="h-4 w-4" />}
      </div>
      <span className="text-sm font-bold text-[var(--color-ink)]">{children}</span>
    </div>
  );
}

  const heroImageBoxClass =
  "pointer-events-none absolute z-0 " +
  "max-[639px]:right-[0px] max-[639px]:top-[0px] max-[639px]:h-[150px] max-[639px]:w-[240px] " +
  "sm:right-[0px] sm:top-[-5px] sm:h-[180px] sm:w-[300px] " +
  "md:right-[10px] md:top-[-10px] md:h-[220px] md:w-[360px] " +
  "lg:right-[10px] lg:top-[-10px] lg:h-[260px] lg:w-[420px]";

const heroImageClass =
  "h-full w-full object-contain object-right";

export default function Profile() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const profileQuery = useQuery({
    queryKey: ["client-profile"],
    queryFn: fetchClientProfile,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const [profile, setProfile] = useState(emptyProfile);
  const [initialProfile, setInitialProfile] = useState(emptyProfile);
  const [draft, setDraft] = useState(emptyProfile);
  const [modal, setModal] = useState({ type: "", open: false });
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [toast, setToast] = useState({
    id: 0,
    open: false,
    type: "success",
    title: "",
    text: "",
    duration: 2600,
  });
  const [errorModal, setErrorModal] = useState({
    open: false,
    title: "",
    message: "",
  });

  const loading = profileQuery.isLoading && !profileQuery.data;

  useEffect(() => {
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
  }, [profileQuery.data]);

  const initials = useMemo(() => {
    const first = profile.firstName.trim().slice(0, 1).toUpperCase();
    const last = profile.lastName.trim().slice(0, 1).toUpperCase();
    return (first + last).trim() || "U";
  }, [profile.firstName, profile.lastName]);

  const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();
  const photoSrc = photoPreviewUrl || toPublicUrl(profile.photoUrl);

  const genderLabel = useMemo(() => {
    if (profile.gender === "female") return "Жіноча";
    if (profile.gender === "male") return "Чоловіча";
    if (profile.gender === "other") return "Інше";
    return "Не вказано";
  }, [profile.gender]);

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

  const profileCompletion = useMemo(() => {
    const checks = [
      Boolean(initialProfile.firstName.trim()),
      Boolean(initialProfile.birthDate),
      Boolean(initialProfile.gender && initialProfile.gender !== "unknown"),
      Boolean(initialProfile.photoUrl),
    ];

    return Math.round(
      (checks.filter(Boolean).length / checks.length) * 100,
    );
  }, [
    initialProfile.firstName,
    initialProfile.birthDate,
    initialProfile.gender,
    initialProfile.photoUrl,
  ]);

  const profileItems = [
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
  ];

  function handleLogout() {
    queryClient.removeQueries({ queryKey: ["client-profile"] });
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/login", { replace: true });
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
      photoUrl: profile.photoUrl || "",
    });
    setModal({ type, open: true });
  }

  function closeEditModal() {
    setModal({ type: "", open: false });
  }

  function normalizeProfile(data) {
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

  async function patchProfile(body) {
    const token = localStorage.getItem("token");
    const updatedRaw = await api("/client/me", {
      method: "PATCH",
      token,
      body,
    });
    const updated = normalizeProfile(updatedRaw);

    queryClient.setQueryData(["client-profile"], updated);
    setProfile(updated);
    setInitialProfile(updated);
    return updated;
  }

  function showSaveError(error, fallback = "Не вдалося зберегти зміни") {
    const raw = String(error?.message || "").toLowerCase();
    const isOffline =
      !navigator.onLine || raw.includes("failed to fetch") || raw.includes("network");

    showToast({
      type: "error",
      title: isOffline ? "Немає підключення" : "Помилка",
      text: isOffline ? "Перевірте інтернет" : fallback,
    });
  }

  async function saveModalChanges() {
    try {
      setSaving(true);

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

      if (modal.type === "birthDate") body.birthDate = draft.birthDate || null;
      if (modal.type === "gender") body.gender = draft.gender;

      await patchProfile(body);
      closeEditModal();
      showToast({
        type: "success",
        title: "Збережено",
        text: "Дані профілю оновлено",
      });
    } catch (error) {
      showSaveError(error);
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
    if (!res.ok) throw new Error(data?.message || "Upload failed");
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

    if (!res.ok) throw new Error("Delete failed");
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

      const token = localStorage.getItem("token");
      const previousPhotoKey = String(profile.photoUrl || "").trim();
      const compressed = await compressImage(file);

      setPhotoFile(compressed);

      const out = await uploadClientPhoto(compressed, token);
      const nextPhotoKey = out?.key || "";

      await patchProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        birthDate: profile.birthDate || null,
        gender: profile.gender,
        photoUrl: nextPhotoKey || null,
      });

      setPhotoFile(null);
      setPhotoPreviewUrl("");

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
        await deleteFromR2(previousPhotoKey).catch(console.error);
      }
    } catch (error) {
      console.error(error);
      setPhotoFile(null);
      setPhotoPreviewUrl("");
      showSaveError(error, "Не вдалося оновити фото");
    } finally {
      setSaving(false);
    }
  }

  async function removePhoto() {
    const currentPhotoKey = String(profile.photoUrl || "").trim();
    if (!currentPhotoKey && !photoFile) return;

    try {
      setSaving(true);

      await patchProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        birthDate: profile.birthDate || null,
        gender: profile.gender,
        photoUrl: null,
      });

      setPhotoFile(null);
      setPhotoPreviewUrl("");

      showToast({
        type: "success",
        title: "Фото видалено",
        text: "Фото профілю успішно видалено",
      });

      if (currentPhotoKey && !/^https?:\/\//i.test(currentPhotoKey)) {
        await deleteFromR2(currentPhotoKey).catch(console.error);
      }
    } catch (error) {
      console.error(error);
      showSaveError(error, "Не вдалося видалити фото");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <ProfileSkeleton />;

 return (
  <main className="min-h-screen bg-[#f7f5f1] pb-[calc(env(safe-area-inset-bottom)+92px)] pt-[calc(env(safe-area-inset-top)+78px)] text-[#202020] sm:pb-10 lg:pt-[calc(env(safe-area-inset-top)+92px)]">
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      {/* MOBILE TOP */}
      <div className="mb-5 flex items-center justify-between lg:hidden">
        <div>
          <p className="text-sm font-bold text-[#8b8794]">Кабінет клієнта</p>
          <h1 className="text-[34px] font-black leading-none tracking-[-0.06em]">
            Профіль
          </h1>
        </div>

        <button
          type="button"
          className="grid h-12 w-12 place-items-center rounded-[18px] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
        >
          <Bell className="h-5 w-5" />
        </button>
      </div>

      {/* HERO */}

<section className="relative mb-5 overflow-hidden rounded-[26px] bg-[#f3eee7] px-5 py-7 sm:rounded-[34px] sm:px-8 sm:py-9 lg:px-10">
  <div className={cn(heroImageBoxClass, "mask-hero-image")}>
    <img
      src={profileHero}
      alt=""
      aria-hidden="true"
      className={heroImageClass}
    />
  </div>

  <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center">
    <button
      type="button"
      onClick={() => fileRef.current?.click()}
      disabled={saving}
      className="group relative grid h-[105px] w-[105px] shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white bg-white text-3xl font-black shadow-[0_18px_44px_rgba(15,23,42,0.12)] transition active:scale-[0.98] sm:h-[128px] sm:w-[128px]"
    >
      {photoSrc ? (
        <img
          src={photoSrc}
          alt="avatar"
          className="h-full w-full object-cover"
        />
      ) : (
        initials
      )}

      <span className="absolute inset-0 grid place-items-center bg-black/40 text-white opacity-0 transition group-hover:opacity-100">
        <Camera className="h-6 w-6" />
      </span>
    </button>

    <div className="min-w-0 max-w-[520px]">
      <div className="flex flex-wrap items-center gap-2">
        <h1
          className="
            text-[#202020] font-black tracking-[-0.06em] leading-[0.9]

            sm:text-[48px]
            md:text-[58px]
            lg:text-[64px]

            max-[639px]:text-[34px]
          "
        >
          {fullName || "Ваш профіль"}
        </h1>

        <span className="inline-flex h-8 items-center gap-1 rounded-full bg-[#fff3e9] px-3 text-xs font-black text-[#ff6200]">
          <BadgeCheck className="h-4 w-4" />
          Pro
        </span>
      </div>

      <div className="mt-4 space-y-2 text-[13px] font-semibold text-[#77716b] sm:text-sm">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 shrink-0" />
          <span className="truncate">
            {profile.email || "Email не вказано"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 shrink-0" />
          <span>
            {profile.phone || "Телефон не вказано"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>Україна, Київ</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => openEditModal("name")}
        className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-[18px] border border-[#eadfce] bg-white px-5 text-sm font-black text-[#77716b] shadow-[0_10px_28px_rgba(15,23,42,0.05)] transition hover:border-[#f1dfbf] hover:text-[#ff6200] active:scale-[0.98]"
      >
        <Edit3 className="h-4 w-4" />
        Редагувати профіль
      </button>
    </div>
  </div>
</section>
      {/* STATS */}
     <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {[
          {
            icon: <CalendarDays className="h-6 w-6" />,
            value: "12",
            label: "Мої записи",
            sub: "майбутні візити",
          },
          {
            icon: <Heart className="h-6 w-6" />,
            value: "8",
            label: "Улюблені студії",
            sub: "додано до обраного",
          },
          {
            icon: <Star className="h-6 w-6" />,
            value: "24",
            label: "Відгуки",
            sub: "залишено відгуків",
          },
          {
            icon: <Shield className="h-6 w-6" />,
            value: isProfileComplete ? "Pro" : `${profileCompletion}%`,
            label: "Статус",
            sub: isProfileComplete ? "профіль заповнено" : "заповнення профілю",
          },
        ].map((item) => (
<div
  key={item.label}
  className="flex items-center justify-between gap-4 rounded-[28px] bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.06)] sm:p-5"
>
  <div className="min-w-0">
    <p className="text-[26px] font-black leading-none tracking-[-0.05em]">
      {item.value}
    </p>

    <p className="mt-1 text-sm font-black">
      {item.label}
    </p>

    <p className="mt-1 text-xs font-medium text-[#8b8794]">
      {item.sub}
    </p>
  </div>

  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-[#fff1e8] text-[#ff6200]">
    {item.icon}
  </div>
</div>
        ))}
      </section>

      {/* CONTENT */}
      <section className="mt-5 grid gap-5 lg:grid-cols-[300px_1fr]">
        {/* SIDE MENU */}
        <aside className="rounded-[30px] bg-white p-3 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          {[
            { icon: <UserRound className="h-5 w-5" />, label: "Особисті дані", active: true },
            { icon: <CalendarDays className="h-5 w-5" />, label: "Мої записи" },
            { icon: <Heart className="h-5 w-5" />, label: "Улюблені студії" },
            { icon: <Star className="h-5 w-5" />, label: "Відгуки та оцінки" },
            { icon: <Shield className="h-5 w-5" />, label: "Безпека" },
            { icon: <Bell className="h-5 w-5" />, label: "Сповіщення" },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              className={cx(
                "flex h-14 w-full items-center gap-4 rounded-[20px] px-4 text-sm font-black transition",
                item.active
                  ? "bg-[#fff1e8] text-[#ff6200]"
                  : "text-[#77716b] hover:bg-[#f7f5f1] hover:text-[#202020]",
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}

          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex h-14 w-full items-center gap-4 rounded-[20px] px-4 text-sm font-black text-red-500 transition hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
            Вийти
          </button>
        </aside>

        {/* PERSONAL DATA */}
        <section className="overflow-hidden rounded-[30px] bg-white shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          <div className="border-b border-[#eee8df] px-5 py-5 sm:px-7">
            <h3 className="text-2xl font-black tracking-[-0.05em]">
              Особисті дані
            </h3>
          </div>

          <div>
            {[
              {
                icon: <UserRound className="h-5 w-5" />,
                label: "Імʼя",
                value: fullName || "Не вказано",
                type: "name",
              },
              {
                icon: <Mail className="h-5 w-5" />,
                label: "Електронна пошта",
                value: profile.email || "Не вказано",
                type: "email",
              },
              {
                icon: <Phone className="h-5 w-5" />,
                label: "Номер телефону",
                value: profile.phone || "Не вказано",
                type: "phone",
              },
              {
                icon: <VenusAndMars className="h-5 w-5" />,
                label: "Стать",
                value: genderLabel,
                type: "gender",
              },
              {
                icon: <CalendarDays className="h-5 w-5" />,
                label: "Дата народження",
                value: profile.birthDate || "Не вказано",
                type: "birthDate",
              },
            ].map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => openEditModal(item.type)}
                className="group grid w-full grid-cols-[44px_1fr] gap-4 border-b border-[#eee8df] px-5 py-4 text-left transition last:border-b-0 hover:bg-[#fbfaf8] sm:grid-cols-[44px_240px_1fr] sm:px-7"
              >
                <div className="grid h-11 w-11 place-items-center rounded-[16px] bg-[#f7f5f1] text-[#77716b] transition group-hover:bg-[#fff1e8] group-hover:text-[#ff6200]">
                  {item.icon}
                </div>

                <div className="sm:contents">
                  <p className="text-sm font-bold text-[#77716b] sm:self-center">
                    {item.label}
                  </p>
                  <p className="mt-1 min-w-0 truncate text-sm font-black text-[#202020] sm:mt-0 sm:self-center">
                    {item.value}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="px-5 py-5 sm:px-7">
            <button
              type="button"
              onClick={() => openEditModal("name")}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[18px] border border-[#ff6200] bg-white px-5 text-sm font-black text-[#ff6200] transition hover:bg-[#fff1e8] active:scale-[0.98] sm:w-auto"
            >
              <PencilLine className="h-4 w-4" />
              Редагувати особисті дані
            </button>
          </div>
        </section>
      </section>
    </div>

    <input
      ref={fileRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(event) => onPickPhoto(event.target.files?.[0])}
    />

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
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, firstName: event.target.value }))
              }
              placeholder="Наприклад, Михайло"
            />
          </FormField>
          <FormField label="Прізвище">
            <Input
              value={draft.lastName}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, lastName: event.target.value }))
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
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, gender: event.target.value }))
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
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, birthDate: event.target.value }))
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
      >
        <div className="space-y-4">
          <FormField label="Новий номер">
            <Input
              value={draft.phone}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, phone: event.target.value }))
              }
              placeholder="+380..."
            />
          </FormField>
          <p className="text-sm leading-6 text-[color:var(--color-caramel)]/85">
            Тут можна підключити існуючу логіку підтвердження через SMS-код.
          </p>
        </div>
      </EditModal>

      <EditModal
        open={modal.open && modal.type === "email"}
        title="Змінити email"
        onClose={closeEditModal}
        onSave={closeEditModal}
        saveDisabled={!draft.email.trim()}
      >
        <div className="space-y-4">
          <FormField label="Нова пошта">
            <Input
              value={draft.email}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, email: event.target.value }))
              }
              placeholder="email@domain.com"
            />
          </FormField>
          <p className="text-sm leading-6 text-[color:var(--color-caramel)]/85">
            Тут можна підключити існуючу логіку підтвердження через email-код або лист.
          </p>
        </div>
      </EditModal>

      <div className="pointer-events-none fixed inset-x-0 top-[calc(12px+env(safe-area-inset-top))] z-[120] flex justify-center px-4 sm:bottom-5 sm:top-auto sm:justify-start sm:px-5">
        <div
          className={cx(
            "w-fit max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border bg-white shadow-[0_18px_50px_rgba(15,23,42,0.14)] transition-all duration-200",
            toast.open
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-2 opacity-0 sm:translate-y-2",
            toast.type === "success" && "border-[var(--color-sand)]",
            toast.type === "error" && "border-[var(--color-danger-border)]",
            toast.type === "warning" && "border-[var(--color-sand)]",
          )}
        >
          <div className="flex items-start gap-3 px-4 py-3.5">
            <div
              className={cx(
                "grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white",
                toast.type === "success" && "bg-[var(--color-forest)]",
                toast.type === "error" && "bg-[var(--color-danger)]",
                toast.type === "warning" && "bg-[var(--color-caramel)]",
              )}
            >
              {toast.type === "success" && <CheckCircle2 className="h-4 w-4" />}
              {toast.type === "error" && <X className="h-4 w-4" />}
              {toast.type === "warning" && <AlertTriangle className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[var(--color-ink)]">
                {toast.title}
              </p>
              {toast.text ? (
                <p className="mt-0.5 text-sm text-[color:var(--color-caramel)]/85">
                  {toast.text}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setToast((prev) => ({ ...prev, open: false }))}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--color-caramel)] transition hover:bg-[var(--color-cream)] hover:text-[var(--color-ink)]"
              aria-label="Закрити сповіщення"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="h-[2px] bg-[var(--color-cream)]">
            <div
              key={toast.id}
              className={cx(
                "h-full origin-left",
                toast.type === "success" && "bg-[var(--color-forest)]",
                toast.type === "error" && "bg-[var(--color-danger)]",
                toast.type === "warning" && "bg-[var(--color-caramel)]",
              )}
              style={{ animation: `toastbar ${toast.duration}ms linear forwards` }}
            />
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgba(20,18,16,0.46)] px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-mist)] bg-white p-6 shadow-[0_24px_80px_rgba(20,18,16,0.18)]">
            <h3 className="text-lg font-black text-[var(--color-ink)]">
              {errorModal.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[color:var(--color-caramel)]/85">
              {errorModal.message}
            </p>
            <div className="mt-5 flex justify-end">
              <PrimaryButton
                type="button"
                onClick={() => setErrorModal({ open: false, title: "", message: "" })}
              >
                Зрозуміло
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
