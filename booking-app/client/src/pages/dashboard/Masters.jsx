import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Camera,
  UserRound,
  CalendarDays,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
} from "lucide-react";
import DatePicker from "../../components/ui/DatePicker";
import TimeSelect from "../../components/TimeSelect";
import { useStudio } from "../../context/studio/useStudio";

async function uploadMasterPhoto(studioId, file) {
  const token = localStorage.getItem("token");
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/media/studio/${studioId}/master-photo`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    },
  );

  const data = await res.json().catch(() => null);
  if (!res.ok)
    throw new Error(data?.message || `Upload failed (${res.status})`);
  return data;
}

function initialsFromName(name) {
  const s = String(name || "").trim();
  if (!s) return "M";

  return (
    s
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "M"
  );
}

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function SectionCard({
  title,
  subtitle,
  badge,
  actions,
  children,
  className = "",
}) {
  return (
    <section
      className={cn(
        "group relative overflow-hidden rounded-3xl border bg-white transition-all duration-300",
        "border-[var(--color-cream)] shadow-[0_4px_24px_-4px_rgba(27,27,27,0.10)] hover:shadow-[0_8px_32px_-4px_rgba(27,27,27,0.14)]",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[var(--color-forest)] via-[var(--color-forest)] to-[var(--color-ink)] opacity-70" />

      <div className="border-b border-[var(--color-cream)] px-5 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold tracking-tight text-[var(--color-ink)]">
                {title}
              </h2>

              {badge && (
                <span className="shrink-0 inline-flex items-center rounded-full bg-[var(--color-cream)] px-3 py-1 text-xs font-semibold text-[var(--color-ink)]">
                  {badge}
                </span>
              )}
            </div>

            {subtitle && (
              <p className="mt-1.5 text-sm text-[var(--color-caramel)]">{subtitle}</p>
            )}
          </div>

          {actions && (
            <div className="w-full md:w-auto md:shrink-0">{actions}</div>
          )}
        </div>
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

function isExceptionValid(item) {
  if (!item.date) return false;
  if (!item.enabled) return true;
  if (!item.start || !item.end) return false;
  return item.start < item.end;
}

function Button({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...props
}) {
  const variants = {
    primary:
      "bg-[var(--color-ink)] text-white hover:bg-[var(--border-hover-primary)] shadow-[0_10px_24px_rgba(27,27,27,0.22)]",
    secondary:
      "bg-white border border-[var(--color-cream)] text-[var(--color-ink)] hover:bg-[var(--border-hover-primary)]",
    danger:
      "bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-red-600 hover:from-red-100 hover:to-rose-100",
    accent:
      "border border-[var(--color-forest)] bg-[var(--border-hover-primary)] text-[var(--color-ink)] shadow-sm hover:bg-[var(--color-forest)] hover:text-white",
    ghost: "text-[var(--color-ink)] hover:bg-[var(--border-hover-primary)]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-xl",
    md: "px-4 py-2.5 text-sm rounded-2xl",
    lg: "px-6 py-3 text-sm rounded-2xl",
  };

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold",
        "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function IconButton({
  variant = "secondary",
  className = "",
  children,
  ...props
}) {
  const variants = {
    primary:
      "bg-[var(--color-ink)] text-white hover:bg-[var(--border-hover-primary)] shadow-[0_10px_24px_rgba(27,27,27,0.22)]",
    secondary:
      "bg-white border border-[var(--color-cream)] text-[var(--color-ink)] hover:bg-[var(--color-cream)]",
    danger:
      "bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-red-600 hover:from-red-100 hover:to-rose-100",
    accent:
      "border border-[var(--color-forest)] bg-[var(--color-cream)] text-[var(--color-ink)] shadow-sm hover:bg-[var(--border-hover-primary)] hover:text-white",
    ghost: "text-[var(--color-ink)] hover:bg-[var(--border-hover-primary)]",
  };

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-2xl px-3 transition-all duration-200 active:scale-95",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
  mobileFull = false,
  icon = <CalendarDays className="h-8 w-8 text-white" />,
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";

      const handleEscape = (e) => {
        if (e.key === "Escape") onClose?.();
      };

      document.addEventListener("keydown", handleEscape);

      return () => {
        document.body.style.overflow = "";
        document.removeEventListener("keydown", handleEscape);
      };
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex bg-[var(--color-bg)]/45 backdrop-blur-sm",
        mobileFull
          ? "items-stretch justify-stretch p-0 sm:items-center sm:justify-center sm:p-6"
          : "items-center justify-center p-4 sm:p-6"
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden bg-white shadow-2xl",
          "animate-in fade-in-0 zoom-in-95 duration-200",

          mobileFull
            ? "flex h-[100dvh] max-h-[100dvh] flex-col rounded-none sm:h-auto sm:max-h-none sm:rounded-3xl"
            : "rounded-3xl",

          sizeClasses[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >


        {/* 👉 BODY */}
        <div
          className={cn(
            "flex-1 overflow-y-auto px-6 py-6",
            mobileFull
              ? "pb-24 sm:max-h-[calc(100vh-220px)] sm:pb-6"
              : "max-h-[calc(100vh-220px)]"
          )}
        >
          {children}
        </div>

        {/* 👉 FOOTER */}
        {footer && (
          <div className="shrink-0 border-t border-[var(--color-cream)] px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function Avatar({ name, photoUrl, size = "md", className = "" }) {
  const initials = initialsFromName(name);

  const sizes = {
    sm: "h-12 w-12 rounded-2xl text-xs",
    md: "h-20 w-20 rounded-[22px] text-sm",
  };

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden border-2 border-[var(--color-cream)] bg-gradient-to-br from-[var(--color-cream)] to-[var(--color-sand)] shadow-sm",
        sizes[size],
        className,
      )}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : initials ? (
        <span className="font-bold text-[var(--color-forest)]">{initials}</span>
      ) : (
        <Camera className="h-6 w-6 text-[var(--color-forest)]" />
      )}
    </div>
  );
}

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-[var(--color-cream)]", className)}
      aria-hidden="true"
    />
  );
}

function isPastExceptionDate(dateStr) {
  if (!dateStr) return false;

  const today = new Date();
  const todayLocal = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const [y, m, d] = String(dateStr).split("-").map(Number);
  const target = new Date(y, (m || 1) - 1, d || 1);

  return target < todayLocal;
}

async function deleteExpiredMasterExceptions(masterId, list) {
  const token = localStorage.getItem("token");

  const expired = (list || []).filter(
    (item) => item?.id && isPastExceptionDate(item.date),
  );

  if (!expired.length) return list || [];

  await Promise.allSettled(
    expired.map((item) =>
      fetch(
        `${import.meta.env.VITE_API_URL}/studio/masters/${masterId}/schedule/exceptions/${item.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      ),
    ),
  );

  return (list || []).filter((item) => !isPastExceptionDate(item.date));
}

function MasterSkeletonRow() {
  return (
    <div className="rounded-2xl border border-[var(--color-cream)] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="h-12 w-12 animate-pulse rounded-2xl bg-[var(--color-cream)]" />
          <div className="w-full min-w-0">
            <div className="h-4 w-40 animate-pulse rounded bg-[var(--color-cream)]" />
            <div className="mt-2 h-3 w-52 animate-pulse rounded bg-[var(--color-cream)]" />
            <div className="mt-2 h-3 w-64 animate-pulse rounded bg-[var(--color-cream)]" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <div className="h-10 w-28 animate-pulse rounded-2xl bg-[var(--color-cream)]" />
          <div className="h-10 w-28 animate-pulse rounded-2xl bg-[var(--color-cream)]" />
        </div>
      </div>
    </div>
  );
}

function MastersListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <MasterSkeletonRow key={i} />
      ))}
    </div>
  );
}

export default function Masters() {
  const { studio } = useStudio();
  const queryClient = useQueryClient();
  const studioId = studio?.id ?? null;
  const mastersQuery = useQuery({
    queryKey: ["masters", studioId],
    queryFn: () => fetchMasters(studioId),
    enabled: Boolean(studioId),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const [adding, setAdding] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [exceptionsMaster, setExceptionsMaster] = useState(null);
  const [exceptionsModalOpen, setExceptionsModalOpen] = useState(false);
  const [masterExceptions, setMasterExceptions] = useState([]);
  const [exceptionsLoading, setExceptionsLoading] = useState(false);
  const [expandedExceptions, setExpandedExceptions] = useState({});
const [deleteConfirm, setDeleteConfirm] = useState({
  open: false,
  master: null,
});

  async function syncMastersRelatedQueries() {
    if (!studioId) return;

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["masters", studioId],
        exact: true,
      }),
      queryClient.invalidateQueries({
        queryKey: ["services", studioId],
        exact: true,
      }),
    ]);
  }

  async function fetchMasters(currentStudioId) {
    if (!currentStudioId) return [];

    const token = localStorage.getItem("token");

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/studio/${currentStudioId}/masters`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.message || `Load masters failed (${res.status})`);
    }

    return Array.isArray(data?.masters) ? data.masters : [];
  }

  async function deleteMasterPhoto(currentStudioId, key) {
    if (!key) return;
    const token = localStorage.getItem("token");

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/media/studio/${currentStudioId}/master-photo`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ key }),
      },
    );

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.message || `Delete failed (${res.status})`);
    }
    return data;
  }

  const [editOriginal, setEditOriginal] = useState({
    photoKey: null,
    photoUrl: "",
  });

  const masters = mastersQuery.data || [];
  const loading = mastersQuery.isLoading;

  const [form, setForm] = useState({
    name: "",
    role: "",
    bio: "",
    photoUrl: "",
    photoKey: null,
    photoFile: null,
  });

  const [editMaster, setEditMaster] = useState(null);
  const [editDraft, setEditDraft] = useState({
    id: "",
    name: "",
    role: "",
    bio: "",
    photoUrl: "",
    photoKey: null,
    photoFile: null,
  });

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handlePickPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);

    setForm((p) => ({
      ...p,
      photoUrl: localUrl,
      photoFile: file,
      photoKey: null,
    }));

    setPhotoBroken(false);
    e.target.value = "";
  }

  function removePhoto() {
    setPhotoBroken(false);

    setForm((p) => {
      if (p.photoUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(p.photoUrl);
      }
      return { ...p, photoUrl: "", photoKey: null, photoFile: null };
    });
  }

  async function addMaster(e) {
    e.preventDefault();
    const name = String(form.name || "").trim();
    if (!name || !studio?.id || adding) return;

    setAdding(true);
    try {
      let photoKey = null;
      let photoUrl = "";

      if (form.photoFile) {
        const uploaded = await uploadMasterPhoto(studio.id, form.photoFile);
        photoKey = uploaded.key;
        photoUrl = uploaded.url;
      }

      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/studio/${studio.id}/masters`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            role: form.role,
            bio: form.bio,
            photoUrl,
            photoKey,
          }),
        },
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("Add master failed:", res.status, data);

        if (photoKey) {
          try {
            await deleteMasterPhoto(studio.id, photoKey);
          } catch (error) {
            console.warn("Rollback delete failed:", error);
          }
        }

        alert(data?.message || `Add master failed (${res.status})`);
        return;
      }

      if (data?.master) {
        queryClient.setQueryData(["masters", studioId], (old = []) => [
          data.master,
          ...old,
        ]);
      } else {
        await queryClient.invalidateQueries({
          queryKey: ["masters", studioId],
          exact: true,
        });
      }

      await queryClient.invalidateQueries({
        queryKey: ["services", studioId],
        exact: true,
      });

      if (form.photoUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(form.photoUrl);
      }

      setForm({
        name: "",
        role: "",
        bio: "",
        photoUrl: "",
        photoKey: null,
        photoFile: null,
      });
      setPhotoBroken(false);
      setAddOpen(false);
    } finally {
      setAdding(false);
    }
  }

  async function deleteMaster(master) {
    if (!studio?.id) return;

    const token = localStorage.getItem("token");
    const id = master?.id;
    const key = master?.photoKey;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/studio/masters/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        alert(data?.message || `Delete master failed (${res.status})`);
        return;
      }

      if (key) {
        try {
          await deleteMasterPhoto(studio.id, key);
        } catch (error) {
          console.warn("Photo delete from R2 failed:", error);
        }
      }

      queryClient.setQueryData(["masters", studioId], (old = []) =>
        old.filter((m) => m.id !== id),
      );

      await queryClient.invalidateQueries({
        queryKey: ["services", studioId],
        exact: true,
      });
    } catch (error) {
      console.error(error);
      alert("Помилка при видаленні майстра");
    }
  }

  function dateToInputValue(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function createEmptyException() {
    return {
      id: "",
      date: dateToInputValue(),
      enabled: true,
      start: "08:00",
      end: "18:00",
      isNew: true,
    };
  }

  function sortExceptions(list) {
    return [...list].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  }

  function getExceptionKey(item, index) {
    return item.id || `${item.date || "new"}-${index}`;
  }

  function formatExceptionDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateStr;

    return new Intl.DateTimeFormat("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  }

  async function openMasterExceptions(master) {
    if (!studio?.id || !master?.id) return;

    setExceptionsMaster(master);
    setExceptionsModalOpen(true);
    setExceptionsLoading(true);
    setExpandedExceptions({});

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/studio/masters/${master.id}/schedule/exceptions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "Не вдалося завантажити особливі дати");
      }

      const rawExceptions = Array.isArray(data?.exceptions)
        ? data.exceptions.map((item) => ({
            ...item,
            date: String(item?.date || "").slice(0, 10),
            isNew: false,
          }))
        : [];

      const cleanedExceptions = await deleteExpiredMasterExceptions(
        master.id,
        rawExceptions,
      );

      setMasterExceptions(sortExceptions(cleanedExceptions));
    } catch (error) {
      alert(error?.message || "Помилка завантаження");
    } finally {
      setExceptionsLoading(false);
    }
  }

  function addExceptionRow() {
    const newItem = createEmptyException();

    setMasterExceptions((prev) => {
      const next = sortExceptions([...prev, newItem]);
      const newIndex = next.findIndex((item) => item === newItem);
      const key = getExceptionKey(newItem, newIndex);

      setTimeout(() => {
        setExpandedExceptions((prevExpanded) => ({
          ...prevExpanded,
          [key]: true,
        }));
      }, 0);

      return next;
    });
  }

  function updateException(index, field, value) {
    setMasterExceptions((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  async function saveException(item, index) {
    if (!exceptionsMaster?.id) return;

    const token = localStorage.getItem("token");

    if (!item.date) {
      alert("Оберіть дату");
      return;
    }

    const body = {
      date: item.date,
      enabled: item.enabled,
      start: item.enabled ? item.start : null,
      end: item.enabled ? item.end : null,
    };

    const url = item.id
      ? `${import.meta.env.VITE_API_URL}/studio/masters/${exceptionsMaster.id}/schedule/exceptions/${item.id}`
      : `${import.meta.env.VITE_API_URL}/studio/masters/${exceptionsMaster.id}/schedule/exceptions`;

    const method = item.id ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      alert(data?.message || "Не вдалося зберегти");
      return;
    }

    setMasterExceptions((prev) => {
      const next = sortExceptions(
        prev.map((row, i) =>
          i === index
            ? {
                ...data.exception,
                isNew: false,
              }
            : row,
        ),
      );

      const savedIndex = next.findIndex(
        (row) =>
          row.id === data.exception?.id ||
          (!row.id && row.date === data.exception?.date),
      );

      const nextKey =
        savedIndex >= 0
          ? getExceptionKey(next[savedIndex], savedIndex)
          : getExceptionKey(data.exception, index);

      setTimeout(() => {
        setExpandedExceptions((prevExpanded) => {
          const updated = { ...prevExpanded };
          Object.keys(updated).forEach((k) => {
            if (k.includes(item.date || "")) delete updated[k];
          });
          updated[nextKey] = false;
          return updated;
        });
      }, 0);

      return next;
    });
  }

  async function removeException(item, index) {
    if (!exceptionsMaster?.id) return;

    if (!item.id) {
      setMasterExceptions((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    const token = localStorage.getItem("token");

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/studio/masters/${exceptionsMaster.id}/schedule/exceptions/${item.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      alert(data?.message || "Не вдалося видалити");
      return;
    }

    setMasterExceptions((prev) => prev.filter((_, i) => i !== index));
  }

  function openEdit(master) {
    setEditMaster(master);

    setEditOriginal({
      photoKey: master.photoKey ?? null,
      photoUrl: master.photoUrl || "",
    });

    setEditDraft({
      id: master.id,
      name: master.name || "",
      role: master.role || "",
      bio: master.bio || "",
      photoUrl: master.photoUrl || "",
      photoKey: master.photoKey ?? null,
      photoFile: null,
    });
  }

  async function closeEdit() {
    const prevKey = editOriginal.photoKey;
    const draftKey = editDraft.photoKey;

    const uploadedNewButCancelled = Boolean(draftKey) && draftKey !== prevKey;

    if (uploadedNewButCancelled) {
      try {
        await deleteMasterPhoto(studio.id, draftKey);
      } catch (error) {
        console.warn("Cancel cleanup delete failed:", error);
      }
    }

    setEditMaster(null);
    setEditDraft({
      id: "",
      name: "",
      role: "",
      bio: "",
      photoUrl: "",
      photoKey: null,
      photoFile: null,
    });
    setEditOriginal({ photoKey: null, photoUrl: "" });
  }

  async function editPickPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);

    setEditDraft((p) => {
      if (p.photoUrl?.startsWith("blob:")) URL.revokeObjectURL(p.photoUrl);

      return {
        ...p,
        photoUrl: localUrl,
        photoFile: file,
      };
    });

    e.target.value = "";
  }

  const inputBaseClass =
    "w-full rounded-2xl border border-[var(--color-cream)] bg-white px-4 py-3 " +
    "text-sm font-medium text-[var(--color-ink)] outline-none transition-all " +
    "placeholder:text-[var(--color-caramel)] " +
    "hover:bg-[var(--color-cream)] " +
    "focus:border-[var(--color-forest)] focus:ring-4 focus:ring-[var(--color-forest)]/10 focus:text-[var(--color-ink)]";

  async function saveEdit() {
    const name = String(editDraft.name || "").trim();
    if (!name || !studio?.id) return;

    const token = localStorage.getItem("token");

    const prevKey = editOriginal.photoKey;

    let nextKey = editDraft.photoKey ?? null;
    let nextUrl = editDraft.photoUrl || "";

    if (editDraft.photoFile) {
      const uploaded = await uploadMasterPhoto(studio.id, editDraft.photoFile);
      nextKey = uploaded.key;
      nextUrl = uploaded.url;
    }

    if (!nextUrl) nextUrl = "";
    if (!nextKey) nextKey = null;

    const shouldDeletePrev = Boolean(prevKey) && prevKey !== nextKey;

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/studio/masters/${editDraft.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          role: editDraft.role,
          bio: editDraft.bio,
          photoUrl: nextUrl,
          photoKey: nextKey,
        }),
      },
    );

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      if (editDraft.photoFile && nextKey) {
        try {
          await deleteMasterPhoto(studio.id, nextKey);
        } catch (error) {
          console.warn("Rollback delete failed:", error);
        }
      }
      alert(data?.message || `Update failed (${res.status})`);
      return;
    }

    if (shouldDeletePrev) {
      try {
        await deleteMasterPhoto(studio.id, prevKey);
      } catch (error) {
        console.warn("Old photo delete failed:", error);
      }
    }

    if (editDraft.photoUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(editDraft.photoUrl);
    }

    if (data?.master) {
      queryClient.setQueryData(["masters", studioId], (old = []) =>
        old.map((m) => (m.id === data.master.id ? data.master : m)),
      );
    } else {
      await queryClient.invalidateQueries({
        queryKey: ["masters", studioId],
        exact: true,
      });
    }

    closeEdit();

    await queryClient.invalidateQueries({
      queryKey: ["services", studioId],
      exact: true,
    });
  }

  const total = masters.length;
  const [photoBroken, setPhotoBroken] = useState(false);
const neutralButtonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-white px-4 text-sm font-bold text-[var(--color-ink)] shadow-sm transition-all duration-200 hover:bg-[var(--color-cream)] active:scale-[0.98]";
  return (
    <div className="h-full">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--color-cream)] bg-white p-5 shadow-[0_4px_24px_-4px_rgba(27,27,27,0.10)] sm:p-6">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[var(--color-forest)] via-[var(--color-forest)] to-[var(--color-ink)] opacity-70" />

          <div className="relative">
<div
  className={cn(
    "mb-3 inline-flex items-center gap-2 rounded-[20px] border px-3.5 py-2",
    "transition-all duration-200",
    "border-[var(--color-sand)]",
    "bg-gradient-to-br from-[var(--color-pending-bg)] via-white to-[var(--color-cream)]",
    "shadow-[0_10px_30px_rgba(212,186,140,0.10)]",
    "backdrop-blur-sm",
  )}
>
  <Sparkles className="h-4 w-4 text-[var(--color-forest)]" />

  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-ink)]">
    Команда студії
  </span>
</div>

            <h1 className="text-3xl font-black tracking-tight text-[var(--color-ink)] sm:text-4xl">
              Майстри
            </h1>

            <p className="mt-2 max-w-xl text-sm text-[var(--color-caramel)] sm:text-base">
              Додай майстрів, щоб привʼязувати їх до послуг, графіка та записів клієнтів.
            </p>
          </div>
        </div>

        <SectionCard
          title="Новий майстер"
          subtitle="Фото, імʼя та короткий опис — як у професійних профілях."
          actions={
<Button
  onClick={() => setAddOpen((prev) => !prev)}
  className={cn(neutralButtonClass, "w-full justify-center md:w-auto")}
>
  <Plus className="h-4 w-4" />
  {addOpen ? "Сховати форму" : "Додати майстра"}
  {addOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
</Button>
          }
        >
          <div
            className={cn(
              "grid transition-all duration-300 ease-out",
              addOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
            )}
          >
            <div className="overflow-hidden">
              <div className="pt-1">
                <form onSubmit={addMaster} className="space-y-5">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="relative">
                        <Avatar
                          name={form.name || "Фото"}
                          photoUrl={!photoBroken ? form.photoUrl : ""}
                          size="md"
                          className="h-16 w-16 rounded-2xl sm:h-20 sm:w-20 sm:rounded-[22px]"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
<label className="cursor-pointer">
<span
  className={cn(
    "inline-flex h-11 w-[150px] items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold text-white",
    "bg-gradient-to-r from-[rgba(var(--color-nude-green-500),var(--color-nude-green-opacity))] to-[rgba(var(--color-nude-green-600),var(--color-nude-green-opacity))]",
    "transition-all duration-200 active:scale-[0.98]",
    "hover:from-[rgba(var(--color-nude-green-500-hover),1)] hover:to-[rgba(var(--color-nude-green-600-hover),1)]"
  )}
>
  <Plus className="h-4 w-4" />
  Додати фото
</span>

<input
  type="file"
  accept="image/*"
  onChange={handlePickPhoto}
  className="hidden"
/>
</label>

{form.photoUrl && (
  <Button
    onClick={removePhoto}
    className="inline-flex h-11 w-[150px] items-center justify-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-white px-4 text-sm font-bold text-[var(--color-ink)] shadow-sm transition-all duration-200 hover:bg-[var(--color-cream)] active:scale-[0.98]"
  >
    <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
    Видалити
  </Button>
)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--color-ink)]">
                      Імʼя
                    </label>
                    <input
                      name="name"
                      placeholder="Напр. Наталія"
                      value={form.name}
                      onChange={handleChange}
                      className={inputBaseClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--color-ink)]">
                      Посада / Спеціалізація
                    </label>
                    <input
                      name="role"
                      value={form.role}
                      onChange={handleChange}
                      className={inputBaseClass}
                      placeholder="Напр. Стиліст або Барбер"
                    />
                    <p className="mt-1 text-xs text-[var(--color-caramel)]">
                      Вкажіть посаду чи спеціалізацію.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--color-ink)]">
                      Опис
                    </label>
                    <textarea
                      name="bio"
                      placeholder="Напр. 6 років досвіду, спеціалізація: фарбування, укладки..."
                      value={form.bio}
                      onChange={handleChange}
                      rows={4}
                      className={cn(inputBaseClass, "resize-none")}
                    />
                    <p className="mt-1 text-xs text-[var(--color-caramel)]">
                      Коротко і по суті (2–4 речення).
                    </p>
                  </div>

<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
<Button
  type="submit"
  disabled={adding || !String(form.name || "").trim()}
  className={cn(
    "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold text-white",

    // 👉 gradient через nude-green
    "bg-gradient-to-r from-[rgba(var(--color-nude-green-500),var(--color-nude-green-opacity))] to-[rgba(var(--color-nude-green-600),var(--color-nude-green-opacity))]",

    "transition-all duration-200 active:scale-[0.98]",

    // 👉 hover
    "hover:from-[rgba(var(--color-nude-green-500-hover),1)] hover:to-[rgba(var(--color-nude-green-600-hover),1)]",

    (adding || !String(form.name || "").trim()) &&
      "cursor-not-allowed bg-[var(--color-cream)] text-[var(--color-caramel)] hover:from-[var(--color-cream)] hover:to-[var(--color-cream)]"
  )}
>
  <Check className="h-4 w-4" />
  {adding ? "Додаємо..." : "Додати майстра"}
</Button>
</div>
                </form>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Список майстрів"
          subtitle={
            total
              ? "Клікни “Редагувати”, щоб оновити профіль."
              : "Додай першого майстра вище."
          }
          badge={`К-ть майстрів: ${total}`}
        >
          {loading ? (
            <MastersListSkeleton />
          ) : total === 0 ? (
<div className="rounded-2xl border-2 border-dashed border-[var(--color-caramel)]/40 bg-[var(--color-cream)] p-6 text-center sm:p-8">
  <div className="mb-3 flex items-center justify-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/70">
      <UserRound className="h-6 w-6 text-[var(--color-caramel)]" />
    </div>
  </div>

  <p className="text-sm font-medium text-[var(--color-caramel)]">
    Поки що немає майстрів
  </p>

<p className="mt-1 text-xs text-[var(--color-caramel)]/80">
  Натисніть «Додати майстра» зверху, щоб створити першого майстра.
</p>
</div>
          ) : (
            <div className="space-y-3">
              {masters.map((m) => (
                <div
                  key={m.id}
                  className="group rounded-2xl border border-[var(--color-cream)] bg-white p-4 transition-all  hover:shadow-md hover:shadow-black/5"
                >
<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
  {/* ЛІВА ЧАСТИНА */}
  <div className="min-w-0 flex-1">
    <div className="flex min-w-0 items-start gap-3">
      <Avatar name={m.name} photoUrl={m.photoUrl} size="sm" />

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-[var(--color-ink)]">
          {m.name}
        </p>

        {m.role ? (
          <p className="mt-1 truncate text-sm font-medium text-[var(--color-caramel)]">
            {m.role}
          </p>
        ) : (
          <p className="mt-1 text-sm text-[var(--color-caramel)]">
            Спеціалізація не вказана
          </p>
        )}

        {m.bio ? (
          <p className="mt-1 line-clamp-2 break-words text-sm text-[var(--color-caramel)]">
            {m.bio}
          </p>
        ) : (
          <p className="mt-1 text-sm text-[var(--color-caramel)]">
            Без опису
          </p>
        )}
      </div>
    </div>
  </div>

  {/* КНОПКИ */}
  <div className="mt-2 flex w-full justify-end gap-2 md:mt-0 md:w-auto">
<Button
  onClick={() => openMasterExceptions(m)}
  className={cn(neutralButtonClass, "flex-1 min-w-0 max-w-[200px]")}
>
  <CalendarDays className="h-4 w-4 shrink-0" />
  <span className="truncate">Особливі дати</span>
</Button>

<IconButton
  onClick={() => openEdit(m)}
  title="Редагувати"
  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-white p-0 text-[var(--color-ink)] shadow-sm transition-all duration-200 hover:bg-[var(--color-cream)] active:scale-[0.98]"
>
  <Pencil className="h-4 w-4" />
</IconButton>

<IconButton
  onClick={() => setDeleteConfirm({ open: true, master: m })}
  title="Видалити"
  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-white p-0 text-[#c97a72] shadow-sm transition-all duration-200 hover:bg-[rgba(201,122,114,0.10)] active:scale-[0.98]"
>
  <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
</IconButton>

  </div>
</div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

<Modal
  open={deleteConfirm.open}
  onClose={() => setDeleteConfirm({ open: false, master: null })}
  size="sm"
  footer={
    <div className="flex justify-end gap-2">
      <Button
        onClick={() => setDeleteConfirm({ open: false, master: null })}
        className="w-full rounded-2xl border border-[var(--border-soft)] bg-white px-4 py-2.5 text-sm font-bold text-[var(--color-ink)] shadow-sm transition-all duration-200 hover:bg-[var(--color-cream)] active:scale-[0.98] sm:w-auto"
      >
        Назад
      </Button>

      <button
        type="button"
        onClick={async () => {
          try {
            await deleteMaster(deleteConfirm.master);
            setDeleteConfirm({ open: false, master: null });
          } catch (e) {
            alert(e.message || "Не вдалося видалити майстра");
          }
        }}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-danger)] px-4 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:bg-[var(--color-danger-dark)] active:scale-[0.98] sm:w-auto"
      >
        <Trash2 className="h-4 w-4" />
        Так, видалити
      </button>
    </div>
  }
>
  <div className="space-y-4">
    <div className="flex justify-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-[var(--color-danger-bg)]/90 blur-2xl" />

        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-danger)] text-white shadow-[0_16px_36px_rgba(213,92,82,0.24)]">
          <Trash2 className="h-7 w-7" />
        </div>
      </div>
    </div>

    <div className="text-center">
      <h3 className="text-xl font-black tracking-tight text-[var(--color-ink)]">
        Видалити майстра?
      </h3>

      <p className="mt-2 text-sm leading-6 text-[var(--color-caramel)]">
        Майстер буде видалений зі студії та більше не відображатиметься у списку.
      </p>
    </div>

    <div className="rounded-2xl bg-[var(--color-danger-bg)] p-3.5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--color-danger-dark)] shadow-sm">
          <AlertTriangle className="h-4.5 w-4.5" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-[var(--color-danger-dark)]">
            Увага
          </p>

          <p className="mt-1 text-xs leading-5 text-[var(--color-ink)]">
            Видалені дані не можна буде повернути назад.
          </p>
        </div>
      </div>
    </div>
  </div>
</Modal>
<Modal
  open={Boolean(editMaster)}
  onClose={closeEdit}
  title="Редагування майстра"
  subtitle="Онови фото, імʼя або опис і збережи зміни."
  size="md"
  mobileFull
  footer={
            <div className="flex items-center justify-end gap-2">
              <Button 
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-white px-4 text-sm font-bold text-[var(--color-ink)] shadow-sm transition-all duration-200 hover:bg-[var(--color-cream)] active:scale-[0.98]"
              onClick={closeEdit}>
                Скасувати
              </Button>
<Button
  onClick={saveEdit}
  disabled={!String(editDraft.name || "").trim()}
  className={cn(
    "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold text-white transition-all duration-200 active:scale-[0.98]",

    // 👉 gradient через nude-green
    "bg-gradient-to-r from-[rgba(var(--color-nude-green-500),var(--color-nude-green-opacity))] to-[rgba(var(--color-nude-green-600),var(--color-nude-green-opacity))]",

    // 👉 hover
    "hover:from-[rgba(var(--color-nude-green-500-hover),1)] hover:to-[rgba(var(--color-nude-green-600-hover),1)]",

    // 👉 disabled
    !String(editDraft.name || "").trim() &&
      "cursor-not-allowed bg-[var(--color-cream)] text-[var(--color-caramel)] hover:from-[var(--color-cream)] hover:to-[var(--color-cream)]"
  )}
>
  <Check className="h-4 w-4" />
  Зберегти
</Button>
            </div>
          }
        >
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar
                  name={editDraft.name || "Майстер"}
                  photoUrl={editDraft.photoUrl}
                  size="md"
                />
                <div className="absolute -bottom-2 -right-2 rounded-xl border border-[var(--color-cream)] bg-white p-2 shadow-sm">
                  <Camera className="h-4 w-4 text-[var(--color-forest)]" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer">
                  <span className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-white px-4 text-sm font-bold text-[var(--color-ink)] shadow-sm transition-all duration-200 hover:bg-[var(--color-cream)] active:scale-[0.98]">
                    <Pencil className="h-4 w-4" />
                    Змінити фото
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={editPickPhoto}
                  />
                </label>

                {editDraft.photoUrl && (
                  <Button
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-white px-4 text-sm font-bold text-[var(--color-ink)] shadow-sm transition-all duration-200 hover:bg-[var(--color-cream)] active:scale-[0.98]"
                    onClick={() =>
                      setEditDraft((p) => {
                        if (p.photoUrl?.startsWith("blob:")) {
                          URL.revokeObjectURL(p.photoUrl);
                        }
                        return {
                          ...p,
                          photoUrl: "",
                          photoKey: null,
                          photoFile: null,
                        };
                      })
                    }
                  >
                   <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
                    Видалити фото
                  </Button>
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--color-ink)]">
                Імʼя
              </label>
              <input
                value={editDraft.name}
                onChange={(e) =>
                  setEditDraft((p) => ({ ...p, name: e.target.value }))
                }
                className={inputBaseClass}
                placeholder="Напр. Олена Коваль"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--color-ink)]">
                Посада / Спеціалізація
              </label>
              <input
                value={editDraft.role || ""}
                onChange={(e) =>
                  setEditDraft((p) => ({ ...p, role: e.target.value }))
                }
                className={inputBaseClass}
                placeholder="Напр. Стиліст або Барбер"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--color-ink)]">
                Опис
              </label>
              <textarea
                value={editDraft.bio}
                onChange={(e) =>
                  setEditDraft((p) => ({ ...p, bio: e.target.value }))
                }
                rows={4}
                className={cn(inputBaseClass, "resize-none")}
                placeholder="Коротко про досвід та спеціалізацію…"
              />
            </div>
          </div>
        </Modal>

<Modal
  open={exceptionsModalOpen}
  onClose={() => {
    setExceptionsModalOpen(false);
    setExceptionsMaster(null);
    setMasterExceptions([]);
    setExpandedExceptions({});
  }}
  title={`Особливі дати — ${exceptionsMaster?.name || ""}`}
  subtitle="Керуйте індивідуальним графіком майстра."
  size="md"
  mobileFull
  footer={
    <div className="flex justify-end">
<Button
  onClick={addExceptionRow}
  className={cn(
    "w-full justify-center whitespace-nowrap sm:w-auto sm:shrink-0",
    "inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-bold text-white",
    "transition-all duration-200 active:scale-[0.98]",

    // 👉 nude-green CTA
    "bg-gradient-to-r from-[rgba(var(--color-nude-green-500),var(--color-nude-green-opacity))] to-[rgba(var(--color-nude-green-600),var(--color-nude-green-opacity))]",

    // 👉 hover
    "hover:from-[rgba(var(--color-nude-green-500-hover),1)] hover:to-[rgba(var(--color-nude-green-600-hover),1)]"
  )}
>
  <CalendarDays className="h-4 w-4" />
  Додати особливу дату
</Button>
    </div>
  }
>
          {exceptionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-[var(--color-cream)] bg-white p-4"
                >
                  <SkeletonBlock className="h-5 w-44" />
                  <SkeletonBlock className="mt-2 h-4 w-36" />
                </div>
              ))}
            </div>
          ) : masterExceptions.length === 0 ? (
<div className="rounded-2xl border-2 border-dashed border-[var(--color-caramel)]/40 bg-[var(--color-cream)] p-6 text-center sm:p-8">
  <div className="mb-3 flex items-center justify-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/70">
      <CalendarDays className="h-7 w-7 text-[var(--color-caramel)]" />
    </div>
  </div>

  <p className="text-sm font-medium text-[var(--color-caramel)]">
    Немає особливих дат
  </p>

  <p className="mt-1 text-xs text-[var(--color-caramel)]/80">
    Тут ви можете додати вихідні, відпустку, лікарняні або інші дні, коли майстер не працює. <br />
    У ці дні він не буде доступний для запису клієнтами.
  </p>
</div>
          ) : (
            <div className="space-y-3">
              {masterExceptions.map((item, index) => {
                const isValid = isExceptionValid(item);
                const exceptionKey = getExceptionKey(item, index);
                const isExpanded =
                  item.isNew || expandedExceptions[exceptionKey] === true;

                return (
                  <div
                    key={exceptionKey}
                    className="overflow-hidden rounded-2xl border border-[var(--color-cream)] bg-white shadow-[0_6px_18px_rgba(27,27,27,0.04)]"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (item.isNew) return;

                        setExpandedExceptions((prev) => ({
                          ...prev,
                          [exceptionKey]: !prev[exceptionKey],
                        }));
                      }}
                      className={cn(
                        "flex w-full items-start justify-between gap-3 p-4 text-left transition-colors",
                        !item.isNew && "hover:bg-[var(--color-cream)]",
                      )}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[15px] font-bold text-[var(--color-ink)]">
                            {item.date
                              ? formatExceptionDate(item.date)
                              : "Нова особлива дата"}
                          </p>

                          <div className="rounded-full  px-3 py-1 text-xs font-semibold text-[var(--color-ink)]">
                            {item.enabled ? "Особливий графік" : "Вихідний"}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {!item.isNew && (
                          <span className="hidden text-xs font-medium text-[var(--color-caramel)] sm:inline">
                            {isExpanded ? "Згорнути" : "Розгорнути"}
                          </span>
                        )}

                        {!item.isNew &&
                          (isExpanded ? (
                            <ChevronUp className="h-5 w-5 shrink-0 text-[var(--color-caramel)]" />
                          ) : (
                            <ChevronDown className="h-5 w-5 shrink-0 text-[var(--color-caramel)]" />
                          ))}
                      </div>
                    </button>

                    <div
                      className={cn(
                        "grid transition-all duration-300 ease-out",
                        isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="border-t border-[var(--color-cream)] px-4 pb-4 pt-4">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end">
                            <div className="min-w-0">
                              <DatePicker
                                label="Дата"
                                value={item.date}
                                onChange={(value) =>
                                  updateException(index, "date", value)
                                }
                              />
                            </div>

                            <div className="col-span-1 sm:col-span-1">
                              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-caramel)]">
                                Статус
                              </label>

<button
  type="button"
  onClick={() =>
    updateException(index, "enabled", !item.enabled)
  }
  className="flex h-[50px] w-full items-center gap-3 rounded-2xl border border-[var(--color-cream)] bg-white px-4 transition-all duration-200 hover:bg-[var(--color-cream)] focus:border-[var(--color-forest)] focus:ring-4 focus:ring-[var(--color-forest)]/10"
>
<span
  className={cn(
    "relative inline-flex h-7 w-12 items-center rounded-full",
    item.enabled
      ? "bg-gradient-to-r from-[rgba(var(--color-nude-green-500),0.8)] to-[rgba(var(--color-nude-green-600),0.8)]"
      : "bg-[var(--color-mist)]",
  )}
>
  <span
    className={cn(
      "inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300",
      item.enabled ? "translate-x-6" : "translate-x-1",
    )}
  />
</span>

  <span className="whitespace-nowrap text-sm font-semibold text-[var(--color-ink)]">
    {item.enabled ? "Робочий день" : "Вихідний"}
  </span>
</button>
                            </div>

                            {item.enabled ? (
                              <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                                <div className="min-w-0">
                                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-caramel)]">
                                    Початок
                                  </label>

                                 <div className="flex h-[50px] items-center overflow-hidden rounded-2xl border border-[var(--color-cream)] bg-white px-2 transition-all hover:bg-[var(--color-cream)] focus-within:ring-4 focus-within:ring-[var(--color-forest)]/10">
                                    <TimeSelect
                                      value={item.start}
                                      label="Початок"
                                      dayLabel={item.date || "Особлива дата"}
                                      onChange={(value) =>
                                        updateException(index, "start", value)
                                      }
                                      onCommit={(value) =>
                                        updateException(index, "start", value)
                                      }
                                    />
                                  </div>
                                </div>

                                <div className="min-w-0">
                                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-caramel)]">
                                    Завершення
                                  </label>
                                  <div className="flex h-[50px] items-center overflow-hidden rounded-2xl border border-[var(--color-cream)] bg-white px-2 transition-all hover:bg-[var(--color-cream)] focus-within:border-[var(--color-forest)] focus-within:ring-4 focus-within:ring-[var(--color-forest)]/10">
                                    <TimeSelect
                                      value={item.end}
                                      label="Завершення"
                                      dayLabel={item.date || "Особлива дата"}
                                      onChange={(value) =>
                                        updateException(index, "end", value)
                                      }
                                      onCommit={(value) =>
                                        updateException(index, "end", value)
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center sm:col-span-2">
<div className="w-full text-center rounded-2xl border border-[#e8b7b0]  px-4 py-3 text-sm font-semibold text-[#b6463f]">
  У цей день майстер не працюватиме
</div>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 sm:col-span-2 sm:flex">
<Button
  onClick={() => saveException(item, index)}
  disabled={!isValid}
  className={cn(
    "inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold text-white",

    // 👉 gradient через var
    "bg-gradient-to-r from-[rgba(var(--color-nude-green-500),var(--color-nude-green-opacity))] to-[rgba(var(--color-nude-green-600),var(--color-nude-green-opacity))]",

    "transition-all duration-200 active:scale-[0.98]",

    // 👉 hover через var
    "hover:from-[rgba(var(--color-nude-green-500-hover),1)] hover:to-[rgba(var(--color-nude-green-600-hover),1)]",

    !isValid &&
      "cursor-not-allowed bg-[var(--color-cream)] text-[var(--color-caramel)] shadow-none hover:from-[var(--color-cream)] hover:to-[var(--color-cream)]"
  )}
>
  <Check className="h-4 w-4" />
  Зберегти
</Button>
                              <Button
                               
                                onClick={() => removeException(item, index)}
                                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-white px-4 text-sm font-bold text-[var(--color-ink)] shadow-sm transition-all duration-200 hover:bg-[var(--color-cream)] active:scale-[0.98]"
                              >
                              <Trash2 className="h-4 w-4 text-[#b96b61]" />
                                Видалити
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
